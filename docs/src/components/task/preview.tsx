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
  openHandle,
  useFileContent,
  useFileTask,
  useFiles,
} from "@/filesystem/queries";
import { cn } from "@/lib/utils";
import { Eye, PanelRightClose, PanelRightOpen, Save } from "lucide-react";
import { useLayoutEffect, useMemo, useState } from "react";

function Preview({
  repo,
  file,
  onFileChange,
}: {
  repo: string;
  file: string | null;
  onFileChange: (file: string) => void;
}) {
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

  // const [active, setActive] = useState<string | null>(file);

  const files = useFiles(repo);

  const [showPanel, setShowPanel] = useState(true);

  const defaultActive = useMemo(() => {
    return files.data?.[0]?.path;
  }, [files.data]);

  const activePath = file || defaultActive;

  const fileContent = useFileContent(repo, activePath);

  const fileTasks = useFileTask(repo, activePath);

  const error =
    fileTasks.data &&
    "error" in fileTasks.data &&
    (fileTasks.data.error as Error);

  const tasks =
    fileTasks.data && "tasks" in fileTasks.data
      ? fileTasks.data.tasks
      : undefined;

  return (
    <div
      className={cn("flex flex-col gap-2 group", {
        "show-panel": showPanel,
      })}
    >
      <div className="flex flex-row gap-2 items-center">
        <Select value={activePath} onValueChange={(file) => onFileChange(file)}>
          <SelectTrigger className="w-auto flex-grow-0">
            <SelectValue placeholder="select..." />
          </SelectTrigger>
          <SelectContent className="max-h-[400px]">
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
          {(fileContent.error as Error | undefined)?.message ===
          "No directory handle" ? (
            <p className="text-sm text-muted-foreground">
              there is no live preview for this file, you can click{" "}
              <Button
                variant="link"
                onClick={() => {
                  openHandle(repo);
                }}
              >
                here
              </Button>{" "}
              to get the file
            </p>
          ) : (
            <Code theme={theme}>{fileContent.data as string}</Code>
          )}
        </div>
        <Card className="hidden group-[.show-panel]:block w-[300px]">
          <CardHeader>
            <CardTitle>Text Matches</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="text-sm text-muted-foreground">{error.message}</p>
            )}
            {tasks?.length === 0 && (
              <p className="text-sm text-muted-foreground">no matches found</p>
            )}
            {tasks?.map((task) => {
              return (
                <div
                  key={task.match.start}
                  className="flex flex-col gap-1 border-b border-accent pb-1"
                >
                  <p className="text-sm text-muted-foreground">
                    "
                    {Array.isArray(task.match.text)
                      ? task.match.text.join("[]")
                      : task.match.text}
                    "
                  </p>
                  <div className="flex flex-row gap-1">
                    <span className="text-xs rounded bg-accent-foreground text-accent p-1">
                      {task.localeKey}
                    </span>
                    <span className="text-xs rounded bg-accent-foreground text-accent p-1">
                      {task.match.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Preview;
