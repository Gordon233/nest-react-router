import { Form, redirect, useActionData } from "react-router";
import type { Route } from "./+types/login";
import { api } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

// action 处理表单提交
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const loginResponse = await api.request("/auth/login", {
      method: "post",
      body: { email, password },
      request,
    });

    // ✅ 成功：可以访问响应头
    const setCookieHeader = loginResponse.headers['set-cookie'];

    if (setCookieHeader) {
      return redirect("/users", {
        headers: {
          "Set-Cookie": setCookieHeader,
        },
      });
    } else {
      return redirect("/users");
    }
  } catch (error) {
    // ✅ 错误：可以访问完整响应信息
    if (error instanceof Error && (error as any).response) {
      const response = (error as any).response;
      return {
        error: response.data?.message || "Invalid credentials",
        email
      };
    }

    // 其他类型的错误（如 redirect）重新抛出
    throw error;
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