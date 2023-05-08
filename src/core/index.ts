import { FileProcesser, Sentence, Plugin, ReplaceTask, Helper } from "../type";

import { Matcher } from "../matcher";
import { renderTasks } from "./render";

export function createReplacer({
  matcher,
  assignee,
  helpers,
  plugins,
}: {
  matcher: Matcher;
  assignee: {
    getLocaleKey: (text: string | string[], filePath: string) => string;
  };
  helpers: Record<string, (option: any) => Helper>;
  plugins: Plugin[];
}) {
  const finalPlugins = plugins.map((p) => {
    return {
      inject: p.inject.map(({ type, name, option }) => {
        return {
          name: name || type,
          helper: helpers[type](option),
        };
      }),
      template: (context: any, sentence: Sentence) => {
        if (typeof p.template === "string") {
          return p.template;
        }
        if (typeof p.template === "function") {
          return p.template(context, sentence);
        }
        if ("types" in p.template) {
          if (p.template.types.includes(sentence.type)) {
            const temp = p.template.template;
            return typeof temp === "function" ? temp(context, sentence) : temp;
          }
          return;
        }
        if (sentence.type in p.template) {
          const temp = p.template[sentence.type as keyof typeof p.template];
          return typeof temp === "function" ? temp(context, sentence) : temp;
        }
      },
    };
  });

  return (filepath: string, fileContent: string) => {
    const tasks: ReplaceTask[] = [];

    /**
     * allow helper to store some context
     */
    const fileContext = {};

    const matches = matcher.collect(filepath, fileContent);

    const sentences = matches.map((m) => {
      return {
        ...m,
        parts: m.parts.map((p, i) => ({
          ...p,
          name: `part${i + 1}`,
        })),
        localeKey: assignee.getLocaleKey(
          m.text || (m.texts as string[]),
          filepath
        ),
      } as Sentence;
    });

    const matchPlugins = finalPlugins.reduce(
      (acc, plugin) => {
        const context: Record<string, any> = {};

        for (const { helper, name } of plugin.inject) {
          const result = helper.parse(filepath, fileContent);

          if (!result.matched) {
            return acc;
          }

          context[name] = result;
        }

        return [
          ...acc,
          {
            inject: plugin.inject,
            result: context,
            template: plugin.template,
          },
        ];
      },
      [] as Array<{
        inject: {
          name: string;
          helper: Helper;
        }[];
        result: any;
        template: (context: any, sentence: Sentence) => string | undefined;
      }>
    );

    sentences.forEach((sentence) => {
      let processed = false;

      matchPlugins.forEach(({ inject, result, template }) => {
        if (processed) {
          return;
        }

        const task: ReplaceTask = {
          context: {},
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

        const tempContext = {
          ...context,
          ...result,
        };

        for (const { name, helper } of inject) {
          if (helper.beforeSentenceReplace) {
            const beforeContext = helper.beforeSentenceReplace?.(
              {
                ...tempContext,
                result: tempContext[name],
              },
              sentence
            );

            // cant replace
            if (!beforeContext) {
              return;
            }

            tempContext[name] = {
              ...tempContext[name],
              ...beforeContext,
            };
          }
        }

        const templateStr = template(tempContext, sentence);
        if (templateStr) {
          processed = true;

          context.replace([templateStr]);

          task.postEffects = [];

          inject.forEach(({ helper, name }) => {
            helper.afterSentenceReplace?.(
              {
                file: {
                  context: fileContext,
                },
                ...tempContext,
                result: tempContext[name],
              },
              sentence
            );
          });

          task.context = tempContext;

          tasks.push(task);
        }
      });
    });

    matchPlugins.forEach(({ inject, result }) => {
      inject.forEach(({ helper, name }) => {
        helper.postFile?.({
          file: {
            context: fileContext,
          },
          push(task: any) {
            tasks.push(task);
          },
        });
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
