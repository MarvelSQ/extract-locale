import { parse } from "@babel/parser";
import generator from "@babel/generator";
import readString from "./utils/readString";
import { setAutoName, setAutoReplace } from "./utils/extra";

export async function readFile(
  fileContent: string,
  fileName: string,
  options: {
    auto: boolean;
    autoName: boolean;
  }
) {
  setAutoReplace(options.auto);
  setAutoName(options.autoName);

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
