import {
  Plugin,
  FileTask,
  HelperResult,
  LocaleTask,
  FileHandle,
  TextMatch,
} from "../type";

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
  helpers: Record<string, (option: any) => HelperResult<any>>;
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
      template: (context: any, sentence: TextMatch) => {
        if (typeof p.template === "string") {
          return p.template;
        }
        if (typeof p.template === "function") {
          return p.template(context, sentence);
        }
        if ("types" in p.template && Array.isArray(p.template.types)) {
          if (p.template.types.includes(sentence.type)) {
            const temp = p.template.template;
            return typeof temp === "function" ? temp(context, sentence) : temp;
          }
          return;
        }
        if (sentence.type in p.template) {
          const temp = p.template[sentence.type as keyof typeof p.template];
          return typeof temp === "function"
            ? temp(context, sentence)
            : (temp as string);
        }
      },
    };
  });

  return (filepath: string, fileContent: string) => {
    const tasks: LocaleTask[] = [];

    /**
     * allow helper to store some context
     */
    const fileContext: Record<string, any> = {};

    const matches = matcher.collect(filepath, fileContent);

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
      [] as {
        inject: {
          name: string;
          helper: HelperResult<any>;
        }[];
        result: any;
        template: (context: any, sentence: TextMatch) => string | undefined;
      }[]
    );

    matches.forEach((sentence) => {
      let processed = false;

      matchPlugins.forEach(({ inject, result, template }) => {
        if (processed) {
          return;
        }

        const task: LocaleTask = {
          match: sentence,
          localeKey: assignee.getLocaleKey(sentence.text, filepath),
          context: {},
          extra: {},
          effects: [],
          postEffects: null,
        };

        const handle: FileHandle = {
          replace: (start, end, text, uniqueTaskId) => {
            const effection = {
              type: "replace" as "replace",
              start,
              end,
              text,
              uniqueTaskId,
            };
            if (task.postEffects) {
              task.postEffects.push(effection);
            } else {
              task.effects.push(effection);
            }
          },
          insert: (start, end, text, uniqueTaskId) => {
            const effection = {
              type: "insert" as "insert",
              start,
              end,
              text,
              uniqueTaskId,
            };
            if (task.postEffects) {
              task.postEffects.push(effection);
            } else {
              task.effects.push(effection);
            }
          },
        };

        const tempContext = {
          fileContext,
          ...handle,
          context: {
            ...result,
          },
        };

        for (const { name, helper } of inject) {
          if (helper.beforeSentenceReplace) {
            const beforeContext = helper.beforeSentenceReplace?.(
              {
                ...tempContext,
                result: tempContext.context[name],
              },
              sentence
            );

            // cant replace
            if (!beforeContext) {
              return;
            }

            tempContext.context[name] = {
              ...tempContext.context[name],
              ...beforeContext,
            };
          }
        }

        const templateStr = template(tempContext, sentence);
        if (templateStr) {
          processed = true;

          handle.replace(sentence.start, sentence.end, templateStr);

          task.postEffects = [];

          inject.forEach(({ helper, name }) => {
            helper.afterSentenceReplace?.(
              {
                ...tempContext,
                result: tempContext.context[name],
              },
              sentence
            );
          });

          task.context = tempContext.context;

          tasks.push(task);
        }
      });
    });

    const fileTasks: FileTask[] = [];

    matchPlugins.forEach(({ inject, result }) => {
      inject.forEach(({ helper, name }) => {
        helper.postFile?.({
          fileContext,
          push(task: any) {
            fileTasks.push(task);
          },
        });
      });
    });

    return {
      tasks,
      fileTasks,
      toString(alterdTasks: LocaleTask[] = tasks) {
        return renderTasks(alterdTasks, fileTasks, fileContent);
      },
    };
  };
}
