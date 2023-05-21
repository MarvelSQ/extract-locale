import { openExtractLocale } from "../filesystem";
import {
  flatFileTree,
  getFileContent,
  getHistory,
  saveResult,
} from "../filesystem/utils";

export type SimpleFile = {
  path: string;
  content: string | Promise<string>;
  save?: (content: string) => Promise<void>;
};

export async function loadFiles(id: string): Promise<{
  name: string;
  files: SimpleFile[];
  directoryHandleId: string;
  handle?: FileSystemDirectoryHandle;
}> {
  if (id === "demo") {
    const files = await import.meta.glob("../Demo/**/*.tsx", {
      eager: true,
      as: "raw",
    });

    return {
      name: "demo",
      files: Object.entries(files).map(([path, content]) => {
        return {
          path: path.replace("../Demo/", ""),
          content,
        };
      }) as { path: string; content: string }[],
      directoryHandleId: "",
    };
  }

  const fileTree = await openExtractLocale({
    id,
  });
  if (fileTree) {
    return {
      handle: fileTree.handle,
      directoryHandleId: id,
      name: fileTree.name,
      files: flatFileTree(await fileTree.files, (node, parent) => {
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
      ),
    };
  }

  throw new Error("Could not load files");
}
