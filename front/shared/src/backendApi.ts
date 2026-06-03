const trimTrailingSlash = (s: string) => s.replace(/\/+$/, '');

const guessHttpProtocol = () => {
  if (typeof window === 'undefined') return 'http';
  return window.location.protocol === 'https:' ? 'https' : 'http';
};

const normalizeHttpBaseUrl = (raw: string) => {
  const v = raw.trim();
  if (!v) return '';
  if (v.startsWith('http://') || v.startsWith('https://')) return trimTrailingSlash(v);
  if (v.startsWith('//')) return trimTrailingSlash(`${guessHttpProtocol()}:${v}`);
  return trimTrailingSlash(`${guessHttpProtocol()}://${v}`);
};

let _backendApiBaseUrl: string = 'http://192.168.31.95:8081'

export const setBackendApiBaseUrl = (url: string | undefined) => {
  const next = url ? normalizeHttpBaseUrl(url) : '';
  _backendApiBaseUrl = next || undefined;
};

export const getBackendApiBaseUrl = () => {
  if (_backendApiBaseUrl) return _backendApiBaseUrl;

  const env = (import.meta as any)?.env;
  const fromEnv =
    env?.VITE_BACKEND_API_URL ??
    env?.VITE_BACKEND_URL ??
    env?.VITE_API_URL ??
    env?.VITE_API_BASE_URL ??
    env?.VITE_API_HOST ??
    '';

  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    _backendApiBaseUrl = normalizeHttpBaseUrl(fromEnv);
    return _backendApiBaseUrl;
  }

  if (typeof window !== 'undefined') {
    const port = '8081';
    _backendApiBaseUrl = normalizeHttpBaseUrl(`${window.location.hostname}:${port}`);
    return _backendApiBaseUrl;
  }

  _backendApiBaseUrl = 'http://localhost:8081';
  return _backendApiBaseUrl;
};

export const getBackendWsBaseUrl = () => {
  const httpBase = getBackendApiBaseUrl();
  return httpBase.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
};

