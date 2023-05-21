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
  useFileTasks,
  useFiles,
} from "@/filesystem/queries";
import { cn } from "@/lib/utils";
import {
  Edit,
  Eye,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Square,
  Trash,
  XSquare,
} from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { useTheme } from "../hooks/useTheme";
import { Checkbox } from "../ui/checkbox";
import { LocaleTask } from "../../../../src/type";
import { calcPostTasks } from "../../../../src/utils/calcPostTasks";
import { usePreviewTask } from "@/Task/usePreviewTask";

function Preview({
  repo,
  file,
  onFileChange,
  fileTaskPatch,
  onFileTaskPatchChange,
}: {
  repo: string;
  file: string | null;
  onFileChange: (file: string) => void;
  fileTaskPatch: Record<
    string,
    Record<
      string,
      {
        disable?: boolean;
      }
    >
  >;
  onFileTaskPatchChange: (
    filename: string,
    id: string,
    patch: {
      disable: boolean;
    }
  ) => void;
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

  const fileTasks = useFileTasks(repo);

  const currentFileTask = fileTasks.data?.find(
    (task) => task.path === activePath
  );

  const isSaved = currentFileTask?.saved;

  const { task, save } = useFileTask(repo, activePath);

  const error = task.data && "error" in task.data && (task.data.error as Error);

  const tasks = task.data && "tasks" in task.data ? task.data.tasks : undefined;

  const isEmpty = tasks?.length === 0;

  const [showPreview, setShowPreview] = useState(true);

  const content = useMemo(() => {
    if (showPreview && !isEmpty) {
      return (
        task.data?.toString(
          tasks?.filter((task) => {
            return !fileTaskPatch[activePath as string]?.[task.match.start]
              ?.disable;
          })
        ) ||
        fileContent.data ||
        ""
      );
    }
    return fileContent.data || "";
  }, [fileContent.data, task.data, isEmpty, showPreview, fileTaskPatch, tasks]);

  const previewRef = useRef<HTMLDivElement>(null);

  const textTasks = useMemo(() => {
    if (currentFileTask?.result && "tasks" in currentFileTask.result) {
      const { matches } = calcPostTasks(currentFileTask.result, {
        ignore(localeTask) {
          return (
            fileTaskPatch[activePath as string]?.[localeTask.match.start]
              ?.disable || false
          );
        },
      });

      return matches;
    }
  }, [currentFileTask?.result, fileTaskPatch]);

  const textTasksRef = useRef(textTasks);

  useMemo(() => {
    textTasksRef.current = textTasks;
  }, [textTasks]);

  const handleMatchClick = (
    baseTask: LocaleTask & {
      postMatch: {
        start: number;
        end: number;
      };
    }
  ) => {
    const task =
      textTasksRef.current?.find((task) => task.match === baseTask.match) ||
      baseTask;

    let { start, end } = task.match;

    if (showPreview) {
      start = task.postMatch.start;
      end = task.postMatch.end;
    }

    if (previewRef.current) {
      let currentOffset = 0;

      function walkNode(
        node: HTMLElement,
        nodes: HTMLElement[] = []
      ): HTMLElement[] {
        if (currentOffset > end) {
          return nodes;
        }

        const children = node.childNodes;

        for (let i = 0; i < children.length; i++) {
          const currentNode = children[i];

          // text node
          if (currentNode.nodeType === 3) {
            const text = currentNode.textContent || "";

            const nextOffset = currentOffset + text.length;

            if (start >= currentOffset && start < nextOffset) {
              nodes.push(node);
            } else if (start < currentOffset && end >= nextOffset) {
              nodes.push(node);
            }

            currentOffset = nextOffset;
          } else {
            walkNode(currentNode as HTMLElement, nodes);
          }
        }

        return nodes;
      }

      const targetNodes = walkNode(previewRef.current);

      if (targetNodes[0]) {
        console.log(targetNodes);

        const range = document.createRange();

        range.setStart(targetNodes[0], 0);
        range.setEnd(targetNodes[targetNodes.length - 1], 1);

        const highlight = new Highlight(range);

        CSS.highlights.set("text-match", highlight);

        targetNodes[0].scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
      }
    }
  };

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
        <Button
          size="sm"
          variant={showPreview ? "default" : "ghost"}
          onClick={() => {
            setShowPreview(!showPreview);
          }}
        >
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
                  disabled={
                    repo === "demo" || isEmpty || save.isLoading || isSaved
                  }
                  onClick={() => {
                    save.mutateAsync(
                      (tasks as LocaleTask[]).filter((task) => {
                        return !fileTaskPatch[activePath as string]?.[
                          task.match.start
                        ]?.disable;
                      })
                    );
                  }}
                >
                  <Save className="mr-1" size={16} />
                  {isSaved ? "Saved" : "Save to Local"}
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
          {isSaved && (
            <Button
              onClick={() => {
                const currentIndex = fileTasks.data?.findIndex(
                  (task) => task.path === activePath
                );

                const nextFileTask = fileTasks.data?.find(
                  (task, index) =>
                    index > (currentIndex || 0) &&
                    !task.saved &&
                    "tasks" in task.result &&
                    task.result.tasks.length > 0
                );

                if (nextFileTask) {
                  onFileChange(nextFileTask.path);
                }
              }}
            >
              next <span className="hidden md:inline ml-1">file</span>
            </Button>
          )}
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
          <div className="flex-grow overflow-auto" ref={previewRef}>
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
              <Code theme={theme}>{content}</Code>
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
              {textTasks?.map((task) => {
                return (
                  <div
                    key={task.match.start}
                    className={cn(
                      "flex flex-col gap-1 border-b border-accent pb-1 relative group/match-text cursor-pointer hover:bg-accent",
                      {
                        disable:
                          fileTaskPatch[activePath as string]?.[
                            task.match.start
                          ]?.disable,
                      }
                    )}
                    onClick={() => {
                      setTimeout(() => {
                        handleMatchClick(task);
                      }, 0);
                    }}
                  >
                    <Edit className="absolute bottom-1 right-1 p-1 rounded hover:bg-accent cursor-pointer" />
                    <Square
                      className="group-[.disable]/match-text:hidden absolute bottom-1 right-8 p-1 rounded hover:bg-accent cursor-pointer"
                      onClick={() => {
                        onFileTaskPatchChange(
                          activePath as string,
                          `${task.match.start}`,
                          {
                            disable: true,
                          }
                        );
                      }}
                    />
                    <XSquare
                      className="hidden group-[.disable]/match-text:block absolute bottom-1 right-8 p-1 rounded hover:bg-accent cursor-pointer"
                      onClick={() => {
                        onFileTaskPatchChange(
                          activePath as string,
                          `${task.match.start}`,
                          {
                            disable: false,
                          }
                        );
                      }}
                    />
                    <p className="text-sm text-muted-foreground group-[.disable]/match-text:line-through">
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
