import { parse } from "@babel/parser";
import * as t from "@babel/types";
import { BaseTask, FileProcesser, HelperResult, Sentence, SentenceType } from "../type";
import { getNodeJSRelativePath } from "../utils/path";

export type SourceParam = {
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
};

/**
 * parse file content & resolve importSource
 */
export function SourceHelper(source: SourceParam): HelperResult<ReturnType<typeof parseFile>, void, {
  imports: {
    id: string,
    source: SourceParam,
    result: ReturnType<typeof parseFile>
  }[]
}> {
  const isRelativePath = source.importSource.startsWith("./");

  const sourceHelperId = `sourceHelper_${source.name}_${source.isDefault}_${source.isNamespace}_${source.importSource}`;

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
    let hasDefaultImport = false;
    let hasNamespaceImport = false;
    let hasNormalImport = false;
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

          node.specifiers.forEach((specifier) => {
            if (t.isImportDefaultSpecifier(specifier)) {
              hasDefaultImport = true;
            } else if (t.isImportNamespaceSpecifier(specifier)) {
              hasNamespaceImport = true;
            } else if (t.isImportSpecifier(specifier)) {
              hasNormalImport = true;
            }
          });

          if (source.isDefault) {
            node.specifiers.some((specifier) => {
              if (t.isImportDefaultSpecifier(specifier)) {
                localImportName = specifier.local.name;
                hasSpecifier = true;
              }
            });

            if (!localImportName) {
              if (isNamespace) {
                localImportName = `${firstSpecifier.local.name}.default`;
                hasSpecifier = true;
              } else {
                /**
                 * "import|{xx}from 'xx'"
                 *   ^^^^^^ +6
                 */
                const importStart = (node.start as number) + 6;

                specifierInsertIndex = importStart;
                specifierInsert = ` ${source.name},`;
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
                localImportName = `${firstSpecifier.local.name}.${source.name}`;
                hasSpecifier = true;
              } else if (isDefault) {
                specifierInsertIndex = firstSpecifier.end as number;
                specifierInsert = `, { ${source.name} }`;
              }
            }
          }
        }
      }
    });

    if (!hasImport) {
      importInsert = `import ${source.isDefault
        ? source.name
        : source.isNamespace
          ? `* as ${source.name}`
          : `\\{ ${source.name} \\}`
        } from "${moduleImportPath}"`;
    }

    return {
      matched: true,
      hasImport,
      hasDefaultImport,
      hasNamespaceImport,
      hasNormalImport,
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

      localImportName: localImportName || source.name,
      moduleImportPath,
    };
  }

  type Context = FileProcesser<ReturnType<typeof parseFile>>;

  function addImport(
    context: FileProcesser<any>,
    result: ReturnType<typeof parseFile>
  ) {
    const { hasImport, importInsert, importInsertIndex, localImportName } =
      result;

    if (!hasImport) {
      context.insert(
        importInsertIndex,
        importInsertIndex,
        `\n${importInsert}`,
        `import-${localImportName}`
      );
    }
  }

  return {
    parse: parseFile,
    // defaultReplace(context, sentence) {
    //   let replacement: string[] = [];

    //   const { localImportName } = context.result;

    //   if (sentence.parts.length === 0) {
    //     replacement = [`${localImportName}("${sentence.localeKey}")`];
    //   } else {
    //     replacement = [
    //       ...sentence.parts.map((part, index) => {
    //         return `${index === 0
    //             ? `${localImportName}("${sentence.localeKey}", { `
    //             : ", "
    //           }${part.name}: `;
    //       }),
    //       " })",
    //     ];
    //   }
    //   // add `{}` for raw text in jsx
    //   if (
    //     [SentenceType.JSXText, SentenceType.JSXAttributeText].includes(
    //       sentence.type as any
    //     )
    //   ) {
    //     replacement[0] = `{${replacement[0]}`;
    //     replacement[replacement.length - 1] = `${replacement[replacement.length - 1]
    //       }}`;
    //   }
    //   context.replace(replacement);
    // },
    // addImport,
    afterSentenceReplace(context) {
      context.fileContext.imports =
        context.fileContext.imports ||
        ([] as {
          id: string;
          source: SourceParam;
          result: ReturnType<typeof parseFile>;
        }[]);

      if (context.result.hasSpecifier) {
        return;
      }

      if (
        context.fileContext.imports.find((item) => item.id === sourceHelperId)
      ) {
        return;
      }

      context.fileContext.imports.push({
        id: sourceHelperId,
        source,
        result: context.result,
      });

      context.insert(0, 0, "", sourceHelperId);
    },
    postFile(context) {
      const { imports = [] } = context.fileContext;

      // reset imports
      context.fileContext.imports = [];

      const importMap = imports.reduce((map, item) => {
        const importSource = item.source.importSource;
        map[importSource] = map[importSource] || [];

        if (!map[importSource].find((i) => i.id === item.id)) {
          map[importSource].push(item);
        }

        return map;
      }, {} as Record<string, typeof imports>);

      Object.entries(importMap).forEach(([importSource, specifiers]) => {

        type ImportType = {
          sourceHelperId: string;
          localImportName: string;
        }

        const {
          hasImport,
          hasNormalImport,
          importInsertIndex,
          moduleImportPath,
        } = specifiers[0].result;
        let defaultImport: ImportType | null = null;
        const normalImports: ImportType[] = [];
        let defaultInsertIndex: number | null = null;
        let normalInsertIndex: number | null = null;

        specifiers.forEach((item) => {
          const { isDefault, isNamespace } = item.source;
          const { localImportName, specifierInsertIndex } = item.result;

          if (isDefault) {
            defaultInsertIndex = specifierInsertIndex;
            defaultImport = {
              sourceHelperId: item.id,
              localImportName,
            } as ImportType;
          } else if (isNamespace) {
            // todo
          } else {
            normalInsertIndex = specifierInsertIndex;
            normalImports.push({
              sourceHelperId: item.id,
              localImportName,
            });
          }
        });

        if (hasImport) {
          const normalImportsStr = normalImports
            .map((item) => {
              return item.localImportName;
            })
            .join(", ");

          context.push({
            type: "condition",
            tasks: [
              defaultImport && {
                type: "insert",
                start: defaultInsertIndex as unknown as number,
                end: defaultInsertIndex as unknown as number,
                text: `${(defaultImport as ImportType).localImportName}, `,
              },
              normalImportsStr && {
                type: "insert",
                start: normalInsertIndex as unknown as number,
                end: normalInsertIndex as unknown as number,
                text: `${hasNormalImport ? "," : ", {"}${normalImportsStr}${hasNormalImport ? "" : "}"
                  }`,
              },
            ].filter(Boolean) as BaseTask[],
          });
        } else {
          if (defaultImport || normalImports.length > 0) {
            context.push({
              type: "condition",
              tasks: [
                {
                  type: "insert",
                  start: importInsertIndex,
                  end: importInsertIndex,
                  text: `\nimport ${[
                    defaultImport && (defaultImport as ImportType).localImportName,
                    ...normalImports.map(
                      (item, index) =>
                        `${index === 0 ? "{ " : ""}${item.localImportName}${index === normalImports.length - 1 ? " }" : ""
                        }`
                    ),
                  ]
                    .filter(Boolean)
                    .join(", ")} from "${moduleImportPath}"`,
                },
              ],
            });
          }
        }
      });
    },
  };
}
