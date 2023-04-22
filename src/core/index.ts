import { FileProcesser, Sentence, Plugin, ReplaceTask } from "../type";

import { Matcher } from "../matcher";
import { renderTasks } from "./render";

export function createReplacer({
  matcher,
  assignee,
  plugins,
}: {
  matcher: Matcher;
  assignee: {
    getLocaleKey: (text: string | string[]) => string;
  };
  plugins: Plugin[];
}) {
  return (filepath: string, fileContent: string) => {
    const tasks: ReplaceTask[] = [];

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

    sentences.forEach((sentence) => {
      let processed = false;

      matchPlugins.forEach(({ plugin, result }) => {
        if (processed) {
          return;
        }

        const task: ReplaceTask = {
          sentence,
          effects: [],
          postEffects: null,
        };

        const context: FileProcesser<any> = {
          replace: (strs, uniqueTaskId) => {
            if (task.postEffects) {
              task.postEffects.push({
                type: "replace",
                texts: strs,
                uniqueTaskId,
              });
            } else {
              task.effects.push({
                type: "replace",
                texts: strs,
                uniqueTaskId,
              });
            }
            processed = true;
          },
          result,
          next: () => {},
          insert: (start, end, text, uniqueTaskId) => {
            if (task.postEffects) {
              task.postEffects.push({
                type: "insert",
                start,
                end,
                text,
                uniqueTaskId,
              });
            } else {
              task.effects.push({
                type: "insert",
                start,
                end,
                text,
                uniqueTaskId,
              });
            }
          },
        };

        plugin.defaultReplace(
          context,
          sentence,
          plugin.beforeSentenceReplace?.(context, sentence)
        );

        if (processed) {
          // 设置 postEffects
          task.postEffects = [];
          plugin.afterSentenceReplace?.(context, sentence);

          tasks.push(task);
        }
      });
    });

    return {
      tasks,
      toString() {
        return renderTasks(tasks, fileContent);
      },
    };
  };
}
