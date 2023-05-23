import { test, expect } from "vitest";

import { getNodeJSRelativePath, getModulePath } from "../src/utils/path";

test("getNodeJSRelativePath", () => {
  expect(getNodeJSRelativePath("./index.js", "./Intl/index")).toBe(
    "./Intl/index"
  );

  expect(getNodeJSRelativePath("./index.js", "./Intl")).toBe("./Intl");

  expect(getNodeJSRelativePath("./component/index.js", "./Intl/Provider")).toBe(
    "../Intl/Provider"
  );
});

test("getModulePath", () => {
  expect(getModulePath("./base", "/src/utils/path.ts")).toBe("/src/utils/base");

  expect(getModulePath("../base", "/src/utils/path.ts")).toBe("/src/base");

  expect(getModulePath("base", "/src/utils/path.ts")).toBe("base");

  expect(getModulePath("./", "/src/utils/path.ts")).toBe("/src/utils");
});
