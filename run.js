const fs = require("node:fs");
const path = require("node:path");
const { build } = require("esbuild");

async function run(importStr) {
  const targetDir = path.dirname(importStr);

  const tempBundleFileName = path.resolve(
    targetDir,
    `temp-bundle.${Date.now()}.cjs`
  );

  let hasError = false;

  try {
    await build({
      entryPoints: [path.resolve(process.cwd(), importStr)],
      bundle: true,
      outfile: tempBundleFileName,
      platform: "node",
      format: "cjs",
      target: "node14",
      external: ["node:fs", "node:path", "resolve"],
      define: {
        __dirname: JSON.stringify(targetDir),
      },
    });
  } catch (e) {
    console.log("bundle error");
    console.error(e);
  }

  try {
    return require(tempBundleFileName);
  } catch (e) {
    console.log("require error");
    console.error(e);
  } finally {
    fs.unlinkSync(tempBundleFileName);
  }
}

module.exports = {
  run,
};
