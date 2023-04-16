import path from "node:path";
import { parse } from "@babel/parser";
import * as t from "@babel/types";
import traverse, { NodePath } from "@babel/traverse";
import { getNodeJSRelativePath } from "../utils/path";
import { FileProcesser, Sentence, SentenceType } from "../type";

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
export function HookHelper(
  source: {
    /**
     * relative path start with './'
     */
    importSource: string;
    /**
     * 引用名称
     */
    name: string;
    /**
     * 是否为默认引用
     * @default false
     */
    isDefault?: boolean;
    /**
     * 是否为 * as namespace
     * @default false
     */
    isNamespace?: boolean;
  },
  call: {
    /**
     * 调用名
     * @example 'useIntl', 'intl.useHook'
     */
    name?: string;
    result: string;
    params?: string;
  }
) {
  const isRelativePath = source.importSource.startsWith("./");

  function parseFile(filePath: string, fileContent: string) {
    const moduleImportPath = isRelativePath
      ? getNodeJSRelativePath(filePath, source.importSource)
      : source.importSource;

    const ast = parse(fileContent, {
      sourceFilename: filePath,
      sourceType: "module",
      plugins: ["typescript", "jsx"],
    });

    let hasImport = false;
    let hasSpecifier = false;

    let importInsertIndex = 0;
    let importInsert = "";
    let specifierInsertIndex: null | number = null;
    let specifierInsert = "";

    /**
     * 本地引用名称
     */
    let localImportName: string | null = null;

    ast.program.body.forEach((node) => {
      if (t.isImportDeclaration(node)) {
        importInsertIndex = node.end as number;

        if (node.source.value === moduleImportPath) {
          hasImport = true;

          const firstSpecifier = node.specifiers[0];

          const isDefault = t.isImportDefaultSpecifier(firstSpecifier);
          const isNamespace = t.isImportNamespaceSpecifier(firstSpecifier);

          if (source.isDefault) {
            node.specifiers.some((specifier) => {
              if (t.isImportDefaultSpecifier(specifier)) {
                localImportName = specifier.local.name;
              }
            });

            if (!localImportName) {
              if (isNamespace) {
                console.warn(
                  `namespace specifier cannot be used with other specifier at the same time, found in ${filePath}`
                );
                localImportName = `${firstSpecifier.local.name}.default`;
              } else {
                specifierInsertIndex = node.specifiers[0].start as number;
                specifierInsert = `${source.name}, `;
              }
            }
          } else if (source.isNamespace) {
            node.specifiers.some((specifier) => {
              if (t.isImportNamespaceSpecifier(specifier)) {
                localImportName = specifier.local.name;
              }
            });

            if (!localImportName) {
              console.warn(
                `namespace specifier cannot be used with other specifier at the same time, found in ${filePath}`
              );

              /**
               * 将 hasImport 设置为 false，重复插入 import * as xx;
               */
              hasImport = false;
            }
          } else {
            node.specifiers.forEach((specifier) => {
              if (t.isImportSpecifier(specifier)) {
                specifierInsertIndex = specifier.end as number;
                const importedName = t.isIdentifier(specifier.imported)
                  ? specifier.imported.name
                  : specifier.imported.value;
                if (importedName === source.name) {
                  localImportName = specifier.local.name;
                }
              }
            });

            if (!localImportName && specifierInsertIndex === null) {
              if (isNamespace) {
                console.warn(
                  `namespace specifier cannot be used with other specifier at the same time, found in ${filePath}`
                );
                hasImport = false;
              } else if (isDefault) {
                specifierInsertIndex = firstSpecifier.end;
                specifierInsert = `, { ${source.name} }`;
              }
            }
          }
        }
      }
    });

    if (!hasImport) {
      importInsert = `import ${
        source.isDefault
          ? source.name
          : source.isNamespace
          ? `* as ${source.name}`
          : `{ ${source.name} }`
      } from "${moduleImportPath}"`;
    }

    const scopes: {
      start: number;
      end: number;
      result: string | null;
      isBlockBody: boolean;
    }[] = [];

    const hookCall =
      localImportName && call.name && call.name.includes(".")
        ? call.name.replace(/^[^.]+/, localImportName)
        : localImportName;

    const defaultLocalImportName = localImportName || source.name;

    const defaultHookCall =
      defaultLocalImportName && call.name && !call.name.includes(".")
        ? call.name.replace(/^[^.]+/, defaultLocalImportName)
        : defaultLocalImportName;

    traverse(ast, {
      Function(path) {
        const desc = isFunctionIsReactComponent(path, {
          hook: {
            callName: hookCall,
            params: call.params,
            result: call.result,
          },
        });
        if (desc) {
          console.log(desc);
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

      hasImport,
      /**
       * import语句插入位置
       */
      importInsertIndex,
      /**
       * import语句
       */
      importInsert,
      hasSpecifier,
      /**
       * import语句中的引用插入位置
       */
      specifierInsertIndex,
      specifierInsert,
      scopes,
      defaultHookCall,
    };
  }

  type Context = FileProcesser<ReturnType<typeof parseFile>>;

  return {
    parse: parseFile,
    beforeSentenceReplace(context: Context, sentence: Sentence) {
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
    defaultReplace(
      context: Context,
      sentence: Sentence,
      extra?: {
        hookResult: string;
      }
    ) {
      let replacement: string[] = [];

      if (!extra) {
        return;
      }

      if (sentence.parts.length === 0) {
        replacement = [`${extra.hookResult}("${sentence.localeKey}")`];
      } else {
        replacement = [
          ...sentence.parts.map((part, index) => {
            return `${
              index === 0
                ? `${extra.hookResult}("${sentence.localeKey}", { `
                : ", "
            }${part.name}: `;
          }),
          " })",
        ];
      }
      // add `{}` for raw text in jsx
      if (
        [SentenceType.JSXText, SentenceType.JSXAttributeText].includes(
          sentence.type as any
        )
      ) {
        replacement[0] = `{${replacement[0]}`;
        replacement[replacement.length - 1] = `${
          replacement[replacement.length - 1]
        }}`;
      }
      context.replace(replacement);
    },
    afterSentenceReplace(context: Context, sentence: Sentence) {
      const {
        scopes,
        defaultHookCall,
        hasImport,
        importInsert,
        importInsertIndex,
      } = context.result;

      if (!hasImport) {
        context.insert(
          importInsertIndex,
          importInsertIndex,
          `\n${importInsert}`
        );
        context.result.hasImport = true;
      }

      const macthedScope = scopes.find((scope) => {
        return sentence.start >= scope.start && sentence.end <= scope.end;
      });

      if (macthedScope) {
        if (macthedScope.result) {
          return;
        }

        const callStr = `const ${call.result} = ${defaultHookCall}(${
          call.params || ""
        });`;
        if (!macthedScope.isBlockBody) {
          context.insert(
            macthedScope.start,
            macthedScope.start,
            `{${callStr}
return `
          );
          context.insert(macthedScope.end, macthedScope.end, "}");
        } else if (!macthedScope.result) {
          context.insert(
            macthedScope.start,
            macthedScope.start,
            `\n${callStr}`
          );
        }

        macthedScope.result = call.result;
      }
    },
  };
}

export type Plugin = ReturnType<typeof HookHelper>;
