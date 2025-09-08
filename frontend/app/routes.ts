import { type RouteConfig, index, route, prefix } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("profile", "routes/profile.tsx"),
  route("users", "routes/users.tsx"),
  route("users/:id", "routes/users.$id.tsx"),
  route("google-test", "routes/google-test.tsx"),
] satisfies RouteConfig;