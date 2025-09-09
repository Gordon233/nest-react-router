import { Form, redirect, useActionData } from "react-router";
import type { Route } from "./+types/login";
import { api, ApiError } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

// action 处理表单提交
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  console.log("[LOGIN DEBUG] Starting login action for email:", email);

  try {
    console.log("[LOGIN DEBUG] Making API request to /auth/login");
    const loginResponse = await api.request("/auth/login", {
      method: "post",
      body: { email, password },
    });
    
    console.log("[LOGIN DEBUG] Login API response:", loginResponse);
    console.log("[LOGIN DEBUG] Login successful, redirecting to /users");
    
    // 登录成功，跳转到首页或用户页
    return redirect("/users");
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
  const actionData = useActionData<typeof action>();

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