import { Table, Tag } from "antd";
import React from "react";

const data = [
  {
    localeKey: "LOCALE_KEY_1",
    localeValue: "Locale Value 1",
    sourceFiles: ["src/Task/Entry.tsx"],
  },
];

const columns = [
  {
    title: "Locale Key",
    dataIndex: "localeKey",
    key: "localeKey",
  },
  {
    title: "Locale Value",
    dataIndex: "localeValue",
    key: "localeValue",
  },
  {
    title: "Source Files",
    dataIndex: "sourceFiles",
    key: "sourceFiles",
    render(sourceFiles: string[]) {
      return (
        <>
          {sourceFiles.map((file) => (
            <Tag key={file}>{file}</Tag>
          ))}
        </>
      );
    },
  },
];

function Locales() {
  return <Table dataSource={data} columns={columns} />;
}

export default Locales;
