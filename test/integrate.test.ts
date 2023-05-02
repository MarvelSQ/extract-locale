import { test, expect } from "vitest";
import { createReplacer } from "../src/core";
import { createMatcher } from "../src/matcher";
import { HookHelper } from "../src/helper/hook";
import { SourceHelper } from "../src/helper/source";

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

const constants = {
  sometext: '文案'
}

console.log('中文');
`;

const baseFileResult = `import React from 'react';
import { useIntl } from "../Intl/index"
import { formatMessage } from "../Intl/index"

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

const constants = {
  sometext: formatMessage("LOCALE_TEXT_5")
}

console.log('中文');
`;

const dict = new Map<any, string>();

test("transform base file", () => {
  const replacer = createReplacer({
    matcher: createMatcher({
      test: (value) => /[\u4e00-\u9fa5]/.test(value),
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
      SourceHelper({
        importSource: "./Intl/index",
        name: "formatMessage",
        isDefault: false,
      }),
    ],
  });

  const result = replacer("./components/App.tsx", baseFile).toString();

  expect(result).toBe(baseFileResult);
});
