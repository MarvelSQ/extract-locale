import { NewDictImport } from "@/components/task/dictmap-dialog";
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
import { useAllDictMap } from "@/filesystem/queries";
import { openDialog } from "@/lib/modal";
import { MoreHorizontal } from "lucide-react";

function Builder() {
  const works = useAllDictMap();

  return (
    <div className="container py-4 flex flex-col gap-4">
      <Button
        className="self-start"
        onClick={() => openDialog(NewDictImport, {})}
      >
        New Work
      </Button>
      <Table>
        <TableCaption>Build Works</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Repo</TableHead>
            <TableHead className="w-[250px]">Entry Module</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Create Time</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {works.data?.map((work) => (
            <TableRow
              key={`${work.repo}-${work.entryModule}-${work.timestamp}`}
            >
              <TableCell className="font-medium">{work.repo}</TableCell>
              <TableCell className="font-medium">{work.entryModule}</TableCell>
              <TableCell className="font-medium">
                <div className="inline-block border rounded-full px-2 py-1 font-semibold text-foreground text-xs">
                  unknown
                </div>
              </TableCell>
              <TableCell className="text-right">
                {new Date(work.timestamp).toISOString()}
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
