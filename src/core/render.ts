import MagicString from "magic-string";
import { ReplaceTask } from "../type";

export function renderTasks(tasks: ReplaceTask[], content: string) {
  const magicStr = new MagicString(content);

  const taskMap = new Map<string, boolean>();

  tasks.forEach((task) => {
    const { sentence, effects, postEffects } = task;
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
          const lastPartEnd = sentence.parts.reduce((start, part, index) => {
            magicStr.overwrite(start, part.start, texts[index]);
            return part.end;
          }, sentence.start);

          magicStr.overwrite(
            lastPartEnd,
            sentence.end,
            texts[texts.length - 1]
          );
        } else {
          magicStr.overwrite(sentence.start, sentence.end, texts.join(""));
        }
      } else if (effect.type === "insert") {
        magicStr.appendLeft(effect.start, effect.text);
      }
    });
  });

  return magicStr.toString();
}
