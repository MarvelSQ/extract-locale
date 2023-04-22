import { FileProcesser, Sentence, Plugin } from "../type";
import MagicString from "magic-string";

import { Matcher } from "../matcher";

export function createReplacer({
  matcher,
  assignee,
  plugins,
  returnPreview,
}: {
  matcher: Matcher;
  assignee: {
    getLocaleKey: (text: string | string[]) => string;
  };
  plugins: Plugin[];
  returnPreview?: boolean;
}) {
  return (filepath: string, fileContent: string) => {
    const magicStr = new MagicString(fileContent);

    const matches = matcher.collect(fileContent);

    const sentences = matches.map((m) => {
      return {
        ...m,
        parts: m.parts.map((p, i) => ({
          ...p,
          name: `part${i + 1}`,
        })),
        localeKey: assignee.getLocaleKey(m.text || (m.texts as string[])),
      } as Sentence;
    });

    const matchPlugins = plugins.reduce((acc, plugin) => {
      const result = plugin.parse(filepath, fileContent);
      if (result.matched) {
        return [
          ...acc,
          {
            plugin,
            result,
          },
        ];
      }
      return acc;
    }, [] as { plugin: Plugin; result: any }[]);

    const taskMap: Record<string, boolean> = {};

    sentences.forEach((sentence) => {
      let processed = false;

      matchPlugins.forEach(({ plugin, result }) => {
        if (processed) {
          return;
        }

        const context: FileProcesser<any> = {
          replace: (strs, uniqueTaskId) => {
            if (uniqueTaskId) {
              if (taskMap[uniqueTaskId]) {
                return;
              }
              taskMap[uniqueTaskId] = true;
            }
            if (sentence.parts.length) {
              const lastPartEnd = sentence.parts.reduce(
                (start, part, index) => {
                  magicStr.overwrite(start, part.start, strs[index]);
                  return part.end;
                },
                sentence.start
              );

              magicStr.overwrite(
                lastPartEnd,
                sentence.end,
                strs[strs.length - 1]
              );
            } else {
              magicStr.overwrite(sentence.start, sentence.end, strs.join(""));
            }
            processed = true;
          },
          result,
          next: () => {},
          insert: (start, end, text, uniqueTaskId) => {
            if (uniqueTaskId) {
              if (taskMap[uniqueTaskId]) {
                return;
              }
              taskMap[uniqueTaskId] = true;
            }
            magicStr.appendLeft(start, text);
          },
        };

        plugin.defaultReplace(
          context,
          sentence,
          plugin.beforeSentenceReplace?.(context, sentence)
        );

        if (processed) {
          plugin.afterSentenceReplace?.(context, sentence);
        }
      });
    });

    if (returnPreview) {
      return magicStr.toString();
    }
  };
}
