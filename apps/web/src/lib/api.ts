export const API_BASE_URL = process.env.AI_SERVICE_API_BASE_URL

async function http<T>(path: string, config: RequestInit): Promise<T> {
  const request = new Request(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...config,
  })
  const response = await fetch(request)

  if (!response.ok) {
    throw new Error(response.statusText)
  }

  // may error if there is no body, return empty array
  return response.json().catch(() => ({}))
}

async function get<T>(path: string, config?: RequestInit): Promise<T> {
  const init = { method: 'get', ...config }
  return await http<T>(path, init)
}

async function post<T, U>(
  path: string,
  body: T,
  config?: RequestInit
): Promise<U> {
  const init = { method: 'post', body: JSON.stringify(body), ...config }
  return await http<U>(path, init)
}

async function patch<T, U>(
  path: string,
  body: T,
  config?: RequestInit
): Promise<U> {
  const init = { method: 'patch', body: JSON.stringify(body), ...config }
  return await http<U>(path, init)
}

async function _delete<T, U>(path: string, config?: RequestInit): Promise<U> {
  const init = { method: 'delete', ...config }
  return await http<U>(path, init)
}

export const api = {
  get,
  post,
  patch,
  delete: _delete,
}
