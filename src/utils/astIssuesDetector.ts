import type { SyntaxNode } from 'tree-sitter';

export interface Issue {
  type: string;
  message: string;
  start: any;
  end: any;
}

//Long Function Summary - This function looks at all the code in a file, finds every function, 
// and checks if it’s too long. If a function is longer than 30 lines, 
// it records it as a “problem” so we can fix it later.
export function detectLongFunctions(node: SyntaxNode, threshold = 30): Issue[] {
  const issues: Issue[] = [];

  function traverse(n: SyntaxNode) {
    // console.log('L.F1', n.type)
    if (n.type === 'function_declaration' || n.type === 'method_definition') {
      const body = n.childForFieldName('body');
      if (body) {
        //Counts how many lines of code are inside it
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

//Deep Nesting

// Threshold is the maximum nesting allowed
export function detectDeepNesting(node: SyntaxNode, threshold = 3): Issue[] {
  const issues: Issue[] = [];

  // Recursive function to traverse nodes
  function traverse(n: SyntaxNode, depth = 0) {
    // List of nodes that count as "nesting"
    const nestingTypes = [
      'if_statement',
      'for_statement',
      'while_statement',
      'switch_statement',
      'try_statement',
      'catch_clause',
    ];

    // If the node is a nesting type, increase depth
    if (nestingTypes.includes(n.type)) {
      depth += 1;

      // If the nesting exceeds the threshold, record an issue
      if (depth > threshold) {
        issues.push({
          type: 'deep-nesting',
          message: `Code is nested too deeply (${depth} levels)`,
          start: n.startPosition,
          end: n.endPosition,
        });
      }
    }

    // Traverse all child nodes, passing down current depth
    for (const child of n.children) {
      traverse(child, depth);
    }
  }

  traverse(node);
  return issues;
}