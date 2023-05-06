import { ReplaceTask } from "../../src/type";

export type ParsedResultTask = {
  path: string;
  tasks: ReplaceTask[];
  toString: () => string;
};
