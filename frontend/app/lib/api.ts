import { redirect, data } from 'react-router';
import createClient from 'openapi-fetch';
import type { paths } from '~/types/api';

export const api = createClient<paths>({ baseUrl: 'http://localhost:3000' });

export function createHeaders(request: Request) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

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

  return headers;
}

export function handleApiError(error: any, path: string) {
  console.log(`[API] API request error for ${path}:`, error);

  // Handle openapi-fetch error format
  if (error.response) {
    const { status } = error.response;

    // Automatic redirect on 401 Unauthorized
    if (status === 401) {
      console.log(`[API] 401 Unauthorized - redirecting to login`);
      throw redirect("/login");
    }

    // Return 404 with data() for proper error boundary handling
    if (status === 404) {
      console.log(`[API] 404 Not Found`);
      throw data("Not Found", { status: 404 });
    }

    // Create enhanced error with response information
    const errorMessage = error.response.data?.message || `API Error: ${status}`;
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).response = error.response;
    (enhancedError as any).status = status;

    console.log(`[API] Throwing error for ${path}:`, enhancedError.message);
    throw enhancedError;
  }

  // Re-throw non-API errors
  throw error;
}

export function createFetchOptions(request: Request) {
  const isServer = typeof window === 'undefined';
  const headers = createHeaders(request);

  const fetchOptions: RequestInit = {
    headers,
  };

  // Add credentials for client-side requests
  if (!isServer) {
    fetchOptions.credentials = 'include';
  }

  return fetchOptions;
}