import { ReplaceTask } from "../../../src/type";
import { replacer as ReactReplacer } from "../../../src/preset/react";
import { SimpleFile } from "./loadFiles";
import { useState } from "react";

export function createConfig({}) {
  return ReactReplacer;
}

export function processFile(filename: string, filecontent: string) {
  const { tasks, toString } = ReactReplacer(filename, filecontent);

  return {
    tasks,
    toString,
  };
}

async function runFiles(files: SimpleFile[]) {
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
    runFiles(files).then((results) => {
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
