import Code from "@/Task/Code";
import { useLayoutEffect, useState } from "react";

const code = `import React, { useMemo } from "react";

function Home({ name, children }: React.PropsWithChildren<{ name: string }>) {
  const content = useMemo(() => {
    return \`主页 - \${name}\`;
  }, [name]);

  return (
    <div>
      <div>{content}</div>
      <div>{children}</div>
    </div>
  );
}

export default Home;`;

function Preview() {
  const [theme, setTheme] = useState();

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

  return (
    <div>
      <Code theme={theme}>{code}</Code>
    </div>
  );
}

export default Preview;
