import { useMemo, useState } from "react";
import { replacer as ReactReplacer } from "../../../src/preset/react";
import { Button, Space } from "antd";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { CloseSquareOutlined } from "@ant-design/icons";

function Code({
  filename,
  filecontent,
  matched,
  onRemove,
}: {
  filename: string;
  filecontent: string;
  matched: boolean;
  onRemove: () => void;
}) {
  const [show, setShow] = useState(false);

  const task = useMemo(() => {
    if (filename.match(/\.(j|t)sx?$/) && matched) {
      const { tasks, toString } = ReactReplacer("./" + filename, filecontent);

      console.log(tasks);

      return {
        filecontent,
        result: tasks.length ? toString() : "",
      };
    }
    return {
      filecontent,
    };
  }, [filename, filecontent, matched]);

  const handle = (
    <Space
      className="selected-file-title"
      style={{
        position: "sticky",
      }}
    >
      {filename}
      <Button icon={<CloseSquareOutlined />} size="small" onClick={onRemove} />
      {task.result && (
        <Button
          size="small"
          type={show ? "primary" : undefined}
          onClick={() => {
            setShow((show) => !show);
          }}
        >
          preview
        </Button>
      )}
    </Space>
  );

  if (filename.match(/\.(png|jpe?g|gif|webp)$/i)) {
    return (
      <>
        {handle}
        <img src={`data:image/png;base64,${filecontent}`} />
      </>
    );
  }

  if (filename.endsWith(".svg")) {
    return (
      <>
        {handle}
        <div
          dangerouslySetInnerHTML={{
            __html: filecontent,
          }}
        ></div>
      </>
    );
  }

  return (
    <>
      {handle}
      <SyntaxHighlighter
        language="typescript"
        style={oneLight}
        customStyle={{ margin: 0 }}
      >
        {show ? task.result || task.filecontent : task.filecontent}
      </SyntaxHighlighter>
    </>
  );
}

export default Code;
