import MagicString from "magic-string";
import { ReplaceTask, SentenceType } from "../type";
import { renderTemplate } from "../utils/template";

export function renderTasks(tasks: ReplaceTask[], content: string) {
  const magicStr = new MagicString(content);

  const taskMap = new Map<string, boolean>();

  tasks.forEach((task) => {
    const { sentence, effects, postEffects, context: rawContext } = task;

    const context = {
      ...rawContext,
      localeKey: sentence.localeKey,
    };
    [...effects, ...(postEffects || [])].forEach((effect) => {
      const { uniqueTaskId } = effect;

      if (uniqueTaskId) {
        if (taskMap.has(uniqueTaskId)) {
          return;
        }
        taskMap.set(uniqueTaskId, true);
      }

      if (effect.type === "replace") {
        const { texts } = effect;
        if (sentence.parts.length) {
          if (texts.length === 1) {
            const partRandom = `------${Math.random()}-----`;
            const parts = `\\{ ${sentence.parts
              .map((e) => `${e.name}: ${partRandom}`)
              .join(", ")} \\}`;

            const rendered = renderTemplate(texts[0], {
              ...context,
              isJSXText: sentence.type === SentenceType.JSXText,
              isJSXAttributeText:
                sentence.type === SentenceType.JSXAttributeText,
              isLiteral: sentence.type === SentenceType.Literal,
              isTemplateLiteral: sentence.type === SentenceType.TemplateLiteral,
              parts,
            });

            const splited = rendered.split(partRandom);

            splited.reduce((start, text, index) => {
              const part = sentence.parts[index];

              const end = part ? part.start : sentence.end;

              magicStr.overwrite(start, end, text);
              return part?.end;
            }, sentence.start);
          } else {
            const lastPartEnd = sentence.parts.reduce((start, part, index) => {
              magicStr.overwrite(
                start,
                part.start,
                renderTemplate(texts[index], context)
              );
              return part.end;
            }, sentence.start);

            magicStr.overwrite(
              lastPartEnd,
              sentence.end,
              renderTemplate(texts[texts.length - 1], context)
            );
          }
        } else {
          magicStr.overwrite(
            sentence.start,
            sentence.end,
            renderTemplate(texts.join(""), context)
          );
        }
      } else if (effect.type === "insert") {
        magicStr.appendLeft(effect.start, renderTemplate(effect.text, context));
      }
    });
  });

  return magicStr.toString();
}
