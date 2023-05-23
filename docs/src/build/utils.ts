export function getPackage(path: string) {
  const paths = path.split("/");

  if (path.startsWith("@")) {
    return `${paths[0]}/${paths[1]}`;
  }
  return paths[0];
}
