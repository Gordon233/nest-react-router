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
    }
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    
    // 添加查询参数
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const res = await fetch(url.toString(), {
      method: options?.method || 'get',
      credentials: 'include', // 重要：自动发送 cookie
      headers: {
        'Content-Type': 'application/json',
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    // 处理错误
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new ApiError(res.status, res.statusText, errorData);
    }

    // 204 No Content 不返回数据
    if (res.status === 204) {
      return undefined as T;
    }

    return res.json();
  }
}

export const api = new ApiClient();
export { ApiError };