import { EyeFilled, EyeOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { diffWordsWithSpace, Change } from "diff";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LocaleTask } from "../../../src/type";
import { ParsedResultTask } from "../type";
import Code, { RenderCodeBlockType } from "./Code";
import { SimpleFile } from "./loadFiles";

function getMatchTask(tasks: LocaleTask[], start: number, end: number) {
  if (!tasks) return false;
  const index = tasks.findIndex(
    (task) => task.match.start <= start && task.match.end >= end
  );
  if (index >= 0) {
    return {
      index,
      last: tasks[index].match.end === end,
    };
  }
}

function getMatchChange(
  changes: { start: number; end: number }[],
  start: number,
  end: number
) {
  const index = changes.findIndex(
    (change) => change.start <= start && change.end >= end
  );
  if (index >= 0) {
    return {
      index,
      last: changes[index].end === end,
    };
  }
}

function Preview({
  result,
  file,
}: {
  file: SimpleFile;
  result: ParsedResultTask;
}) {
  const [show, setShow] = useState(false);
  const [fileContent, setFileContent] = useState("");
  const [fileResult, setFileResult] = useState("");

  useEffect(() => {
    Promise.resolve(file.content).then((content) => {
      setFileContent(content);
      setFileResult(result.toString());
    });
  }, [file]);

  const diffs = useMemo(() => {
    if (fileContent && fileResult) {
      const changes = diffWordsWithSpace(fileContent, fileResult);

      let offset = 0;

      const adds = changes
        .filter((change) => !change.removed)
        .map((change) => {
          const changeWithRange = {
            ...change,
            start: offset,
            end: offset + change.value.length,
          };
          offset += change.value.length;
          return changeWithRange;
        })
        .filter((change) => change.added);

      const merges = adds.reduce(
        (acc, cur) => {
          const last = acc[acc.length - 1];
          if (last && last.end + 1 === cur.start) {
            acc[acc.length - 1] = {
              count: (last.count as number) + (cur.count as number),
              value: `${last.value}${cur.value}`,
              start: last.start,
              end: cur.end,
              added: true,
            };
          } else {
            acc.push(cur);
          }
          return acc;
        },
        [] as (Change & {
          start: number;
          end: number;
        })[]
      );

      return merges;
    }
    return [];
  }, [fileContent, fileResult]);

  const { tasks } = result;

  const renderCodeBlock = useCallback(
    (({ start, end, tagName: TagName, children, style, ...props }) => {
      if (show) {
        const matchedDiff =
          typeof children[0] === "string" && getMatchChange(diffs, start, end);

        return (
          <TagName
            {...props}
            style={
              matchedDiff
                ? {
                    ...style,
                    // 绿色 1dc116, 半透明 0.3
                    backgroundColor: "rgba(29,193,22,0.3)",
                  }
                : style
            }
          >
            {children}
          </TagName>
        );
      }
      const matchedTask =
        typeof children[0] === "string" && getMatchTask(tasks, start, end);

      return (
        <TagName
          {...props}
          style={
            matchedTask
              ? {
                  ...style,
                  backgroundColor: "rgba(0,0,0,0.3)",
                }
              : style
          }
        >
          {children}
        </TagName>
      );
    }) as RenderCodeBlockType,
    [tasks, diffs, show]
  );

  return (
    <div className="file-preview">
      {!!result.tasks.length && (
        <Button
          className="file-preview-toggle"
          type={show ? "primary" : undefined}
          icon={show ? <EyeFilled /> : <EyeOutlined />}
          onClick={() => {
            setShow((show) => !show);
          }}
        >
          preview
        </Button>
      )}
      <Code renderCodeElement={renderCodeBlock}>
        {show ? fileResult : fileContent}
      </Code>
    </div>
  );
}

export default Preview;