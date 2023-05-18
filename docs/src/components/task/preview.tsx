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
import {
  Eye,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Save,
} from "lucide-react";
import { useLayoutEffect, useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useTheme } from "../hooks/useTheme";

function Preview({
  repo,
  file,
  onFileChange,
}: {
  repo: string;
  file: string | null;
  onFileChange: (file: string) => void;
}) {
  const theme = useTheme();
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

  const isEmpty = tasks?.length === 0;

  return (
    <div
      className={cn("flex flex-col gap-2 group w-full", {
        "show-panel": showPanel,
      })}
    >
      <div className="flex flex-row gap-2 items-center sticky top-16">
        <Select value={activePath} onValueChange={(file) => onFileChange(file)}>
          <SelectTrigger className="w-auto flex-grow-0 bg-background">
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
          <TooltipProvider>
            <Tooltip open={(repo === "demo" || isEmpty) && undefined}>
              <TooltipTrigger>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={repo === "demo" || isEmpty}
                >
                  <Save className="mr-1" size={16} />
                  Save to Local
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm text-muted-foreground">
                  {isEmpty
                    ? "no matches to save"
                    : "this feature is not available in demo mode"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
      {fileContent.isLoading ? (
        <div className="flex-grow w-full flex flex-row items-center justify-center">
          <Loader2 className="animate-spin" size={60} />
        </div>
      ) : (
        <div className="flex-grow flex flex-row gap-4 w-full">
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
          <Card
            className="shrink-0 hidden group-[.show-panel]:block w-[300px] sticky top-28 overflow-auto"
            style={{
              maxHeight: "calc(100vh - 8.5rem)",
            }}
          >
            <CardHeader className="sticky top-0 bg-background">
              <CardTitle>Text Matches</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="text-sm text-muted-foreground">{error.message}</p>
              )}
              {tasks?.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  no matches found
                </p>
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
      )}
    </div>
  );
}

export default Preview;
