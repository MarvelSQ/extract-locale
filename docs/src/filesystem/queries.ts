import { useQuery, QueryClient } from "@tanstack/react-query";
import { openExtractLocale } from ".";
import * as Task from "@/Task/init";

export const repoQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: false,
      staleTime: Infinity,
    },
  },
});

let repos = Task.init();

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
  const repos = getRepos();

  return repos.find((repo) => repo.name === name);
}

export function useRepos() {
  const repos = useQuery(["GET_REPOS"], () => {
    return getRepos();
  });

  return repos;
}

export function useRepo(name: string) {
  const repo = useQuery(["GET_REPO", name], () => {
    return getRepo(name);
  });

  return repo;
}

export async function getFiles(name: string) {
  if (name === "demo") {
    const files = (
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

    return Object.entries(files).map(([path, content]) => {
      return {
        path: path.replace("../Demo/", ""),
        content,
      };
    }) as { path: string; content: string }[];
  }

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
  if (name === "demo") {
    const files = await getFiles(name);

    const file = (files as { path: string; content: string }[]).find(
      (file) => file.path === path
    );

    return file?.content || "";
  }

  const repo = repos.find((repo) => repo.name === name);

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

  return repo.tasks.find((task) => task.path === filePath)?.result;
}

export function useFileTasks(name: string, filePath?: string) {
  const fileTasks = useQuery(
    ["GET_FILE_TASKS", name, filePath],
    () => getFileTask(name, filePath as string),
    {
      enabled: !!filePath,
      retry: false,
    }
  );

  return fileTasks;
}
