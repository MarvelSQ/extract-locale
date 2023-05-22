export type ExtractFile = {
  type: "file";
  name: string;
  handle: FileSystemFileHandle;
};

export type ExtractDirectory = {
  type: "directory";
  name: string;
  handle: FileSystemDirectoryHandle;
  children: (ExtractFile | ExtractDirectory)[];
};
