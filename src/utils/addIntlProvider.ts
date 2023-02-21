import * as t from '@babel/types';
import { ParseResult } from "@babel/parser";
import traverse from "@babel/traverse";
import { File } from "@babel/types";
import { config } from '../config';

const { providerSource, strFormatMessage, strUseIntl } = config;

function addImportUseIntl(ast: ParseResult<File>) {
  let hasImport = false;
  let hasImportSource = false;
  let hasUseIntl = false;
  traverse(ast, {
    ImportDeclaration(path) {
      hasImport = true;
      if (path.node.source.value === providerSource) {
        hasImportSource = true;
      }
    },
    ImportSpecifier(path) {
      if (t.isIdentifier(path.node.imported) && path.node.imported.name === strUseIntl) {
        hasUseIntl = true;
      }
    }
  })

  if (!hasImport) {
    ast.program.body.unshift(t.importDeclaration([t.importSpecifier(t.identifier(strUseIntl), t.identifier(strUseIntl))], t.stringLiteral(providerSource)));
    return;
  }

  if (hasImportSource && hasUseIntl) {
    return;
  }


  traverse(ast, {
    ImportDeclaration(path) {
      if (!hasImportSource) {
        path.insertBefore(t.importDeclaration([t.importSpecifier(t.identifier(strUseIntl), t.identifier(strUseIntl))], t.stringLiteral(providerSource)))
        hasImportSource = true;
        hasUseIntl = true;
      } else if (!hasUseIntl && path.node.source.value === providerSource) {
        path.node.specifiers.push(t.importSpecifier(t.identifier(strUseIntl), t.identifier(strUseIntl)))
        hasUseIntl = true;
      }
    }
  })

}

function addImportFormatMessage(ast: ParseResult<File>) {
  let hasImport = false;
  let hasImportSource = false;
  let hasFormatMessage = false;
  traverse(ast, {
    ImportDeclaration(path) {
      hasImport = true;
      if (path.node.source.value === providerSource) {
        hasImportSource = true;
      }
    },
    ImportSpecifier(path) {
      if (t.isIdentifier(path.node.imported) && path.node.imported.name === strFormatMessage) {
        hasFormatMessage = true;
      }
    }
  })

  if (!hasImport) {
    ast.program.body.unshift(
      t.importDeclaration([t.importSpecifier(t.identifier(strFormatMessage), t.identifier(strFormatMessage))], t.stringLiteral(providerSource))
    )
    return;
  }

  if (hasImportSource && hasFormatMessage) {
    return;
  }

  traverse(ast, {
    ImportDeclaration(path) {
      if (!hasImportSource) {
        path.insertBefore(t.importDeclaration([t.importSpecifier(t.identifier(strFormatMessage), t.identifier(strFormatMessage))], t.stringLiteral(providerSource)))
        hasImportSource = true;
        hasFormatMessage = true;
      } else if (!hasFormatMessage && path.node.source.value === providerSource) {
        path.node.specifiers.push(t.importSpecifier(t.identifier(strFormatMessage), t.identifier(strFormatMessage)))
        hasFormatMessage = true;
      }
    }
  })
}

export {
  addImportFormatMessage,
  addImportUseIntl,
}