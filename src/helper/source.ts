import { parse } from "@babel/parser";
import * as t from "@babel/types";
import { FileProcesser, Sentence, SentenceType } from "../type";
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
export function SourceHelper(source: SourceParam) {
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
          : `\\{ ${source.name} \\}`
      } from "${moduleImportPath}"`;
    }

    return {
      matched: true,
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

      localImportName: localImportName || source.name,
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
    defaultReplace(context: Context, sentence: Sentence) {
      let replacement: string[] = [];

      const { localImportName } = context.result;

      if (sentence.parts.length === 0) {
        replacement = [`${localImportName}("${sentence.localeKey}")`];
      } else {
        replacement = [
          ...sentence.parts.map((part, index) => {
            return `${
              index === 0
                ? `${localImportName}("${sentence.localeKey}", { `
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
    addImport,
    afterSentenceReplace(context: Context) {
      addImport(context, context.result);
    },
  };
}
