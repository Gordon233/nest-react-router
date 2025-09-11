import type { paths } from '~/types/api';

type ApiPath = keyof paths;
type HttpMethod = 'get' | 'post' | 'patch' | 'delete';

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
  private baseUrl = 'http://localhost:3000'; // 开发环境
  
  async request<T = any>(
    path: ApiPath,
    options?: {
      method?: HttpMethod;
      body?: any;
      params?: Record<string, string>;
      // 🔑 新增：接受 React Router 的 request 对象用于 SSR cookie 转发
      request?: Request;
      // 🔑 新增：返回完整响应而不仅仅是数据
      returnFullResponse?: boolean;
    }
  ): Promise<T> {
    console.log(`[JWT DEBUG] API request initiated for ${path}`);
    console.log(`[JWT DEBUG] Options received:`, {
      method: options?.method,
      hasBody: !!options?.body,
      hasRequest: !!options?.request,
      hasParams: !!options?.params,
      returnFullResponse: !!options?.returnFullResponse
    });
    
    // Environment detection
    const isServer = typeof window === 'undefined';
    const isBrowser = typeof window !== 'undefined';
    console.log(`[JWT DEBUG] Environment: ${isServer ? 'SERVER (SSR)' : 'BROWSER (CLIENT)'}`);
    
    const url = new URL(`${this.baseUrl}${path}`);
    
    // 添加查询参数
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    console.log(`[API DEBUG] Making ${options?.method || 'GET'} request to:`, url.toString());
    console.log(`[API DEBUG] Request body:`, options?.body);
    
    // 🔑 构建 headers，包括 cookie 转发逻辑
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    console.log(`[JWT DEBUG] Initial headers:`, headers);
    
    // Cookie 处理逻辑
    if (isBrowser) {
      console.log(`[JWT DEBUG] Browser environment - using credentials: include`);
      console.log(`[JWT DEBUG] Browser cookies available:`, document.cookie);
    } else if (isServer) {
      console.log(`[JWT DEBUG] Server environment - checking for request object`);
      if (options?.request) {
        console.log(`[JWT DEBUG] Request object provided - extracting cookies`);
        const cookieHeader = options.request.headers.get('cookie');
        console.log(`[JWT DEBUG] Raw cookie header from request:`, cookieHeader);
        
        if (cookieHeader) {
          headers['Cookie'] = cookieHeader;
          console.log(`[JWT DEBUG] ✅ SUCCESS: Forwarding cookies to API:`, cookieHeader);
          console.log(`[JWT DEBUG] Headers now include Cookie header:`, headers);
        } else {
          console.log(`[JWT DEBUG] ❌ WARNING: No cookies found in SSR request header`);
        }
      } else {
        console.log(`[JWT DEBUG] ❌ ERROR: No request object provided in SSR environment!`);
        console.log(`[JWT DEBUG] This will likely cause 401 errors for authenticated routes`);
      }
    }
    
    console.log(`[JWT DEBUG] Final headers before fetch:`, headers);
    console.log(`[JWT DEBUG] About to make fetch request`);

    const fetchOptions: RequestInit = {
      method: options?.method || 'get',
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    };

    // 只在浏览器环境使用 credentials: 'include'
    if (isBrowser) {
      fetchOptions.credentials = 'include';
      console.log(`[JWT DEBUG] Browser: Added credentials: include to fetch options`);
    } else {
      console.log(`[JWT DEBUG] Server: Using manual cookie headers instead of credentials`);
    }

    console.log(`[JWT DEBUG] Final fetch options:`, fetchOptions);

    const res = await fetch(url.toString(), fetchOptions);

    console.log(`[API DEBUG] Response status:`, res.status, res.statusText);
    console.log(`[API DEBUG] Response headers:`, Object.fromEntries(res.headers.entries()));
    console.log(`[JWT DEBUG] Received response from ${path} - Status: ${res.status}`);

    // 处理错误
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      console.log(`[API DEBUG] Error response data:`, errorData);
      console.log(`[JWT DEBUG] API Error occurred for ${path} - Status: ${res.status}`);
      
      // 即使是错误，如果需要完整响应，也返回完整信息
      if (options?.returnFullResponse) {
        console.log(`[JWT DEBUG] Error occurred but returnFullResponse=true, returning full error response`);
        const responseHeaders = Object.fromEntries(res.headers.entries());
        const fullErrorResponse = {
          data: errorData,
          headers: responseHeaders,
          status: res.status,
          statusText: res.statusText,
          error: true
        };
        console.log(`[JWT DEBUG] Full error response:`, fullErrorResponse);
        return fullErrorResponse as T;
      }
      
      throw new ApiError(res.status, res.statusText, errorData);
    }

    // 204 No Content 不返回数据
    if (res.status === 204) {
      console.log(`[API DEBUG] 204 No Content response`);
      console.log(`[JWT DEBUG] No content response from ${path}`);
      
      if (options?.returnFullResponse) {
        console.log(`[JWT DEBUG] 204 response with returnFullResponse=true`);
        const responseHeaders = Object.fromEntries(res.headers.entries());
        const fullResponse = {
          data: undefined,
          headers: responseHeaders,
          status: res.status,
          statusText: res.statusText
        };
        console.log(`[JWT DEBUG] Full 204 response:`, fullResponse);
        return fullResponse as T;
      }
      
      return undefined as T;
    }

    const responseData = await res.json();
    console.log(`[API DEBUG] Success response data:`, responseData);
    console.log(`[JWT DEBUG] Successfully received and parsed response from ${path}`);
    
    // 🔑 如果需要完整响应，包含 headers
    if (options?.returnFullResponse) {
      console.log(`[JWT DEBUG] Returning full response with headers for ${path}`);
      const responseHeaders = Object.fromEntries(res.headers.entries());
      console.log(`[JWT DEBUG] Response headers being returned:`, responseHeaders);
      
      const fullResponse = {
        data: responseData,
        headers: responseHeaders,
        status: res.status,
        statusText: res.statusText
      };
      console.log(`[JWT DEBUG] Full response object:`, fullResponse);
      return fullResponse as T;
    }
    
    return responseData;
  }
}

export const api = new ApiClient();
export { ApiError };