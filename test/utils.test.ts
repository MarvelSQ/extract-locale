import { test, expect } from "vitest";

import { getNodeJSRelativePath } from "../src/utils/path";

test("getNodeJSRelativePath", () => {
  expect(getNodeJSRelativePath("./index.js", "./Intl/index")).toBe(
    "./Intl/index"
  );

  expect(getNodeJSRelativePath("./index.js", "./Intl")).toBe("./Intl");

  expect(getNodeJSRelativePath("./component/index.js", "./Intl/Provider")).toBe(
    "../Intl/Provider"
  );
});
