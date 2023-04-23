import { useMemo } from "react";
import { replacer as ReactReplacer } from "../../../src/preset/react";

function Code({
  filename,
  filecontent,
}: {
  filename: string;
  filecontent: string;
}) {
  const task = useMemo(() => {
    if (filename.match(/\.(j|t)sx?$/)) {
      const { tasks } = ReactReplacer("./" + filename, filecontent);

      return filecontent;
    }
    return filecontent;
  }, [filename, filecontent]);

  return <pre>{task}</pre>;
}

export default Code;
