import type { SyntaxNode } from 'tree-sitter';

export interface Issue {
  type: string;
  message: string;
  start: any;
  end: any;
  // Optional payload for multi-location issues (backward compatible)
  locations?: { start: any; end: any }[];
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

// Threshold is the maximum nesting allowed for 3
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

//Code duplication

// detectDuplicateCode = macro-level, function-level duplication.

// detectDuplicateBlocks = micro-level, inside-function duplication.

// Using both gives full coverage for code duplication in a project.

/**
 * Detect duplicate code by normalizing function/method bodies and grouping identical shapes.
 * - Focus v1 scope: function_declaration, method_definition, function_expression, arrow_function
 * - Normalization ignores variable names and literal values (so near-duplicates match).
 */
export function detectDuplicateCode(
  root: SyntaxNode,
  { minLines = 4, minChars = 40 }: { minLines?: number; minChars?: number } = {}
): Issue[] {
  type Block = {
    node: SyntaxNode;
    body: SyntaxNode;
    norm: string;
    lines: number;
  };
  const blocks: Block[] = [];

  // Collect all function-like nodes
  traverse(root, (n) => {
    const kind = n.type;
    const isFunctionLike =
      kind === 'function_declaration' ||
      kind === 'method_definition' ||
      kind === 'function' ||
      kind === 'function_expression' ||
      kind === 'arrow_function';
    if (!isFunctionLike) return;

    const body = n.childForFieldName('body') ?? n;
    if (!body) return;

    const lines = body.endPosition.row - body.startPosition.row;
    if (lines < minLines) return;

    const norm = normalizeNode(body);
    if (norm.length < minChars) return;

    blocks.push({ node: n, body, norm, lines });
  });

  // Group by normalized shape
  const groups = new Map<string, Block[]>();
  for (const b of blocks) {
    const arr = groups.get(b.norm);
    if (arr) arr.push(b);
    else groups.set(b.norm, [b]);
  }

  // Build issues
  const issues: Issue[] = [];
  for (const [, group] of groups) {
    if (group.length < 2) continue;

    const locations = group.map((g) => ({
      start: g.node.startPosition,
      end: g.node.endPosition,
    }));

    issues.push({
      type: 'duplicate-code',
      message: `Duplicate code detected in ${group.length} places (similar function bodies).`,
      start: group[0].node.startPosition,
      end: group[0].node.endPosition,
      locations,
    });
  }

  return issues;
}

/* -------------------------- Duplicate Blocks (Partial) -------------------------- */
// Detect repeated blocks inside function bodies
export function detectDuplicateBlocks(
  node: SyntaxNode,
  minStatements = 2
): Issue[] {
  const issues: Issue[] = [];
  const blockMap: { [hash: string]: SyntaxNode[] } = {};

  function serializeNode(node: SyntaxNode): string {
    if (node.type === 'identifier') return 'ID';
    if (node.children.length === 0) return node.type;
    return node.children.map(serializeNode).join(',');
  }

  function traverse(n: SyntaxNode) {
    if (
      n.type === 'function_declaration' ||
      n.type === 'method_definition' ||
      n.type === 'statement_block'
    ) {
      if (n.namedChildCount >= minStatements) {
        const hash = serializeNode(n);
        if (!blockMap[hash]) blockMap[hash] = [n];
        else blockMap[hash].push(n);
      }
    }

    for (const child of n.children) traverse(child);
  }

  traverse(node);

  Object.values(blockMap).forEach((nodes) => {
    if (nodes.length > 1) {
      nodes.forEach((n) =>
        issues.push({
          type: 'duplicate-code-block',
          message: `Duplicate code block detected (${nodes.length} occurrences)`,
          start: n.startPosition,
          end: n.endPosition,
        })
      );
    }
  });

  return issues;
}

/* -------------------------- Helpers -------------------------- */
function traverse(n: SyntaxNode, cb: (n: SyntaxNode) => void) {
  cb(n);
  for (const child of n.children) traverse(child, cb);
}

function normalizeNode(n: SyntaxNode): string {
  const placeholder = placeholderFor(n);
  if (placeholder) return placeholder;

  if (!n.children || n.children.length === 0) return n.type;
  return `${n.type}(${n.children.map(normalizeNode).join(',')})`;
}

function placeholderFor(n: SyntaxNode): string | null {
  switch (n.type) {
    case 'identifier':
    case 'property_identifier':
    case 'shorthand_property_identifier':
      return 'ID';
    case 'number':
      return 'NUM';
    case 'string':
    case 'string_fragment':
    case 'template_string':
    case 'template_substitution':
      return 'STR';
    case 'true':
    case 'false':
      return 'BOOL';
    case 'null':
      return 'NULL';
    case '+':
    case '-':
    case '*':
    case '/':
    case '%':
    case '==':
    case '===':
    case '!=':
    case '!==':
    case '<':
    case '<=':
    case '>':
    case '>=':
    case '&&':
    case '||':
    case '!':
    case '?':
    case ':':
    case '=':
    case '=>':
    case '.':
    case ',':
    case ';':
    case '(':
    case ')':
    case '{':
    case '}':
    case '[':
    case ']':
      return n.type;
    default:
      return null;
  }
}

/**
 * Detect dead code:
 * - Finds unreachable code after return, throw, break, or continue statements.
 */
export function detectDeadCode(node: SyntaxNode): Issue[] {
  const issues: Issue[] = [];

  function traverse(n: SyntaxNode) {
    // Only check inside blocks
    if (n.type === 'statement_block' || n.type === 'program') {
      let unreachable = false;
      for (const child of n.namedChildren) {
        if (unreachable) {
          issues.push({
            type: 'dead-code',
            message: 'Unreachable code detected',
            start: child.startPosition,
            end: child.endPosition,
          });
        }
        // Mark as unreachable after these statements
        if (
          child.type === 'return_statement' ||
          child.type === 'throw_statement' ||
          child.type === 'break_statement' ||
          child.type === 'continue_statement'
        ) {
          unreachable = true;
        }
      }
    }
    for (const child of n.children) traverse(child);
  }

  traverse(node);
  return issues;
}

/**
 * Detect bad naming:
 * - Flags identifiers with names like 'foo', 'bar', 'tmp', 'data', 'test', or single-letter names (except i, j, k).
 */
export function detectBadNaming(node: SyntaxNode): Issue[] {
  const issues: Issue[] = [];
  const badNames = ['foo', 'bar', 'baz', 'tmp', 'data', 'test'];
  const allowedSingle = ['i', 'j', 'k'];

  function traverse(n: SyntaxNode) {
    if (n.type === 'identifier' || n.type === 'property_identifier') {
      const name = n.text.trim();
      console.log('Identifier:', JSON.stringify(name));
      // Only flag if in badNames or is a single letter not allowed
      if (
        badNames.includes(name) ||
        (name.length === 1 && !allowedSingle.includes(name))
      ) {
        issues.push({
          type: 'bad-naming',
          message: `Suspicious variable name: "${name}"`,
          start: n.startPosition,
          end: n.endPosition,
        });
      }
    }
    for (const child of n.children) traverse(child);
  }

  traverse(node);
  console.log(
    'Bad naming issues:',
    issues.map((i) => i.message)
  );
  return issues;
}
