import React, { useCallback, useMemo } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  createStyleObject,
  createClassNameString,
} from "react-syntax-highlighter/dist/esm/create-element";

type CodeBlock = {
  type: "element" | "text";
  tagName: string;
  properties: {
    className: string[];
  };
  children: CodeBlock[];
  value: string;
};

export type RenderCodeBlockType = (props: {
  tagName: string;
  className: string;
  style: React.CSSProperties;
  key: string;
  start: number;
  end: number;
  children: any[];
}) => JSX.Element | null;

function Code({
  renderCodeElement,
  children,
}: {
  children: string;
  renderCodeElement?: RenderCodeBlockType;
}) {
  const renderCodeBlock = useCallback(
    (
      children: CodeBlock[],
      { allStylesheetSelectors, stylesheet, offset = { current: 0 } }
    ): (JSX.Element | null)[] => {
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

        const elementClassName = createClassNameString(className);

        const Element = renderCodeElement ? (
          renderCodeElement({
            tagName: TagName,
            className: elementClassName,
            style,
            key: `code-segment${index}`,
            start: nodeStart,
            end: nodeEnd,
            children: childrenElements,
          })
        ) : (
          <TagName
            className={elementClassName}
            style={style}
            key={`code-segment${index}`}
          >
            {childrenElements}
          </TagName>
        );

        return Element;
      });
    },
    [renderCodeElement]
  );

  return (
    <div>
      <SyntaxHighlighter
        language="typescript"
        style={oneLight}
        customStyle={{ margin: 0 }}
        renderer={(renderProps) => {
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
              {renderCodeBlock(renderProps.rows as CodeBlock[], {
                stylesheet: renderProps.stylesheet,
                allStylesheetSelectors,
              })}
            </>
          );
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}

export default Code;
