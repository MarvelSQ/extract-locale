import * as esbuild from "esbuild-wasm";
import wasmURL from "esbuild-wasm/esbuild.wasm?url";

let instance = false;

export async function init() {
  if (instance) return;

  await esbuild.initialize({
    wasmURL,
  });

  instance = true;
}
