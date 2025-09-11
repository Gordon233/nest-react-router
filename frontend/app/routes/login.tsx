import { Form, redirect, useActionData } from "react-router";
import type { Route } from "./+types/login";
import { api, ApiError } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

// action 处理表单提交
export async function action({ request }: Route.ActionArgs) {
  console.log(`[JWT DEBUG] Login action started - Request URL: ${request.url}`);
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log("[LOGIN DEBUG] Starting login action for email:", email);
  console.log(`[JWT DEBUG] Login action: Processing login for email: ${email}`);

  try {
    console.log("[LOGIN DEBUG] Making API request to /auth/login");
    console.log(`[JWT DEBUG] Login action: About to call /auth/login API`);
    console.log(`[JWT DEBUG] Login action: Passing request object (though login doesn't need auth)`);
    
    // 🔑 获取完整响应以提取 cookies
    const loginResponse = await api.request("/auth/login", {
      method: "post",
      body: { email, password },
      request, // 传递 request 对象以保持一致性
      returnFullResponse: true, // 获取完整响应，包含 headers
    }) as {
      data: any;
      headers: Record<string, string>;
      status: number;
      statusText: string;
    };
    
    console.log(`[JWT DEBUG] Login action: Got full response with headers`);
    console.log(`[JWT DEBUG] Login response headers:`, loginResponse.headers);
    
    console.log("[LOGIN DEBUG] Login API response:", loginResponse);
    console.log("[LOGIN DEBUG] Login successful, redirecting to /users");
    console.log(`[JWT DEBUG] Login action: Login successful, got response:`, loginResponse);
    
    // 🔑 提取 set-cookie header
    const setCookieHeader = loginResponse.headers['set-cookie'];
    console.log(`[JWT DEBUG] Login action: Extracted set-cookie header:`, setCookieHeader);
    
    if (setCookieHeader) {
      console.log(`[JWT DEBUG] Login action: Found cookies to forward:`, setCookieHeader);
      console.log(`[JWT DEBUG] Login action: Creating redirect with cookie headers`);
      
      // 创建带有 cookie 的重定向响应
      return redirect("/users", {
        headers: {
          "Set-Cookie": setCookieHeader,
        },
      });
    } else {
      console.log(`[JWT DEBUG] Login action: No cookies found in response, doing normal redirect`);
      console.log(`[JWT DEBUG] Login action: Redirecting to /users without cookies`);
      
      // 没有 cookies 的常规重定向
      return redirect("/users");
    }
  } catch (error) {
    console.log("[LOGIN DEBUG] Login error:", error);
    if (error instanceof ApiError) {
      console.log("[LOGIN DEBUG] ApiError details - status:", error.status, "data:", error.data);
      return {
        error: error.data?.message || "Invalid credentials",
        email, // 保留用户输入
      };
    }
    console.log("[LOGIN DEBUG] Unexpected error:", error);
    return {
      error: "An unexpected error occurred",
      email,
    };
  }
}

// 页面组件
export default function Login() {
  console.log(`[JWT DEBUG] Login component rendering`);
  const actionData = useActionData<typeof action>();
  console.log(`[JWT DEBUG] Login component: ActionData:`, actionData);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Sign in</h2>
        </div>
        
        <Form method="post" className="space-y-6">
          {actionData?.error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {actionData.error}
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={actionData?.email}
              placeholder="john@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
            />
          </div>
          
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </Form>
        
        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <a href="/register" className="text-primary hover:underline">
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}