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

/**
 * Get the absolute path of the module to be imported by file path
 * @example './base' from '/src/utils/path.ts' => '/src/utils/base'
 *          '../base' from '/src/utils/path.ts' => '/src/base'
 *          'base' from '/src/utils/path.ts' => 'base'
 */
export function getModulePath(module: string, filePath: string) {
  if (module === "./") {
    const paths = filePath.split("/");
    return paths.slice(0, paths.length - 1).join("/");
  } else if (module.startsWith(".")) {
    const paths = filePath.split("/");
    // relative path always remove the last path
    paths.pop();
    const modulePaths = module.split("/").filter((path) => {
      if (path === ".") {
        return false;
      }
      if (path === "..") {
        paths.pop();
        return false;
      }
      return true;
    });

    return paths.concat(modulePaths).join("/");
  }

  return module;
}
