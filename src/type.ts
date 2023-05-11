export const enum SentenceType {
  Literal = "Literal",
  TemplateLiteral = "TemplateLiteral",
  JSXText = "JSXText",
  JSXAttributeText = "JSXAttributeText",
}

export type TextMatch = {
  text: string | string[];
  start: number;
  end: number;
  type: SentenceType | string;
  parts: {
    name: string;
    start: number;
    end: number;
  }[];
}

export type Effection = {
  type: "replace" | "insert";
  uniqueTaskId?: string;
  start: number;
  end: number;
  text: string;
}

export type LocaleTask = {
  match: TextMatch;
  localeKey: string;
  extra: any;
  effects: Effection[];
  postEffects: Effection[] | null;
  context: Record<string, any>;
}

export type FileHandle = {
  /**
   * 替换文字内容
   */
  replace: (start: number, end: number, text: string, uniqueTaskId?: string) => void;
  /**
   * 插入文字内容
   */
  insert: (
    start: number,
    end: number,
    text: string,
    uniqueTaskId?: string
  ) => void;
}

export type BaseTemplate = string | ((context: Record<string, any>, sentence: TextMatch) => string);

export type Template = BaseTemplate | {
  types: (SentenceType | string)[];
  template: BaseTemplate;
} | Partial<Record<SentenceType | string, BaseTemplate>>;

export type Plugin = {
  inject: {
    type: string;
    name?: string;
    option: any;
  }[];
  template: Template;
};

export type FileTask = {
  type: string;
  tasks: Effection[]
}

type ReplacerContext<E, FC = Record<string, any>> = {
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
  beforeSentenceReplace?(context: ReplacerContext<ParseResult, FC>, sentence: TextMatch): PreResult | void;
  afterSentenceReplace?(context: FileHandle & ReplacerContext<ParseResult & PreResult, FC>, sentence: TextMatch): void;
  postFile?(context: PostFileContext<FC>): void;
}