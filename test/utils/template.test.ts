import { expect, test } from "vitest";

import { renderTemplate } from "../../src/utils/template";

test("template string", () => {
  expect(renderTemplate("test", {})).toBe("test");

  expect(renderTemplate("test{a}", { a: "b" })).toBe("testb");

  expect(renderTemplate("test{a}test", { a: "b" })).toBe("testbtest");

  expect(renderTemplate("test{a}test\\{b}", { a: "b", b: "c" })).toBe(
    "testbtest{b}"
  );
});

test('template string with "?"', () => {
  expect(renderTemplate("test{a?b}", { a: true })).toBe("testb");

  expect(renderTemplate("test{a?b:c}", { a: false })).toBe("testc");

  expect(renderTemplate("test\\{a?b:c}test", { a: true })).toBe(
    "test{a?b:c}test"
  );

  expect(
    renderTemplate("test{a?{b}:{c}}test", { a: false, b: "right", c: "wrong" })
  ).toBe("testwrongtest");

  // nested condition
  expect(
    renderTemplate("test{a?{b?haha}:{name}}some", {
      a: true,
      b: true,
    })
  ).toBe("testhahasome");
});
