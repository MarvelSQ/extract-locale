import { useMemo, useState } from "react";
import { generateTree } from "../filesystem/utils";
import { Button, Space, Tooltip, Transfer, Tree, Typography } from "antd";

const defaultRegExp = /^src.+tsx?$/;

const isChecked = (
  selectedKeys: (string | number)[],
  eventKey: string | number
) => selectedKeys.includes(eventKey);

const FileSelector = ({
  files,
  onConfirm,
}: {
  files: { key: string; title: string }[];
  onConfirm: (val: string[]) => void;
}) => {
  const [targetKeys, setTargetKeys] = useState(() => {
    return files
      .filter((file) => defaultRegExp.test(file.key))
      .map((file) => file.key) as string[];
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
        Select files to extract locale:
      </Typography.Title>
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
