import React, { useEffect, useMemo, useRef, useState } from "react";
import { SimpleFile, loadFiles } from "./loadFiles";
import { Button, List, Space, Tabs, Tag } from "antd";
import useModal from "antd/es/modal/useModal";
import TaskForm from "./TaskForm";
import Locales from "./Locales";
import FileSelector from "./FileSelector";
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

  const [activeTab, setActiveTab] = useState<"task" | "files" | "locales">(
    type === "demo" ? "files" : "task"
  );

  const [disabled, setDisabled] = useState(type === "demo");

  useEffect(() => {
    if (results.length) {
      setDisabled(true);
      if (activeTab === "task") {
        setActiveTab("files");
      }
    }
  }, [results]);

  useEffect(() => {
    if (type === "demo" && files.length && !results.length) {
      run();
    }
  }, [type, files]);

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
        key: "task",
        label: "Task",
        children: <TaskForm />,
      },
      {
        key: "files",
        label: "files",
        children: <FileViewer files={files} results={results} />,
      },
      {
        key: "locales",
        label: "locales",
        children: <Locales results={results} />,
      },
    ];
  }, [files, results]);

  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    Promise.all(
      results
        .filter((result) => result.tasks.length)
        .map((result) => {
          return Promise.resolve()
            .then(() => result.toString())
            .then((content) => {
              const file = files.find((file) => file.path === result.path);
              if (!file) return;
              return file.save?.(content);
            });
        })
    )
      .then(() => {
        alert("Saved!");
      })
      .catch((err) => {
        alert(err.message);
      })
      .finally(() => {
        setSaving(false);
      });
  };

  return (
    <>
      {holderContext}
      {!!files.length && (
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab as any}
          type="card"
          items={tabs}
        />
      )}
      {!!files.length && (
        <div className="control-bar">
          <Button loading={loading} onClick={() => run()} disabled={disabled}>
            Process Files
          </Button>
          {!!results.length && type === "react" && (
            <Button loading={saving} onClick={handleSave}>
              Save File Changes
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export default Entry;
