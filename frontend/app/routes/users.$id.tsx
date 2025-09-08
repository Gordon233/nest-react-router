import { useLoaderData, Link, Form, redirect } from "react-router";
import type { Route } from "./+types/users.$id";
import { api, ApiError } from "~/lib/api";
import { Button } from "~/components/ui/button";
import type { components } from "~/types/api";

type UserResponse = components["schemas"]["UserResponseDto"];

export async function loader({ params }: Route.LoaderArgs) {
  const userId = params.id;
  
  try {
    const user = await api.request<UserResponse>(`/users/${userId}` as any);
    return { user };
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        throw redirect("/login");
      }
      if (error.status === 404) {
        throw new Response("User not found", { status: 404 });
      }
    }
    throw error;
  }
}

export default function UserDetail() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Details</h1>
        <Link to="/users">
          <Button variant="outline">← Back to Users</Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-600">{user.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <span className="text-sm font-medium text-gray-500">Status</span>
              <p className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">Provider</span>
              <p className="font-medium capitalize">{user.provider}</p>
            </div>
            
            {user.phone && (
              <div>
                <span className="text-sm font-medium text-gray-500">Phone</span>
                <p className="font-medium">{user.phone}</p>
              </div>
            )}
            
            {user.gender && (
              <div>
                <span className="text-sm font-medium text-gray-500">Gender</span>
                <p className="font-medium capitalize">{user.gender}</p>
              </div>
            )}
            
            <div>
              <span className="text-sm font-medium text-gray-500">Member Since</span>
              <p className="font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">Last Updated</span>
              <p className="font-medium">
                {new Date(user.updatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-800 mb-2">
          User Not Found
        </h2>
        <p className="text-red-600 mb-4">
          The user you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <Link to="/users">
          <Button variant="outline">← Back to Users</Button>
        </Link>
      </div>
    </div>
  );
}