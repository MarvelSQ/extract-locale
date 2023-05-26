import React, { useMemo, useState } from "react";
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
import {
  openHandle,
  repoQueryClient,
  useDictMap,
  useDictMapImport,
  useRepo,
  useRepoHandle,
  useRepos,
} from "@/filesystem/queries";
import { useQuery } from "@tanstack/react-query";
import { getItems } from "@/filesystem/utils";
import {
  AlertCircle,
  Check,
  ChevronRight,
  ChevronsUpDown,
  Command,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "@/lib/utils";
import { Popover } from "../ui/popover";
import { PopoverTrigger } from "../ui/popover";
import { PopoverContent } from "../ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../ui/command";
import { Combobox } from "../combobox";
import { Repo } from "@/Task/Entity";
import { useToast } from "../ui/use-toast";

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

function FileSelector({
  repo,
  value,
  onChange,
}: {
  repo: string | null;
  value: string | null;
  onChange: (value: string) => void;
}) {
  const repoHandle = useRepoHandle(repo);

  const files = useQuery(
    ["ALL_FILES", repo],
    () => {
      return getAllFiles(repoHandle.data as FileSystemDirectoryHandle);
    },
    {
      keepPreviousData: false,
      enabled: !!repoHandle.data,
      refetchOnMount: "always",
    }
  );

  return (
    <Popover /** set modal can make content scroll */ modal>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={!repo}>
          {value ? value : "select file"}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <ScrollArea className="h-80">
          {files.isLoading && (
            <div className="h-80 flex items-center justify-around animate-spin">
              <Loader2 />
            </div>
          )}
          <div className="flex flex-col">
            {files.data?.map((file) => (
              <Tree
                key={file.value}
                data={file}
                selected={value}
                onSelect={onChange}
              />
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function NewDictImport({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const repos = useRepos();

  const [targetRepo, setTargetRepo] = useState<string | null>(null);

  const [entryModule, setEntryModule] = useState<string | null>(null);

  const { toast } = useToast();

  const importDict = useDictMapImport(targetRepo, {
    onSuccess() {
      onClose();
      toast({
        description: `${targetRepo} - ${entryModule} import success`,
      });
    },
  });

  const repoItems = useMemo(() => {
    return (
      repos.data?.map((repo) => ({
        label: repo.name,
        value: repo.name,
      })) || []
    );
  }, [repos.data]);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Dict Import</DialogTitle>
          <DialogDescription>
            Import existing dictionary from local file system.
            <br />
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Combobox
            value={targetRepo}
            onChange={(value) => {
              setTargetRepo(value);
              const repo = (repos.data as Repo[]).find(
                (repo) => repo.name === value
              );

              if (repo && !repo.handle) {
                openHandle(value as string);
              }
              if (targetRepo !== value) {
                setEntryModule(null);
              }
            }}
            data={repoItems}
          />
          <FileSelector
            repo={targetRepo}
            value={entryModule}
            onChange={setEntryModule}
          />
          <Button
            disabled={!entryModule}
            onClick={() => importDict.mutate(entryModule as string)}
          >
            {importDict.isLoading ? (
              <Loader2 className="animate-spin inline-block" />
            ) : (
              "Import"
            )}
          </Button>
          <div className="text-muted-foreground text-sm">
            <AlertCircle size={16} className="inline-block" /> Notice: this may
            take a while <wbr /> based on the number of module to be bundled.
          </div>
        </div>
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
  const [importModule, setImportModule] = useState<string | null>(null);

  const imports = useDictMap(repo);

  const importDict = useDictMapImport(repo, {
    onSuccess(data) {
      setDictMap(JSON.stringify(data.result, null, 2));
    },
  });

  const [dictMap, setDictMap] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!importDict.isLoading) {
          if (!open) onClose();
        }
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
            value={dictMap}
            onChange={(event) => setDictMap(event.target.value)}
          />
        </div>
        {!!imports.data?.length && (
          <Select
            onValueChange={(value) => {
              const record = imports.data.find(
                (t) => `${t.timestamp}` === value
              );
              record && setDictMap(JSON.stringify(record.result, null, 2));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {imports.data.map((record) => {
                return (
                  <SelectItem
                    key={record.timestamp}
                    value={`${record.timestamp}`}
                  >
                    {new Date(record.timestamp).toISOString()} -{" "}
                    {record.entryModule}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
        <div
          className={cn("grid gap-2", {
            "grid-cols-[1fr_max-content]": importModule !== null,
          })}
        >
          <FileSelector
            repo={repo}
            value={importModule}
            onChange={setImportModule}
          />
          {importModule && (
            <Button
              onClick={() => {
                importDict.mutate(importModule);
              }}
              disabled={importDict.isLoading}
            >
              {importDict.isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "import"
              )}
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              // openConfirm(
              //   "Are you sure to import local module?",
              //   "local import may take a long time",
              //   () => {
              //     openDialog(FileSelectorDialog, {
              //       repo,
              //     });
              //   }
              // );
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
