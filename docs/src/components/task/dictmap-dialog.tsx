import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { openConfirm, openDialog } from "@/lib/modal";
import { openHandle, repoQueryClient, useRepo } from "@/filesystem/queries";
import { useQuery } from "@tanstack/react-query";
import { getItems } from "@/filesystem/utils";
import { ChevronRight } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";

async function getAllFiles(
  handle: FileSystemDirectoryHandle,
  parent?: string
): Promise<
  {
    name: string;
    value: string;
    children?: {
      name: string;
      value: string;
    }[];
  }[]
> {
  const files = await getItems(handle);

  const sorted = files.sort((a, b) => {
    if (a.kind === "directory" && b.kind === "file") return -1;
    if (a.kind === "file" && b.kind === "directory") return 1;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });

  const result = await Promise.all(
    sorted.map(async (file) => {
      if (file.name === "node_modules") return [] as any;
      const value = parent ? `${parent}/${file.name}` : file.name;
      if (file.kind === "file") {
        return {
          name: file.name,
          value,
        };
      }

      return {
        name: file.name,
        value,
        children: await getAllFiles(
          file as FileSystemDirectoryHandle,
          `${parent ? `${parent}/` : ""}${file.name}`
        ),
      };
    })
  );

  return result.flat();
}

function Tree({
  data,
  selected,
  onSelect,
}: {
  data: {
    name: string;
    value: string;
    children?: {
      name: string;
      value: string;
    }[];
  };
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div
        className={cn(
          "flex flex-row items-center rounded cursor-pointer hover:bg-gray-100 p-1",
          {
            "bg-gray-100": selected === data.value,
            "pl-4": !data.children,
          }
        )}
        onClick={() => {
          if (data.children) {
            setOpen(!open);
          } else {
            onSelect(data.value);
          }
        }}
      >
        {data.children && (
          <ChevronRight
            className={cn("w-4 h-4 rounded-l-md", {
              "rotate-90": open,
            })}
          />
        )}
        <div className="flex-grow">{data.name}</div>
      </div>
      {data.children && open && (
        <div className="pl-2 flex flex-col">
          {data.children.map((child) => (
            <Tree
              key={child.value}
              data={child}
              selected={selected}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FileSelectorDialog({
  repo,
  open,
  onClose,
}: {
  repo: string;
  open: boolean;
  onClose: () => void;
}) {
  const [, setUpdate] = useState(0);
  const repoHandle = useRepo(repo);

  const [selected, setSelected] = useState<string | null>(null);

  const files = useQuery(
    ["ALL_FILES", repo],
    () => {
      return getAllFiles(
        (repoHandle.data as any).handle as FileSystemDirectoryHandle
      );
    },
    {
      enabled: !!repoHandle.data?.handle,
      refetchOnMount: "always",
    }
  );

  console.log("repoHandle", repoHandle.data?.handle);
  console.log("files", files.data);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Module</DialogTitle>
        </DialogHeader>
        <div>
          <div className="p-2 border-primary border-b">
            {selected || `select file to generate locale key`}
          </div>
          <ScrollArea className="h-72">
            <div className="flex flex-col">
              {files.data?.map((file) => (
                <Tree
                  key={file.value}
                  data={file}
                  selected={selected}
                  onSelect={setSelected}
                />
              ))}
            </div>
          </ScrollArea>
          {!repoHandle.data?.handle && (
            <Button
              onClick={() => {
                openHandle(repo).then(() => {
                  repoHandle.refetch();
                });
              }}
            >
              open Handle
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              setUpdate((v) => v + 1);
            }}
          >
            build
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DictmapDialog({
  repo,
  open,
  onClose,
}: {
  repo: string;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Dictionary</DialogTitle>
          <DialogDescription>
            using exist lcoale map, can help locale key generation
          </DialogDescription>
        </DialogHeader>
        <div>
          <Textarea
            className="h-80"
            placeholder={`example:
{
  "hello": "你好",
  "world": "世界"
}
`}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              openConfirm(
                "Are you sure to import local module?",
                "local import may take a long time",
                () => {
                  openDialog(FileSelectorDialog, {
                    repo,
                  });
                }
              );
            }}
          >
            Import Local Module
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DictmapDialog;
