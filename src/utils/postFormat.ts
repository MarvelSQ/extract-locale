import { ParseResult } from "@babel/parser";
import traverse from "@babel/traverse";
import {
  callExpression,
  conditionalExpression,
  Expression,
  File,
  isCallExpression,
  isIdentifier,
  isMemberExpression,
  isStringLiteral,
  stringLiteral,
} from "@babel/types";

function isFormatMessage(node: Expression) {
  if (!isCallExpression(node)) {
    return false;
  }
  const callee = node.callee;
  if (isMemberExpression(callee)) {
    if (
      isIdentifier(callee.object) &&
      callee.object.name === "intl" &&
      isIdentifier(callee.property) &&
      callee.property.name === "formatMessage"
    ) {
      if (node.arguments.length > 1) {
        return false;
      }
      if (isStringLiteral(node.arguments[0])) {
        return {
          callee,
          localeKey: node.arguments[0].value,
        };
      }
    }
  }
  if (isIdentifier(callee)) {
    if (callee.name === "formatMessage") {
      if (node.arguments.length > 1) {
        return false;
      }
      if (isStringLiteral(node.arguments[0])) {
        return {
          callee,
          localeKey: node.arguments[0].value,
        };
      }
    }
  }
  return false;
}

export function postFormat(ast: ParseResult<File>) {
  // 优化三元表达式
  // 优化前
  // test ? formatMessage("a") : formatMessage("b")
  // 优化后
  // formatMessage(test ? "a" : "b")
  traverse(ast, {
    ConditionalExpression(path) {
      const baseCallee = isFormatMessage(path.node.consequent);
      const anotherCallee = isFormatMessage(path.node.alternate);
      if (baseCallee && anotherCallee) {
        path.replaceWith(
          callExpression(baseCallee.callee, [
            conditionalExpression(
              path.node.test,
              stringLiteral(baseCallee.localeKey),
              stringLiteral(anotherCallee.localeKey)
            ),
          ])
        );
      }
    },
  });
}
