import { createReplacer } from "../core";
import { HookHelper } from "../helper/hook";
import { SourceHelper } from "../helper/source";
import { createMatcher } from "../matcher";
import { Plugin, SentenceType } from "../type";
import { renderTemplate } from "../utils/template";

const dict = new Map();

const ReactIntlUseIntl = {
  name: "react-intl useIntl",
  inject: [
    {
      type: "source",
      option: {
        importSource: "react-intl",
        name: "useIntl",
        isDefault: false,
      },
    },
    {
      type: "hook",
      option: {
        name: "{source.localImportName}",
        result: "formatMessage",
      },
    },
  ],
  template:
    '{isJSXText?\\{}{isJSXAttributeText?\\{}{hook.hookResult}("{localeKey}"{parts?, {parts}}){isJSXAttributeText?\\}}{isJSXText?\\}}',
};

const ReactIntlImperativeAPI = {
  name: "react-intl imperative API",
  inject: [
    {
      type: "source",
      option: {
        importSource: "react-intl",
        name: "intl",
        isDefault: false,
      },
    },
  ],
  template:
    "{isJSXText?\\{}{isJSXAttributeText?\\{}{source.localImportName}.formatMessage({localeKey}{parts?, {parts}}){isJSXAttributeText?\\}}{isJSXText?\\}}",
};

const ReactIntlFormattedMessage = {
  name: "react-intl FormattedMessage",
  inject: [
    {
      type: "source",
      option: {
        importSource: "react-intl",
        name: "FormattedMessage",
        isDefault: false,
      },
    },
  ],
  template: {
    [SentenceType.JSXText]:
      '<{source.localImportName} id="{localeKey}"{parts?, {parts}}/>',
  },
};

export const DefaultSettings = {
  match: "[\\u4e00-\\u9fa5]",
  localeKeyPattern: "LOCALE_KEY_{number}",
  plugins: [
    ReactIntlFormattedMessage,
    ReactIntlUseIntl,
    ReactIntlImperativeAPI,
  ],
};

export function withPreset({
  match,
  localeKeyPattern,
  plugins,
}: {
  match: string;
  localeKeyPattern: string;
  plugins: Plugin[];
}) {
  const matchRegExp = new RegExp(match);

  return createReplacer({
    matcher: createMatcher({
      test: (value) => matchRegExp.test(value),
    }),
    assignee: {
      getLocaleKey(text, filePath) {
        if (dict.has(text)) {
          return dict.get(text) as string;
        }
        const localeKey = renderTemplate(localeKeyPattern, {
          number: dict.size,
        });
        dict.set(text, localeKey);
        return localeKey;
      },
    },
    helpers: {
      source: SourceHelper,
      hook: HookHelper,
    },
    plugins,
  });
}
