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
