import { Button } from "../ui/button";

const menus = [
  {
    label: "Detail",
    value: "detail",
  },
  {
    label: "Match List",
    value: "matches",
  },
  {
    label: "File List",
    value: "files",
  },
  {
    label: "Preview",
    value: "preview",
  },
];

function Sidebar({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      {menus.map((menu) => {
        return (
          <Button
            key={menu.value}
            variant={value === menu.value ? "secondary" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => onSelect(menu.value)}
          >
            {menu.label}
          </Button>
        );
      })}
    </div>
  );
}

export default Sidebar;
