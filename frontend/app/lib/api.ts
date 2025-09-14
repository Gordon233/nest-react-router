import { redirect, data } from 'react-router';
import type { paths } from '~/types/api';

type ApiPath = keyof paths;
type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

interface ApiResponse<T = any> {
  data: T;
  headers: Record<string, string>;
  status: number;
  statusText: string;
}

class ApiClient {
  private baseUrl = 'http://localhost:3000';


  private buildResponse<T>(res: Response, data: T): ApiResponse<T> {
    return {
      data,
      headers: Object.fromEntries(res.headers.entries()),
      status: res.status,
      statusText: res.statusText
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

    console.log(`[API] Received response from ${path} - Status: ${res.status}`);

    // Handle errors by throwing exceptions (React Router v7 standard)
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);

      // Automatic redirect on 401 Unauthorized
      if (res.status === 401) {
        console.log(`[API] 401 Unauthorized - redirecting to login`);
        throw redirect("/login");
      }

      // Return 404 with data() for proper error boundary handling
      if (res.status === 404) {
        console.log(`[API] 404 Not Found`);
        throw data("Not Found", { status: 404 });
      }

      // Create enhanced error with response information
      const error = new Error(errorData?.message || `API Error: ${res.status} ${res.statusText}`);
      const responseInfo = {
        data: errorData,
        headers: Object.fromEntries(res.headers.entries()),
        status: res.status,
        statusText: res.statusText
      };
      (error as any).response = responseInfo;
      (error as any).status = res.status;
      (error as any).statusText = res.statusText;

      console.log(`[API] Throwing error for ${path}:`, error.message);
      throw error;
    }

    // Handle 204 No Content
    if (res.status === 204) {
      console.log(`[API] No content response from ${path}`);
      return this.buildResponse(res, undefined as T);
    }

    // Success: return complete response
    const responseData = await res.json();
    console.log(`[API] Successfully received response from ${path}`, responseData);
    return this.buildResponse(res, responseData);
  }
}

export const api = new ApiClient();