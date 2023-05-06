import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Space, Button, Typography, Badge } from "antd";
import "antd/dist/reset.css";
import "./index.css";
import Entry from "./Task/Entry";

function App() {
  const [type, setType] = useState<"react" | "demo" | null>(null);

  return (
    <>
      <Typography.Title>Extract Locale</Typography.Title>
      <Space>
        <Button
          className="demo-btn"
          size="large"
          onClick={() => setType("demo")}
        >
          Demo
        </Button>
        <Badge color="green" count="react">
          <Button size="large" onClick={() => setType("react")}>
            open Directory
          </Button>
        </Badge>
      </Space>
      {type && <Entry key={type} type={type} onClose={() => setType(null)} />}
    </>
  );
}

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(<App />);
