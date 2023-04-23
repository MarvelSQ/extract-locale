import { createReplacer } from "../core";
import { HookHelper } from "../helper/hook";
import { SourceHelper } from "../helper/source";
import { createMatcher } from "../matcher";

const dict = new Map();

const replacer = createReplacer({
  matcher: createMatcher({
    test: /[\u4e00-\u9fa5]/,
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
  plugins: [
    HookHelper(
      {
        importSource: "./Intl/index",
        name: "useIntl",
        isDefault: false,
      },
      {
        result: "formatMessage",
      }
    ),
    SourceHelper({
      importSource: "./Intl/index",
      name: "formatMessage",
      isDefault: false,
    }),
  ],
});

export { replacer };
