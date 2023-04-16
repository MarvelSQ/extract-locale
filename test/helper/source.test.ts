import { test, expect } from "vitest";

import { SourceHelper } from "../../src/helper/source";

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

test("测试依赖解析", () => {
  const sourceHelper = SourceHelper({
    importSource: "./Intl/Provider",
    name: "useIntl",
    isDefault: true,
  });

  const result = sourceHelper.parse("./index.ts", fileContent);

  expect(result).toMatchObject({
    hasImport: false,
    hasSpecifier: false,
    importInsert: `import useIntl from "./Intl/Provider"`,
    importInsertIndex: 25,
    specifierInsert: "",
    specifierInsertIndex: null,
  });

  const resultWithImport = sourceHelper.parse("./index.ts", fileWithImport);

  expect(resultWithImport).toMatchObject({
    hasImport: true,
    hasSpecifier: false,
    importInsert: "",
    importInsertIndex: 63,
    specifierInsert: "",
    specifierInsertIndex: null,
  });
});
