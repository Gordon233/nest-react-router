import { Link, useLoaderData, Form, redirect } from "react-router";
import type { Route } from "./+types/users";
import { api, ApiError } from "~/lib/api";
import { Button } from "~/components/ui/button";
import type { components } from "~/types/api";

type UserResponse = components["schemas"]["UserResponseDto"];

// loader 在组件渲染前获取数据
export async function loader({ request }: Route.LoaderArgs) {
  console.log("[USERS DEBUG] Users loader called, request URL:", request.url);
  console.log(`[JWT DEBUG] Users loader started - SSR loading user data`);
  
  // Log request details in SSR context
  console.log(`[JWT DEBUG] Request object:`, {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
  });
  
  // Check for cookie header specifically
  const cookieHeader = request.headers.get('cookie');
  console.log(`[JWT DEBUG] Cookie header from request:`, cookieHeader);
  
  if (cookieHeader) {
    console.log(`[JWT DEBUG] Cookies found in SSR request:`, cookieHeader);
  } else {
    console.log(`[JWT DEBUG] NO cookies found in SSR request - this is the problem!`);
  }
  
  try {
    console.log("[USERS DEBUG] Making API request to /users");
    console.log(`[JWT DEBUG] Users loader: About to request /users`);
    console.log(`[JWT DEBUG] Users loader: Passing request object for cookie forwarding`);
    
    // 🔑 关键改动：传递 request 对象以转发 cookies
    const users = await api.request<UserResponse[]>("/users", {
      request, // 传递原始请求对象，包含 cookies
    });
    
    console.log("[USERS DEBUG] Users API response success, users count:", users?.length);
    console.log(`[JWT DEBUG] Users loader: Successfully got ${users?.length} users`);
    console.log(`[JWT DEBUG] Users loader: Cookie forwarding worked! 🎉`);
    return { users };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      console.log("[USERS DEBUG] 401 Unauthorized - redirecting to login");
      console.log(`[JWT DEBUG] Users loader: 401 error, redirecting to /login`);
      console.log(`[JWT DEBUG] Users loader: Cookie forwarding may have failed ❌`);
      // 未登录，跳转到登录页
      throw redirect("/login");
    }
    console.log("[USERS DEBUG] Non-401 error, throwing to ErrorBoundary:", error);
    console.log(`[JWT DEBUG] Users loader: Non-401 error, throwing to ErrorBoundary`);
    throw error; // 其他错误会被 ErrorBoundary 捕获
  }
}

// action 处理用户操作（如删除）
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const userId = formData.get("userId");

  if (intent === "delete" && userId) {
    try {
      await api.request(`/users/${userId}` as any, {
        method: "delete",
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        return { error: "You can only delete your own account" };
      }
      throw error;
    }
  }

  return null;
}

export default function Users() {
  console.log(`[JWT DEBUG] Users component rendering - SSR/Client render`);
  const { users } = useLoaderData<typeof loader>();
  console.log(`[JWT DEBUG] Users component: Got ${users?.length} users from loader`);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Users</h1>
        <Link to="/profile">
          <Button variant="outline">My Profile</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Provider
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.provider}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link 
                    to={`/users/${user.id}`}
                    className="text-primary hover:underline mr-4"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 错误边界
export function ErrorBoundary() {
  console.log(`[JWT DEBUG] Users ErrorBoundary rendered - Error in users route`);
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">
          Failed to load users
        </h2>
        <p className="text-red-600">
          Please make sure you're logged in and try again.
        </p>
        <Link to="/login" className="text-primary hover:underline mt-4 inline-block">
          Go to login →
        </Link>
      </div>
    </div>
  );
}