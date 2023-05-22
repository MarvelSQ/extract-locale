import React, { useEffect, useMemo, useRef, useState } from "react";
import { SimpleFile, loadFiles } from "./loadFiles";
import { Button, List, Popconfirm, Space, Tabs, Tag } from "antd";
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

    loadFiles(type).then(async ({ name, files }) => {
      let selectedFiles = files;

      if (type === "react") {
        selectedFiles = await new Promise<string[]>((res) => {
          if (!files.length) return res([]);

          const handle = modal.info({
            className: "file-selector-modal",
            content: (
              <FileSelector
                directory={name}
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

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(false);
  }, [results]);

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
        setSaved(true);
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
            <Popconfirm
              title="Saving Changes"
              description={
                <>
                  Before saving, please make sure you have <br /> git or other
                  version control system <br /> tracking your changes.
                </>
              }
              onConfirm={handleSave}
              okText="proceed"
              cancelText="cancel"
            >
              <Button loading={saving} disabled={saved}>
                Save File Changes
              </Button>
            </Popconfirm>
          )}
        </div>
      )}
    </>
  );
}

export default Entry;
