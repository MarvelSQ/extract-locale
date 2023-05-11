import MagicString from "magic-string";
import { FileTask, LocaleTask, SentenceType } from "../type";
import { renderTemplate } from "../utils/template";

export function renderTasks(
  tasks: LocaleTask[],
  fileTasks: FileTask[],
  content: string
) {
  const magicStr = new MagicString(content);

  const taskMap = new Map<string, boolean>();

  tasks.forEach((task) => {
    const { match, localeKey, effects, postEffects, context: rawContext } = task;

    const context = {
      ...rawContext,
      localeKey,
    };
    [...effects, ...(postEffects || [])].forEach((effect) => {
      const { uniqueTaskId } = effect;

      if (uniqueTaskId) {
        if (taskMap.has(uniqueTaskId)) {
          return;
        }
        taskMap.set(uniqueTaskId, true);
      }

      const renderContext = {
        ...context,
        isJSXText: match.type === SentenceType.JSXText,
        isJSXAttributeText: match.type === SentenceType.JSXAttributeText,
        isLiteral: match.type === SentenceType.Literal,
        isTemplateLiteral: match.type === SentenceType.TemplateLiteral,
      };

      if (effect.type === "replace") {
        const { text } = effect;
        if (match.parts.length) {
          const partRandom = `------${Math.random()}-----`;
          const parts = `\\{ ${match.parts
            .map((e) => `${e.name}: ${partRandom}`)
            .join(", ")} \\}`;

          const rendered = renderTemplate(text, {
            ...renderContext,
            parts,
          });

          const splited = rendered.split(partRandom);

          splited.reduce((start, text, index) => {
            const part = match.parts[index];

            const end = part ? part.start : match.end;

            magicStr.overwrite(start, end, text);
            return part?.end;
          }, match.start);
        } else {
          magicStr.overwrite(
            match.start,
            match.end,
            renderTemplate(text, renderContext)
          );
        }
      } else if (effect.type === "insert") {
        magicStr.appendLeft(
          effect.start,
          renderTemplate(effect.text, renderContext)
        );
      }
    });
  });

  fileTasks.forEach(({ tasks }) => {
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
