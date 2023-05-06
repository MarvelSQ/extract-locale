import React, { useEffect, useMemo, useState } from "react";
import { SimpleFile } from "./loadFiles";
import { ReplaceTask } from "../../../src/type";
import { Button, List, Space, Tag } from "antd";
import Preview from "./Preview";

function FileViewer({
  files,
  results,
}: {
  files: SimpleFile[];
  results: {
    path: string;
    tasks: ReplaceTask[];
  }[];
}) {
  const [selectFile, setSelectFile] = useState<string | null>(null);

  const match = useMemo(() => {
    const file = files.find((f) => f.path === selectFile);
    const result = results.find((r) => r.path === selectFile);
    if (!result || !file) return null;
    return {
      file,
      result,
    };
  }, [files, results, selectFile]);

  useEffect(() => {
    if (!match && results.length) {
      setSelectFile(results[0].path);
    }
  }, [results]);

  return (
    <div className="file-viewer">
      <List>
        {files.map((file, index) => (
          <List.Item
            key={file.path}
            onClick={() => setSelectFile(file.path)}
            extra={
              results[index] ? <Tag>{results[index].tasks.length}</Tag> : null
            }
          >
            {file.path}
          </List.Item>
        ))}
      </List>
      {match && <Preview file={match.file} result={match.result} />}
    </div>
  );
}

export default FileViewer;
