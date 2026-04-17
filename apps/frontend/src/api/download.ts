import { getAccessToken } from './http'

function baseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string
  return raw.replace(/\/$/, '')
}

export async function downloadAuthorized(path: string, filename: string) {
  const url = `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers()
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(url, { method: 'POST', headers })
  if (!res.ok) throw new Error(await res.text())
  const blob = await res.blob()
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.click()
  URL.revokeObjectURL(href)
}

export async function fetchAuthorizedBlob(path: string): Promise<string> {
  const url = `${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers()
  const token = getAccessToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(await res.text())
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
