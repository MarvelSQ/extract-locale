import { ThemeToggle } from "@/components/theme-toggle";
import { Languages } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

export function Root() {
  const location = useLocation();

  return (
    <div className="relative min-h-screen flex flex-col">
      <header className="sticky top-0 z-10 backdrop-blur border-b">
        <div className="container h-14 p-3 flex flex-row">
          <div className="self-center">
            {location.pathname !== "/" && (
              <Link to="/" className="font-bold">
                <Languages className="mr-2 h-4 w-4 inline-block" /> Extract
                Locale
              </Link>
            )}
          </div>
          <div className=" flex-grow flex justify-end">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
