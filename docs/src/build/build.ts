import { getModulePath } from "../../../src/utils/path";
import { run } from "./run";
import { PnpmHandle } from "./pnpm";
import { NodeHelper } from "./node";

export async function build(
  handle: FileSystemDirectoryHandle,
  entryModule: string
) {
  let helper: PnpmHandle | null = null;

  const pnpmHelper = await PnpmHandle.init(handle);

  if (pnpmHelper) {
    helper = pnpmHelper;
  }

  const nodeHelper = new NodeHelper(handle);

  return run(entryModule, {
    resolve(path, importer) {
      if (NodeHelper.isNodeJSInternalModule(path)) {
        return path;
      }

      const realImporter = nodeHelper.getRealPath(importer) || importer;

      const modulePath = getModulePath(path, realImporter);

      // local map
      if (
        path.startsWith("src") &&
        (!importer || realImporter.startsWith("src"))
      ) {
        return modulePath;
      }

      if (realImporter.startsWith("src") && modulePath.match(/^[A-Z]/)) {
        return `src/${modulePath.replace(/^([A-Z])/, (_, $1) =>
          $1.toLowerCase()
        )}`;
      } else if (
        !realImporter.startsWith("src") ||
        !modulePath.startsWith("src/")
      ) {
        const result = pnpmHelper?.resolveModule(modulePath, realImporter);

        if (result) {
          return result;
        }
      }

      return modulePath;
    },
    async load(path) {
      if (NodeHelper.isNodeJSInternalModule(path)) {
        return "module.exports = {}";
      }

      const [, ext] = path.match(/\.([.]+)$/) || [];

      if (ext && ["js", "ts", "tsx", "jsx"].includes(ext)) {
        console.log("not js", path);
        return "module.exports = {}";
      }

      const content = await nodeHelper.load(path);

      return content || 'module.exports = ""';
    },
  });
}
