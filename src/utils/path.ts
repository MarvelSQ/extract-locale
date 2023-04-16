import path from "node:path";

/**
 * Get the relative path of the file to the import file
 * in the NodeJS environment
 * node:path.relative(from, to) 不能正确处理相对路径，需根据情况调整
 */
export function getNodeJSRelativePath(
  filePath: string,
  importFilePath: string
) {
  const result = path.relative(path.dirname(filePath), importFilePath);

  if (result.startsWith(".")) {
    return result;
  }

  return `./${result}`;
}
