import {
  ConfigProvider,
  Input,
  Popover,
  Select,
  Space,
  Tree,
  Typography,
} from "antd";
import type { DataNode, DirectoryTreeProps } from "antd/es/tree";
import { ExtractFile, ExtractDirectory } from "./type";
import { treeEach, treeMap } from "./utils";
import { useMemo, useState } from "react";
import Code from "./Code";
import { minimatch } from "minimatch";
import {
  EyeOutlined,
  EyeTwoTone,
  FileExclamationOutlined,
  FileExclamationTwoTone,
} from "@ant-design/icons";

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

  const [showMatch, setShowMatch] = useState(false);
  const [showExclude, setShowExclude] = useState(false);

  const [matchGlob, setMatchGlob] = useState<string>("");
  const [excludeGlob, setExcludeGlob] = useState<string>("");

  const matchResults = useMemo(() => {
    const matched: DataNode[] = [];
    const glob = matchGlob || "src/**/*.{ts,tsx,js,jsx}";
    const exclude = excludeGlob || "**/*locale*/";
    treeEach(treeData, (node) => {
      if (
        node.key &&
        minimatch(node.key as string, glob) &&
        !minimatch(node.key as string, exclude)
      ) {
        matched.push(node);
      }
    });
    return matched;
  }, [matchGlob, excludeGlob, fileTree]);

  return (
    <div className="file-explorer-card">
      <div
        style={{
          display: "flex",
          alignItems: "stretch",
          flexDirection: "column",
          borderBottom: "1px solid #d9d9d9",
        }}
      >
        <Input
          size="large"
          value={matchGlob}
          onChange={(event) => {
            if (!showMatch) {
              setShowMatch(true);
            }
            setMatchGlob(event.target.value);
          }}
          bordered={false}
          placeholder="src/**/*.{ts,tsx,js,jsx}"
          prefix="Include"
          suffix={
            <>
              <Popover
                mouseEnterDelay={0.5}
                content={
                  <Typography.Text>show the matched files</Typography.Text>
                }
              >
                {showMatch ? (
                  <EyeTwoTone onClick={() => setShowMatch(false)} />
                ) : (
                  <EyeOutlined onClick={() => setShowMatch(true)} />
                )}
              </Popover>
              <Popover
                mouseEnterDelay={0.5}
                content={
                  <Typography.Text>Exclude the matched files</Typography.Text>
                }
              >
                {showExclude ? (
                  <FileExclamationTwoTone
                    onClick={() => setShowExclude((show) => !show)}
                  />
                ) : (
                  <FileExclamationOutlined
                    onClick={() => setShowExclude((show) => !show)}
                  />
                )}
              </Popover>
            </>
          }
        />
        {showExclude && (
          <Input
            size="large"
            bordered={false}
            placeholder="locale"
            prefix="Exclude"
            value={excludeGlob}
            onChange={(event) => {
              setExcludeGlob(event.target.value);
            }}
            style={{
              borderRadius: 0,
              borderTop: "1px dashed #d9d9d9",
            }}
          />
        )}
      </div>
      <Space
        style={{
          borderBottom: "1px solid #d9d9d9",
        }}
      >
        <Input prefix="Text Matching" placeholder="RegExp" />
        Inject Type:
        <Select
          mode="multiple"
          value={["local", "hook"]}
          options={[
            {
              label: "GLOBAL",
              value: "global",
            },
            {
              label: "LOCAL",
              value: "local",
            },
            {
              label: "HOOK",
              value: "hook",
            },
            {
              label: "COMPONENT",
              value: "component",
            },
          ]}
        />
        Ignore Pattern:
        <Select
          mode="multiple"
          value={["console"]}
          options={[
            {
              label: "console.log",
              value: "console",
            },
            {
              label: "enum",
              value: "enum",
            },
          ]}
        />
      </Space>
      <ConfigProvider
        theme={{
          token: {
            controlHeight: 40,
          },
        }}
      >
        <DirectoryTree
          treeData={showMatch ? matchResults : treeData}
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
              // 图片类型
              const isPicture = file.name.match(/\.(png|jpe?g|gif|webp)$/i);

              file.handle
                .getFile()
                .then((res) => {
                  return new Promise<string>((resolve) => {
                    isPicture
                      ? res
                          .arrayBuffer()
                          .then((array) =>
                            resolve(
                              btoa(
                                String.fromCharCode.apply(
                                  null,
                                  new Uint8Array(array) as any
                                )
                              )
                            )
                          )
                      : resolve(res.text());
                  });
                })
                .then((text) =>
                  setFile({
                    name: key,
                    text,
                  })
                );
            }
          }}
        />
      </ConfigProvider>
      <div
        className={`file-explorer-card-content-selected-file ${
          file ? "has-content" : ""
        }`}
      >
        {file && (
          <Code
            onRemove={() => setFile(null)}
            filename={file.name}
            filecontent={file.text}
            matched={matchResults.some((res) => res.key === file.name)}
          />
        )}
      </div>
    </div>
  );
}

export default FileExplorer;
