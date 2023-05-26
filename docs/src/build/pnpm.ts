/**
 * this file is used to build in browser with pnpm as package manager
 */
import YAML from "yaml";
import { getItems } from "@/filesystem/utils";
import { getModulePath } from "../../../src/utils/path";
import { getPackage } from "./utils";

export async function isPnpmEnabled(handle: FileSystemDirectoryHandle) {
  const files = await getItems(handle);

  const pnpmLock = files.find(
    (file) =>
      file.name === "pnpm-lock.yaml" && file instanceof FileSystemFileHandle
  );

  const node_modules = files.find(
    (file) =>
      file.name === "node_modules" && file instanceof FileSystemDirectoryHandle
  );

  if (pnpmLock && node_modules) {
    const items = await getItems(node_modules as FileSystemDirectoryHandle);

    const pnpm = items.find(
      (item) =>
        item.name === ".pnpm" && item instanceof FileSystemDirectoryHandle
    );

    if (pnpm) {
      return pnpmLock as FileSystemFileHandle;
    }
  }

  return false;
}
/**
 * @example
 * input: "node_modules/.pnpm/@webpack-cli+configtest@1.1.1_2avgptllzshtra2fri2mvdjgbe"
 *
 * output: { packageName: '@webpack-cli/configtest',version: '1.1.1_2avgptllzshtra2fri2mvdjgbe' }
 */
function parsePnpmPath(
  /**
   * @example "node_modules/.pnpm/@webpack-cli+configtest@1.1.1_2avgptllzshtra2fri2mvdjgbe"
   */
  path: string
) {
  /**
   * @example "@webpack-cli+configtest@1.1.1_2avgptllzshtra2fri2mvdjgbe"
   */
  const [, , pnpmPackageDesc] = path.split("/");

  const [packageName, ...versions] = pnpmPackageDesc.split(/(?!^)@/);

  return {
    packageName: packageName.replace("+", "/"),
    /**
     * @example "react-dom@17.0.2_react@17.0.2"
     *          there are two '@', need restore second '@'
     */
    version: versions.join("@"),
  };
}

type LockConfig = {
  lockfileVersion: number;
  dependencies: Record<string, string>;
  packages: Record<
    string,
    {
      dependencies: Record<string, string>;
    }
  >;
  specifiers: Record<string, string>;
};

export class PnpmHandle {
  static async init(rootHandle: FileSystemDirectoryHandle) {
    const pnpmLock = await isPnpmEnabled(rootHandle);

    if (pnpmLock) {
      const content = await pnpmLock.getFile().then((res) => res.text());
      const config = YAML.parse(content);
      return new PnpmHandle(config);
    }
  }

  config: LockConfig;

  constructor(lockConfig: LockConfig) {
    this.config = lockConfig;
  }

  resolveModule(module: string, importer: string) {
    const modulePath = getModulePath(module, importer);
    if (module.startsWith(".")) {
      return modulePath;
    }

    if (module.startsWith("node_modules")) {
      return modulePath;
    }

    const packageName = getPackage(modulePath);

    let packageVersion: string | undefined = undefined;

    /**
     * try to get version form related package
     */
    if (importer.startsWith("node_modules")) {
      const { packageName: Importer, version } = parsePnpmPath(importer);

      const resolver = this.config.packages[`/${Importer}/${version}`];

      if (!resolver) {
        console.error(`failed to locate ${importer} in pnpm config`);
      } else {
        if (resolver.dependencies && packageName in resolver.dependencies) {
          packageVersion = resolver.dependencies[packageName];
        }
      }
    }

    /**
     * try to find in level 1 dependencies
     */
    if (!packageVersion && packageName in this.config.dependencies) {
      packageVersion = this.config.dependencies[packageName];
    }

    /**
     * failed to find confirmed path
     */
    if (!packageVersion) {
      /**
       * try to find matched dependency
       */
      Object.keys(this.config.packages).some((path) => {
        if (path.startsWith(`/${packageName}`)) {
          /**
           * path: "/" + packageName + '/' + version
           */
          packageVersion = path.slice(1 + packageName.length + 1);
        }
        return !!packageVersion;
      });
    }

    if (!packageVersion) {
      console.error(`no mathed package in config`, packageName);
      return null;
    }

    return `node_modules/.pnpm/${packageName.replace(
      "/",
      "+"
    )}@${packageVersion}/node_modules/${module}`;
  }
}
