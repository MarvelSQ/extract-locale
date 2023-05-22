import { test, expect } from "vitest";

import { HookHelper } from "../../src/helper/hook";

const fileContent = `import React from 'react'

export function App() {
  return <div>App</div>
}
`;

const fileWithImport = `import React from 'react'
import useIntl from './Intl/Provider'

export function App() {
  const intl =useIntl() 
  return <div>App</div>
}
`;

test("测试hook解析", () => {
  const hookHelper = HookHelper(
    {
      importSource: "./Intl/Provider",
      name: "useIntl",
      isDefault: true,
    },
    {
      result: "intl",
    }
  );

  const result = hookHelper.parse("./index.ts", fileContent);

  expect(result).toMatchObject({
    scopes: [
      {
        start: 50,
        end: 75,
        isBlockBody: true,
        result: null,
      },
    ],
  });

  const resultWithImport = hookHelper.parse("./index.ts", fileWithImport);

  expect(resultWithImport).toMatchObject({
    scopes: [
      {
        start: 88,
        end: 138,
        isBlockBody: true,
        result: "intl",
      },
    ],
  });
});
