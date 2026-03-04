$ErrorActionPreference='Stop'
$base='http://localhost:3000'

function Json($o){ $o | ConvertTo-Json -Depth 20 -Compress }
function Post($u,$b,$h){ Invoke-RestMethod -Method Post -Uri $u -Headers $h -ContentType 'application/json' -Body (Json $b) }
function GetR($u,$h){ Invoke-RestMethod -Method Get -Uri $u -Headers $h }

$now = Get-Date -Format 'yyyyMMddHHmmss'
Write-Output "STEP 0 Health"
$health = GetR "$base/health" @{}
Write-Output ("health.ok=" + $health.ok)

Write-Output "STEP 1 Login admin"
$adminToken = $null
$adminCreds = @(
  @{ email='admin@lacqua.com.br'; password='Admin@123' },
  @{ email='gabrieldietze13@hotmail.com'; password='galo1313' }
)

foreach($cred in $adminCreds){
  try {
    $adminLogin = Post "$base/auth/login" @{email=$cred.email; password=$cred.password} @{}
    $adminToken = $adminLogin.token
    if($adminToken){ break }
  } catch {}
}
if(-not $adminToken){ throw 'Admin token ausente. Configure credenciais admin válidas no smoke-full-flow.ps1.' }
$adminAuth=@{ Authorization="Bearer $adminToken" }

Write-Output "STEP 2 Register/Login customer"
$email = "flowtest_$now@example.com"
$password='Customer@123'
try {
  $reg = Post "$base/auth/register" @{name='Flow Test'; email=$email; password=$password; phone='11999999999'} @{}
  $customerToken=$reg.token
} catch {
  $login = Post "$base/auth/login" @{email=$email; password=$password} @{}
  $customerToken=$login.token
}
if(-not $customerToken){ throw 'Customer token ausente' }
$customerAuth=@{ Authorization="Bearer $customerToken" }

Write-Output "STEP 3 Create category + subcategory"
$cat = Post "$base/api/categories" @{name="Perfumes Teste $now"; packagingCategory='perfume'} $adminAuth
$category = if($cat.data){$cat.data}else{$cat.category}
if(-not $category){$category=$cat}
$sub = Post "$base/api/subcategories" @{name="Perfumes Linha $now"; categoryId=$category.id} $adminAuth
$subcategory = if($sub.data){$sub.data}else{$sub.subcategory}
if(-not $subcategory){$subcategory=$sub}
Write-Output ("categoryId=" + $category.id + " subcategoryId=" + $subcategory.id)

Write-Output "STEP 4 Create box type + rule"
$boxTypeResp = Post "$base/api/box-types" @{name="Caixa Teste $now"; lengthCm=24; widthCm=16; heightCm=11; maxWeightGrams=5000; isActive=$true} $adminAuth
$boxType = if($boxTypeResp.data){$boxTypeResp.data}else{$boxTypeResp.boxType}
if(-not $boxType){$boxType=$boxTypeResp}
$boxRuleResp = Post "$base/api/box-rules" @{packagingCategory='perfume'; boxTypeId=$boxType.id; maxItems=2; priority=1; allowMix=$false; isActive=$true} $adminAuth
$boxRule = if($boxRuleResp.data){$boxRuleResp.data}else{$boxRuleResp.boxRule}
if(-not $boxRule){$boxRule=$boxRuleResp}
Write-Output ("boxTypeId=" + $boxType.id + " boxRuleId=" + $boxRule.id)

Write-Output "STEP 5 Create product (new contract)"
$productResp = Post "$base/products" @{name="Produto Fluxo $now"; description='Produto físico teste fluxo'; price=129.9; stock=10; categoryId=$category.id; subcategoryId=$subcategory.id; requiresShipping=$true; weightGrams=350; brand='Lacquavi'; volume='100ml'; gender='unissex'} $adminAuth
$product = if($productResp.product){$productResp.product}else{$productResp}
Write-Output ("productId=" + $product.id)

Write-Output "STEP 6 List products filtered by subcategory"
$plist = GetR "$base/products?subcategory=$($subcategory.id)" @{}
$foundCount = if($plist.products){$plist.products.Count}elseif($plist.data){$plist.data.Count}else{0}
Write-Output ("filteredCount=" + $foundCount)

Write-Output "STEP 7 Create order"
$orderHeaders = @{ Authorization = "Bearer $customerToken"; 'Idempotency-Key' = [guid]::NewGuid().ToString() }
$orderResp = Post "$base/orders" @{items=@(@{productId=$product.id; quantity=1})} $orderHeaders
$order = if($orderResp.order){$orderResp.order}else{$orderResp}
if(-not $order.id){ throw 'orderId ausente' }
$orderId = $order.id
Write-Output ("orderId=" + $orderId)

$destination = @{ zip='88010-000'; street='Rua Teste'; number='100'; complement='Apto 1'; district='Centro'; city='Florianopolis'; state='SC' }

Write-Output "STEP 8 Quote + select shipping"
$q = Post "$base/shipping/quotes" @{orderId=$orderId; destination=$destination} $customerAuth
$quote = $q.quotes | Select-Object -First 1
if(-not $quote){ throw 'Sem cotação' }
$selection = Post "$base/shipping/selection" @{orderId=$orderId; quoteId=$quote.quoteId; destination=$destination} $customerAuth
Write-Output ("quoteId=" + $quote.quoteId)

Write-Output "STEP 9 Create PIX payment"
$payHeaders = @{ Authorization = "Bearer $customerToken"; 'Idempotency-Key' = [guid]::NewGuid().ToString() }
$payment = $null
$paymentError = $null
try {
  $pay = Post "$base/api/payments" @{orderId=$orderId; paymentMethodId='pix'} $payHeaders
  $payment = if($pay.payment){$pay.payment}else{$pay}
  Write-Output ("paymentId=" + $payment.id + " status=" + $payment.status)
} catch {
  $paymentError = $_.Exception.Message
  Write-Output ("paymentError=" + $paymentError)
}

Write-Output "STEP 10 Label as customer (expect possible denial)"
$customerLabelOk=$false
try {
  $null = Post "$base/shipping/orders/$orderId/label" @{} $customerAuth
  $customerLabelOk=$true
} catch {
  Write-Output ("customerLabelError=" + $_.Exception.Message)
}

Write-Output "STEP 11 Label as admin"
$adminLabelOk=$false
try {
  $label = Post "$base/shipping/orders/$orderId/label" @{} $adminAuth
  $adminLabelOk=$true
} catch {
  Write-Output ("adminLabelError=" + $_.Exception.Message)
}

Write-Output "STEP 12 Shipment"
$shipmentStatus='none'
try {
  $ship = GetR "$base/shipping/orders/$orderId/shipment" $customerAuth
  if($ship.shipment -and $ship.shipment.status){$shipmentStatus=$ship.shipment.status} elseif($ship.status){$shipmentStatus=$ship.status}
  Write-Output (Json $ship)
} catch {
  Write-Output ("shipmentError=" + $_.Exception.Message)
}

Write-Output "=== SUMMARY ==="
Write-Output (Json @{ healthOk=$health.ok; categoryId=$category.id; subcategoryId=$subcategory.id; boxTypeId=$boxType.id; boxRuleId=$boxRule.id; productId=$product.id; filteredCount=$foundCount; orderId=$orderId; quoteId=$quote.quoteId; paymentId=if($payment){$payment.id}else{$null}; paymentStatus=if($payment){$payment.status}else{'failed'}; paymentError=$paymentError; customerLabelOk=$customerLabelOk; adminLabelOk=$adminLabelOk; shipmentStatus=$shipmentStatus })
