import { ExtractDirectory, ExtractFile } from "./type";

export function openDirectory() {
  return window
    .showDirectoryPicker()
    .then((directoryHandle) => {
      return directoryHandle;
    })
    .catch((err) => {
      console.info("Could not open directory picker");
      console.error(err);
      return null;
    });
}

async function readAllFiles(handle: FileSystemDirectoryHandle) {
  const entries: Array<ExtractDirectory | ExtractFile> = [];

  for await (const entry of handle.values()) {
    // Skip node_modules
    if (entry.name === "node_modules") continue;
    if (entry.kind === "file") {
      entries.push({
        type: "file",
        name: entry.name,
        handle: entry,
      });
    } else if (entry.kind === "directory") {
      entries.push({
        type: "directory",
        name: entry.name,
        handle: entry,
        children: await readAllFiles(entry),
      });
    }
  }

  return entries;
}

export async function openExtractLocale() {
  const directoryHandle = await openDirectory();

  return directoryHandle ? readAllFiles(directoryHandle) : null;
}
