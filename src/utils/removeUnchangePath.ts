import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { needLocale } from "./extra";

export default function removeUnchangePath(
  path: NodePath<t.JSXText | t.StringLiteral | t.TemplateElement>
) {
  const text = t.isTemplateElement(path.node)
    ? path.node.value.raw
    : path.node.value;

  /**
   * 不处理 import xxx from 'xxx'
   */
  if (t.isImportDeclaration(path.parentPath.node)) {
    return false;
  }

  /**
   * 不处理 type a = 'xxx'
   */
  if (t.isTSLiteralType(path.parentPath.node)) {
    return false;
  }

  if (!needLocale(text)) {
    return false;
  }

  return true;
}
