const MAX_DIMENSION = 1200
const WEBP_QUALITY = 0.82
const MAX_FINAL_SIZE_BYTES = 2 * 1024 * 1024

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Não foi possível ler a imagem selecionada'))
    }

    image.src = objectUrl
  })

const toWebpBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Falha ao converter imagem para WebP'))
          return
        }
        resolve(blob)
      },
      'image/webp',
      quality
    )
  })

export const optimizeProductImage = async (file: File): Promise<File> => {
  const image = await loadImage(file)

  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
  const targetWidth = Math.max(1, Math.round(image.width * scale))
  const targetHeight = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Não foi possível processar a imagem selecionada')
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight)

  const webpBlob = await toWebpBlob(canvas, WEBP_QUALITY)

  if (webpBlob.size > MAX_FINAL_SIZE_BYTES) {
    throw new Error('Imagem muito grande após compressão (máx. 2MB)')
  }

  const normalizedName = file.name.replace(/\.[^/.]+$/, '')
  return new File([webpBlob], `${normalizedName}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}
