import { getAuthToken } from '../../auth/token'
import { UPLOAD_ENDPOINT } from '../../graphql/client'

export type UploadedMedia = {
  mediaUrl: string
  mediaType: 'IMAGE' | 'VIDEO'
  mimeType: string
}

export async function uploadMediaFile(file: File): Promise<UploadedMedia> {
  const token = getAuthToken()
  if (!token) {
    throw new Error('Sign in to upload media')
  }

  const body = new FormData()
  body.append('file', file)

  const res = await fetch(UPLOAD_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.error || 'Upload failed')
  }

  return {
    mediaUrl: json.mediaUrl,
    mediaType: json.mediaType,
    mimeType: json.mimeType,
  }
}
