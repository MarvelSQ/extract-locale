import { HookHelper } from "./helper/hook";
import { SourceHelper } from "./helper/source";
import { SentenceType } from "./type";

export const config = {
  providerSource: "@hypers/analytics-ui/lib/IntlProvider/IntlProvider",
  strUseIntl: "useIntl",
  strFormatMessage: "formatMessage",
  localePrefix: "@locale/TEXT_",
  localeOffset: 0,
  externalLocaleMap: {},
  defaultLocale: "zh_CN",
};

type DefaultHelpers = {
  source: {
    /** 引入名称 */
    name: string;
  };
  hook: {
    result: string;
  };
};

type Option<K, T> = K extends keyof T
  ? { key: K; value: T[K] }
  : {
    key: K;
    value: any;
  };

type Options<T> = Option<keyof T, T>[];

type Merge<P, T> = T & Omit<P, keyof T>;

export function defineConfigv1<Helpers>(config: {
  helpers?: Helpers;
  values: any extends Helpers
  ? Options<DefaultHelpers>
  : Options<Merge<DefaultHelpers, Helpers>>;
}) { }

defineConfigv1({
  helpers: {
    some: {
      /**
       * 用于标记这个 helper 是用来干嘛的
       */
      key: "some",
    },
  },
  values: [
    {
      key: "source",
      value: {
        name: "@hypers/analytics-ui/lib/IntlProvider/IntlProvider",
      },
    },
    {
      key: "hook",
      value: {
        result: "useIntl",
      },
    },
    {
      key: "some",
      value: {
        key: "some",
      },
    },
  ],
});

type Parameter<T> = T extends () => any ? never : T extends (arg: infer P) => any ? P : never;

type AS = Parameter<(arg: string) => void>;

type AV = Parameter<() => void>;

type A = Parameter<(arg: string) => void>;

type AisUnknown = A extends never ? true : false;

// type InjectType<K, Helpers> = K extends keyof Helpers ? {
//   type: K;
//   name?: string;
//   option: Parameter<Helpers[K]> extends never ? any : Parameter<Helpers[K]>;
// } : {
//   type: string;
//   name?: string;
//   option: never;
// };

type InjectType<K, Helpers> = K extends keyof Helpers ? Parameter<Helpers[K]> extends never ? {
  type: K;
  name?: string;
} : {
  type: K;
  name?: string;
  option: Parameter<Helpers[K]>;
} : {
  type: string;
  name?: string;
  option: never;
};

type InjectTypes<Helpers> = InjectType<keyof Helpers, Helpers>;

type SentenceContext = {};

type BaseTemplate = string | ((context: SentenceContext) => string);

type Template = BaseTemplate | {
  types: SentenceType[];
  template: BaseTemplate;
} | Partial<Record<SentenceType, BaseTemplate>>;

type Plugin<Inject> = {
  inject: Inject[];
  /**
   * 模版字符串信息
   */
  template: Template;
}

type JavascriptPreset = {
  helpers: {
    source: typeof SourceHelper,
    hook: typeof HookHelper,
  }
}

type HelperResult = {
  parse: (
    /**
     * 文件路径
     */
    filePath: string,
    /**
     * 文件内容
     */
    fileContent: string) => {
      /**
       * 当前文件是否匹配
       */
      matched: boolean
    };
}

type HelperWrap<Helpers> = any extends Helpers ? undefined : {
  [K in keyof Helpers]: (config: Parameter<Helpers[K]>) => HelperResult
}

/**
 * javascript 配置
 */
export function defineConfig<Helpers>(config: {
  type: 'javascript',
  // helpers?: Helpers extends Record<string, (arg: any) => HelperResult> ? Helpers : never,
  helpers: Helpers,
  plugins: Plugin<InjectTypes<Merge<JavascriptPreset['helpers'], Helpers>>>[]
}): any;

/**
 * javascript 配置
 */
export function defineConfig(config: {
  type: 'javascript',
  plugins: Plugin<InjectTypes<JavascriptPreset['helpers']>>[]
}): any;

export function defineConfig() { };

defineConfig({
  type: 'javascript',
  helpers: {
    will: (config: {
      /**
       * this is a helper option
       */
      some: string
    }): HelperResult => {
      return {
        parse: (filePath: string, fileContent: string) => {
          return {
            matched: true,
            haha: 'haha',
          }
        }
      }
    }
  },
  plugins: [
    {
      inject: [
        {
          type: 'source',
          option: {
            importSource: './IntlProvider/IntlProvider',
            name: 'react-intl',
            isDefault: true,
          }
        },
        {
          type: 'hook',
          option: {
            name: '{source.name}',
            result: 'intl',
          },
        },
        {
          type: 'will',
          option: {
            some: 'hahah'
          }
        }
      ],
      template: {
        [SentenceType.JSXText]: (context) => 'haha',
      }
    },
  ]
})