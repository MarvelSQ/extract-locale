import traverse, { NodePath } from "@babel/traverse";
import getTopLevelFunction from "./getTopLevelFunction";
import * as t from "@babel/types";
import { getNewKey } from "./extra";
import { isInsideArguments } from "./isInsideArguments";
import allowUseHook from "./allowUseHook";

function addFormatMessage(
  path: NodePath<t.JSXText | t.StringLiteral | t.TemplateElement>
): false | "formatMessage" | "intl" {
  const isJSX =
    t.isJSXText(path.node) || t.isJSXAttribute(path.parentPath.node);

  const isObjectKey =
    path.parentKey === "key" && path.parentPath.isObjectProperty();

  /**
   * convert {'xxx': xxx} => {[call('xxxx')]: xxx}
   */
  if (isObjectKey) {
    (path.parentPath.node as t.ObjectProperty).computed = true;
  }

  const text = t.isTemplateElement(path.node)
    ? path.node.value.raw
    : path.node.value;

  const toplevelFunction = getTopLevelFunction(path);

  if (toplevelFunction === true) {
    return false;
  }

  /**
   * 字符串不在函数内 或 字符串在参数内
   */
  let useFormatMessage =
    toplevelFunction === false ||
    isInsideArguments(path) ||
    !allowUseHook(toplevelFunction);

  if (toplevelFunction === false || useFormatMessage) {
    const callFormatMessage = t.callExpression(t.identifier("formatMessage"), [
      t.stringLiteral(getNewKey(text)),
    ]);
    if (isJSX) {
      path.replaceWith(t.jsxExpressionContainer(callFormatMessage));
    } else if (t.isTemplateElement(path.node)) {
      // path.replaceWith(t.)
    } else {
      path.replaceWith(callFormatMessage);
    }
    return "formatMessage";
  }

  let hasCallUseIntl = false;
  let intlKey: string | null = null;
  let formatMessageKey: string | null = null;

  traverse(
    toplevelFunction.node,
    {
      CallExpression(path) {
        if (
          t.isIdentifier(path.node.callee) &&
          path.node.callee.name === "useIntl"
        ) {
          hasCallUseIntl = true;

          if (t.isVariableDeclarator(path.parentPath.node)) {
            /**
             * 处理 `const intl = useIntl();`
             */
            if (t.isIdentifier(path.parentPath.node.id)) {
              intlKey = path.parentPath.node.id.name;
            }
            /**
             * 处理 `const { formatMessage } = useIntl();`
             */
            if (t.isObjectPattern(path.parentPath.node.id)) {
              const result = path.parentPath.node.id.properties.find((p) => {
                if (t.isObjectProperty(p)) {
                  let isFormatMessage = false;
                  if (t.isIdentifier(p.key) && p.key.name === "formatMessage") {
                    isFormatMessage = true;
                  } else if (
                    t.isStringLiteral(p.key) &&
                    p.key.value === "formatMessage"
                  ) {
                    isFormatMessage = true;
                  }
                  if (isFormatMessage) {
                    if (t.isIdentifier(p.value)) {
                      formatMessageKey = p.value.name;
                      return true;
                    }
                  }
                }
              });

              if (!result) {
                path.parentPath.node.id.properties.push(
                  t.objectProperty(
                    t.identifier("formatMessage"),
                    t.identifier("formatMessage")
                  )
                );
              }
            }
          }
        }
      },
    },
    path.scope
  );

  if (!hasCallUseIntl) {
    if (t.isBlockStatement(toplevelFunction.node.body)) {
      toplevelFunction.node.body.body.unshift(
        t.variableDeclaration("const", [
          t.variableDeclarator(
            t.identifier("intl"),
            t.callExpression(t.identifier("useIntl"), [])
          ),
        ])
      );
      intlKey = "intl";
    }
  }

  if (intlKey) {
    let expression: any = t.callExpression(
      t.memberExpression(t.identifier(intlKey), t.identifier("formatMessage")),
      [t.stringLiteral(getNewKey(text))]
    );
    if (isJSX) expression = t.jsxExpressionContainer(expression);
    path.replaceWith(expression);
    return "intl";
  } else if (formatMessageKey) {
    let expression: any = t.callExpression(t.identifier(formatMessageKey), [
      t.stringLiteral(getNewKey(text)),
    ]);
    if (isJSX) expression = t.jsxExpressionContainer(expression);
    path.replaceWith(expression);
    return "intl";
  }

  return false;
}

export default addFormatMessage;
