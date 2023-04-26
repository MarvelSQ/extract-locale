import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Layout,
  Space,
  Button,
  Typography,
  Badge,
  Tag,
  ConfigProvider,
} from "antd";
import "antd/dist/reset.css";
import "./index.css";
import { openExtractLocale } from "./filesystem/index";
import FileExplorer from "./filesystem/FileExplorer";
import { ExtractDirectory, ExtractFile } from "./filesystem/type";

function App() {
  const [fileTree, setFileTree] = useState<
    (ExtractFile | ExtractDirectory)[] | null
  >(null);

  return (
    <>
      <Typography.Title>Extract Locale</Typography.Title>
      <Badge color="green" count="react">
        <Button
          size="large"
          onClick={() => {
            openExtractLocale().then((fileTree) => {
              setFileTree(fileTree);
            });
          }}
        >
          open Directory
        </Button>
      </Badge>
      {fileTree && <FileExplorer fileTree={fileTree} />}
    </>
  );
}

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(<App />);
