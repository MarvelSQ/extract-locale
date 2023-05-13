import Detail from "@/components/task/detail";
import Files from "@/components/task/files";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs } from "@/components/ui/tabs";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { BellRing, Check, Folder, FolderPlus, PlusSquare } from "lucide-react";
import Preview from "./preview";
import { useNavigate, useParams } from "react-router-dom";

const tags = Array.from({ length: 50 }).map(
  (_, i, a) => `v1.2.0-beta.${a.length - i}`
);

const notifications = [
  {
    title: "Your call has been confirmed.",
    description: "1 hour ago",
  },
  {
    title: "You have a new message!",
    description: "1 hour ago",
  },
  {
    title: "Your subscription is expiring soon!",
    description: "2 hours ago",
  },
];

type CardProps = React.ComponentProps<typeof Card>;

export function Task() {
  const match = useParams();
  const navigate = useNavigate();

  return (
    <div className="flex-grow flex flex-row">
      <div className="basis-60 border-r">
        <div className="sticky top-14 p-4 flex flex-col gap-y-2">
          <Button
            variant="secondary"
            className="whitespace-nowrap justify-start"
          >
            <Folder className="mr-2 h-4 w-4" />
            Demo
          </Button>
          <Button
            variant="secondary"
            className="whitespace-nowrap justify-start"
          >
            <Folder className="mr-2 h-4 w-4" />
            HOA-FE-HEATMAP
          </Button>
          <Button className="whitespace-nowrap justify-start">
            <Folder className="mr-2 h-4 w-4" />
            HOA-FE-HEATMAP
          </Button>
          <Button
            variant="secondary"
            className="whitespace-nowrap justify-start"
          >
            <Folder className="mr-2 h-4 w-4" />
            HOA-FE-HEATMAP
          </Button>
          <Button variant="ghost">
            <FolderPlus className="mr-2 h-4 w-4" /> Add Repo
          </Button>
        </div>
      </div>
      <div className="container flex flex-col items-start py-8">
        <Tabs
          defaultValue={match.type}
          onValueChange={(event) => {
            navigate(`/task/${event}`);
          }}
          className="flex flex-col self-stretch"
        >
          <TabsList className="grid grid-cols-3 w-[300px]">
            <TabsTrigger value="detail">Detail</TabsTrigger>
            <TabsTrigger value="files">File List</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent className="self-stretch" value="detail">
            <Detail />
          </TabsContent>
          <TabsContent value="files">
            <Files />
          </TabsContent>
          <TabsContent value="preview">
            <Preview />
          </TabsContent>
        </Tabs>
        {/* <div className="flex flex-row gap-8 items-stretch">
          <Card className={cn("w-[380px]")}>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>You have 3 unread messages.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className=" flex items-center space-x-4 rounded-md border p-4">
                <BellRing />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Push Notifications
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Send notifications to device.
                  </p>
                </div>
                <Switch />
              </div>
              <div>
                {notifications.map((notification, index) => (
                  <div
                    key={index}
                    className="mb-4 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
                  >
                    <span className="flex h-2 w-2 translate-y-1 rounded-full bg-sky-500" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {notification.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <Check className="mr-2 h-4 w-4" /> Mark all as read
              </Button>
            </CardFooter>
          </Card>
          <Card className={cn("w-[380px]", "flex items-center justify-center")}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Button>
                    <PlusSquare />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add New Pattern</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Card>
        </div> */}
      </div>
    </div>
  );
}
