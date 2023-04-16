import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import { PreMatch, SentenceType } from "../type";

export type Matcher = ReturnType<typeof createMatcher>;

export function createMatcher({ test }: { test: RegExp }) {
  return {
    collect(filecontent: string) {
      const ast = parse(filecontent, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      });

      const sentences: PreMatch[] = [];

      traverse(ast, {
        enter(path) {
          if (path.isCallExpression()) {
            if (`${path}`.startsWith("console.")) {
              path.skip();
            }
          }
          if (path.isStringLiteral()) {
            const value = path.node.value;
            if (test.test(value)) {
              sentences.push({
                text: value,
                start: path.node.start as number,
                end: path.node.end as number,
                type: path.parentPath.isJSXAttribute()
                  ? SentenceType.JSXAttributeText
                  : SentenceType.Literal,
                parts: [],
              });
            }
          }

          if (path.isJSXText()) {
            const value = path.node.value;
            if (test.test(value)) {
              sentences.push({
                text: value,
                start: path.node.start as number,
                end: path.node.end as number,
                type: SentenceType.JSXText,
                parts: [],
              });
            }
          }

          if (path.isTemplateLiteral()) {
            const value = path.node.quasis.map((q) => {
              return {
                text: q.value.raw,
                start: q.start as number,
                end: q.end as number,
              };
            });

            if (value.some((v) => test.test(v.text))) {
              sentences.push({
                texts: value.map((v) => v.text),
                start: path.node.start as number,
                end: path.node.end as number,
                type: SentenceType.TemplateLiteral,
                parts: path.node.expressions.map((e) => {
                  return {
                    start: e.start as number,
                    end: e.end as number,
                  };
                }),
              });
            }
          }
        },
      });

      return sentences;
    },
  };
}
