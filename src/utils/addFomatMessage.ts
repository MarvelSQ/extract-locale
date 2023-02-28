import traverse, { NodePath } from "@babel/traverse";
import getTopLevelFunction from "./getTopLevelFunction";
import * as t from "@babel/types";
import { getNewKey } from "./extra";
import { isInsideArguments } from "./isInsideArguments";
import allowUseHook from "./allowUseHook";
import { replaceTemplateElement } from "./TemplateElement";
import { getSpaces, getText } from "./getText";

function createFormat(
  text: string,
  {
    intlKey,
    formatMessageKey,
    localeKey: inputLocaleKey,
  }: {
    intlKey?: string | null;
    formatMessageKey: string;
    localeKey: string | undefined;
  }
) {
  const localeKey = getNewKey(text, inputLocaleKey);
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
    localeKey,
  }: {
    intlKey?: string | null;
    formatMessageKey: string;
    localeKey: string | undefined;
  }
) {
  const text = getText(path);

  if (t.isJSXText(path.node)) {
    const [foreSpaces, endSpaces] = getSpaces(path as NodePath<t.JSXText>);

    const expression = createFormat(text, {
      intlKey,
      formatMessageKey,
      localeKey,
    });

    path.replaceWithMultiple([
      t.jsxText(foreSpaces),
      t.jsxExpressionContainer(expression),
      t.jsxText(endSpaces),
    ]);
  } else if (t.isTemplateElement(path.node)) {
    const [foreSpaces, endSpaces] = getSpaces(path as NodePath<t.JSXText>);

    const expression = createFormat(text, {
      intlKey,
      formatMessageKey,
      localeKey,
    });

    replaceTemplateElement(
      path as any,
      expression,
      t.templateElement({ raw: foreSpaces, cooked: foreSpaces }),
      t.templateElement({ raw: endSpaces, cooked: endSpaces })
    );
  } else if (t.isJSXAttribute(path.parentPath.node)) {
    path.replaceWith(
      t.jsxExpressionContainer(
        createFormat(path.node.value, {
          intlKey,
          formatMessageKey,
          localeKey,
        })
      )
    );
  } else {
    path.replaceWith(
      createFormat(path.node.value, {
        intlKey,
        formatMessageKey,
        localeKey,
      })
    );
  }
}

function addFormatMessage(
  path: NodePath<t.JSXText | t.StringLiteral | t.TemplateElement>,
  localeKey: string | undefined
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
      localeKey,
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
      localeKey,
    });
    return intlKey ? "intl" : "formatMessage";
  }

  return false;
}

export default addFormatMessage;
