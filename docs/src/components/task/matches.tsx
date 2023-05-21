import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useFileTasks } from "@/filesystem/queries";
import { LocaleTask } from "../../../../src/type";

function Matches({
  repo,
  onFileClick,
}: {
  repo: string;
  onFileClick: (file: string, start: number) => void;
}) {
  const fileTasks = useFileTasks(repo);

  const matches = useMemo(() => {
    if (!fileTasks.data) return [];

    type TextCell = {
      textId: string;
      match: LocaleTask["match"];
      files: {
        path: string;
        start: number;
      }[];
    };

    const textMap: Record<string, TextCell> = {};

    const texts: TextCell[] = [];

    fileTasks.data.forEach((file) => {
      if ("tasks" in file.result) {
        file.result.tasks.forEach((task) => {
          const textId = Array.isArray(task.match.text)
            ? task.match.text.join('"[]"')
            : task.match.text;
          if (!(textId in textMap)) {
            textMap[textId] = {
              textId,
              match: task.match,
              files: [],
            };
            texts.push(textMap[textId]);
          }

          textMap[textId].files.push({
            path: file.path,
            start: task.match.start,
          });
        });
      }
    });

    return texts;
  }, [fileTasks.data]);

  return (
    <Table>
      <TableCaption>{repo}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Text Match</TableHead>
          <TableHead className="text-right">files</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {matches.map((text) => (
          <TableRow key={text.textId}>
            <TableCell className="font-medium">{text.textId}</TableCell>
            <TableCell className="text-right">
              {text.files.map((file) => {
                return (
                  <div
                    key={file.path}
                    className="cursor-pointer hover:underline"
                    onClick={() => onFileClick(file.path, file.start)}
                  >
                    {file.path}:{file.start}
                  </div>
                );
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default Matches;
