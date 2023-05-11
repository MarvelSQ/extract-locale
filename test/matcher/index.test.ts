import { test, expect } from "vitest";
import { createMatcher } from "../../src/matcher";
import { SentenceType } from "../../src/type";

test("匹配需替换的文本", () => {
  const matchChinese = createMatcher({
    test: (value: string) => /[\u4e00-\u9fa5]/.test(value),
  });

  const sentences = matchChinese.collect(
    "src/test.tsx",
    `
    import React from 'react';

    export default function App() {
      const name = '中文';
      return (
        <div>
          <h1 title="主标题">你好</h1>
          <p title={"段落"}>{name}</p>
          <p>{\`这是一段\${name}模版\`}</p>
        </div>
      );
    }

    console.log('中文');
  `
  );

  expect(sentences).toMatchObject([
    {
      text: "中文",
      start: 88,
      end: 92,
      parts: [],
      type: SentenceType.Literal,
    },
    {
      text: "主标题",
      start: 143,
      end: 148,
      type: SentenceType.JSXAttributeText,
      parts: [],
    },
    {
      text: "你好",
      start: 149,
      end: 151,
      parts: [],
      type: SentenceType.JSXText,
    },
    {
      text: "段落",
      start: 177,
      end: 181,
      type: SentenceType.Literal,
      parts: [],
    },
    {
      text: ["这是一段", "模版"],
      start: 208,
      end: 223,
      parts: [
        {
          start: 215,
          end: 219,
        },
      ],
      type: SentenceType.TemplateLiteral,
    },
  ]);
});
