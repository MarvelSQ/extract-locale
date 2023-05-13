import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { loadFiles, SimpleFile } from "@/Task/loadFiles";
import { Loader2 } from "lucide-react";

const demoFiles = loadFiles("demo");

function Files() {
  const [fileDesc, setFileDesc] = useState<{
    name: string;
    files: SimpleFile[];
  } | null>(null);

  useEffect(() => {
    demoFiles.then((desc) => setFileDesc(desc));
  }, []);

  return (
    <Table>
      <TableCaption>{fileDesc?.name}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fileDesc?.files.map((file) => (
          <TableRow key={file.path}>
            <TableCell className="font-medium">{file.path}</TableCell>
            <TableCell>
              <Loader2 className="animate-spin" />
            </TableCell>
            <TableCell className="text-right">
              <Loader2 className="animate-spin inline-block" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default Files;
