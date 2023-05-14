import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { FolderPlus } from "lucide-react";
import { DialogHeader } from "../ui/dialog";
import { DialogTitle } from "../ui/dialog";
import { DialogDescription } from "../ui/dialog";
import { DialogFooter } from "../ui/dialog";
import { Transfer, Tree } from "antd";
import { generateTree, getHistory } from "@/filesystem/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const defaultRegExp = /^src.+tsx?$/;

const isChecked = (
  selectedKeys: (string | number)[],
  eventKey: string | number
) => selectedKeys.includes(eventKey);

const renderTitle = (item) => item.title;
function Fileselector({
  open,
  onClose,
  directory,
  files,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  directory: string;
  files: { key: string; title: string }[];
  onConfirm: (val: string[]) => void;
}) {
  console.log("open", open);

  const history = useMemo(() => getHistory(directory), [directory]);

  const [targetKeys, setTargetKeys] = useState(() => {
    const { adds, removes } = history;

    const targetKeys = files
      .filter((file) => {
        if (adds.includes(file.key)) {
          return true;
        }

        if (removes.length && removes.includes(file.key)) {
          return false;
        }

        return defaultRegExp.test(file.key);
      })
      .map((file) => file.key) as string[];

    return targetKeys;
  });

  useEffect(() => {
    setTargetKeys((targetKeys) => {
      const { adds, removes } = history;

      const newTargetKeys = files
        .filter((file) => {
          if (adds.includes(file.key)) {
            return true;
          }

          if (removes.length && removes.includes(file.key)) {
            return false;
          }

          return defaultRegExp.test(file.key);
        })
        .map((file) => file.key);

      return newTargetKeys;
    });
  }, [history]);

  const treeFiles = useMemo(() => {
    return generateTree(files);
  }, [files]);

  const [selects, setSelects] = useState<string[]>([]);

  const handleChange = (keys: string[]) => {
    setSelects([]);
    setTargetKeys(keys);
  };

  const handleSelect = (keys: string[]) => {
    setSelects(keys);
  };

  return (
    <Dialog
      modal
      open={open}
      onOpenChange={(open: boolean) => {
        if (!open) {
          onClose();
        }
      }}
    >
      {/* <DialogTrigger>
        <Button variant="ghost">
          <FolderPlus className="mr-2 h-4 w-4" /> Add Repo
        </Button>
      </DialogTrigger> */}
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Select Files From {directory}</DialogTitle>
          <DialogDescription>
            {(!!history.adds.length || !!history.removes.length) && (
              <TooltipProvider>
                You have{" "}
                {history.adds.length ? (
                  <>
                    selected{" "}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>{history.adds.length} files</span>
                      </TooltipTrigger>
                      <TooltipContent>{history.adds.join(", ")}</TooltipContent>
                    </Tooltip>{" "}
                    and
                  </>
                ) : (
                  ""
                )}{" "}
                unselected{" "}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{history.removes.length} files</span>
                  </TooltipTrigger>
                  <TooltipContent>{history.removes.join(", ")}</TooltipContent>
                </Tooltip>{" "}
                before.
              </TooltipProvider>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col h-[500px] overflow-hidden">
          <Transfer
            className="file-selector h-[500px]"
            dataSource={files}
            targetKeys={targetKeys}
            onChange={handleChange}
            onSelectChange={handleSelect}
            showSearch
            render={renderTitle}
          >
            {({ direction, onItemSelect, onItemSelectAll, selectedKeys }) => {
              if (direction === "left") {
                const checkedKeys = [...selectedKeys, ...targetKeys];
                return (
                  <Tree.DirectoryTree
                    checkable
                    // checkStrictly
                    checkedKeys={checkedKeys}
                    // selectedKeys={checkedKeys}
                    onCheck={(_, { node: { key, children }, checked }) => {
                      if (children) {
                        const subKeys = files
                          .filter((file) => file.key.startsWith(key))
                          .map((file) => file.key);

                        onItemSelectAll(subKeys, checked);
                      } else {
                        onItemSelect(key as string, checked);
                      }
                    }}
                    onSelect={(_, { node }) => {
                      if (node.children) {
                        return;
                      }
                      onItemSelect(node.key, !isChecked(checkedKeys, node.key));
                    }}
                    treeData={treeFiles}
                    fieldNames={{
                      title: "name",
                    }}
                  />
                );
              }
            }}
          </Transfer>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm(targetKeys);
            }}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Fileselector;
