import { Link, useLoaderData, Form } from "react-router";
import type { Route } from "./+types/users";
import { api, createFetchOptions, handleApiError } from "~/lib/api";
import { Button } from "~/components/ui/button";
import type { components } from "~/types/api";

type UserResponse = components["schemas"]["UserResponseDto"];

// loader 在组件渲染前获取数据
export async function loader({ request }: Route.LoaderArgs) {
  try {
    const fetchOptions = createFetchOptions(request);
    const { data } = await api.GET("/users", fetchOptions);

    console.log('[USERS] Users loaded successfully', data);
    return { users: data };
  } catch (error) {
    handleApiError(error, "/users");
  }
}

// action 处理用户操作（如删除）
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const userId = formData.get("userId");

  if (intent === "delete" && userId) {
    try {
      const fetchOptions = createFetchOptions(request);
      await api.DELETE("/users/{id}", {
        params: { path: { id: Number(userId) } },
        headers: fetchOptions.headers,
        credentials: fetchOptions.credentials
      });
    } catch (error) {
      try {
        handleApiError(error, `/users/${userId}`);
      } catch (apiError) {
        if (apiError instanceof Error && (apiError as any).status === 403) {
          return { error: "You can only delete your own account" };
        }
        throw apiError;
      }
    }
  }

  return null;
}

export default function Users() {
  const { users } = useLoaderData<typeof loader>();

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