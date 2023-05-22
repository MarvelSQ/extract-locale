import { parse } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import * as t from "@babel/types";
import { HelperResult } from "../type";

function getFunctionName(path: NodePath<t.Function>) {
  if (t.isFunctionDeclaration(path.node)) {
    return path.node.id?.name;
  }
  if (
    t.isFunctionExpression(path.node) ||
    t.isArrowFunctionExpression(path.node)
  ) {
    if (t.isVariableDeclarator(path.parentPath.node)) {
      if (t.isIdentifier(path.parentPath.node.id)) {
        return path.parentPath.node.id.name;
      }
    }
  }
  if (t.isObjectMethod(path.node)) {
    if (t.isIdentifier(path.node.key)) {
      return path.node.key.name;
    }
  }
}

function getParamProps(path: NodePath<t.Function>): {
  isProps: boolean;
  isObjectPattern: boolean;
  length: number;
} {
  const firstParam = path.node.params[0];
  if (t.isIdentifier(firstParam)) {
    /**
     * function App(props)
     */
    return {
      isProps: firstParam.name === "props",
      isObjectPattern: false,
      length: path.node.params.length,
    };
  } else if (t.isObjectPattern(firstParam)) {
    /**
     * function App({ ...props })
     */
    const isProps = firstParam.properties.some((property) => {
      if (
        t.isRestElement(property) &&
        t.isIdentifier(property.argument) &&
        property.argument.name === "props"
      ) {
        return true;
      }
    });

    return {
      isProps,
      isObjectPattern: true,
      length: path.node.params.length,
    };
  }
  return {
    isProps: false,
    isObjectPattern: false,
    length: path.node.params.length,
  };
}

function isFunctionIsReactComponent(
  path: NodePath<t.Function>,
  {
    hook,
  }: {
    hook: {
      callName: string | null;
      params: string | undefined;
      result: string;
    };
  }
) {
  const functionName = getFunctionName(path);

  if (!functionName) {
    return false;
  }
  /**
   * use开头的函数
   */
  let isFunctionNameStartWithUse = functionName.startsWith("use");

  /**
   * 函数名首字母为大写的
   */
  let isFunctionNameCapitalized = functionName.match(/^[A-Z]/);

  /**
   * 参数格式
   */
  const paramDesc = getParamProps(path);

  /**
   * 所有返回类型
   */
  const returns: string[] = [];

  /**
   * 是否有use开头的调用
   */
  let hasCallUse = false;

  /**
   * body为块级
   */
  const isBlockBody = t.isBlockStatement(path.node.body);

  let result: null | string = null;

  path.traverse({
    enter(path) {
      if (t.isFunction(path.node)) {
        path.skip();
      }
      if (t.isReturnStatement(path.node)) {
        returns.push(path.node.argument?.type ?? "unknown");
      }
      if (t.isCallExpression(path.node)) {
        if (hook.callName && path.parentPath?.isVariableDeclarator()) {
          const declaraStr = `${path.parentPath}`;
          const match = declaraStr.match(
            new RegExp(`^([^\s]+) = ${hook.callName}\\(`)
          );
          if (match) {
            result = match[1] as string;
          }
        }

        if (t.isIdentifier(path.node.callee)) {
          if (path.node.callee.name.startsWith("use")) {
            hasCallUse = true;
          }
        }
      }
    },
  });

  return {
    isFunctionNameStartWithUse,
    isFunctionNameCapitalized,
    paramDesc,
    returns: Array.from(new Set(returns)),
    hasCallUse,
    isBlockBody,
    blockStart: isBlockBody ? (path.node.body.start as number) + 1 : 0,
    blockEnd: isBlockBody ? (path.node.body.end as number) - 1 : 0,
    result,
  };
}

/**
 * 根据hook解析依赖 与 scope
 */
export function HookHelper(call: {
  /**
   * 调用名
   * @example 'useIntl', 'intl.useHook'
   */
  name: string;
  /**
   * 返回值
   */
  result: string;
  params?: string;
}): HelperResult<ReturnType<typeof parseFile>, {
  hookResult: string;
}> {
  function parseFile(filePath: string, fileContent: string) {
    const ast = parse(fileContent, {
      sourceFilename: filePath,
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });

    const scopes: {
      start: number;
      end: number;
      result: string | null;
      isBlockBody: boolean;
    }[] = [];

    // const hookCall =
    //   localImportName && call.name && call.name.includes(".")
    //     ? call.name.replace(/^[^.]+/, localImportName)
    //     : localImportName;

    // const defaultLocalImportName = localImportName || source.name;

    // const defaultHookCall =
    //   defaultLocalImportName && call.name && !call.name.includes(".")
    //     ? call.name.replace(/^[^.]+/, defaultLocalImportName)
    //     : defaultLocalImportName;

    traverse(ast, {
      Function(path) {
        const desc = isFunctionIsReactComponent(path, {
          hook: {
            callName: call.name,
            params: call.params,
            result: call.result,
          },
        });
        if (desc) {
          switch (true) {
            case desc.hasCallUse:
            case desc.isFunctionNameStartWithUse:
            case desc.isFunctionNameCapitalized && desc.paramDesc.isProps:
            case desc.isFunctionNameCapitalized &&
              desc.returns.length === 1 &&
              desc.returns[0] === "JSXElement":
              scopes.push({
                start: desc.blockStart,
                end: desc.blockEnd,
                result: desc.result,
                isBlockBody: desc.isBlockBody,
              });
              path.skip();
              break;
          }
        }
      },
    });

    return {
      matched: scopes.length !== 0,
      scopes,
    };
  }

  return {
    parse: parseFile,
    beforeSentenceReplace(context, sentence) {
      const { scopes } = context.result;
      const macthedScope = scopes.find((scope) => {
        return sentence.start >= scope.start && sentence.end <= scope.end;
      });
      if (macthedScope) {
        return {
          hookResult: macthedScope.result || call.result,
        };
      }
    },
    afterSentenceReplace(context, sentence) {
      const { scopes } = context.result;

      const macthedScope = scopes.find((scope) => {
        return sentence.start >= scope.start && sentence.end <= scope.end;
      });

      if (macthedScope) {
        const callStr = `const ${call.result} = ${call.name}(${call.params || ""
          });`;
        if (!macthedScope.isBlockBody) {
          context.insert(
            macthedScope.start,
            macthedScope.start,
            `{${callStr}
return `,
            `hook-insert-block-start-${macthedScope.start}`
          );
          context.insert(
            macthedScope.end,
            macthedScope.end,
            "}",
            `hook-insert-block-end-${macthedScope.end}`
          );
        } else if (!macthedScope.result) {
          context.insert(
            macthedScope.start,
            macthedScope.start,
            `\n${callStr}`,
            `hook-insert-block-start-${macthedScope.start}`
          );
        }
      }
    },
  };
}

export type Plugin = ReturnType<typeof HookHelper>;
