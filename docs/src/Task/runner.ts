import { notification } from "antd";
import { useState } from "react";
import { DefaultSettings, withReact } from "../../../src/preset/react";
import { LocaleTask } from "../../../src/type";
import { SimpleFile } from "./loadFiles";

async function runFiles(config: typeof DefaultSettings, files: SimpleFile[]): Promise<Array<{
  path: string,
  error: unknown;
} | {
  path: string;
  tasks: LocaleTask[];
  toString(): string;
}>> {
  const replacer = withReact(DefaultSettings);

  function processFile(filename: string, filecontent: string) {
    const { tasks, toString } = replacer(filename, filecontent);

    return {
      tasks,
      toString,
    };
  }

  const results = Promise.all(
    files.map(async (file) => {
      const content = await file.content;
      try {
        const { tasks, toString } = processFile(file.path, content);

        return {
          path: file.path,
          tasks,
          toString,
        };
      } catch (error) {
        return {
          path: file.path,
          error,
        };
      }
    })
  );

  return results;
}

export function useProcessFiles(files: SimpleFile[]) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    {
      path: string;
      tasks: LocaleTask[];
      toString: () => string;
    }[]
  >([]);

  const [api] = notification.useNotification({
    placement: "bottom",
  });

  const run = () => {
    setLoading(true);
    runFiles({} as any, files)
      .then((results) => {
        const successed: {
          path: string;
          tasks: LocaleTask[];
          toString: () => string;
        }[] = [];
        const failed: {
          path: string;
          error: unknown;
        }[] = [];

        results.forEach((e) => {
          if ("error" in e) {
            failed.push(e);
          } else {
            successed.push(e);
          }
        });

        if (failed.length) {
          notification.error({
            message: `${failed.length} files failed`,
            description: failed.map((e) => e.path).join("\n"),
            placement: "bottom",
          });
        }

        setResults(successed);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return {
    loading,
    results,
    run,
  };
}
