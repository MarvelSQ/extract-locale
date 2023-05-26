import { getFileOrTarget, getItems } from "@/filesystem/utils";
import { getModulePath } from "../../../src/utils/path";

export class NodeHelper {
  static internalModules = [
    "url",
    "http",
    "https",
    "stream",
    "assert",
    "debug",
  ];
  static isNodeJSInternalModule(path: string) {
    return (
      NodeHelper.internalModules.includes(path) || path.startsWith("node:")
    );
  }

  handle: FileSystemDirectoryHandle;

  constructor(handle: FileSystemDirectoryHandle) {
    this.handle = handle;
  }

  pathMap = new Map<string, string>();

  getRealPath(path: string) {
    return this.pathMap.get(path);
  }

  async load(path: string) {
    const res = await getFileOrTarget(this.handle, path);
    if (res.status === "ancestor is file") {
      throw new Error(
        `ancestor is file: ${res.breakHandle.name}, in path: ${path}`
      );
    }

    if (res.status === "found") {
      const fileHandle = res.handle;

      if (fileHandle instanceof FileSystemFileHandle) {
        const file = await fileHandle.getFile();

        return file.text();
      } else {
        const files = res.files as FileSystemHandle[];

        const indexFile = files.find(
          (file) =>
            file.name.match(/^index\.(t|j)sx?$/) &&
            file instanceof FileSystemFileHandle
        ) as FileSystemFileHandle | undefined;

        const packageJson = files.find(
          (file) =>
            file.name === "package.json" && file instanceof FileSystemFileHandle
        ) as FileSystemFileHandle | undefined;

        // this is a nodejs package
        if (packageJson) {
          const packageJsonFile = await packageJson.getFile();

          const packageJsonContent = JSON.parse(await packageJsonFile.text());

          console.log(packageJsonContent.name);
          // main
          console.log(packageJsonContent.main);
          // browser
          console.log(packageJsonContent.browser);
          // module
          console.log(packageJsonContent.module);
          // export
          console.log(packageJsonContent.exports);

          let relativePath = "";

          if (typeof packageJsonContent.browser === "string") {
            relativePath = packageJsonContent.browser;
          } else if (typeof packageJsonContent.module === "string") {
            relativePath = packageJsonContent.module;
          } else if (typeof packageJsonContent.main === "string") {
            relativePath = packageJsonContent.main;
          }

          if (relativePath) {
            const resolvedPath = relativePath.startsWith(".")
              ? getModulePath(relativePath, `${path}/package.json`)
              : `${path}/${relativePath}`;

            console.log("resolvedPath", resolvedPath);
            // mark real path for next resolve
            this.pathMap.set(path, resolvedPath);

            const res = await getFileOrTarget(this.handle, resolvedPath);

            if (
              res.status === "found" &&
              res.handle instanceof FileSystemFileHandle
            ) {
              const file = await res.handle.getFile();

              return file.text();
            }
          } else if (indexFile) {
            /**
             * query-string only has index.js
             */
            const indexFileHandle = await indexFile.getFile();

            this.pathMap.set(path, `${path}/${indexFile.name}`);

            return indexFileHandle.text();
          }

          throw new Error("nodejs package");
        }

        if (indexFile) {
          const indexFileHandle = await indexFile.getFile();

          this.pathMap.set(path, `${path}/${indexFile.name}`);

          return indexFileHandle.text();
        }
      }
    }

    if (res.status === "not found") {
      const restPath = res.restPath;

      if (restPath.includes("/")) {
        throw new Error(`missing: ${restPath}`);
      }

      const files = await getItems(res.breakHandle);

      const likedFile = files.find(
        (file) =>
          file.name.match(new RegExp(`^${restPath}\\.(t|j)sx?$`)) &&
          file instanceof FileSystemFileHandle
      ) as FileSystemFileHandle | undefined;

      if (likedFile) {
        const likedFileHandle = await likedFile.getFile();

        this.pathMap.set(
          path,
          `${path.slice(0, path.length - restPath.length)}${likedFile.name}`
        );

        return likedFileHandle.text();
      }
    }
  }
}
