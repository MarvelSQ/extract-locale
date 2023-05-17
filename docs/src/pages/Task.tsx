import Detail from "@/components/task/detail";
import Files from "@/components/task/files";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  BellRing,
  Check,
  Edit,
  Folder,
  FolderPlus,
  PlusSquare,
  Trash,
} from "lucide-react";
import Preview from "../components/task/preview";
import { useNavigate, useParams } from "react-router-dom";
import Fileselector from "@/components/task/fileselector";
import React, { useState } from "react";
import { openDialog } from "@/lib/modal";
import { SimpleFile, loadFiles } from "@/Task/loadFiles";
import { useRepos, createRepo, deleteRepo } from "@/filesystem/queries";

type CardProps = React.ComponentProps<typeof Card>;

export function Task() {
  const match = useParams();
  const navigate = useNavigate();

  const repos = useRepos();

  const [edit, setEdit] = useState(false);

  return (
    <div className="flex-grow flex flex-row">
      <div
        className={`basis-60 border-r flex-shrink-0 ${
          edit ? "group edit" : ""
        }`}
      >
        <div className="sticky top-14 p-4 flex flex-col gap-2">
          <div className="flex flex-row justify-between items-center">
            <small className="text-sm font-medium leading-none">
              Task List
            </small>
            <Edit
              className="h-6 w-6 inline-block p-1 rounded hover:bg-accent cursor-pointer group-[.edit]:bg-primary group-[.edit]:text-primary-foreground"
              onClick={() => {
                setEdit(!edit);
              }}
            />
          </div>
          <div className="grid gap-2">
            <Button
              key="demo"
              variant={match.repo === "demo" ? "default" : "secondary"}
              className="whitespace-nowrap justify-start group-[.edit]:col-span-2"
              onClick={() => {
                navigate(`/repo/demo`);
              }}
            >
              <Folder className="mr-2 h-4 w-4" />
              Demo
            </Button>
            {repos.data?.map((repo) => (
              <React.Fragment key={repo.directoryHandleId}>
                <Button
                  variant={match.repo === repo.name ? "default" : "secondary"}
                  className={cn("whitespace-nowrap justify-start")}
                  onClick={() => {
                    navigate(`/repo/${repo.name}`);
                  }}
                >
                  <Folder className="mr-2 h-4 w-4" />
                  {repo.name}
                </Button>
                {edit && (
                  <Button
                    size="sm"
                    className="self-center"
                    onClick={() => {
                      deleteRepo(repo.name);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </React.Fragment>
            ))}
            {repos.data?.length === 0 && (
              <div className="text-muted-foreground text-sm group-[.edit]:col-span-2 text-center">
                No repos found
              </div>
            )}
            <Button
              variant="ghost"
              className="group-[.edit]:col-span-2"
              onClick={() => {
                const id = Math.random().toString(36).substring(2, 10);
                loadFiles(id).then(({ name, files, handle }) => {
                  const fileMap = files.reduce((acc, cur) => {
                    acc[cur.path] = cur;
                    return acc;
                  }, {} as Record<string, SimpleFile>);

                  openDialog(Fileselector, {
                    directory: name,
                    files: files.map((file) => ({
                      key: file.path,
                      title: file.path,
                    })),
                    onConfirm: (keys) => {
                      const files = keys
                        .sort()
                        .map((key) => fileMap[key])
                        .map((file) => ({
                          path: file.path,
                        }));

                      createRepo(
                        name,
                        files,
                        id,
                        handle as FileSystemDirectoryHandle
                      );

                      navigate(`/repo/${name}`);
                    },
                  });
                });
              }}
            >
              <FolderPlus className="mr-2 h-4 w-4" /> Add Repo
            </Button>
          </div>
        </div>
      </div>
      <div className="container flex flex-col items-start py-8 overflow-auto">
        <Tabs
          value={match.tab || "detail"}
          onValueChange={(event) => {
            navigate(`/repo/${match.repo}/${event}`);
          }}
          className="flex flex-col self-stretch"
        >
          <TabsList className="grid grid-cols-3 w-[300px]">
            <TabsTrigger value="detail">Detail</TabsTrigger>
            <TabsTrigger value="files">File List</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent className="self-stretch" value="detail">
            <Detail />
          </TabsContent>
          <TabsContent value="files">
            <Files repo={match.repo as string} />
          </TabsContent>
          <TabsContent value="preview">
            <Preview repo={match.repo as string} />
          </TabsContent>
        </Tabs>
        {/* <div className="flex flex-row gap-8 items-stretch">
          <Card className={cn("w-[380px]")}>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>You have 3 unread messages.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className=" flex items-center space-x-4 rounded-md border p-4">
                <BellRing />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Push Notifications
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Send notifications to device.
                  </p>
                </div>
                <Switch />
              </div>
              <div>
                {notifications.map((notification, index) => (
                  <div
                    key={index}
                    className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
                  >
                    <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {notification.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Check className="mr-2 h-4 w-4" /> Mark all as read
              </Button>
            </CardFooter>
          </Card>
          <Card className={cn("w-[380px]", "flex items-center justify-center")}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button>
                    <PlusSquare />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add New Pattern</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Card>
        </div> */}
      </div>
    </div>
  );
}
