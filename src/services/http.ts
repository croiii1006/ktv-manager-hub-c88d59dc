const TOKEN_KEY = 'df_admin_token';

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setAuthToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearAuthToken = () => localStorage.removeItem(TOKEN_KEY);

const API_BASE_URL: string = (import.meta as unknown as { env?: Record<string, string> })
  .env?.VITE_API_BASE_URL ?? 'http://94.74.101.163:9001';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

type RequestOptions = {
  method?: Method;
  body?: unknown;
  query?: Record<string, unknown>;
  headers?: Record<string, string>;
};

const buildQuery = (query?: Record<string, unknown>) => {
  if (!query || Object.keys(query).length === 0) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    params.append(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : '';
};

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method || 'GET';
  const query = buildQuery(options.query);
  const url = `${API_BASE_URL}${path}${query}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers || {}),
  };

  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  let payload: unknown = null;
  if (contentType.includes('application/json')) {
    payload = await res.json();
  } else {
    payload = await res.text();
  }

  if (!res.ok) {
    const errObj = typeof payload === 'object' && payload ? (payload as { message?: string }) : { message: String(payload) };
    throw Object.assign(new Error(errObj.message || 'Request failed'), { status: res.status, payload });
  }

  return payload as T;
}
