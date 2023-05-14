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
import { useFileContent, useFiles } from "@/filesystem/queries";
import { cn } from "@/lib/utils";
import { Eye, PanelRightClose, PanelRightOpen, Save } from "lucide-react";
import { useLayoutEffect, useMemo, useState } from "react";

function Preview({ repo }: { repo: string }) {
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

  const [active, setActive] = useState<string | null>(null);

  const files = useFiles(repo, {
    onSuccess(res) {
      if (res[0]) {
        setActive(res[0].path);
      }
    },
  });

  const fileContent = useFileContent(repo, active);

  const [showPanel, setShowPanel] = useState(false);

  return (
    <div
      className={cn("flex flex-col gap-2 group", {
        "show-panel": showPanel,
      })}
    >
      <div className="flex flex-row gap-2 items-center">
        <Select value={active as string} onValueChange={setActive}>
          <SelectTrigger className="w-auto flex-grow-0">
            <SelectValue placeholder="select..." />
          </SelectTrigger>
          <SelectContent>
            {files.data?.map((file) => {
              return (
                <SelectItem key={file.path} value={file.path}>
                  {file.path}
                </SelectItem>
              );
            })}
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowPanel(!showPanel);
            }}
          >
            <PanelRightOpen className="group-[.show-panel]:hidden" size={16} />
            <PanelRightClose
              className="hidden group-[.show-panel]:block"
              size={16}
            />
          </Button>
        </div>
      </div>
      <div className="flex flex-row gap-4 w-full">
        <div className="flex-grow overflow-auto">
          <Code theme={theme}>{fileContent.data as string}</Code>
        </div>
        <Card className="hidden group-[.show-panel]:block w-[300px]">
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
