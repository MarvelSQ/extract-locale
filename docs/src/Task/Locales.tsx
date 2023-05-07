import { Table, Tag } from "antd";
import React, { useMemo } from "react";
import { ReplaceTask } from "../../../src/type";

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
    render(
      sourceFiles: {
        filename: string;
        start: number;
      }[]
    ) {
      return (
        <>
          {sourceFiles.map((file) => (
            <Tag key={`${file.filename}-${file.start}`}>
              {file.filename}:{file.start}
            </Tag>
          ))}
        </>
      );
    },
  },
];

function Locales({
  results,
}: {
  results: {
    path: string;
    tasks: ReplaceTask[];
    toString: () => string;
  }[];
}) {
  const localeData = useMemo(() => {
    const locales: {
      localeKey: string;
      localeValue: string;
      sourceFiles: {
        filename: string;
        start: number;
      }[];
    }[] = [];
    const localeKeyMap: Record<string, { filename: string; start: number }[]> =
      {};

    results.forEach((result) => {
      result.tasks.forEach((task) => {
        const { localeKey, start, text, texts } = task.sentence;

        if (!localeKeyMap[localeKey]) {
          const files = [
            {
              filename: result.path,
              start: start,
            },
          ];

          localeKeyMap[localeKey] = files;

          locales.push({
            localeKey,
            localeValue: texts ? texts.join("{holder}") : text,
            sourceFiles: files,
          });
        } else {
          localeKeyMap[localeKey].push({
            filename: result.path,
            start: start,
          });
        }
      });
    });

    return locales;
  }, [results]);

  return (
    <Table
      sticky
      scroll={{
        x: true,
        y: "calc(100vh - 315px)",
      }}
      pagination={{
        pageSize: 30,
      }}
      dataSource={localeData}
      columns={columns}
    />
  );
}

export default Locales;
