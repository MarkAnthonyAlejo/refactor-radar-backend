import type { SyntaxNode } from 'tree-sitter';

export interface Issue {
  type: string;
  message: string;
  start: any;
  end: any;
}

export function detectLongFunctions(node: SyntaxNode, threshold = 30): Issue[] {
  const issues: Issue[] = [];

  function traverse(n: SyntaxNode) {
    if (n.type === 'function_declaration' || n.type === 'method_definition') {
      const body = n.childForFieldName('body');
      if (body) {
        const lines = body.endPosition.row - body.startPosition.row;
        if (lines > threshold) {
          issues.push({
            type: 'long-function',
            message: `Function too long (${lines} lines)`,
            start: n.startPosition,
            end: n.endPosition,
          });
        }
      }
    }
    for (const child of n.children) {
      traverse(child);
    }
  }

  traverse(node);
  return issues;
}
