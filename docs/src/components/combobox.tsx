import * as React from "react";
import { Check, ChevronsUpDown, FolderPlus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { openNewRepo } from "@/filesystem/queries";

const frameworks = [
  {
    value: "next.js",
    label: "Next.js",
  },
  {
    value: "sveltekit",
    label: "SvelteKit",
  },
  {
    value: "nuxt.js",
    label: "Nuxt.js",
  },
  {
    value: "remix",
    label: "Remix",
  },
  {
    value: "astro",
    label: "Astro",
  },
];

export function Combobox({
  value,
  onChange,
  data,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  data: {
    label: React.ReactNode;
    value: string;
  }[];
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between"
        >
          {value
            ? data.find((data) => data.value === value)?.label
            : "Select framework..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          {data.length > 20 && (
            <CommandInput placeholder="Search framework..." />
          )}
          <CommandEmpty>No repos found.</CommandEmpty>
          <CommandGroup>
            {data.map((item) => (
              <CommandItem
                key={`repo-${item.value}`}
                onSelect={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === item.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup>
            <CommandItem
              key="new-repo"
              onSelect={() =>
                openNewRepo()
                  .then((repo) => {
                    onChange(repo);
                  })
                  .catch(() => {
                    setOpen(false);
                  })
              }
            >
              <FolderPlus className="mr-2 h-4 w-4" /> open New Repo
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
