import { test, expect } from "vitest";

import { SourceHelper } from "../../src/helper/source";

const fileContent = `import React from 'react'

export function App() {
  return <div>App</div>
}
`;

const fileWithDefaultImport = `import React from 'react'
import useIntl from './Intl/Provider'

export function App() {
  const intl =useIntl() 
  return <div>App</div>
}
`;

const fileWithImport = `import React from 'react'
import { some } from './Intl/Provider'

export function App() {
  const intl =useIntl() 
  return <div>App</div>
}
`;

const fileWithNameSpace = `import React from 'react'
import * as intl from './Intl/Provider'

export function App() {
  const intl =intl.useIntl()
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

  const resultWithDefaultImport = sourceHelper.parse(
    "./index.ts",
    fileWithDefaultImport
  );

  expect(resultWithDefaultImport).toMatchObject({
    hasImport: true,
    hasSpecifier: true,
    importInsert: "",
    importInsertIndex: 63,
    specifierInsert: "",
    specifierInsertIndex: null,
  });

  const resultWithImport = sourceHelper.parse("./index.ts", fileWithImport);

  expect(resultWithImport).toMatchObject({
    hasImport: true,
    hasSpecifier: false,
    importInsert: "",
    importInsertIndex: 64,
    specifierInsert: " useIntl,",
    specifierInsertIndex: 32,
  });

  const resultWithNameSpace = sourceHelper.parse(
    "./index.ts",
    fileWithNameSpace
  );

  expect(resultWithNameSpace).toMatchObject({
    hasImport: true,
    hasSpecifier: true,
    importInsert: "",
    importInsertIndex: 65,
    specifierInsert: "",
    specifierInsertIndex: null,
    matched: true,
    localImportName: "intl.default",
  });
});
