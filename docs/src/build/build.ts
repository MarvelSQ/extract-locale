import { getModulePath } from "../../../src/utils/path";
import { run } from "./run";
import { PnpmHandle } from "./pnpm";
import { NodeHelper } from "./node";

export async function build(
  handle: FileSystemDirectoryHandle,
  entryModule: string,
  options?: {
    onMessage: (message: {
      type: "resolve" | "load" | "success" | "error";
      message: string | string[];
    }) => void;
  }
) {
  let helper: PnpmHandle | null = null;

  const log =
    (type: "resolve" | "load" | "success" | "error") =>
    (message: string | string[]) => {
      options?.onMessage({ type, message });
    };

  const logResolve = log("resolve");
  const logLoad = log("load");
  const logSuccess = log("success");
  const logError = log("error");

  const pnpmHelper = await PnpmHandle.init(handle);

  if (pnpmHelper) {
    helper = pnpmHelper;
  }

  const nodeHelper = new NodeHelper(handle);

  return run(entryModule, {
    resolve(path, importer) {
      if (NodeHelper.isNodeJSInternalModule(path)) {
        logResolve(`ignore internal module: ${path}`);
        return path;
      }

      const realImporter = nodeHelper.getRealPath(importer) || importer;

      const importerString = `(${importer})${
        realImporter !== importer ? `(${realImporter})` : ""
      }`;

      const modulePath = getModulePath(path, realImporter);

      // local map
      if (
        path.startsWith("src") &&
        (!importer || realImporter.startsWith("src"))
      ) {
        logResolve(`package: ${modulePath} from ${importerString}`);
        return modulePath;
      }

      if (realImporter.startsWith("src") && modulePath.match(/^[A-Z]/)) {
        const resolvedPath = `src/${modulePath.replace(/^([A-Z])/, (_, $1) =>
          $1.toLowerCase()
        )}`;
        logResolve(
          `alias package: (${modulePath})${resolvedPath} from ${importerString}`
        );
        return resolvedPath;
      } else if (
        !realImporter.startsWith("src") ||
        !modulePath.startsWith("src/")
      ) {
        const result = pnpmHelper?.resolveModule(modulePath, realImporter);

        if (result) {
          logResolve(
            `pnpm package: ${modulePath} from ${importerString} => ${result}`
          );
          return result;
        }
      }

      return modulePath;
    },
    async load(path) {
      if (NodeHelper.isNodeJSInternalModule(path)) {
        logLoad(`ignore internal module: ${path}`);
        return "module.exports = {}";
      }

      const [, ext] = path.match(/\.([.]+)$/) || [];

      if (ext && ["js", "ts", "tsx", "jsx"].includes(ext)) {
        console.log("not js", path);
        logLoad(`ignore non js module: ${path}`);
        return "module.exports = {}";
      }

      const content = await nodeHelper.load(path);

      logLoad(`load module: ${path}`);

      return content || 'module.exports = ""';
    },
  })
    .then((res) => {
      logSuccess("build success");
      return res;
    })
    .catch((err) => {
      logError(err.message);
      throw err;
    });
}
