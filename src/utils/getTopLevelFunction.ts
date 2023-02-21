import { NodePath } from '@babel/traverse';
import * as t from '@babel/types';

function getTopLevelFunction(path: NodePath, formBottomPath = ""): boolean | NodePath<t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression> {
  if (!path.parentPath) {
    return false;
  }
  if (t.isProgram(path.parentPath.node)) {
    if (t.isExportNamedDeclaration(path.node)) {
      return (
        formBottomPath.endsWith("FunctionDeclaration") ||
        formBottomPath.endsWith("FunctionExpressionVariableDeclaratorVariableDeclaration") ||
        formBottomPath.endsWith("ArrowFunctionExpressionVariableDeclaratorVariableDeclaration")
      );
    }
    if (t.isFunctionDeclaration(path.node)) {
      return path as NodePath<t.FunctionDeclaration>;
    }
    if (t.isVariableDeclaration(path.node)) {
      return (
        formBottomPath.endsWith("FunctionExpressionVariableDeclarator") ||
        formBottomPath.endsWith("ArrowFunctionExpressionVariableDeclarator")
      );
    }
    if (t.isExportDefaultDeclaration(path.node)) {
      return (
        formBottomPath.endsWith("FunctionDeclaration") ||
        formBottomPath.endsWith("FunctionExpressionCallExpression") ||
        formBottomPath.endsWith("ArrowFunctionExpressionCallExpression")
      );
    }
  }
  const result = getTopLevelFunction(
    path.parentPath,
    formBottomPath + path.node.type
  );

  if (
    result === true && (t.isFunctionDeclaration(path.node) ||
      t.isArrowFunctionExpression(path.node) ||
      t.isFunctionExpression(path.node))
  ) {
    return path as NodePath<t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression>;
  }

  return result;
}

export default getTopLevelFunction;
