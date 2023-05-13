import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./main.css";
import { Home } from "./pages";
import { Task } from "./pages/Task";
import { Root } from "./pages/Root";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "task",
        element: <Navigate to="/task/detail" />,
      },
      {
        path: "task/:type",
        element: <Task />,
      },
    ],
  },
]);

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(<RouterProvider router={router} />);
