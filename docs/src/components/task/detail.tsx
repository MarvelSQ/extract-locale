import { openDialog } from "@/lib/modal";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import _ from "lodash";
import {
  ArrowDownWideNarrow,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Edit,
  Trash,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { DefaultSettings } from "../../../../src/preset/react";
import { SentenceType, Template } from "../../../../src/type";
import ReactIntlSVG from "../../../public/react-intl.svg";
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
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "../ui/form";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const { plugins } = DefaultSettings;

type PluginType = {
  name: string;
  inject: {
    type: string;
    name?: string;
    option: any;
  }[];
  template: Template;
};

function PluginDialog({
  open,
  onClose,
  plugin: pluginProps,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  plugin: PluginType;
  onChange: (plugin: PluginType) => void;
}) {
  const [plugin, setPlugin] = useState(pluginProps);

  const { types, pattern } = useMemo(() => {
    if (typeof plugin.template === "string") {
      return {
        types: [],
        pattern: plugin.template,
      };
    }

    if (typeof plugin.template === "function") {
      return {
        types: [],
        pattern: plugin.template.toString(),
      };
    }

    if ("types" in plugin.template) {
      return {
        types: plugin.template.types as string[],
        pattern: (plugin.template.template as any).toString(),
      };
    }

    const types = Object.keys(plugin.template);

    return {
      types,
      pattern: plugin.template[types[0]],
    };
  }, [plugin.template]);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Plugin</DialogTitle>
          <DialogDescription>
            plugin configuration is object will matchType, inject and tempalte
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="plugin-name">Name</Label>
          <Input
            id="plugin-name"
            placeholder="for task identify"
            value={plugin.name}
            onChange={(e) => {
              setPlugin({
                ...plugin,
                name: e.target.value,
              });
            }}
          />
          <Label htmlFor="plugin-matchType">Text Match Type</Label>
          <Select
            id="plugin-matchType"
            defaultValue="regexp"
            value={types.length === 0 ? "all" : types[0]}
          >
            <SelectTrigger id="area" className="col-span-3">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="literal">String Literal</SelectItem>
              <SelectItem value="template">Template Literal</SelectItem>
              <SelectItem value="jsx">JSXText</SelectItem>
            </SelectContent>
          </Select>
          <Label htmlFor="plugin-inject">Injects</Label>
          <div className="flex flex-col gap-2">
            {plugin.inject.map((inject, index) => {
              return (
                <div
                  key={`${inject.type}-${index}`}
                  className="flex flex-row items-center gap-2 justify-between"
                >
                  <div className="flex flex-row items-center gap-2  rounded-md bg-accent px-2 py-1">
                    <Badge>source</Badge>
                    <span>
                      {inject.type === "source" &&
                        `import { ${inject.option.name} } from '${inject.option.importSource}'`}
                    </span>
                  </div>
                  <Trash className="h-4 w-4 cursor-pointer" />
                </div>
              );
            })}
            <div className="flex flex-row gap-2 items-center">
              <Select>
                <SelectTrigger id="area" className="flex-grow-0 w-auto">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="source">Source</SelectItem>
                  <SelectItem value="hook">Hook</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="import { formatMessage } from 'react-intl'" />
              <Button className="flex-shrink-0" size="sm">
                Add
              </Button>
            </div>
            <Label htmlFor="plugin-template">Template</Label>
            <Textarea
              id="plugin-template"
              rows={10}
              placeholder={`<FormattedMessage id="LOCALE_KEY" defaultMessage="default message" />`}
              value={pattern}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={() => {
              onChange(plugin);
              onClose();
            }}
          >
            Save Plugin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PluginField({
  icon,
  isFirst,
  index,
  isLast,
  plugin,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  icon?: string;
  isFirst: boolean;
  index: number;
  isLast: boolean;
  plugin: PluginType;
  onChange: (plugin: PluginType) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const { types, pattern } = useMemo(() => {
    if (typeof plugin.template === "string") {
      return {
        types: [],
        pattern: plugin.template,
      };
    }

    if (typeof plugin.template === "function") {
      return {
        types: [],
        pattern: plugin.template.toString(),
      };
    }

    if ("types" in plugin.template) {
      return {
        types: plugin.template.types as string[],
        pattern: (plugin.template.template as any).toString(),
      };
    }

    const types = Object.keys(plugin.template);

    return {
      types,
      pattern: plugin.template[types[0]],
    };
  }, [plugin.template]);

  return (
    <Card className="group">
      <CardHeader>
        <CardTitle className="flex flex-row items-center">
          {icon && <img className="h-4 w-4 mr-1 inline-block" src={icon} />}
          {plugin.name}
          <span className="flex flex-grow gap-2 justify-end">
            <Edit
              className="hidden group-hover:inline-block h-6 w-6 p-1 cursor-pointer"
              onClick={() => {
                openDialog(PluginDialog, {
                  plugin,
                  onChange,
                });
              }}
            />
            {!isFirst && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <ArrowLeftFromLine
                      className="inline-block h-6 w-6 p-1 cursor-pointer rounded-sm hover:bg-muted"
                      onClick={onMoveUp}
                    />
                  </TooltipTrigger>
                  <TooltipContent>move plugin to previous</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {!isLast && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <ArrowRightFromLine
                      className="inline-block h-6 w-6 p-1 cursor-pointer rounded-sm hover:bg-muted"
                      onClick={onMoveDown}
                    />
                  </TooltipTrigger>
                  <TooltipContent>move plugin to next</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </span>
        </CardTitle>
        <CardDescription className="whitespace-nowrap overflow-hidden text-ellipsis">
          {pattern}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge>{types?.length === 0 ? "ALL" : types}</Badge>
            </TooltipTrigger>
            <TooltipContent>replace all matched text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {plugin.inject.map((inject, index) => {
          const { type, option } = inject;
          const content =
            type === "source"
              ? `import ${option.name} from "${option.importSource}"`
              : `${option.name}()`;
          return (
            <span
              key={`${type}-${index}`}
              className="space-x-4 rounded-2xl p-2 bg-accent text-accent-foreground text-sm text-center"
            >
              {content}
            </span>
          );
        })}
      </CardContent>
    </Card>
  );
}

function MatchField({
  value,
  onChange,
}: {
  value: {
    type: "preset" | "regexp" | "function";
    value: string;
  };
  onChange: (value: {
    type: "preset" | "regexp" | "function";
    value: string;
  }) => void;
}) {
  const memoValues = useRef([] as (typeof value)[]);

  useMemo(() => {
    if (value.type && value.type !== "preset") {
      const regIndex = memoValues.current.findIndex(
        (v) => v.type === value.type
      );

      if (regIndex === -1) {
        memoValues.current.push(value);
      } else {
        memoValues.current[regIndex] = value;
      }
    }
  }, [value]);

  const [open, setOpen] = useState(false);

  const [modalValue, setModalValue] = useState<typeof value>({
    type: "regexp",
    value: "",
  });

  return (
    <div className="flex flex-row gap-4">
      <Select
        value={`${value.type}-${value.value}`}
        onValueChange={(desc) => {
          const [, type, value] =
            desc.match(/^(preset|regexp|function)-(.+)$/) || [];

          if (type && value) {
            onChange({
              type: type as any,
              value,
            });
          }
        }}
      >
        <SelectTrigger id="area" className="flex-grow">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="preset-chinese">🇨🇳 Chinese</SelectItem>
          {memoValues.current.map((v) => {
            return (
              <SelectItem
                key={`${v.type}-${v.value}`}
                value={`${v.type}-${v.value}`}
              >
                Custom Match ({v.type === "regexp" ? "RegExp" : "Function"}{" "}
                <span className="font-bold bg-muted">
                  {v.type === "regexp" ? `/${v.value}/` : v.value}
                </span>
                )
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <Dialog
        open={open}
        onOpenChange={(open) => {
          setOpen(open);
        }}
      >
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
              <Label className="text-right">Match Type</Label>
              <Select
                value={modalValue.type}
                onValueChange={(type) => {
                  setModalValue((value) => {
                    return {
                      ...value,
                      type: type as any,
                    };
                  });
                }}
              >
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
                value={modalValue.value}
                onChange={(e) => {
                  setModalValue((value) => {
                    return {
                      ...value,
                      value: e.target.value,
                    };
                  });
                }}
                className="col-span-3"
                rows={10}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                onChange(modalValue);
                setOpen(false);
              }}
            >
              Save Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const formSchema = z.object({
  match: z.object({
    type: z.enum(["preset", "regexp", "function"]),
    value: z.string(),
  }),
  ignoreConsole: z.boolean(),
  localeKeyPattern: z.string(),
  plugins: z.array(
    z.object({
      name: z.string(),
      inject: z.array(
        z.object({
          type: z.enum(["source", "hook"]),
          option: z.object({
            name: z.string(),
            importSource: z.string(),
          }),
        })
      ),
      template: z.union([
        z.string(),
        z.object({
          types: z.array(z.string()),
          template: z.union([z.string(), z.function()]),
        }),
        z.record(
          z.enum([
            SentenceType.JSXText,
            SentenceType.JSXAttributeText,
            SentenceType.Literal,
            SentenceType.TemplateLiteral,
          ]),
          z.union([z.string(), z.function()])
        ),
      ]),
    })
  ),
});

const defaultValues: z.infer<typeof formSchema> = {
  match: {
    type: "preset",
    value: "chinese",
  },
  ignoreConsole: true,
  localeKeyPattern: "LOCALE_KEY_{number}",
  plugins: DefaultSettings.plugins,
};

function Detail({ repo }: { repo: string }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const shouldSubmit = useMemo(() => {
    return !_.isEqual(form.getValues(), defaultValues);
  }, [form.formState.isDirty]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between">
              Replace Task Detail
              <Button
                size="sm"
                className={cn({
                  invisible: !shouldSubmit,
                })}
              >
                Save
              </Button>
            </CardTitle>
            <CardDescription>detail of you task configuration</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <FormItem>
              <FormLabel>Text Match</FormLabel>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="area">Matched Locale</Label>
                  <FormField
                    control={form.control}
                    name="match"
                    render={({ field }) => {
                      return (
                        <MatchField
                          value={field.value}
                          onChange={field.onChange}
                        />
                      );
                    }}
                  ></FormField>
                </div>
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <Label
                    className="flex-grow flex flex-col"
                    htmlFor="ignoreLog"
                  >
                    <span>Ignore Log</span>
                    <span className="font-normal leading-snug text-muted-foreground">
                      ignore matched text inside{" "}
                      <span className="font-bold">console.log</span>
                    </span>
                  </Label>
                  <FormField
                    control={form.control}
                    name="ignoreConsole"
                    render={({ field }) => {
                      return (
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      );
                    }}
                  />
                </div>
              </div>
            </FormItem>
            <FormItem>
              <FormLabel>Locale Key Pattern</FormLabel>
              <FormField
                control={form.control}
                name="localeKeyPattern"
                render={({ field }) => {
                  return (
                    <Input value={field.value} onChange={field.onChange} />
                  );
                }}
              ></FormField>
              <FormDescription>
                pattern has holders:
                <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                  number
                </code>{" "}
                for auto increment number
              </FormDescription>
            </FormItem>
            <FormItem>
              <FormLabel className="flex flex-row items-center justify-between">
                <div>Dictionary</div>
                <Button size="sm" variant="outline" onClick={() => {}}>
                  Import Local Module
                </Button>
              </FormLabel>
              <Textarea className="h-48"></Textarea>
              <div className="grid grid-cols-2 gap-2">
                <FormItem>
                  <FormLabel>Template Spliter</FormLabel>
                  <Input />
                </FormItem>
                <FormItem>
                  <FormLabel>Template Spliter</FormLabel>
                  <Input />
                </FormItem>
              </div>
            </FormItem>
            <FormItem>
              <FormLabel>
                Plugin
                <ArrowDownWideNarrow className="ml-1 inline-block -rotate-90" />
              </FormLabel>
              <FormDescription>
                plugin will replace each text match by order, if text was
                handled, rest plugin won't be called
              </FormDescription>
              <FormField
                control={form.control}
                name="plugins"
                render={({ field }) => {
                  return (
                    <div className="grid 2xl:grid-cols-3 xl:grid-cols-2 gap-2">
                      {field.value.map((plugin, index) => (
                        <PluginField
                          isFirst={index === 0}
                          isLast={index === plugins.length - 1}
                          index={index}
                          icon={ReactIntlSVG}
                          key={plugin.name}
                          plugin={plugin}
                          onChange={(nextPlugin) => {
                            field.onChange(
                              field.value.map((p, i) => {
                                return i === index ? nextPlugin : p;
                              })
                            );
                          }}
                          onRemove={() =>
                            field.onChange(
                              field.value.filter((_, i) => i !== index)
                            )
                          }
                          onMoveUp={() => {
                            const nextPlugins = field.value.flatMap((p, i) => {
                              if (i === index - 1) {
                                return [plugin, p];
                              }
                              if (i === index) {
                                return [];
                              }
                              return [p];
                            });

                            field.onChange(nextPlugins);
                          }}
                          onMoveDown={() => {
                            const nextPlugins = field.value.flatMap((p, i) => {
                              if (i === index) {
                                return [];
                              }
                              if (i === index + 1) {
                                return [p, plugin];
                              }
                              return [p];
                            });

                            field.onChange(nextPlugins);
                          }}
                        />
                      ))}
                    </div>
                  );
                }}
              />
            </FormItem>
            {/* <Card>
              <CardHeader>
                <CardTitle></CardTitle>
                <CardDescription></CardDescription>
              </CardHeader>
              <CardContent className="grid 2xl:grid-cols-3 xl:grid-cols-2 gap-2">
                
              </CardContent>
            </Card> */}
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}

export default Detail;
