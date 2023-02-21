import traverse, { NodePath } from "@babel/traverse";
import getTopLevelFunction from "./getTopLevelFunction";
import * as t from "@babel/types";
import { getNewKey } from "./extra";
import { isInsideArguments } from "./isInsideArguments";
import allowUseHook from "./allowUseHook";

function createFormat(
  text: string,
  {
    intlKey,
    formatMessageKey,
  }: {
    intlKey?: string | null;
    formatMessageKey: string;
  }
) {
  const localeKey = getNewKey(text);
  return t.callExpression(
    intlKey
      ? t.memberExpression(
          t.identifier(intlKey),
          t.identifier(formatMessageKey)
        )
      : t.identifier(formatMessageKey),
    [t.stringLiteral(localeKey)]
  );
}

function replaceText(
  path: NodePath<t.JSXText | t.StringLiteral | t.TemplateElement>,
  {
    intlKey,
    formatMessageKey,
  }: {
    intlKey?: string | null;
    formatMessageKey: string;
  }
) {
  if (t.isJSXText(path.node)) {
    const text = path.node.value;
    const rawText = text.replace(/^[\n\s]*/, "").replace(/[\n\s]*$/, "");
    const foreSpaces = text.match(/^[\n\s]*/)?.[0] || "";
    const endSpaces = text.match(/[\n\s]*$/)?.[0] || "";

    const expression = createFormat(rawText, {
      intlKey,
      formatMessageKey,
    });

    path.replaceWithMultiple([
      t.jsxText(foreSpaces),
      t.jsxExpressionContainer(expression),
      t.jsxText(endSpaces),
    ]);
  } else if (t.isTemplateElement(path.node)) {
    // empty
  } else if (t.isJSXAttribute(path.parentPath.node)) {
    path.replaceWith(
      t.jsxExpressionContainer(
        createFormat(path.node.value, {
          intlKey,
          formatMessageKey,
        })
      )
    );
  } else {
    path.replaceWith(
      createFormat(path.node.value, {
        intlKey,
        formatMessageKey,
      })
    );
  }
}

function addFormatMessage(
  path: NodePath<t.JSXText | t.StringLiteral | t.TemplateElement>
): false | "formatMessage" | "intl" {
  // 准备阶段
  /**
   * convert {'xxx': xxx} => {[call('xxxx')]: xxx}
   */
  if (path.parentKey === "key" && path.parentPath.isObjectProperty()) {
    (path.parentPath.node as t.ObjectProperty).computed = true;
  }

  // 获取顶层函数
  const toplevelFunction = getTopLevelFunction(path);
  if (toplevelFunction === true) {
    return false;
  }

  /**
   * 字符串不在函数内 或 字符串在参数内
   * 仅使用 formatMessage 作为函数
   */
  let useFormatMessage =
    toplevelFunction === false ||
    isInsideArguments(path) ||
    !allowUseHook(toplevelFunction);

  // this condition is redundant, but it can help typescript to narrow the type
  if (toplevelFunction === false || useFormatMessage) {
    replaceText(path, {
      formatMessageKey: "formatMessage",
    });
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

  if (intlKey || formatMessageKey) {
    replaceText(path, {
      intlKey,
      formatMessageKey: formatMessageKey || "formatMessage",
    });
  }

  return "intl";
}

export default addFormatMessage;
