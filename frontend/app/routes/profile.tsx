import { Form, redirect, useLoaderData, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/profile";
import { api, ApiError } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { components } from "~/types/api";

type UserResponse = components["schemas"]["UserResponseDto"];
type UpdateUserDto = components["schemas"]["UpdateUserDto"];

// 获取当前用户信息
export async function loader({ request }: Route.LoaderArgs) {
  try {
    const user = await api.request<UserResponse>("/auth/me");
    return { user };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw redirect("/login");
    }
    throw error;
  }
}

// 处理更新操作
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  
  // 获取当前用户信息
  const currentUser = await api.request<UserResponse>("/auth/me");
  
  if (intent === "update") {
    const updateData: UpdateUserDto = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string || undefined,
      gender: formData.get("gender") as "male" | "female" | "other" | undefined,
    };
    
    try {
      await api.request(`/users/${currentUser.id}` as any, {
        method: "patch",
        body: updateData,
      });
      return { success: "Profile updated successfully" };
    } catch (error) {
      if (error instanceof ApiError) {
        return { error: error.data?.message || "Failed to update profile" };
      }
      return { error: "An unexpected error occurred" };
    }
  }
  
  if (intent === "logout") {
    await api.request("/auth/logout", { method: "post" });
    return redirect("/login");
  }
  
  if (intent === "logout-all") {
    await api.request("/auth/logout-all-devices", { method: "post" });
    return redirect("/login");
  }
  
  return null;
}

export default function Profile() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>
      
      {/* 显示成功或错误消息 */}
      {actionData?.success && (
        <div className="bg-green-50 text-green-600 p-3 rounded-md mb-6">
          {actionData.success}
        </div>
      )}
      {actionData?.error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6">
          {actionData.error}
        </div>
      )}
      
      {/* 用户信息展示 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex">
            <span className="font-medium w-24">Email:</span>
            <span>{user.email}</span>
          </div>
          <div className="flex">
            <span className="font-medium w-24">Provider:</span>
            <span className="capitalize">{user.provider}</span>
          </div>
          <div className="flex">
            <span className="font-medium w-24">Status:</span>
            <span className={user.isActive ? "text-green-600" : "text-red-600"}>
              {user.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex">
            <span className="font-medium w-24">Member since:</span>
            <span>{new Date(user.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      {/* 编辑表单 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
        <Form method="post" className="space-y-4">
          <input type="hidden" name="intent" value="update" />
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                First Name
              </label>
              <Input
                id="firstName"
                name="firstName"
                defaultValue={user.firstName}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                Last Name
              </label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={user.lastName}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium mb-1">
              Phone
            </label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={user.phone || ""}
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label htmlFor="gender" className="block text-sm font-medium mb-1">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              className="w-full px-3 py-2 border rounded-md"
              defaultValue={user.gender || ""}
              disabled={isSubmitting}
            >
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </Form>
      </div>
      
      {/* 账户操作 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Account Actions</h2>
        <div className="space-y-3">
          <Form method="post" className="inline">
            <input type="hidden" name="intent" value="logout" />
            <Button type="submit" variant="outline">
              Logout
            </Button>
          </Form>
          
          <Form method="post" className="inline ml-3">
            <input type="hidden" name="intent" value="logout-all" />
            <Button type="submit" variant="destructive">
              Logout All Devices
            </Button>
          </Form>
        </div>
      </div>
    </div>
  );
}