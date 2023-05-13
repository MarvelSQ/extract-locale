import Code from "@/Task/Code";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Eye,
  PanelRightOpen,
  Save,
} from "lucide-react";
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
    <div className="flex flex-col gap-2">
      <div className="flex flex-row gap-2 items-center">
        <Select defaultValue="Home.tsx">
          <SelectTrigger className="w-auto flex-grow-0">
            <SelectValue placeholder="select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="components/Button.tsx">
              components/Button.tsx
            </SelectItem>
            <SelectItem value="Home.tsx">Home.tsx</SelectItem>
            <SelectItem value="index.tsx">index.tsx</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm">
          <Eye className="mr-1" size={16} />
          Preview
        </Button>
        <div className="flex-grow flex flex-row justify-end gap-2">
          <Button size="sm" variant="outline">
            <Save className="mr-1" size={16} />
            Save to Local
          </Button>
          <Button size="sm" variant="outline">
            <PanelRightOpen size={16} />
          </Button>
        </div>
      </div>
      <div className="flex flex-row gap-4">
        <div className="flex-grow">
          <Code theme={theme}>{code}</Code>
        </div>
        <Card className="w-[300px]">
          <CardHeader>
            <CardTitle>Text Matches</CardTitle>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Preview;
