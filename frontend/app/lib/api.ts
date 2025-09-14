import type { paths } from '~/types/api';

type ApiPath = keyof paths;
type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

interface ApiResponse<T = any> {
  data: T;
  headers: Record<string, string>;
  status: number;
  statusText: string;
  error?: boolean;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error: ${status} ${statusText}`);
  }
}

class ApiClient {
  private baseUrl = 'http://localhost:3000';


  private buildResponse<T>(res: Response, data: T, error = false): ApiResponse<T> {
    return {
      data,
      headers: Object.fromEntries(res.headers.entries()),
      status: res.status,
      statusText: res.statusText,
      ...(error && { error: true })
    };
  }

  private handleCookies(headers: Record<string, string>, request: Request) {
    const isServer = typeof window === 'undefined';

    if (!isServer) {
      console.log('[API] Browser environment - using credentials: include');
      console.log('[API] Browser cookies available', document.cookie);
    } else {
      console.log('[API] Server environment - extracting cookies');
      const cookieHeader = request.headers.get('cookie');
      console.log('[API] Raw cookie header from request', cookieHeader);

      if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
        console.log('[API] ✅ SUCCESS: Forwarding cookies to API', cookieHeader);
      } else {
        console.log('[API] ❌ WARNING: No cookies found in SSR request header');
      }
    }
  }

  async request<T = any>(
    path: ApiPath,
    options: {
      method?: HttpMethod;
      body?: any;
      params?: Record<string, string>;
      // 🔑 必须：React Router 的 request 对象用于 SSR cookie 转发
      request: Request;
    }
  ): Promise<ApiResponse<T>> {
    const isServer = typeof window === 'undefined';

    console.log(`[API] API request initiated for ${path}`);
    console.log(`[API] Environment: ${isServer ? 'SERVER (SSR)' : 'BROWSER (CLIENT)'}`);

    const url = new URL(`${this.baseUrl}${path}`);

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    console.log(`[API] Making ${options.method || 'GET'} request to`, url.toString());

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    this.handleCookies(headers, options.request);

    const fetchConfig: RequestInit = {
      method: options.method || 'get',
      headers,
      ...(options.body && { body: JSON.stringify(options.body) }),
      ...(typeof window !== 'undefined' && { credentials: 'include' as RequestCredentials })
    };

    const res = await fetch(url.toString(), fetchConfig);


    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return this.buildResponse(res, errorData, true);
    }

    if (res.status === 204) {
      console.log(`[API] No content response from ${path}`);
      return this.buildResponse(res, undefined as T);
    }

    const responseData = await res.json();
    console.log(`[API] Successfully received response from ${path}`, responseData);
    return this.buildResponse(res, responseData);
  }
}

export const api = new ApiClient();
export { ApiError };