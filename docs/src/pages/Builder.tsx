import BuildLog from "@/components/builder/BuildLog";
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
import { useToast } from "@/components/ui/use-toast";
import { useAllDictMap } from "@/filesystem/queries";
import { openDialog } from "@/lib/modal";
import { MoreHorizontal } from "lucide-react";

/**
 * parse duration to human readable string
 * @example 1000 -> 00:00:01:000
 */
function formateDuration(time: number) {
  const ms = time % 1000;
  const s = ((time - ms) / 1000) % 60;
  const m = ((time - ms - s * 1000) / 1000 / 60) % 60;
  const h = ((time - ms - s * 1000 - m * 1000 * 60) / 1000 / 60 / 60) % 24;
  const d =
    (time - ms - s * 1000 - m * 1000 * 60 - h * 1000 * 60 * 60) /
    1000 /
    60 /
    60 /
    24;
  return `${d ? `${d}:` : ""}${h < 10 ? `0${h}` : h}:${m < 10 ? `0${m}` : m}:${
    s < 10 ? `0${s}` : s
  }:${ms < 10 ? `00${ms}` : ms < 100 ? `0${ms}` : ms}`;
}

function Builder() {
  const works = useAllDictMap();

  const { toast } = useToast();

  return (
    <div className="container py-4 flex flex-col gap-4">
      <Button
        className="self-start"
        onClick={() =>
          openDialog(NewDictImport, {
            onConfirm(build) {
              openDialog(BuildLog, {
                record: build,
              });
              toast({
                description: `${build.repo} - ${build.entryModule} import success`,
              });
            },
          })
        }
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
            <TableHead className="text-right">Cost Time</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {works.data?.map((work) => (
            <TableRow
              key={`${work.repo}-${work.entryModule}-${work.timestamp}`}
              onClick={() => {
                openDialog(BuildLog, {
                  record: work,
                });
              }}
            >
              <TableCell className="font-medium">{work.repo}</TableCell>
              <TableCell className="font-medium">{work.entryModule}</TableCell>
              <TableCell className="font-medium">
                <div className="inline-block border rounded-full px-2 py-1 font-semibold text-foreground text-xs">
                  {work.status || "unknown"}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {new Date(work.timestamp).toISOString()}
              </TableCell>
              <TableCell className="text-right">
                {work.finishtime
                  ? formateDuration(work.finishtime - work.timestamp)
                  : "--"}
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
