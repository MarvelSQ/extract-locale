import { openExtractLocale } from "../filesystem";
import { flatFileTree, getFileContent, saveResult } from "../filesystem/utils";

export type SimpleFile = {
  path: string;
  content: string | Promise<string>;
  save?: (content: string) => Promise<void>;
};

export async function loadFiles(type: string): Promise<SimpleFile[]> {
  switch (type) {
    case "demo":
      const files = await import.meta.glob("../Demo/**/*.tsx", {
        eager: true,
        as: "raw",
      });

      return Object.entries(files).map(([path, content]) => {
        return {
          path: path.replace("../Demo/", ""),
          content,
        };
      }) as { path: string; content: string }[];
    case "react":
      const fileTree = await openExtractLocale();
      if (fileTree) {
        return flatFileTree(fileTree, (node, parent) => {
          if (parent) {
            return {
              ...node,
              name: `${parent.name}/${node.name}`,
            };
          }

          return node;
        }).map(
          (file) =>
            ({
              path: file.name,
              get content() {
                return getFileContent(file);
              },
              async save(content: string) {
                await saveResult(file, content);
              },
            } as SimpleFile)
        );
      }
  }

  return [];
}
