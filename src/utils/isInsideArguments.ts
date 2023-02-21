import { NodePath } from "@babel/traverse";
import * as t from '@babel/types';

function isFunctionAlike(node: t.Node): node is t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression {
  return t.isFunctionDeclaration(node) || t.isFunctionExpression(node) || t.isArrowFunctionExpression(node);
}

function isInsideArguments(path: NodePath) {
  return path.findParent(p => {
    if (p.isObjectPattern() && isFunctionAlike(p.parentPath.node)) {
      return true;
    }
    return false;
  }) !== null;
}

export {
  isInsideArguments
}