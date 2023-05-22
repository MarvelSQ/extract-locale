import { useMemo, useState } from "react";
import { generateTree, getHistory, saveHistory } from "../filesystem/utils";
import {
  Button,
  Popover,
  Space,
  Tooltip,
  Transfer,
  Tree,
  Typography,
} from "antd";
import { FolderFilled } from "@ant-design/icons";

const defaultRegExp = /^src.+tsx?$/;

const isChecked = (
  selectedKeys: (string | number)[],
  eventKey: string | number
) => selectedKeys.includes(eventKey);

const FileSelector = ({
  directory,
  files,
  onConfirm,
}: {
  directory: string;
  files: { key: string; title: string }[];
  onConfirm: (val: string[]) => void;
}) => {
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
    <Space direction="vertical" align="center">
      <Typography.Title level={5}>
        Select files from <FolderFilled /> <i>{directory}</i> to extract locale:
      </Typography.Title>
      {(!!history.adds.length || !!history.removes.length) && (
        <Typography.Text type="secondary">
          You have{" "}
          {history.adds.length ? (
            <>
              selected{" "}
              <Popover content={history.adds.join(", ")}>
                {history.adds.length} files
              </Popover>{" "}
              and
            </>
          ) : (
            ""
          )}{" "}
          unselected{" "}
          <Popover content={history.removes.join(", ")}>
            {history.removes.length} files
          </Popover>{" "}
          before.
        </Typography.Text>
      )}
      <Transfer
        className="file-selector"
        dataSource={files}
        targetKeys={targetKeys}
        onChange={handleChange}
        onSelectChange={handleSelect}
        showSearch
        render={(item) => item.title}
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
      <Tooltip
        trigger="click"
        title={selects.length ? "please finish your selection" : undefined}
      >
        <Button
          type="primary"
          onClick={() => {
            if (!!selects.length) return;

            const adds: string[] = [];
            const removes: string[] = [];

            files.forEach((file) => {
              if (
                targetKeys.includes(file.key) &&
                !defaultRegExp.test(file.key)
              ) {
                adds.push(file.key);
              }
              if (
                !targetKeys.includes(file.key) &&
                defaultRegExp.test(file.key)
              ) {
                removes.push(file.key);
              }
            });

            saveHistory(directory, {
              adds,
              removes,
            });

            onConfirm(targetKeys);
          }}
        >
          confirm
        </Button>
      </Tooltip>
    </Space>
  );
};

export default FileSelector;
