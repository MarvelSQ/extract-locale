import React, { useContext, useMemo, useRef, useState } from "react";
import { replacer as ReactReplacer } from "../../../src/preset/react";
import { Badge, Button, Menu, Space } from "antd";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  createStyleObject,
  createClassNameString,
} from "react-syntax-highlighter/dist/esm/create-element";
import { CloseSquareOutlined, FileOutlined } from "@ant-design/icons";
import { ReplaceTask } from "../../../src/type";

type CodeBlock = {
  type: "element" | "text";
  tagName: string;
  properties: {
    className: string[];
  };
  children: CodeBlock[];
  value: string;
};

const TaskContext = React.createContext<{
  tasks?: ReplaceTask[];
}>({
  tasks: [],
});

const Marked = ({
  tagName: TagName,
  className,
  children,
  start,
  end,
  ...props
}) => {
  const { tasks } = useContext(TaskContext);

  const matchedTask = useMemo(() => {
    if (!tasks) return false;
    if (typeof children[0] !== "string") return false;
    const index = tasks.findIndex(
      (task) => task.sentence.start <= start && task.sentence.end >= end
    );
    if (index >= 0) {
      return {
        index,
        last: tasks[index].sentence.end === end,
      };
    }
  }, [tasks, start, end]);

  const node = (
    <TagName
      className={`${className} ${matchedTask ? "task-matched" : ""}`}
      {...props}
    >
      {children}
    </TagName>
  );

  if (matchedTask && matchedTask.last) {
    return (
      <Badge size="small" count={matchedTask.index + 1}>
        {node}
      </Badge>
    );
  }

  return node;
};

function renderCodeBlock(
  children: CodeBlock[],
  { allStylesheetSelectors, stylesheet, offset = { current: 0 } }
) {
  return children.map((node, index) => {
    const { properties, tagName: TagName, children } = node;

    const nodeStart = offset.current;

    if (node.type === "text") {
      offset.current += node.value.length;
      return node.value;
    }

    const startingClassName =
      properties.className && properties.className.includes("token")
        ? ["token"]
        : [];

    const className =
      properties.className &&
      startingClassName.concat(
        properties.className.filter(
          (className) => !allStylesheetSelectors.includes(className)
        )
      );

    const style = createStyleObject(properties.className, {}, stylesheet);

    const childrenElements = renderCodeBlock(children, {
      allStylesheetSelectors,
      offset,
      stylesheet,
    });

    const nodeEnd = offset.current;

    return (
      <Marked
        tagName={TagName}
        className={createClassNameString(className)}
        style={style}
        key={`code-segment${index}`}
        start={nodeStart}
        end={nodeEnd}
      >
        {childrenElements}
      </Marked>
    );
  });
}

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
        tasks,
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
        zIndex: 1,
        top: 0,
        height: 50,
        backgroundColor: "white",
        display: "flex",
      }}
    >
      <Menu
        activeKey="code"
        items={[
          {
            label: <>{filename}</>,
            key: "code",
            icon: <FileOutlined />,
          },
        ]}
      />
      <Button icon={<CloseSquareOutlined />} size="small" onClick={onRemove} />
      {task.result && (
        <Badge count={task.tasks.length}>
          <Button
            size="small"
            type={show ? "primary" : undefined}
            onClick={() => {
              setShow((show) => !show);
            }}
          >
            preview
          </Button>
        </Badge>
      )}
    </Space>
  );

  const styleRef = useRef<HTMLStyleElement>(null);

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
    <TaskContext.Provider value={show ? {} : task}>
      {handle}
      <SyntaxHighlighter
        language="typescript"
        style={oneLight}
        customStyle={{ margin: 0 }}
        renderer={(renderProps) => {
          console.log(renderProps);

          if (styleRef.current) {
            styleRef.current.style;
          }

          const allStylesheetSelectors = Object.keys(
            renderProps.stylesheet
          ).reduce((classes, selector) => {
            selector.split(".").forEach((className) => {
              if (!classes.includes(className)) classes.push(className);
            });
            return classes;
          }, [] as string[]);

          return (
            <>
              <style ref={styleRef}></style>
              {renderCodeBlock(renderProps.rows, {
                stylesheet: renderProps.stylesheet,
                allStylesheetSelectors,
              })}
            </>
          );
        }}
      >
        {show ? task.result || task.filecontent : task.filecontent}
      </SyntaxHighlighter>
    </TaskContext.Provider>
  );
}

export default Code;
