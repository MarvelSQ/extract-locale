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
import { useFiles } from "@/filesystem/queries";

const demoFiles = loadFiles("demo");

function Files({ repo }: { repo: string }) {
  const files = useFiles(repo);

  return (
    <Table>
      <TableCaption>{repo}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.data?.map((file) => (
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
