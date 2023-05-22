import { useLayoutEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"dark" | "light">();

  useLayoutEffect(() => {
    const handleChange = () => {
      // check html classlist
      const html = document.querySelector("html");
      if (html) {
        const classList = html.classList;
        if (classList.contains("dark")) {
          setTheme("dark");
        } else {
          setTheme("light");
        }
      }
    };

    const mutationObserver = new MutationObserver(handleChange);

    mutationObserver.observe(document.querySelector("html")!, {
      attributes: true,
      attributeFilter: ["class"],
    });

    handleChange();

    return () => {
      mutationObserver.disconnect();
    };
  }, []);

  return theme;
}
