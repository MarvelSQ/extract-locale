import { useMemo, useState } from "react";
import { replacer as ReactReplacer } from "../../../src/preset/react";
import { Button } from "antd";

function Code({
  filename,
  filecontent,
  matched,
}: {
  filename: string;
  filecontent: string;
  matched: boolean;
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

  if (filename.match(/\.(png|jpe?g|gif|webp)$/i)) {
    return <img src={`data:image/png;base64,${filecontent}`} />;
  }

  if (filename.endsWith(".svg")) {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: filecontent,
        }}
      ></div>
    );
  }

  return (
    <div>
      {task.result && (
        <Button
          type={show ? "primary" : undefined}
          onClick={() => {
            setShow((show) => !show);
          }}
        >
          preview
        </Button>
      )}
      <pre>{show ? task.result || task.filecontent : task.filecontent}</pre>
    </div>
  );
}

export default Code;
