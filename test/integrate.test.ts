import { test, expect } from "vitest";
import { createReplacer } from "../src/core";
import { createMatcher } from "../src/matcher";
import { HookHelper } from "../src/helper/hook";

const baseFile = `import React from 'react';

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
`;

const baseFileResult = `import React from 'react';
import { useIntl } from "../Intl/index"

export default function App() {
const formatMessage = useIntl();
  const name = formatMessage("LOCALE_TEXT_0");
  return (
    <div>
      <h1 title={formatMessage("LOCALE_TEXT_1")}>{formatMessage("LOCALE_TEXT_2")}</h1>
      <p title={formatMessage("LOCALE_TEXT_3")}>{name}</p>
      <p>{formatMessage("LOCALE_TEXT_4", { part1: name })}</p>
    </div>
  );
}

console.log('中文');
`;

const dict = new Map<any, string>();

test("transform base file", () => {
  const replacer = createReplacer({
    matcher: createMatcher({
      test: /[\u4e00-\u9fa5]/,
    }),
    assignee: {
      getLocaleKey(text) {
        if (dict.has(text)) {
          return dict.get(text) as string;
        }
        const localeKey = `LOCALE_TEXT_${dict.size}`;
        dict.set(text, localeKey);
        return localeKey;
      },
    },
    plugins: [
      HookHelper(
        {
          importSource: "./Intl/index",
          name: "useIntl",
          isDefault: false,
        },
        {
          result: "formatMessage",
        }
      ),
    ],
    returnPreview: true,
  });

  const result = replacer("./components/App.tsx", baseFile);

  expect(result).toBe(baseFileResult);
});