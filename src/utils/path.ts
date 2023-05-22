/**
 * Get the relative path of the file to the import file
 * in the NodeJS environment
 * node:path.relative(from, to) 不能正确处理相对路径，需根据情况调整
 */
export function getNodeJSRelativePath(
  filePath: string,
  importFilePath: string
) {
  const currentPaths = filePath.split("/");
  const importPaths = importFilePath.split("/");

  const commonPaths = currentPaths.filter((path, index) => {
    return path === importPaths[index];
  });

  const currentRelativePaths = currentPaths.slice(commonPaths.length);

  const importRelativePaths = importPaths.slice(commonPaths.length);

  // remove the file name
  currentRelativePaths.pop();

  const result = currentRelativePaths
    .map(() => "..")
    .concat(importRelativePaths)
    .join("/");

  if (result.startsWith(".")) {
    return result;
  }

  return `./${result}`;
}
