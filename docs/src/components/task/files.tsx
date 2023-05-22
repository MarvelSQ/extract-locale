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

function Files({
  repo,
  onFileClick,
}: {
  repo: string;
  onFileClick: (file: string) => void;
}) {
  const tasks = useFileTasks(repo);

  return (
    <Table>
      <TableCaption>{repo}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">name</TableHead>
          <TableHead className="text-right">Text Match Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.data?.map((file) => (
          <TableRow key={file.path} onClick={() => onFileClick(file.path)}>
            <TableCell className="font-medium">{file.path}</TableCell>
            <TableCell className="text-right">
              {"tasks" in file.result && file.result.tasks.length}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default Files;
