import { useQuery, QueryClient } from "@tanstack/react-query";

export const repoQueryClient = new QueryClient();

type Repo = {
  name: string;
  files: {
    path: string;
  }[];
  config: Record<string, any>;
  directoryHandleId: string;
};

export function getRepos() {
  const repos = JSON.parse(localStorage.getItem("repos") || `[]`) as Repo[];

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
    const files = import.meta.glob("../Demo/**/*.tsx", {
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

  return [];
}

type PromiseResult<P> = P extends Promise<infer T> ? T : unknown;

export function useFiles(
  name: string,
  options: {
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
  directoryHandleId: string
) {
  const repos = getRepos();

  const repoIndex = repos.findIndex((repo) => repo.name === name);

  if (repoIndex === -1) {
    repos.push({
      name,
      files,
      config: {},
      directoryHandleId,
    });
  } else {
    repos[repoIndex] = {
      name,
      files,
      config: {},
      directoryHandleId,
    };
  }

  localStorage.setItem("repos", JSON.stringify(repos));

  repoQueryClient.invalidateQueries(["GET_REPOS"]);
  repoQueryClient.invalidateQueries(["GET_REPO", name]);
}

export function deleteRepo(name: string) {
  const repos = getRepos();

  const repoIndex = repos.findIndex((repo) => repo.name === name);

  if (repoIndex !== -1) {
    repos.splice(repoIndex, 1);
  }

  localStorage.setItem("repos", JSON.stringify(repos));

  repoQueryClient.invalidateQueries(["GET_REPOS"]);
  repoQueryClient.invalidateQueries(["GET_REPO", name]);
}
