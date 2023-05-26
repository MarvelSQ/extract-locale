import * as esbuild from "esbuild-wasm";
import { init } from ".";
import React from "react";

export async function run(
  entryFile: string,
  option: {
    resolve: (path: string, importer: string) => string;
    load: (path: string) => Promise<string>;
  }
) {
  await init();

  const result = await esbuild.build({
    entryPoints: [entryFile],
    bundle: true,
    format: "cjs",
    platform: "browser",
    plugins: [
      {
        name: "custom-resolve",
        setup(build) {
          build.onResolve({ filter: /^.+$/ }, (args) => {
            return {
              path: option.resolve(args.path, args.importer),
              namespace: "custom-resolve",
            };
          });
          build.onLoad(
            { filter: /^.+$/, namespace: "custom-resolve" },
            async (args) => {
              const content = await option.load(args.path).catch((err) => {
                if (err) {
                  console.log("path", args.path);
                  console.error(err);
                }
              });

              return {
                contents: content || "export default {}",
                loader: "tsx",
              };
            }
          );
        },
      },
    ],
  });

  console.log(result);

  const outputUint8Array = result.outputFiles[0].contents;

  const output = new TextDecoder("utf-8").decode(outputUint8Array);

  console.log({ output });

  if (output) {
    const runner = new Function("module", "{ React }", output);

    const module = {
      exports: {},
    };

    runner(module, {
      React,
    });

    console.log("module", module.exports);

    return module.exports;
  }
}
