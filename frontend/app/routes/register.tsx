import { Form, redirect, useActionData } from "react-router";
import type { Route } from "./+types/register";
import { api } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { components } from "~/types/api";

type CreateUserDto = components["schemas"]["CreateUserDto"];

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  
  // 构建用户数据
  const userData: CreateUserDto = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    phone: formData.get("phone") as string || undefined,
    gender: formData.get("gender") as "male" | "female" | "other" | undefined,
  };

  try {
    await api.request("/auth/register", {
      method: "post",
      body: userData,
      request,
    });

    // 注册成功，跳转到登录页
    return redirect("/login");
  } catch (error) {
    if (error instanceof Error && (error as any).response) {
      const response = (error as any).response;
      // 处理具体错误（如邮箱已存在）
      if (response.status === 409) {
        return { error: "Email already exists", data: userData };
      }
      return {
        error: response.data?.message || "Registration failed",
        data: userData
      };
    }
    throw error; // 重新抛出其他错误
  }
}

export default function Register() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Create Account</h2>
        </div>
        
        <Form method="post" className="space-y-4">
          {actionData?.error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {actionData.error}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                First Name
              </label>
              <Input
                id="firstName"
                name="firstName"
                required
                defaultValue={actionData?.data?.firstName}
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                Last Name
              </label>
              <Input
                id="lastName"
                name="lastName"
                required
                defaultValue={actionData?.data?.lastName}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={actionData?.data?.email}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Min 8 characters"
            />
            <p className="text-xs text-gray-500 mt-1">
              Must contain uppercase, lowercase, and number/special character
            </p>
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone (Optional)
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={actionData?.data?.phone}
            />
          </div>
          
          <div>
            <label htmlFor="gender" className="block text-sm font-medium mb-1">
              Gender (Optional)
            </label>
            <select 
              id="gender"
              name="gender" 
              className="w-full px-3 py-2 border rounded-md"
              defaultValue={actionData?.data?.gender || ""}
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <Button type="submit" className="w-full">
            Sign up
          </Button>
        </Form>
        
        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <a href="/login" className="text-primary hover:underline">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}