import { Repo } from "./Entity";

type Config = {};

type BaseRepo = {
  name: string;
  files: { path: string }[];
  directoryHandleId: string;
  config: Config;
};

export function init() {
  const repos = JSON.parse(localStorage.getItem("repos") || `[]`) as BaseRepo[];

  return repos.map((repo) => {
    const inst = new Repo(repo.name, repo.directoryHandleId, repo.files);

    inst.config = repo.config;

    return inst;
  });
}

export function createRepo(
  name: string,
  files: { path: string }[],
  directoryHandleId: string
) {
  return new Repo(name, directoryHandleId, files);
}
