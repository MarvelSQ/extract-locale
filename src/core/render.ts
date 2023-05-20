import MagicString from "magic-string";
import { Effection, FileTask, LocaleTask, SentenceType } from "../type";
import { renderTemplate } from "../utils/template";

function renderTask(task: LocaleTask) {
  const { match, localeKey, effects, postEffects, context: rawContext } = task;

  const context = {
    ...rawContext,
    localeKey,
  };

  const renderContext = {
    ...context,
    isJSXText: match.type === SentenceType.JSXText,
    isJSXAttributeText: match.type === SentenceType.JSXAttributeText,
    isLiteral: match.type === SentenceType.Literal,
    isTemplateLiteral: match.type === SentenceType.TemplateLiteral,
  };

  const partRandom = `------${Math.random()}-----`;
  const parts = `\\{ ${match.parts
    .map((e) => `${e.name}: ${partRandom}`)
    .join(", ")} \\}`;

  function renderEffect(effect: Effection): Effection[] {
    const { text, type } = effect;

    const rendered = renderTemplate(text, {
      ...renderContext,
      parts: match.parts.length ? parts : "",
    });

    if (type === "insert") {
      return [
        {
          ...effect,
          text: rendered,
        },
      ];
    }

    const splited = rendered.split(partRandom);

    let lastStart = match.start;

    return splited.map((value, index) => {
      const part = match.parts[index];

      const currentStart = lastStart;

      lastStart = part?.end;

      const end = part ? part.start : match.end;

      return {
        uniqueTaskId:
          splited.length > 1
            ? `${effect.uniqueTaskId}-${index}`
            : effect.uniqueTaskId,
        start: currentStart,
        end,
        type: "replace",
        text: value,
      };
    });
  }

  return {
    ...task,
    effects: effects.flatMap(renderEffect),
    postEffects: postEffects?.flatMap(renderEffect),
  };
}

/**
 * replace holder with real value
 * this opration will change the task effects
 * @example replace('a{parts}b') will change to [repalce('a, value:{part1:'), replace('}, b')]
 */
export function getRenderedTasks(tasks: LocaleTask[], fileTasks: FileTask[]) {
  return {
    tasks: tasks.map(renderTask) as LocaleTask[],
    fileTasks,
  };
}

export function renderTasks(
  tasks: LocaleTask[],
  fileTasks: FileTask[],
  content: string
) {
  const magicStr = new MagicString(content);

  const taskMap = new Map<string, boolean>();

  const { tasks: renderedTask, fileTasks: renderedFileTask } = getRenderedTasks(
    tasks,
    fileTasks
  );

  renderedTask.forEach((task) => {
    [...task.effects, ...(task.postEffects || [])].forEach((effect) => {
      if (effect.uniqueTaskId) {
        if (taskMap.has(effect.uniqueTaskId)) {
          return;
        }
        taskMap.set(effect.uniqueTaskId, true);
      }

      if (effect.type === "replace") {
        const { start, end, text } = effect;
        magicStr.overwrite(start, end, text);
      } else if (effect.type === "insert") {
        const { start, text } = effect;
        magicStr.appendLeft(start, text);
      }
    });
  });

  renderedFileTask.forEach(({ tasks }) => {
    tasks.forEach((task) => {
      if (task.type === "replace") {
        const { start, end, text } = task;
        magicStr.overwrite(start, end, text);
      } else if (task.type === "insert") {
        const { start, text } = task;
        magicStr.appendLeft(start, text);
      }
    });
  });

  return magicStr.toString();
}
