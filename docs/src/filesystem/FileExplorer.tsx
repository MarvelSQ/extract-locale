import { Button, Card, Tree } from "antd";
import type { DataNode, DirectoryTreeProps } from "antd/es/tree";
import { ExtractFile, ExtractDirectory } from "./type";
import { treeMap } from "./utils";
import { useMemo, useState } from "react";
import { CloseSquareOutlined } from "@ant-design/icons";
import Code from "./Code";

const { DirectoryTree } = Tree;

function FileExplorer({
  fileTree,
}: {
  fileTree: (ExtractFile | ExtractDirectory)[] | null;
}) {
  const [file, setFile] = useState<{
    name: string;
    text: string;
  } | null>(null);

  const treeData = useMemo(() => {
    if (!fileTree) {
      return [];
    }
    return treeMap(fileTree, (node, parentNode): DataNode => {
      const prefix = parentNode ? `${(parentNode as any).key}/` : "";
      if (node.type === "file") {
        return {
          title: node.name,
          key: `${prefix}${node.name}`,
          isLeaf: true,
        };
      }
      return {
        title: node.name,
        key: `${prefix}${node.name}`,
      };
    }) as DataNode[];
  }, [fileTree]);

  return (
    <Card className="file-explorer-card" size="small">
      <div className="file-explorer-card-content">
        <DirectoryTree
          treeData={treeData}
          onSelect={(keys) => {
            const key = keys[keys.length - 1] as string;

            const file = key.split("/").reduce(
              (acc: ExtractFile | ExtractDirectory, cur) => {
                if (acc.name === cur) {
                  return acc;
                }
                if (acc.type === "file") {
                  return acc;
                }
                const match = acc.children.find((f) => f.name === cur);
                if (!match) {
                  return acc;
                }
                return match;
              },
              {
                type: "directory",
                children: fileTree,
              } as ExtractDirectory
            );

            if (file && file.type === "file") {
              file.handle
                .getFile()
                .then((res) => res.text())
                .then((text) =>
                  setFile({
                    name: key,
                    text,
                  })
                );
            }
          }}
        />
        <div
          className={`file-explorer-card-content-selected-file ${
            file ? "has-content" : ""
          }`}
        >
          {file?.name && (
            <div className="selected-file-title">
              {file.name}
              <Button
                icon={<CloseSquareOutlined />}
                size="small"
                onClick={() => setFile(null)}
              />
            </div>
          )}
          {file && <Code filename={file.name} filecontent={file.text} />}
        </div>
      </div>
    </Card>
  );
}

export default FileExplorer;
