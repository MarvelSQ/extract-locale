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
  /**
   * 替换文字内容
   */
  replace: (strs: string[], uniqueTaskId?: string) => void;
  result: P;
  next: () => void;
  insert: (
    start: number,
    end: number,
    text: string,
    uniqueTaskId?: string
  ) => void;
};

export type Plugin = {
  parse: (
    filePath: string,
    fileContent: string
  ) => {
    matched: boolean;
  };
  beforeSentenceReplace?: (
    context: FileProcesser<any>,
    sentence: Sentence
  ) => any;
  afterSentenceReplace?: (
    context: FileProcesser<any>,
    sentence: Sentence
  ) => void;
  defaultReplace(
    context: FileProcesser<any>,
    sentence: Sentence,
    extra?: any
  ): void;
};
