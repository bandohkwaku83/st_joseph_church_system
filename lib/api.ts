
const API_BASE =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
  '';

export function getApiBase(): string {
  return API_BASE;
}

export interface ApiFetchOptions extends Omit<RequestInit, 'credentials'> {
  /** Default true – always send credentials so auth cookie is included */
  credentials?: RequestInit['credentials'];
}


export async function apiFetch(
  path: string,
  options: ApiFetchOptions = {}
): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  return fetch(url, {
    ...options,
    credentials: options.credentials ?? 'include',
  });
}
