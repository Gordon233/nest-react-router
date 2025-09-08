import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  // route("register", "routes/register.tsx"),
  // route("login", "routes/login.tsx"),
  // route("profile", "routes/profile.tsx"),
  route("google-test", "routes/google-test.tsx"),
] satisfies RouteConfig;
