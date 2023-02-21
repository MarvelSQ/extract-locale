import { parse } from "@babel/parser";
import generator from "@babel/generator";
import readString from "./utils/readString";
import { setAutoReplace } from "./utils/extra";

export async function readFile(
  fileContent: string,
  fileName: string,
  auto = false
) {
  setAutoReplace(auto);

  const ast = parse(fileContent, {
    sourceFilename: fileName,
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });

  const changed = await readString(ast, fileContent);

  return {
    changed,
    code: changed
      ? generator(ast, {
          retainLines: true,
        }).code
      : fileContent,
  };
}
