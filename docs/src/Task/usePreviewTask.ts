import { useMemo } from "react";
import { Effection, FileTask, LocaleTask, TextMatch } from "../../../src/type";

export function usePreviewTask(
  fileTask:
    | {
        tasks: LocaleTask[];
        fileTasks: FileTask[];
        toString(alterdTasks?: LocaleTask[]): string;
      }
    | {
        error: any;
      }
    | undefined
) {
  const taskAdjust = useMemo(() => {
    if (!fileTask) return;
    if ("tasks" in fileTask) {
      const allbasetask: (Effection & {
        match?: TextMatch;
      })[] = fileTask.tasks.flatMap((task) => [
        ...task.effects.map((effect) => ({
          ...effect,
          match: task.match,
        })),
        ...(task.postEffects || []),
      ]);

      allbasetask.push(...fileTask.fileTasks.flatMap((task) => task.tasks));

      allbasetask.sort((a, b) => a.start - b.start);

      let offset = 0;

      const taskIdMap = new Map<string, number>();
      const matchNextPosition = new Map<number, number>();

      allbasetask.forEach((task) => {
        if (task.uniqueTaskId) {
          if (taskIdMap.has(task.uniqueTaskId)) {
            return;
          }
          taskIdMap.set(task.uniqueTaskId, task.start);
        }
        let currentOffset = offset;
        if (task.match && matchNextPosition.has(task.match.start)) {
          matchNextPosition.set(task.match.start, currentOffset);
        }
        if (task.type === "insert") {
          offset += task.text.length;
        } else if (task.type === "replace") {
          offset += task.text.length - task.end + task.start;
        }
      });

      return matchNextPosition;
    }
  }, [fileTask]);

  return taskAdjust;
}
