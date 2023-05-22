import React from "react";
import { createRoot } from "react-dom/client";
import { Analytics } from "@vercel/analytics/react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import "./main.css";
import { Home } from "./pages";
import { Task } from "./pages/Task";
import { Root } from "./pages/Root";
import { ModalProvider } from "./lib/modal";
import { repoQueryClient } from "./filesystem/queries";

const RedirectRoute = () => {
  const params = new URLSearchParams(window.location.search);

  const path = params.get("path");

  return <Navigate to={path ? `/repo/${path}` : "/"} />;
};

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
        path: "repo/:repo",
        element: <Task />,
      },
      {
        path: "repo/:repo/:tab",
        element: <Task />,
      },
      {
        path: "index.html",
        element: <RedirectRoute />,
      },
    ],
  },
]);

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <ModalProvider>
      <QueryClientProvider client={repoQueryClient}>
        <RouterProvider router={router} />
        <Analytics />
      </QueryClientProvider>
    </ModalProvider>
  </React.StrictMode>
);
