$ErrorActionPreference='Stop'
$base='http://localhost:3000'

function Json($o){ $o | ConvertTo-Json -Depth 25 -Compress }
function Post($u,$b,$h){ Invoke-RestMethod -Method Post -Uri $u -Headers $h -ContentType 'application/json' -Body (Json $b) }
function GetR($u,$h){ Invoke-RestMethod -Method Get -Uri $u -Headers $h }
function PutR($u,$b,$h){ Invoke-RestMethod -Method Put -Uri $u -Headers $h -ContentType 'application/json' -Body (Json $b) }

$now = Get-Date -Format 'yyyyMMddHHmmss'

Write-Output "STEP 0 Health"
$health = GetR "$base/health" @{}

Write-Output "STEP 1 Create admin-capable user"
$adminEmail = 'gabrieldietze13@hotmail.com'
$adminPassword = 'galo1313'
$adminToken = $null
try {
  $adminLogin = Post "$base/auth/login" @{email=$adminEmail; password=$adminPassword} @{}
  $adminToken = $adminLogin.token
} catch {
  $fallbackAdminEmail = "smokeadmin_$now@example.com"
  $fallbackAdminPassword = 'Admin@123'
  $adminReg = Post "$base/auth/register" @{name='Smoke Admin'; email=$fallbackAdminEmail; password=$fallbackAdminPassword; phone='11999999999'; role='admin'} @{}
  $adminToken = $adminReg.token
  if(-not $adminToken){
    $adminLogin = Post "$base/auth/login" @{email=$fallbackAdminEmail; password=$fallbackAdminPassword} @{}
    $adminToken = $adminLogin.token
  }
  $adminEmail = $fallbackAdminEmail
}
if(-not $adminToken){ throw 'Admin token ausente' }
$adminAuth=@{ Authorization = "Bearer $adminToken" }

Write-Output "STEP 2 Resolve customer"
$customerEmail = 'customer@lacqua.com.br'
$customerPassword = 'Customer@123'
$customerToken = $null
try {
  $customerLogin = Post "$base/auth/login" @{email=$customerEmail; password=$customerPassword} @{}
  $customerToken = $customerLogin.token
} catch {
  $customerEmail = "smokecustomer_$now@lacquavi.test"
  $customerReg = Post "$base/auth/register" @{name='Smoke Customer'; email=$customerEmail; password=$customerPassword; phone='11988888888'} @{}
  $customerToken = $customerReg.token
  if(-not $customerToken){
    $customerLogin = Post "$base/auth/login" @{email=$customerEmail; password=$customerPassword} @{}
    $customerToken = $customerLogin.token
  }
}
if(-not $customerToken){ throw 'Customer token ausente' }
$customerAuth=@{ Authorization = "Bearer $customerToken" }

Write-Output "STEP 3 Category + Subcategory (packagingCategory on category)"
$catResp = Post "$base/api/categories" @{name="Perfumaria Smoke $now"; packagingCategory='perfume'} $adminAuth
$category = if($catResp.data){$catResp.data}elseif($catResp.category){$catResp.category}else{$catResp}

$subCreateResp = Post "$base/api/subcategories" @{name="Sub Smoke $now"; categoryId=$category.id} $adminAuth
$subCreated = if($subCreateResp.data){$subCreateResp.data}elseif($subCreateResp.subcategory){$subCreateResp.subcategory}else{$subCreateResp}

Write-Output "STEP 4 Category update (PUT packagingCategory=kit)"
$catUpdateResp = PutR "$base/api/categories/$($category.id)" @{packagingCategory='kit'} $adminAuth
$catUpdated = if($catUpdateResp.data){$catUpdateResp.data}elseif($catUpdateResp.category){$catUpdateResp.category}else{$catUpdateResp}

Write-Output "STEP 5 Box type + box rule"
$boxTypeResp = Post "$base/api/box-types" @{name="Caixa Smoke $now"; lengthCm=24; widthCm=16; heightCm=11; maxWeightGrams=5000; isActive=$true} $adminAuth
$boxType = if($boxTypeResp.data){$boxTypeResp.data}elseif($boxTypeResp.boxType){$boxTypeResp.boxType}else{$boxTypeResp}
$boxRuleResp = Post "$base/api/box-rules" @{packagingCategory='kit'; boxTypeId=$boxType.id; maxItems=2; priority=1; allowMix=$false; isActive=$true} $adminAuth
$boxRule = if($boxRuleResp.data){$boxRuleResp.data}elseif($boxRuleResp.boxRule){$boxRuleResp.boxRule}else{$boxRuleResp}

Write-Output "STEP 6 Product create (category+subcategory, requiresShipping+weight)"
$productResp = Post "$base/products" @{name="Produto Smoke $now"; description='Produto físico smoke'; price=129.9; stock=7; brand='Lacquavi'; volume='100ml'; gender='unissex'; categoryId=$category.id; subcategoryId=$subCreated.id; requiresShipping=$true; weightGrams=350} $adminAuth
$product = if($productResp.product){$productResp.product}else{$productResp}

Write-Output "STEP 7 Product list filter by subcategory"
$plist = GetR "$base/products?subcategory=$($subCreated.id)" @{}
$productsArr = if($plist.products){$plist.products}elseif($plist.data){$plist.data}else{@()}
$filteredCount = $productsArr.Count

Write-Output "STEP 8 Order + quote + selection"
$orderHeaders = @{ Authorization = "Bearer $customerToken"; 'Idempotency-Key' = [guid]::NewGuid().ToString() }
$orderResp = Post "$base/orders" @{items=@(@{productId=$product.id; quantity=1})} $orderHeaders
$order = if($orderResp.order){$orderResp.order}else{$orderResp}
$orderId = $order.id

$destination = @{ zip='88010-000'; street='Rua Teste'; number='100'; complement='Apto 1'; district='Centro'; city='Florianopolis'; state='SC' }
$qResp = Post "$base/shipping/quotes" @{orderId=$orderId; destination=$destination} $customerAuth
$quote = $qResp.quotes | Select-Object -First 1
if(-not $quote){ throw 'Sem cotação' }
$selResp = Post "$base/shipping/selection" @{orderId=$orderId; quoteId=$quote.quoteId; destination=$destination} $customerAuth

Write-Output "STEP 9 Generate Mercado Pago card token"
$mpPublicKey = $env:VITE_MP_PUBLIC_KEY
if(-not $mpPublicKey){ $mpPublicKey = $env:MP_PUBLIC_KEY }
if(-not $mpPublicKey){ $mpPublicKey = $env:MERCADOPAGO_PUBLIC_KEY }
if(-not $mpPublicKey){ throw 'MP public key ausente. Defina VITE_MP_PUBLIC_KEY (ou MP_PUBLIC_KEY/MERCADOPAGO_PUBLIC_KEY).' }

$cardData = @{
  card_number = '5031433215406351'
  security_code = '123'
  expiration_month = 11
  expiration_year = 2030
  cardholder = @{
    name = 'APRO'
    identification = @{
      type = 'CPF'
      number = '12345678909'
    }
  }
}

$mpToken = $null
$mpTokenError = $null
try {
  $mpResp = Invoke-RestMethod -Method Post -Uri "https://api.mercadopago.com/v1/card_tokens?public_key=$mpPublicKey" -ContentType 'application/json' -Body (Json $cardData)
  $mpToken = $mpResp.id
  if(-not $mpToken){ throw 'Token MP não retornado' }
} catch [System.Net.WebException] {
  $resp = $_.Exception.Response
  if($resp){
    $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $mpTokenError = $sr.ReadToEnd()
  } else {
    $mpTokenError = $_.Exception.Message
  }
} catch {
  $mpTokenError = $_.Exception.Message
}

Write-Output "STEP 10 Payment CARD"
$payHeaders = @{ Authorization = "Bearer $customerToken"; 'Idempotency-Key' = [guid]::NewGuid().ToString() }
$payment = $null
$paymentError = $null
if(-not $mpToken){
  $paymentError = "card token generation failed: $mpTokenError"
} else {
  try {
    $payResp = Post "$base/api/payments" @{orderId=$orderId; paymentMethodId='master'; cardToken=$mpToken} $payHeaders
    $payment = if($payResp.payment){$payResp.payment}else{$payResp}
  } catch [System.Net.WebException] {
    $resp = $_.Exception.Response
    if($resp){
      $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
      $paymentError = $sr.ReadToEnd()
    } else {
      $paymentError = $_.Exception.Message
    }
  } catch {
    $paymentError = $_.Exception.Message
  }
}

Write-Output "STEP 11 Label try as customer + admin"
$customerLabelOk = $false
$adminLabelOk = $false
try { $null = Post "$base/shipping/orders/$orderId/label" @{} $customerAuth; $customerLabelOk = $true } catch {}
try { $null = Post "$base/shipping/orders/$orderId/label" @{} $adminAuth; $adminLabelOk = $true } catch {}

Write-Output "STEP 12 Shipment"
$shipmentStatus = 'none'
try {
  $shipResp = GetR "$base/shipping/orders/$orderId/shipment" $customerAuth
  if($shipResp.shipment -and $shipResp.shipment.status){ $shipmentStatus = $shipResp.shipment.status }
} catch {}

Write-Output "=== SUMMARY ==="
Write-Output (Json @{
  healthOk = $health.ok
  adminEmail = $adminEmail
  customerEmail = $customerEmail
  categoryId = $category.id
  subcategoryId = $subCreated.id
  categoryPackagingCategoryCreated = $category.packagingCategory
  categoryPackagingCategoryUpdated = $catUpdated.packagingCategory
  boxTypeId = $boxType.id
  boxRuleId = $boxRule.id
  productId = $product.id
  filteredCount = $filteredCount
  orderId = $orderId
  quoteId = $quote.quoteId
  mpTokenCreated = [bool]$mpToken
  mpTokenError = $mpTokenError
  paymentId = if($payment){$payment.id}else{$null}
  paymentStatus = if($payment){$payment.status}else{'failed'}
  paymentError = $paymentError
  customerLabelOk = $customerLabelOk
  adminLabelOk = $adminLabelOk
  shipmentStatus = $shipmentStatus
})
