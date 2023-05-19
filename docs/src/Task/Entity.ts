import { getFile } from "@/filesystem/utils";
import { DefaultSettings, withReact } from "../../../src/preset/react";
import { LocaleTask } from "../../../src/type";

export class Repo {
  public name: string = "";

  /**
   * filtered files by user select
   */
  public files: {
    path: string;
    handle?: FileSystemFileHandle;
    content?: string;
  }[] = [];

  /**
   * accessed files but not in files
   */
  public localFiles: { path: string; handle?: FileSystemFileHandle }[] = [];

  public directoryHandleId: string = "";

  private directoryHandle: FileSystemDirectoryHandle | null = null;

  private fileCacheMap = new Map<string, string>();

  public config: any = {};

  constructor(
    name: string,
    directoryHandleId: string,
    files: {
      path: string;
      content?: string;
      handle?: FileSystemFileHandle;
    }[],
    config?: any
  ) {
    this.name = name;
    this.directoryHandleId = directoryHandleId;
    this.files = files;
    this.config = config || {};
  }

  set handle(directoryHandle: FileSystemDirectoryHandle) {
    Promise.resolve().then(() => {
      this.executeTask(this.config);
    });

    this.directoryHandle = directoryHandle;
  }

  update(files: { path: string; handle: FileSystemFileHandle }[]) {
    this.files = files;
  }

  async getFileContent(filePath: string) {
    const file = this.files.find((file) => file.path === filePath);
    if (file?.content) {
      return file.content;
    }

    if (!this.directoryHandle) {
      throw new Error("No directory handle");
    }

    if (this.fileCacheMap.has(filePath)) {
      return this.fileCacheMap.get(filePath) as string;
    }

    let handle: FileSystemFileHandle | undefined = file?.handle;

    if (!file) {
      let localFile = this.localFiles.find((file) => file.path === filePath);

      handle = localFile?.handle;
    }

    if (!handle) {
      handle = await getFile(this.directoryHandle, filePath);
      if (handle) {
        if (file) {
          file.handle = handle;
        } else {
          const file = {
            path: filePath,
            handle: handle,
          };
          this.localFiles.push(file);
        }
      } else {
        throw new Error("not found");
      }
    }

    const content = await handle.getFile().then((file) => file.text());

    this.fileCacheMap.set(filePath, content);

    return content;
  }

  private cbs: (() => void)[] = [];

  onTasksFinished(cb: () => void) {
    this.cbs.push(cb);
  }

  public tasks: {
    path: string;
    result: Promise<
      | ReturnType<ReturnType<typeof withReact>>
      | {
          error: any;
        }
    >;
    saved?: boolean;
  }[] = [];

  executeTask(config: any) {
    const replacer = withReact(DefaultSettings);

    const fileTasks = this.files.map((file) => {
      return {
        path: file.path,
        result: this.getFileContent(file.path)
          .then((content) => {
            const result = replacer(file.path, content);
            return result;
          })
          .catch((err) => {
            return {
              error: err,
            };
          }),
      };
    });

    Promise.all(fileTasks.map((fileTask) => fileTask.result)).then(
      (results) => {
        console.log(results);
        console.log("done");
        this.config = config;

        this.cbs.forEach((cb) => cb());
        this.cbs = [];
      }
    );

    this.tasks = fileTasks;

    return fileTasks;
  }

  async saveFile(filePath: string, tasks: LocaleTask[]) {
    const file = this.files.find((file) => file.path === filePath);
    // const content = await this.getFileContent(filePath);

    const task = this.tasks.find((task) => task.path === filePath);

    if (file?.handle && task?.result) {
      const { toString } = await task.result;

      await file.handle.createWritable().then((writable) => {
        writable.write(toString(tasks));
        writable.close();

        task.saved = true;
      });
    }
  }

  toJSON() {
    return {
      name: this.name,
      files: this.files.map((file) => ({
        path: file.path,
      })),
      directoryHandleId: this.directoryHandleId,
      config: this.config,
    };
  }
}
