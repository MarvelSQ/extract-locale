import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

const foreSpacesReg = /^[\n\s]*/;
const endSpacesReg = /[\n\s]*$/;

export function getText(
  path: NodePath<t.JSXText | t.StringLiteral | t.TemplateElement>
) {
  if (t.isTemplateElement(path.node)) {
    return path.node.value.raw
      .replace(foreSpacesReg, "")
      .replace(endSpacesReg, "");
  }
  if (t.isJSXText(path.node)) {
    return path.node.value.replace(foreSpacesReg, "").replace(endSpacesReg, "");
  }
  return path.node.value;
}

export function getSpaces(path: NodePath<t.JSXText | t.TemplateElement>) {
  const rawText = t.isTemplateElement(path.node)
    ? path.node.value.raw
    : path.node.value;
  return [
    rawText.match(foreSpacesReg)?.[0] || "",
    rawText.match(endSpacesReg)?.[0] || "",
  ];
}
