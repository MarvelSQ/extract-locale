import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import { SentenceType, TextMatch } from "../type";

export type Matcher = ReturnType<typeof createMatcher>;

export function createMatcher({
  test,
}: {
  test: (text: string, filename: string) => boolean;
}) {
  return {
    collect(filename: string, filecontent: string) {
      const ast = parse(filecontent, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      });

      const sentences: TextMatch[] = [];

      traverse(ast, {
        enter(path) {
          if (path.isCallExpression()) {
            if (`${path}`.startsWith("console.")) {
              path.skip();
            }
          }
          if (path.isStringLiteral()) {
            const value = path.node.value;
            if (test(value, filename)) {
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
            if (test(value, filename)) {
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

            if (value.some((v) => test(v.text, filename))) {
              sentences.push({
                text: value.map((v) => v.text),
                start: path.node.start as number,
                end: path.node.end as number,
                type: SentenceType.TemplateLiteral,
                parts: path.node.expressions.map((e, i) => {
                  return {
                    name:  `part${i + 1}`,
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
