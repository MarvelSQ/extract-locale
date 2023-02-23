import chalk from "chalk";
import inquirer, { QuestionCollection } from "inquirer";

import { ParseResult } from "@babel/parser";
import traverse, { NodePath } from "@babel/traverse";
import {
  File,
  isTemplateElement,
  JSXText,
  StringLiteral,
  TemplateElement,
} from "@babel/types";
import addFormatMessage from "./addFomatMessage";
import { addImportFormatMessage, addImportUseIntl } from "./addIntlProvider";
import removeUnchangePath from "./removeUnchangePath";
import {
  getAutoName,
  getAutoReplace,
  getNextKey,
  getPrefixKey,
  isKeyExist,
} from "./extra";
import { postFormat } from "./postFormat";

export default async function readString(
  ast: ParseResult<File>,
  fileContent: string
) {
  const autoReplace = getAutoReplace();

  const autoName = getAutoName();

  let changed: (false | "formatMessage" | "intl")[] = [];

  let paths: NodePath<JSXText | StringLiteral | TemplateElement>[] = [];
  traverse(ast, {
    JSXText(path) {
      paths.push(path);
    },
    StringLiteral(path) {
      paths.push(path);
    },
    TemplateElement(path) {
      paths.push(path);
    },
  });

  paths = paths.filter((path) => removeUnchangePath(path));

  for (const path of paths) {
    const value = isTemplateElement(path.node)
      ? path.node.value.raw
      : path.node.value;
    const printValue = chalk.red(value);

    const startLine = path.node.loc?.start.line;
    const endLine = path.node.loc?.end.line;
    const paragraph =
      typeof startLine == "number" && typeof endLine === "number"
        ? fileContent
            .split("\n")
            .map((text, index) => `${chalk.gray(index)}: ${chalk.blue(text)}`)
            .filter((text, index) => {
              return index >= startLine - 2 && index <= endLine;
            })
            .join("\n")
            .replace(value, printValue)
        : "缺失行信息";

    // value中是否存在中文字符
    const perferAnswer = value.match(/[\u4e00-\u9fa5]/g) ? 0 : 1;

    const questions: QuestionCollection<{
      need: boolean;
      localeKey: string;
    }> = [
      {
        type: "list",
        name: "need",
        message: `convert "${printValue}" to formatMessage?
------file-----
${paragraph}
------file-----
`,
        choices: [
          {
            name: "Yes",
            value: true,
          },
          {
            name: "No",
            value: false,
          },
        ],
        default: perferAnswer,
        when: !autoReplace,
      },
      {
        type: "input",
        name: "localeKey",
        message: `please input Locale Key for this text "${printValue}"?
------file-----
${paragraph}
------file-----
`,
        validate: (key: string) => {
          const isExist = isKeyExist(key);
          if (isExist) {
            return `key ${key} is exist`;
          }
          return true;
        },
        transformer(input: string) {
          return getPrefixKey(input);
        },
        default: getNextKey(),
        when: (data) => {
          if (autoReplace) {
            return !autoName && !perferAnswer;
          }
          return !autoName && data.need;
        },
      },
    ];

    const result = await inquirer.prompt(questions);
    if (result.need ?? !perferAnswer) {
      changed.push(addFormatMessage(path, result.localeKey));
    }
  }

  if (changed.includes("intl")) {
    addImportUseIntl(ast);
  }
  if (changed.includes("formatMessage")) {
    addImportFormatMessage(ast);
  }

  if (changed.filter(Boolean).length) {
    postFormat(ast);
  }

  return changed.length === 0 || changed.every((item) => item === false)
    ? false
    : true;
}
