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
    }

    return [...task.effects, ...(task.postEffects || [])];
  });

  effections.push(...fileTasks.flatMap((task) => task.tasks));

  effections.sort((a, b) => a.start - b.start);

  const taskIdMap = new Map<string, Effection>();

  const effectionMapOffset = new Map<Effection, number>();

  const renderedTaskIds: string[] = [];

  effections.forEach((effection) => {
    if (effection.uniqueTaskId) {
      if (taskIdMap.has(effection.uniqueTaskId)) {
        const lastEffection = taskIdMap.get(effection.uniqueTaskId);
        effectionMapOffset.set(
          effection,
          effectionMapOffset.get(lastEffection as Effection) as number
        );
        if (renderedTaskIds.includes(effection.uniqueTaskId)) {
          return;
        }
      } else {
        taskIdMap.set(effection.uniqueTaskId, effection);
      }
    }
    effectionMapOffset.set(effection, currentOffset);

    if (ignoredEffections.includes(effection)) return;

    if (effection.uniqueTaskId) {
      renderedTaskIds.push(effection.uniqueTaskId);
    }

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
      ...task.effects.map((effect) => {
        const { text, start } = effect;

        const isIgnored = ignoredEffections.includes(effect);

        const offset = effectionMapOffset.get(effect) as number;

        const end = isIgnored
          ? effect.end + offset
          : start + text.length + offset;

        return end;
      })
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
