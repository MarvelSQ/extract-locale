import { useQuery, QueryClient, useMutation } from "@tanstack/react-query";
import { openExtractLocale } from ".";
import * as Task from "@/Task/init";
import { Repo } from "@/Task/Entity";
import { LocaleTask } from "../../../src/type";
import { SimpleFile, loadFiles } from "@/Task/loadFiles";
import { openDialog } from "@/lib/modal";
import Fileselector from "@/components/task/fileselector";
import { build } from "@/build/build";

export const repoQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      staleTime: Infinity,
    },
  },
});

let repos = Task.init();

function initDemo() {
  const DemoRepo = new Repo("Demo", "demo", [], {});

  const demoFileMap = (
    import.meta as unknown as {
      glob(
        path: string,
        option: {
          eager: boolean;
          as: string;
        }
      ): Record<string, string>;
    }
  ).glob("../Demo/**/*.tsx", {
    eager: true,
    as: "raw",
  });

  DemoRepo.files = Object.entries(demoFileMap).map(([path, content]) => {
    return {
      path: path.replace("../Demo/", ""),
      content,
    };
  }) as { path: string; content: string }[];

  DemoRepo.executeTask({});

  return DemoRepo;
}

const DemoRepo = initDemo();

function writeRepos() {
  localStorage.setItem(
    "repos",
    JSON.stringify(repos.map((repo) => repo.toJSON()))
  );
}

export function getRepos() {
  return repos;
}

function getRepo(name: string) {
  if (name === "demo") {
    return DemoRepo;
  }

  const repos = getRepos();

  return repos.find((repo) => repo.name === name);
}

export function useRepos({ suspense = false } = {}) {
  const repos = useQuery(
    ["GET_REPOS"],
    () => {
      return getRepos();
    },
    {
      suspense,
    }
  );

  return repos;
}

export function useRepo(name: string) {
  const repo = useQuery(["GET_REPO", name], () => {
    return getRepo(name);
  });

  return repo;
}

export function useRepoHandle(name: string | null) {
  const repo = useQuery(
    ["GET_REPO_HANDLE", name],
    () => {
      return (
        getRepo(name as string)?.handle ||
        Promise.reject(new Error("no handle"))
      );
    },
    {
      enabled: !!name,
    }
  );

  return repo;
}

export async function getFiles(name: string) {
  const repo = getRepo(name);

  if (repo) {
    return repo.files.map((file) => ({
      path: file.path,
      content: undefined,
    }));
  }

  return [];
}

type PromiseResult<P> = P extends Promise<infer T> ? T : unknown;

export function useFiles(
  name: string,
  options?: {
    onSuccess?: (res: PromiseResult<ReturnType<typeof getFiles>>) => void;
  }
) {
  const files = useQuery(
    ["GET_REPO_FILES", name],
    () => getFiles(name),
    options
  );

  return files;
}

export function createRepo(
  name: string,
  files: { path: string }[],
  directoryHandleId: string,
  handle: FileSystemDirectoryHandle
) {
  const repo = Task.createRepo(name, files, directoryHandleId);

  repo.handle = handle;

  repos = [...repos, repo];

  writeRepos();

  repoQueryClient.invalidateQueries(["GET_REPOS"]);
  repoQueryClient.invalidateQueries(["GET_REPO", name]);
}

export function deleteRepo(name: string) {
  repos = repos.filter((repo) => repo.name !== name);

  writeRepos();

  repoQueryClient.invalidateQueries(["GET_REPOS"]);
  repoQueryClient.invalidateQueries(["GET_REPO", name]);
}

async function getFileContent(name: string, path: string) {
  const repo = getRepo(name);

  if (!repo) {
    throw new Error("Repo not found");
  }

  const conetnt = await repo.getFileContent(path);

  return conetnt;
}

export async function openHandle(name: string) {
  const repo = getRepo(name);

  if (repo?.directoryHandleId) {
    const result = await openExtractLocale({
      id: repo.directoryHandleId,
    });

    if (result && result.name === name) {
      repo.handle = result.handle;
      repoQueryClient.invalidateQueries(["GET_FILE_CONTENT", name]);
      // inside handle setter, tasks will be executed in next tick, so we need to invalidate queries in next tick
      Promise.resolve().then(() => {
        repoQueryClient.invalidateQueries(["GET_FILE_TASK", name]);
        repoQueryClient.invalidateQueries(["GET_FILE_TASKS", name]);
      });
      return result;
    }
  }

  throw new Error("No handle found");
}

export function useFileContent(repo: string, path?: string | null) {
  const fileContent = useQuery(
    ["GET_FILE_CONTENT", repo, path],
    () => getFileContent(repo, path as string),
    {
      enabled: !!path,
      retry: false,
    }
  );

  return fileContent;
}

export function executeTask(name: string, config: {}) {
  const repo = getRepo(name);

  if (!repo) {
    throw new Error("Repo not found");
  }

  return repo.executeTask(config);
}

export function getFileTask(name: string, filePath: string) {
  const repo = getRepo(name);

  if (!repo) {
    throw new Error("Repo not found");
  }

  const result = repo.tasks.find((task) => task.path === filePath)?.result;

  if (!result) {
    throw new Error("Task not found");
  }

  return result;
}

function saveFile(name: string, filePath: string, tasks: LocaleTask[]) {
  const repo = getRepo(name);

  if (!repo) {
    throw new Error("Repo not found");
  }

  return repo.saveFile(filePath, tasks);
}

export function useFileTask(name: string, filePath?: string) {
  const fileTask = useQuery(
    ["GET_FILE_TASK", name, filePath],
    () => getFileTask(name, filePath as string),
    {
      enabled: !!filePath,
      retry: false,
    }
  );

  const save = useMutation(
    (tasks: LocaleTask[]) => saveFile(name, filePath as string, tasks),
    {
      onSuccess: () => {
        repoQueryClient.invalidateQueries(["GET_FILE_TASK", name]);
        repoQueryClient.invalidateQueries(["GET_FILE_TASKS", name]);
      },
    }
  );

  return { task: fileTask, save };
}

function getFileTasks(name: string) {
  const repo = getRepo(name);

  if (!repo) {
    throw new Error("Repo not found");
  }

  return Promise.all(
    repo.tasks.map((task) => {
      return task.result.then((result) => ({
        path: task.path,
        result,
        saved: task.saved,
      }));
    })
  );
}

export function useFileTasks(name: string) {
  const fileTasks = useQuery(
    ["GET_FILE_TASKS", name],
    () => getFileTasks(name),
    {
      retry: false,
    }
  );

  return fileTasks;
}

export async function openNewRepo() {
  const id = Math.random().toString(36).substring(2, 10);
  const { name, files, handle } = await loadFiles(id);
  const fileMap = files.reduce((acc, cur) => {
    acc[cur.path] = cur;
    return acc;
  }, {} as Record<string, SimpleFile>);

  return new Promise<string>((res) => {
    openDialog(Fileselector, {
      directory: name,
      files: files.map((file) => ({
        key: file.path,
        title: file.path,
      })),
      onConfirm: (keys) => {
        const files = keys
          .sort()
          .map((key) => fileMap[key])
          .map((file) => ({
            path: file.path,
          }));

        createRepo(name, files, id, handle as FileSystemDirectoryHandle);

        res(name);
      },
    });
  });
}

export type BuildRecord = {
  repo: string;
  status: "running" | "success" | "error";
  entryModule: string;
  timestamp: number;
  result?: any;
  finishtime?: number;
};

let cacheResult: Record<string, BuildRecord[]> = {};

const local = localStorage.getItem("import_build_cache");
if (local) {
  cacheResult = JSON.parse(local);
}

function updateLocal() {
  localStorage.setItem("import_build_cache", JSON.stringify(cacheResult));
}

export function useAllDictMap() {
  return useQuery(["ALL_IMPORTS"], () => {
    return Object.entries(cacheResult)
      .flatMap(([key, records]) => {
        return records.map((rec) => ({
          ...rec,
          repo: key,
        }));
      })
      .sort((a, b) => (b.timestamp - a.timestamp > 0 ? 1 : -1));
  });
}

export function useDictMap(repo: string) {
  const result = useQuery(["GET_REPO_IMPORTS", repo], () => {
    return [...(cacheResult[repo] || [])];
  });

  return result;
}

const ImportDictMessage: Record<
  string,
  {
    type: "resolve" | "load" | "success" | "error";
    message: string | string[];
  }[]
> = {};

export function useImportDictBuild(
  repo: string,
  entryModule: string,
  timestamp: number
) {
  const record = useQuery(
    ["GET_IMPORT_DICT_BUILD", repo, entryModule, timestamp],
    () => {
      return cacheResult[repo].find(
        (record) =>
          record.entryModule === entryModule && record.timestamp === timestamp
      );
    },
    {
      refetchInterval(data) {
        return data?.status === "running" ? 1000 : false;
      },
    }
  );

  return record;
}

export function useImportDictBuildLog(build?: BuildRecord) {
  const messages = useQuery(
    [
      "GET_IMPORT_DICT_BUILD_LOG",
      build?.repo,
      build?.entryModule,
      build?.timestamp,
    ],
    () => {
      return [
        ...(ImportDictMessage[
          `${build.repo}-${build.entryModule}-${build.timestamp}`
        ] || []),
      ];
    },
    {
      enabled: !!build,
      refetchInterval: build?.status === "running" ? 1000 : false,
    }
  );

  return messages;
}

export function useDictMapImport(
  repo: string | null,
  option?: {
    onSuccess: (record: BuildRecord) => void;
  }
) {
  const importDictMap = useMutation(
    (path: string) => {
      const timestamp = new Date().getTime();
      const targetRepo = getRepo(repo as string);
      if (targetRepo?.handle) {
        const buildRecord: BuildRecord = {
          repo: repo as string,
          entryModule: path,
          status: "running",
          timestamp,
        };
        cacheResult[repo as string] = cacheResult[repo as string] || [];
        cacheResult[repo as string].push(buildRecord);

        repoQueryClient.invalidateQueries(["GET_REPO_IMPORTS"]);
        repoQueryClient.invalidateQueries(["ALL_IMPORTS"]);

        updateLocal();

        build(targetRepo.handle, path, {
          onMessage: (message) => {
            ImportDictMessage[`${repo}-${path}-${timestamp}`] ||= [];
            ImportDictMessage[`${repo}-${path}-${timestamp}`].push(message);
          },
        }).then((res) => {
          cacheResult[repo as string] = cacheResult[repo as string] || [];
          cacheResult[repo as string] = cacheResult[repo as string].map(
            (record) => {
              return record.timestamp === timestamp
                ? {
                    ...record,
                    finishtime: new Date().getTime(),
                    status: "success",
                    result: res,
                  }
                : record;
            }
          );

          updateLocal();

          return cacheResult[repo as string].find(
            (record) => record.timestamp === timestamp
          ) as BuildRecord;
        });

        return Promise.resolve(buildRecord);
      }

      return Promise.reject("No handle found");
    },
    {
      ...option,
      onSuccess(data) {
        option?.onSuccess(data);
        repoQueryClient.invalidateQueries(["GET_REPO_IMPORTS"]);
        repoQueryClient.invalidateQueries(["ALL_IMPORTS"]);
      },
    }
  );

  return importDictMap;
}
