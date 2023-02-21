import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";

export function readLocaleMap(fileContent: string, filename: string) {
  const ast = parse(fileContent, {
    sourceFilename: filename,
    sourceType: "module",
    plugins: ["typescript"],
  });

  const localeMap: { [key: string]: string } = {};

  traverse(ast, {
    Identifier(path) {
      if (path.node.name === "zh_CN") {
        const parentPath = path.parentPath;
        if (parentPath.isObjectProperty()) {
          traverse(
            parentPath.node,
            {
              ObjectProperty(path) {
                const { key, value } = path.node;
                let localeKey = null;
                if (t.isIdentifier(key)) {
                  localeKey = key.name;
                } else if (t.isStringLiteral(key)) {
                  localeKey = key.value;
                } else {
                  return;
                }

                if (t.isStringLiteral(value)) {
                  localeMap[localeKey] = value.value;
                }
              },
            },
            parentPath.scope,
            parentPath.state,
            parentPath
          );
        }
      }
    },
  });

  return localeMap;
}
