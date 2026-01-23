import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Login from "../pages/login/page";
import Dashboard from "../pages/dashboard/page";
import Profile from "../pages/profile/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
