import { createRoot } from "react-dom/client";
import './main.css';
import { Button } from "./components/ui/button";
import { ThemeToggle } from "./components/theme-toggle";

function App() {
  return (
    <div className="relative h-screen flex flex-col">
      <header className="sticky top-0 z-10">
        <div className="container h-14 p-3 flex flex-row">
          <div className=" flex-grow flex justify-end">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <section className="flex-grow self-center flex flex-col justify-center">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
          Extract Locale
        </h1>
        <p className="leading-7 [&:not(:first-child)]:mt-6 mb-6">
          replace all your <span className="font-bold text-black dark:text-white ">word/文本</span> to <span className="">formatMessage</span>
        </p>
        <Button>Get Start</Button>
      </section>
    </div>
  );
}

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(<App />);
