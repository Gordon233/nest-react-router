import { Link, useLoaderData, redirect } from "react-router";
import type { Route } from "./+types/home";
import { api, createFetchOptions } from "~/lib/api";
import { Button } from "~/components/ui/button";

// 尝试获取当前用户，但不强制登录
export async function loader({ request }: { request: Request }) {
  try {
    const fetchOptions = createFetchOptions(request);
    const { data } = await api.GET("/auth/me", {
      headers: fetchOptions.headers,
      credentials: fetchOptions.credentials
    });

    console.log('[HOME] User authenticated', data);
    return { user: data, isAuthenticated: true };
  } catch (error) {
    // 未登录也没关系，显示公开页面
    // 注意：如果是 redirect，需要重新抛出
    if (error && (error as any).response?.status === 401) {
      console.log('[HOME] User not authenticated, showing public page');
      return { user: null, isAuthenticated: false };
    }
    throw error; // 重新抛出其他错误
  }
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "User Management System" },
    { name: "description", content: "A modern user management application" },
  ];
}

export default function Home() {
  const { user, isAuthenticated } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 简单的导航栏 */}
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-xl font-bold">
                User System
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/users" className="text-gray-700 hover:text-primary">
                    Users
                  </Link>
                  <Link to="/profile" className="text-gray-700 hover:text-primary">
                    Profile
                  </Link>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-gray-600">
                    Hello, {user?.firstName}!
                  </span>
                  <form action="/profile" method="post" className="inline">
                    <input type="hidden" name="intent" value="logout" />
                    <Button type="submit" variant="outline" size="sm">
                      Logout
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="outline" size="sm">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主页内容 */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">
            Welcome to User Management System
          </h1>
          
          {isAuthenticated ? (
            <div className="space-y-6">
              <p className="text-xl text-gray-600">
                Welcome back, {user?.firstName} {user?.lastName}!
              </p>
              
              <div className="bg-white rounded-lg shadow p-8 text-left">
                <h2 className="text-2xl font-semibold mb-4">Your Account</h2>
                <div className="space-y-2">
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Provider:</strong> {user?.provider}</p>
                  <p><strong>Status:</strong> 
                    <span className={`ml-2 ${user?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>
                
                <div className="mt-6 space-x-4">
                  <Link to="/users">
                    <Button>View All Users</Button>
                  </Link>
                  <Link to="/profile">
                    <Button variant="outline">Edit Profile</Button>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-xl text-gray-600">
                A secure and modern platform for managing user accounts
              </p>
              
              <div className="bg-white rounded-lg shadow p-8">
                <h2 className="text-2xl font-semibold mb-4">Get Started</h2>
                <p className="text-gray-600 mb-6">
                  Sign in to access your account or create a new one to get started.
                </p>
                
                <div className="space-x-4">
                  <Link to="/login">
                    <Button size="lg">Sign In</Button>
                  </Link>
                  <Link to="/register">
                    <Button size="lg" variant="outline">Create Account</Button>
                  </Link>
                </div>
              </div>

              <div className="mt-8">
                <Link to="/google-test" className="text-primary hover:underline">
                  Test Google OAuth →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}