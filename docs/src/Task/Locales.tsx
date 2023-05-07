import { Input, Space, Table, Tag } from "antd";
import React, { useMemo, useState } from "react";
import { ReplaceTask } from "../../../src/type";

const data = [
  {
    localeKey: "LOCALE_KEY_1",
    localeValue: "Locale Value 1",
    sourceFiles: ["src/Task/Entry.tsx"],
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
  const [search, setSearch] = useState("");

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

  const columns = useMemo(
    () => [
      {
        title: "Locale Key",
        dataIndex: "localeKey",
        key: "localeKey",
      },
      {
        width: 180,
        title: "Locale Value",
        dataIndex: "localeValue",
        key: "localeValue",
        filters: [
          {
            text: "Template",
            value: "template",
          },
          {
            text: "Text",
            value: "text",
          },
        ],
        onFilter: (value: string, record: any) => {
          if (value === "template") {
            return record.localeValue.includes("{holder}");
          } else if (value === "text") {
            return !record.localeValue.includes("{holder}");
          }
        },
      },
      {
        title: "Source Files",
        dataIndex: "sourceFiles",
        key: "sourceFiles",
        filters: results.map((result) => ({
          text: result.path,
          value: result.path,
        })),
        onFilter: (value: string, record: any) => {
          return record.sourceFiles.some((file) => file.filename === value);
        },
        filterSearch: true,
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
    ],
    [results]
  );

  const filteredData = useMemo(() => {
    if (!search) {
      return localeData;
    }
    return localeData.filter((locale) => {
      return (
        locale.localeKey.includes(search) || locale.localeValue.includes(search)
      );
    });
  }, [localeData, search]);

  return (
    <Space direction="vertical">
      <Space>
        <Input.Search
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Space>
      <Table
        sticky
        scroll={{
          x: true,
          y: "calc(100vh - 370px)",
        }}
        pagination={{
          pageSize: 30,
        }}
        dataSource={filteredData}
        columns={columns}
      />
    </Space>
  );
}

export default Locales;
