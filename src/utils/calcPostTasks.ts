import { createReplacer } from "../core";
import { getRenderedTasks } from "../core/render";
import { LocaleTask } from "../type";
import { Effection } from "../type";

export function calcPostTasks(
  result: ReturnType<ReturnType<typeof createReplacer>>,
  options?: {
    ignore?: (localeTask: LocaleTask) => boolean;
  }
) {
  let currentOffset = 0;

  const ignoredEffections: Effection[] = [];

  const { tasks, fileTasks } = getRenderedTasks(result.tasks, result.fileTasks);

  const effections = tasks.flatMap((task) => {
    if (options?.ignore && options.ignore(task)) {
      ignoredEffections.push(...task.effects, ...(task.postEffects || []));
      return [];
    }

    return [...task.effects, ...(task.postEffects || [])];
  });

  effections.push(...fileTasks.flatMap((task) => task.tasks));

  effections.sort((a, b) => a.start - b.start);

  const taskIdMap = new Map<string, Effection>();

  const effectionMapOffset = new Map<Effection, number>();

  effections.forEach((effection) => {
    if (effection.uniqueTaskId) {
      if (taskIdMap.has(effection.uniqueTaskId)) {
        effectionMapOffset.set(
          effection,
          effectionMapOffset.get(effection) as number
        );
        return;
      }
      taskIdMap.set(effection.uniqueTaskId, effection);
    }
    effectionMapOffset.set(effection, currentOffset);

    if (ignoredEffections.includes(effection)) return;

    if (effection.type === "insert") {
      currentOffset += effection.text.length;
    } else if (effection.type === "replace") {
      currentOffset += effection.text.length - effection.end + effection.start;
    }
  });

  const matches = tasks.map((task) => {
    const postStart = Math.min(
      ...task.effects.map(
        (effect) => effect.start + (effectionMapOffset.get(effect) as number)
      )
    );

    const postEnd = Math.max(
      ...task.effects.map(
        (effect) => effect.end + (effectionMapOffset.get(effect) as number)
      )
    );

    return {
      ...task,
      postMatch: {
        start: postStart,
        end: postEnd,
      },
    };
  });

  return {
    matches,
  };
}
