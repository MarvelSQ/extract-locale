import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, MoreHorizontal } from "lucide-react";
import React from "react";

function Builder() {
  const works = [
    {
      repo: "demo",
      entryModule: "src/index.tsx",
      status: "pending",
      results: undefined,
      createTime: new Date().getTime(),
    },
  ];

  return (
    <div className="container py-4 flex flex-col gap-4">
      <Button className="self-start">New Work</Button>
      <Table>
        <TableCaption>Build Works</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Repo</TableHead>
            <TableHead className="w-[200px]">Entry Module</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {works.map((work) => (
            <TableRow key={`${work.repo}-${work.entryModule}`}>
              <TableCell className="font-medium">{work.repo}</TableCell>
              <TableCell className="font-medium">{work.entryModule}</TableCell>
              <TableCell className="font-medium">
                {work.status === "pending" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  work.status
                )}
              </TableCell>
              <TableCell className="text-right">
                <MoreHorizontal className="inline-block cursor-pointer w-4 h-4" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default Builder;
