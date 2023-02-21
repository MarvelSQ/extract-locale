import path from 'path';
import { NodePath } from "@babel/traverse";
import * as t from "@babel/types";

function getFileName(filePath: string) {
  const basename = path.basename(filePath, path.extname(filePath));
  // if(basename == 'index') {
  //   return path.basename(path.dirname(filePath));
  // }
  return basename;
}

export default function allowUseHook(path: NodePath<t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression>) {
  let functionName = '';
  if (path.isFunctionDeclaration() && t.isIdentifier(path.node.id)) {
    functionName = path.node.id.name;
  } else if (path.isArrowFunctionExpression() || path.isFunctionExpression()) {
    if (path.parentPath.isVariableDeclarator() && t.isIdentifier(path.parentPath.node.id)) {
      functionName = path.parentPath.node.id.name;
    }
  }
  if (!functionName && path.findParent(p => p.isExportDefaultDeclaration())) {
    const programPath = path.findParent(p => p.isProgram()) as NodePath<t.Program> | null;
    if (programPath) {
      const { filename } = ((programPath.container as t.Node).loc as any);
      if (filename) {
        functionName = getFileName(filename);
      }
    }
  }
  return functionName ? functionName[0].match(/[A-Z]/) !== null || functionName === 'index' || functionName.startsWith('use') : false;
}