import React, { useEffect, useMemo, useRef, useState } from "react";
import { SimpleFile, loadFiles } from "./loadFiles";
import { List, Space, Tabs, Tag } from "antd";
import useModal from "antd/es/modal/useModal";
import TaskForm from "./TaskForm";
import Locales from "./Locales";
import FileSelector from "./FileSelector";
import Control from "./Control";
import { useProcessFiles } from "./runner";
import FileViewer from "./FileViewer";

function Entry({
  type,
  onClose,
}: {
  type: "react" | "demo";
  onClose: () => void;
}) {
  const [files, setFiles] = useState<SimpleFile[]>([]);

  const [regExp, setRegExp] = useState("");

  const { run, results, loading } = useProcessFiles(files);

  const mountedRef = useRef(false);

  const [modal, holderContext] = useModal();

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    loadFiles(type).then(async (files) => {
      let selectedFiles = files;

      if (type === "react") {
        selectedFiles = await new Promise<string[]>((res) => {
          if (!files.length) return res([]);

          const handle = modal.info({
            className: "file-selector-modal",
            content: (
              <FileSelector
                files={files.map((file) => ({
                  key: file.path,
                  title: file.path,
                }))}
                onConfirm={(keys) => {
                  handle.destroy();
                  res(keys);
                }}
              />
            ),
            keyboard: false,
            footer: null,
            icon: null,
            width: 800,
          });
        }).then((keys) => files.filter((file) => keys.includes(file.path)));
      }
      if (!selectedFiles.length) {
        onClose();
      }
      setFiles(selectedFiles);
    });
  }, []);

  const tabs = useMemo(() => {
    return [
      {
        key: "1",
        label: "Task",
        children: <TaskForm />,
      },
      {
        key: "2",
        label: "files",
        children: <FileViewer files={files} results={results} />,
      },
      {
        key: "3",
        label: "locales",
        children: <Locales />,
      },
    ];
  }, [files, results]);

  return (
    <>
      {holderContext}
      {!!files.length && <Tabs type="card" items={tabs} />}
      {!!files.length && <Control loading={loading} onConfirm={() => run()} />}
    </>
  );
}

export default Entry;
