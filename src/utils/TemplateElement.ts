import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

export function replaceTemplateElement(
  path: NodePath<t.TemplateElement>,
  expression: t.Expression,
  foreElement: t.TemplateElement,
  endElement: t.TemplateElement
) {
  const templateLiteral = path.parentPath.node as t.TemplateLiteral;
  const index = templateLiteral.quasis.indexOf(path.node);
  templateLiteral.expressions.splice(index, 0, expression);
  templateLiteral.quasis.splice(index, 1, foreElement, endElement);
}
