import { ReplaceTask } from "../../../src/type";
import { withPreset, DefaultSettings } from "../../../src/preset/react";
import { SimpleFile } from "./loadFiles";
import { useState } from "react";

async function runFiles(config: typeof DefaultSettings, files: SimpleFile[]) {
  const replacer = withPreset(DefaultSettings);

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
      const { tasks, toString } = processFile(file.path, content);

      return {
        path: file.path,
        tasks,
        toString,
      };
    })
  );

  return results;
}

export function useProcessFiles(files: SimpleFile[]) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<
    {
      path: string;
      tasks: ReplaceTask[];
      toString: () => string;
    }[]
  >([]);

  const run = () => {
    setLoading(true);
    runFiles({} as any, files).then((results) => {
      setResults(results);
      setLoading(false);
    });
  };

  return {
    loading,
    results,
    run,
  };
}
