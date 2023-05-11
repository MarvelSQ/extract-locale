export const enum SentenceType {
  Literal = "Literal",
  TemplateLiteral = "TemplateLiteral",
  JSXText = "JSXText",
  JSXAttributeText = "JSXAttributeText",
}

export type PreMatch = {
  text?: string;
  texts?: string[];
  start: number;
  end: number;
  type: SentenceType;
  parts: {
    start: number;
    end: number;
  }[];
};

export type Sentence<E = any> = {
  text: string;
  texts: string[];
  localeKey: string;
  parts: {
    name: string;
    start: number;
    end: number;
  }[];
  type: SentenceType.JSXAttributeText | string;
  extra: E;
  start: number;
  end: number;
};

export type FileProcesser<P> = {
  result: P;
  /**
   * 替换文字内容
   */
  replace: (strs: string[], uniqueTaskId?: string) => void;
  next: () => void;
  insert: (
    start: number,
    end: number,
    text: string,
    uniqueTaskId?: string
  ) => void;
};

export type EffectTask =
  | {
    type: "replace";
    texts: string[];
    uniqueTaskId?: string;
  }
  | {
    type: "insert";
    start: number;
    end: number;
    text: string;
    uniqueTaskId?: string;
  };

export type ReplaceTask = {
  context: any;
  sentence: Sentence;
  effects: EffectTask[];
  postEffects: EffectTask[] | null;
};

// export type Helper = {
//   parse: (
//     filePath: string,
//     fileContent: string
//   ) => {
//     matched: boolean;
//   };
//   beforeSentenceReplace?: (
//     context: FileProcesser<any>,
//     sentence: Sentence
//   ) => any;
//   afterSentenceReplace?: (
//     context: FileProcesser<any>,
//     sentence: Sentence
//   ) => void;
//   defaultReplace(
//     context: FileProcesser<any>,
//     sentence: Sentence,
//     extra?: any
//   ): void;
//   postFile?: (context: FileProcesser<any>) => void;
// };

export type Plugin = {
  inject: {
    type: string;
    name?: string;
    option: any;
  }[];
  template:
  | string
  | ((context: string, sentence: Sentence) => string)
  | {
    types: string[];
    template: string | ((context: string, sentence: Sentence) => string);
  }
  | Partial<
    Record<
      SentenceType,
      string | ((context: string, sentence: Sentence) => string)
    >
  >;
};

export type BaseTask = {
  type: "insert" | "replace";
  start: number;
  end: number;
  text: string;
}

export type FileTask = {
  type: string;
  tasks: BaseTask[]
}

type CoreContext = {
  replace(strs: string[], uniqueTaskId: string): void;
  result: Record<string, any>;
  insert(start: number, end: number, text: string, uniqueTaskId: string): void;
  push(task: FileTask): void;
  /**
   * 文件上下文，存储文件的一些信息
   * 可以在 helper 中通过 context.fileContext 获取
   */
  fileContext: Record<string, any>;
  /**
   * 插件上下文
   * 可以在 helper 中通过 context.pluginContext 获取
   * 同时可以在模版中直接读取
   */
  pluginContext: Record<string, any>;
}

type ReplacerContext<E, FC = Record<string, any>> = { [k in keyof CoreContext]: CoreContext[k] } & {
  result: E;
  fileContext: FC
};

type PostFileContext<FC> = {
  fileContext: FC;
  push(task: FileTask): void;
}

export type HelperResult<ParseResult extends {
  matched: boolean;
}, PreResult = void | {}, FC = Record<string, any>> = {
  parse(filepath: string, filecontent: string): ParseResult;
  beforeSentenceReplace?(context: ReplacerContext<ParseResult, FC>, sentence: Sentence): PreResult | void;
  afterSentenceReplace?(context: ReplacerContext<ParseResult & PreResult, FC>, sentence: Sentence): void;
  postFile?(context: PostFileContext<FC>): void;
}