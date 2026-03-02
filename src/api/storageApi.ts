interface StorageUploadResponse {
  secure_url?: string
}

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dnixpl7iw'
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'Front_end_lacquavi'
const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

export const uploadProductImageToStorage = async (file: File): Promise<{ url: string }> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Falha no upload para Cloudinary (${response.status})`)
  }

  const payload = (await response.json()) as StorageUploadResponse
  const url = payload.secure_url ?? null

  if (!url) {
    throw new Error('Upload concluído sem secure_url no retorno da Cloudinary')
  }

  return { url }
}
