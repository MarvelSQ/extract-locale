#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const glob = require("glob");

const { readFile } = require("./lib");
const { getLocaleMap } = require("./lib/utils/extra");
const config = require("./lib/config");
const { readLocaleMap } = require("./lib/utils/parseLocaleMap");
const prettier = require("prettier");
const { Command } = require("commander");

const program = new Command();
program.version("0.0.1");
program.option("-l, --locale <locale>", "existing locale file");
program.option("-p, --prefix <prefix>", "locale key prefix");
program.option("-o, --offset <offset>", "offset of locale");
program.option("-A, --no-auto", "replace locale manually");

program.parse();

const options = program.opts();

if (options.locale) {
  const localeFilePath = path.resolve(process.cwd(), options.locale);
  const localeFile = fs.readFileSync(localeFilePath, {
    encoding: "utf-8",
  });
  const localeMap = readLocaleMap(localeFile, localeFilePath);

  config.config.externalLocaleMap = localeMap;
}

if (options.offset) {
  const base = parseInt(options.offset, 10);
  config.config.localeOffset = base;
}

if (options.prefix) {
  config.config.localePrefix = options.prefix;
}

// const currentDir = process.cwd();
// const filename = path.resolve(currentDir, process.argv[2]);

const filenames = program.args.filter((filename) => {
  // no less file, no locale file, no mock file
  if (filename.match(/(less|css|sass)$/)) {
    return false;
  }

  if (filename.match(/mock/)) {
    return false;
  }

  if (filename.match(/__tests__/)) {
    return false;
  }

  if (filename.match(/locale/)) {
    return false;
  }

  if (filename.match(/\.d\.ts$/)) {
    return false;
  }

  return true;
});

console.log(filenames);

// glob(filename, {}, async (err, files) => {
//   if (err) {
//     console.error(err);
//     return;
//   }
async function readFiles(filenames) {
  for (let file of filenames) {
    console.log(`processing ${file}`);

    const result = fs.readFileSync(file, {
      encoding: "utf-8",
    });

    await readFile(result, file, options.auto).then(async ({ changed, code }) => {
      if (changed) {
        console.log(`${file} is formatted`);
        fs.writeFile(
          file,
          prettier.format(code, {
            printWidth: 100,
            singleQuote: true,
            tabWidth: 2,
            parser: "typescript",
          }),
          (err) => {
            if (err) {
              console.error(err);
            }
          }
        );
      }
    });
  }
  console.log(JSON.stringify(getLocaleMap(), null, 2));
}

readFiles(filenames);
// });
