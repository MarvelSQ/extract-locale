import {
  ArrowDownWideNarrow,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Edit,
} from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import ReactIntlSVG from "../../../public/react-intl.svg";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Switch } from "../ui/switch";

function Detail() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Replace Task Detail</CardTitle>
        <CardDescription>detail of you task configuration</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Text Match</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="grid col-span-2 gap-2">
                <Label htmlFor="area">Matched Locale</Label>
                <div className="flex flex-row gap-4">
                  <Select defaultValue="chinese">
                    <SelectTrigger id="area" className="flex-grow">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chinese">🇨🇳 Chinese</SelectItem>
                      <SelectItem value="custom">
                        Custom Match (Regex{" "}
                        <span className="font-bold bg-muted">
                          /[\u4e00-\u9fa5]/
                        </span>
                        )
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="whitespace-nowrap" variant="secondary">
                        Add Custom Match
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Edit Custom Match</DialogTitle>
                        <DialogDescription>
                          you can use regexp or function to match text
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="type" className="text-right">
                            Match Type
                          </Label>
                          <Select id="type" defaultValue="regexp">
                            <SelectTrigger id="area" className="col-span-3">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="regexp">RegExp</SelectItem>
                              <SelectItem value="function">function</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="content" className="text-right">
                            Match Content
                          </Label>
                          <Textarea
                            id="content"
                            value="[\\u4e00-\\u9fa5]"
                            className="col-span-3"
                            rows={10}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit">Save Match</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="flex flex-row items-center">
                <Label className="flex-grow flex flex-col" htmlFor="ignoreLog">
                  <span>Ignore Log</span>
                  <span className="font-normal leading-snug text-muted-foreground">
                    ignore matched text inside{" "}
                    <span className="font-bold">console.log</span>
                  </span>
                </Label>
                <Switch defaultChecked={true} id="ignoreLog" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Label htmlFor="localeKeyPattern">Locale Key Pattern</Label>
        <Input defaultValue="LOCALE_KEY_{number}" />
        <p className="text-sm text-muted-foreground">
          pattern has holders:
          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
            number
          </code>{" "}
          for auto increment number
        </p>
        <Card>
          <CardHeader>
            <CardTitle>
              Plugin
              <ArrowDownWideNarrow className="ml-1 inline-block -rotate-90" />
            </CardTitle>
            <CardDescription>
              plugin will replace each text match by order, if text was handled,
              rest plugin won't be called
            </CardDescription>
          </CardHeader>
          <CardContent className="grid xl:grid-cols-3 lg:grid-cols-2 gap-2">
            <Card className="group">
              <CardHeader>
                <CardDescription className="flex flex-row items-center">
                  <img
                    className="h-4 w-4 mr-1 inline-block"
                    src={ReactIntlSVG}
                  />
                  React Intl formatMessage
                  <div className="flex flex-grow gap-2 justify-end">
                    <Edit className="hidden group-hover:inline-block h-6 w-6 p-1 cursor-pointer" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <ArrowRightFromLine className="inline-block h-6 w-6 p-1 cursor-pointer rounded-sm hover:bg-muted" />
                        </TooltipTrigger>
                        <TooltipContent>move plugin to next</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <span className="space-x-4 rounded-2xl p-2 bg-accent text-accent-foreground text-sm text-center">
                  <span>import {"{ formatMessage }"} from "react-intl"</span>
                </span>
              </CardContent>
            </Card>
            <Card className="group">
              <CardHeader>
                <CardDescription className="flex flex-row items-center">
                  <img
                    className="h-4 w-4 mr-1 inline-block"
                    src={ReactIntlSVG}
                  />
                  <span>
                    React Intl {"<"}FormattedMessage {"/>"}
                  </span>
                  <div className="flex flex-grow gap-2 justify-end">
                    <Edit className="hidden group-hover:inline-block h-6 w-6 p-1 cursor-pointer" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <ArrowLeftFromLine className="inline-block h-6 w-6 p-1 cursor-pointer rounded-sm hover:bg-muted" />
                        </TooltipTrigger>
                        <TooltipContent>move plugin to previous</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <ArrowRightFromLine className="inline-block h-6 w-6 p-1 cursor-pointer rounded-sm hover:bg-muted" />
                        </TooltipTrigger>
                        <TooltipContent>move plugin to next</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <span className="space-x-4 rounded-2xl p-2 bg-accent text-accent-foreground text-sm text-center">
                  <span>import {"{ FormattedMessage }"} from "react-intl"</span>
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription className="flex flex-row items-center">
                  <img
                    className="h-4 w-4 mr-1 inline-block"
                    src={ReactIntlSVG}
                  />
                  React Intl useIntl
                  <div className="flex flex-grow gap-2 justify-end">
                    <Edit className="hidden group-hover:inline-block h-6 w-6 p-1 cursor-pointer" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <ArrowLeftFromLine className="inline-block h-6 w-6 p-1 cursor-pointer rounded-sm hover:bg-muted" />
                        </TooltipTrigger>
                        <TooltipContent>move plugin to previous</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <span className="space-x-4 rounded-2xl p-2 bg-accent text-accent-foreground text-sm text-center">
                  <span>import {"{ useIntl }"} from "react-intl"</span>
                </span>
                <span className="space-x-4 rounded-2xl p-2 bg-accent text-accent-foreground text-sm text-center">
                  <span>const intl = useIntl()</span>
                </span>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}

export default Detail;
