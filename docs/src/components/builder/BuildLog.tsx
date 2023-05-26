import {
  BuildRecord,
  useImportDictBuild,
  useImportDictBuildLog,
} from "@/filesystem/queries";
import { ScrollArea } from "../ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useLayoutEffect, useRef } from "react";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";

function LogItem({
  message,
  isLast,
}: {
  message: {
    type: string;
    message: string | string[];
  };
  isLast: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isLast) ref.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div ref={ref} className="flex flex-row gap-2">
      <div className="inline-block border rounded-full px-2 py-1 font-semibold text-foreground text-xs flex-shrink self-start">
        {message.type}
      </div>
      <div className="flex-grow overflow-hidden break-all">
        {message.message}
      </div>
    </div>
  );
}

function BuildLog({
  open,
  onClose,
  record,
}: {
  open: boolean;
  onClose: () => void;
  record: BuildRecord;
}) {
  const latestBuild = useImportDictBuild(
    record.repo,
    record.entryModule,
    record.timestamp
  );

  const log = useImportDictBuildLog(latestBuild.data);

  return (
    <Sheet
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent size="content" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>
            {record.repo}-{record.entryModule}-
            {new Date(record.timestamp).toISOString()}
          </SheetTitle>
          <SheetDescription>showing record of build</SheetDescription>
        </SheetHeader>
        <Tabs
          defaultValue={record.finishtime || record.result ? "result" : "log"}
          className="w-[1000px] flex-grow overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="log" className="flex gap-2 items-center">
              Log {!!log.data?.length && <Badge>{log.data.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="result">Result</TabsTrigger>
          </TabsList>
          <TabsContent
            value="log"
            className="data-[state=active]:flex-grow overflow-hidden flex flex-col"
          >
            <div className="flex-grow overflow-hidden w-[1000px]">
              <ScrollArea className="h-full w-[1000px]">
                <div className="flex flex-col gap-2">
                  {log.data?.map((message, i) => (
                    <LogItem
                      message={message}
                      isLast={i === log.data.length - 1}
                      key={i}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
          <TabsContent
            value="result"
            className="data-[state=active]:flex-grow flex flex-col gap-2"
          >
            <Textarea
              className="flex-grow"
              value={
                latestBuild.data?.result
                  ? JSON.stringify(latestBuild.data.result, null, 2)
                  : "null"
              }
              readOnly
            />
            <div className="flex flex-row gap-4">
              <div className="text-muted-foreground">
                preprocess
                <br />
                (javascript)
              </div>
              <Textarea
                className="h-24 text-sm"
                placeholder={`/**
 * @param {{ default: { zh_CN: Record<string, string> } }}
 */
result => result.default.zh_CN`}
              />
            </div>
            <div className="text-muted-foreground text-sm">
              convert result to dict format
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

export default BuildLog;
