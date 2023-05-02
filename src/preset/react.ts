import { createReplacer } from "../core";
import { HookHelper } from "../helper/hook";
import { SourceHelper } from "../helper/source";
import { createMatcher } from "../matcher";
import { SentenceType } from "../type";

const dict = new Map();

const replacer = createReplacer({
  matcher: createMatcher({
    test: (value) => /[\u4e00-\u9fa5]/.test(value),
  }),
  assignee: {
    getLocaleKey(text) {
      if (dict.has(text)) {
        return dict.get(text) as string;
      }
      const localeKey = `LOCALE_TEXT_${dict.size}`;
      dict.set(text, localeKey);
      return localeKey;
    },
  },
  helpers: {
    source: SourceHelper,
    hook: HookHelper,
  },
  plugins: [
    {
      inject: [
        {
          type: "source",
          option: {
            importSource: "./Intl/index",
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
      template: (context, sentence) => {
        if (
          [SentenceType.JSXText, SentenceType.JSXAttributeText].includes(
            sentence.type as any
          )
        ) {
          return '\\{{hook.hookResult}("{localeKey}"{parts?, {parts}})\\}';
        }
        return '{hook.hookResult}("{localeKey}"{parts?, {parts}})';
      },
    },
    {
      inject: [
        {
          type: "source",
          option: {
            importSource: "./Intl/index",
            name: "formatMessage",
            isDefault: false,
          },
        },
      ],
      template: (context, sentence) => {
        if (
          [SentenceType.JSXText, SentenceType.JSXAttributeText].includes(
            sentence.type as any
          )
        ) {
          return '\\{{source.localImportName}("{localeKey}"{parts?, {parts}})\\}';
        }
        return '{source.localImportName}("{localeKey}"{parts?, {parts}})';
      },
    },
  ],
});

export { replacer };
