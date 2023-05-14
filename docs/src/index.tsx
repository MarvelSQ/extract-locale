import React from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./main.css";
import { Home } from "./pages";
import { Task } from "./pages/Task";
import { Root } from "./pages/Root";
import { ModalProvider } from "./lib/modal";
import { getRepos, repoQueryClient } from "./filesystem/queries";

const repos = getRepos();

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
    ],
  },
]);

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <React.StrictMode>
    <ModalProvider>
      <QueryClientProvider client={repoQueryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ModalProvider>
  </React.StrictMode>
);
