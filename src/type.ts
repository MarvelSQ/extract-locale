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
  replace: (strs: string[]) => void;
  result: P;
  next: () => void;
  insert: (start: number, end: number, text: string) => void;
  insertLine: (start: number, end: number, text: string) => void;
};

export type Plugin = {
  beforeSentenceReplace(sentence: Sentence): any;
  afterSentenceReplace(sentence: Sentence): void;
  defaultReplace(
    context: FileProcesser<{ hookResult: string }>,
    sentence: Sentence
  ): void;
};
