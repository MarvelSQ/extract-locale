import { ExtractFile } from "./type";

export function treeMap<T, R>(
  tree: T[],
  callback: (node: T, parentNode?: R) => R,
  parentNode?: R,
  getChildren: (node: T) => null | undefined | void | T[] = (node) =>
    (node as any).children
) {
  const collect: (R & {
    children?: R[];
  })[] = [];
  tree.forEach((node) => {
    const result = callback(node, parentNode) as R & {
      children?: R[];
    };
    collect.push(result);
    const children = getChildren(node);
    if (children) {
      result.children = treeMap(children, callback, result, getChildren);
    }
  });
  return collect;
}

export function treeEach<T>(tree: T[], callback: (node: T) => void) {
  tree.forEach((item) => {
    callback(item);
    if ((item as any).children) {
      treeEach((item as any).children, callback);
    }
  });
}

export function flatChildren(tree: any[], callback: (node: any) => any) {
  const collect: any[] = [];
  tree.forEach((item) => {
    collect.push(callback(item));
    if ((item as any).children) {
      collect.push(...flatChildren((item as any).children, callback));
    }
  });
  return collect;
}

export function flatFileTree(
  tree: any[],
  callback: (node: any, parent: any) => any
) {
  const collect: any[] = [];
  tree.forEach((item) => {
    if (item.type === "directory") {
      collect.push(
        ...flatFileTree(item.children, callback).map((child) =>
          callback(child, item)
        )
      );
    } else {
      collect.push(item);
    }
  });
  return collect;
}

export async function getFileContent(file: ExtractFile) {
  const isPicture = file.name.match(/\.(png|jpe?g|gif|webp)$/i);

  return file.handle.getFile().then((res) => {
    return new Promise<string>((resolve) => {
      isPicture
        ? res
            .arrayBuffer()
            .then((array) =>
              resolve(
                btoa(
                  String.fromCharCode.apply(null, new Uint8Array(array) as any)
                )
              )
            )
        : resolve(res.text());
    });
  });
}

export function saveResult(file: ExtractFile, content: string) {
  return file.handle.createWritable().then((writable) => {
    writable.write(content);
    writable.close();
  });
}

const sortFile = (a, c) => {
  if (a.children && !c.children) {
    return -1;
  }
  if (c.children && !a.children) {
    return 1;
  }
  return a.name > c.name ? 1 : -1;
};

export function generateTree(
  files: {
    key: string;
  }[]
) {
  const trees: {
    key: string;
    name: string;
    children?: [];
  }[] = [];

  const root = {
    children: trees,
  };

  files.forEach((file) => {
    const paths = file.key.split("/");

    paths.reduce((acc, path, index) => {
      if (index === paths.length - 1) {
        acc.children.push({
          key: file.key,
          name: path,
          isLeaf: true,
        });

        acc.children.sort(sortFile);

        return {
          children: [],
        };
      }

      if (!acc[path]) {
        acc[path] = {
          key: acc.key ? `${acc.key}/${path}` : path,
          name: path,
          children: [],
        };
        acc.children.push(acc[path]);

        acc.children.sort(sortFile);
      }

      return acc[path];
    }, root);
  });

  return trees;
}
