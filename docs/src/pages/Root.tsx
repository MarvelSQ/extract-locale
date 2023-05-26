import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Github, Languages } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

export function Root() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 backdrop-blur border-b">
        <div className="h-14 p-3 flex flex-row">
          <div className="flex gap-4 items-center">
            {location.pathname !== "/" && (
              <>
                <Link to="/" className="font-bold">
                  <Languages className="mr-2 h-4 w-4 inline-block" /> Extract
                  Locale
                </Link>
                <Link to="/repo">
                  <Button
                    size="sm"
                    variant={
                      location.pathname.startsWith("/repo")
                        ? "secondary"
                        : "ghost"
                    }
                  >
                    Repo
                  </Button>
                </Link>
                <Link to="/builder">
                  <Button
                    size="sm"
                    variant={
                      location.pathname.startsWith("/builder")
                        ? "secondary"
                        : "ghost"
                    }
                  >
                    Builder
                  </Button>
                </Link>
              </>
            )}
          </div>
          <div className=" flex-grow flex justify-end gap-2">
            <Button variant="ghost" asChild>
              <a
                target="_blank"
                href="https://github.com/MarvelSQ/extract-locale"
              >
                <Github />
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}