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
import { RedirectTask, Task } from "./pages/Task";
import { Root } from "./pages/Root";
import { ModalProvider } from "./lib/modal";
import { repoQueryClient } from "./filesystem/queries";
import Builder from "./pages/Builder";
import { Toaster } from "./components/ui/toaster";

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
        path: "repo",
        element: <RedirectTask />,
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
        path: "builder",
        element: <Builder />,
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
    <QueryClientProvider client={repoQueryClient}>
      <ModalProvider>
        <RouterProvider router={router} />
        <Toaster />
        <Analytics />
      </ModalProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
