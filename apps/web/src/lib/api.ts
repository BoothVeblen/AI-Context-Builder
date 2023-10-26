export const API_BASE_URL = process.env.AI_SERVICE_API_BASE_URL

async function http<T>(path: string, config: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...config,
  })
  if (!response.ok) {
    throw new Error(response.statusText)
  }

  const json = await response.json()
  if (+json.status !== 200) {
    throw new Error(`API service error: ${json.message}`)
  }
  return json.data
}

async function get<T>(path: string, config?: RequestInit): Promise<T> {
  const init = { method: 'GET', ...config }
  return await http<T>(path, init)
}

async function post<T, U>(
  path: string,
  body: T,
  config?: RequestInit
): Promise<U> {
  const init = { method: 'POST', body: JSON.stringify(body), ...config }
  return await http<U>(path, init)
}

async function patch<T, U>(
  path: string,
  body: T,
  config?: RequestInit
): Promise<U> {
  const init = { method: 'PATCH', body: JSON.stringify(body), ...config }
  return await http<U>(path, init)
}

async function _delete<T, U>(path: string, config?: RequestInit): Promise<U> {
  const init = { method: 'DELETE', ...config }
  return await http<U>(path, init)
}

export const api = {
  get,
  post,
  patch,
  delete: _delete,
}
