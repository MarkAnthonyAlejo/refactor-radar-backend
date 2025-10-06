import type { SyntaxNode } from 'tree-sitter';

export interface Issue {
  type: string;
  message: string;
  start: any;
  end: any;
  locations?: { start: any; end: any }[];
}

/* -------------------------- Long Functions -------------------------- */
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
    for (const child of n.children) traverse(child);
  }
  traverse(node);
  return issues;
}

/* -------------------------- Deep Nesting -------------------------- */
export function detectDeepNesting(node: SyntaxNode, threshold = 3): Issue[] {
  const issues: Issue[] = [];
  function traverse(n: SyntaxNode, depth = 0) {
    const nestingTypes = ['if_statement','for_statement','while_statement','switch_statement','try_statement','catch_clause'];
    if (nestingTypes.includes(n.type)) {
      depth += 1;
      if (depth > threshold) {
        issues.push({
          type: 'deep-nesting',
          message: `Code is nested too deeply (${depth} levels)`,
          start: n.startPosition,
          end: n.endPosition,
        });
      }
    }
    for (const child of n.children) traverse(child, depth);
  }
  traverse(node);
  return issues;
}

/* -------------------------- Duplicate Code -------------------------- */
export function detectDuplicateCode(root: SyntaxNode, { minLines = 4, minChars = 40 }: { minLines?: number; minChars?: number } = {}): Issue[] {
  type Block = { node: SyntaxNode; body: SyntaxNode; norm: string; lines: number };
  const blocks: Block[] = [];

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

  const groups = new Map<string, Block[]>();
  for (const b of blocks) {
    const arr = groups.get(b.norm);
    if (arr) arr.push(b);
    else groups.set(b.norm, [b]);
  }

  const issues: Issue[] = [];
  for (const [, group] of groups) {
    if (group.length < 2) continue;
    const locations = group.map((g) => ({ start: g.node.startPosition, end: g.node.endPosition }));
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

/* -------------------------- Duplicate Blocks -------------------------- */
export function detectDuplicateBlocks(node: SyntaxNode, minStatements = 2): Issue[] {
  const issues: Issue[] = [];
  const blockMap: { [hash: string]: SyntaxNode[] } = {};

  function serializeNode(node: SyntaxNode): string {
    if (node.type === 'identifier') return 'ID';
    if (node.children.length === 0) return node.type;
    return node.children.map(serializeNode).join(',');
  }

  function traverse(n: SyntaxNode) {
    if (n.type === 'function_declaration' || n.type === 'method_definition' || n.type === 'statement_block') {
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

/* -------------------------- Cyclomatic Complexity -------------------------- */
export function detectCyclomaticComplexity(root: SyntaxNode, { warnAt = 10, noteAt = 5 }: { warnAt?: number; noteAt?: number } = {}): Issue[] {
  const issues: Issue[] = [];

  const isFunctionLike = (t: string) =>
    ['function_declaration','method_definition','function_expression','arrow_function','function'].includes(t);

  function functionName(n: SyntaxNode): string {
    const id = n.childForFieldName('name');
    if (id && (id.type === 'identifier' || id.type === 'property_identifier')) return id.text ?? '(anonymous)';
    const key = n.childForFieldName('key');
    if (key && (key.type === 'identifier' || key.type === 'property_identifier')) return key.text ?? '(anonymous)';
    return '(anonymous)';
  }

  function functionBody(n: SyntaxNode): SyntaxNode | null {
    return n.childForFieldName('body') ?? null;
  }

  function complexityOf(body: SyntaxNode): number {
    let c = 1;
    const stack: SyntaxNode[] = [body];
    while (stack.length) {
      const node = stack.pop()!;
      switch (node.type) {
        case 'if_statement':
        case 'for_statement':
        case 'for_in_statement':
        case 'for_of_statement':
        case 'while_statement':
        case 'do_statement':
        case 'catch_clause':
        case 'conditional_expression':
          c += 1;
          break;
        case 'switch_statement':
          let cases = 0;
          for (const ch of node.children) {
            if (ch.type === 'switch_case' || ch.type === 'switch_default') cases += 1;
          }
          c += cases;
          break;
        case 'binary_expression':
          for (const ch of node.children) if (ch.type === '&&' || ch.type === '||') c += 1;
          break;
      }
      for (const ch of node.children) stack.push(ch);
    }
    return c;
  }

  traverse(root, (n) => {
    if (!isFunctionLike(n.type)) return;
    const body = functionBody(n);
    if (!body) return;

    const score = complexityOf(body);
    const name = functionName(n);
    const level = score >= warnAt ? ' (high)' : score >= noteAt ? ' (moderate)' : ' (low)';

    issues.push({
      type: 'cyclomatic-complexity',
      message: `Cyclomatic complexity for function "${name}" is ${score}${level}.`,
      start: n.startPosition,
      end: n.endPosition,
    });
  });

  return issues;
}

/* -------------------------- Dead Code -------------------------- */
export function detectDeadCode(node: SyntaxNode): Issue[] {
  const issues: Issue[] = [];

  function traverse(n: SyntaxNode) {
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
        if (['return_statement','throw_statement','break_statement','continue_statement'].includes(child.type)) {
          unreachable = true;
        }
      }
    }
    for (const child of n.children) traverse(child);
  }

  traverse(node);
  return issues;
}

/* -------------------------- Bad Naming -------------------------- */
export function detectBadNaming(node: SyntaxNode): Issue[] {
  const issues: Issue[] = [];
  const badNames = ['foo','bar','baz','tmp','data','test'];
  const allowedSingle = ['i','j','k'];

  function traverse(n: SyntaxNode) {
    if (n.type === 'identifier' || n.type === 'property_identifier') {
      const name = n.text.trim();
      console.log('Identifier:', JSON.stringify(name));
      if (badNames.includes(name) || (name.length === 1 && !allowedSingle.includes(name))) {
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
  console.log('Bad naming issues:', issues.map((i) => i.message));
  return issues;
}

/* -------------------------- Shared Helpers -------------------------- */
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
    case 'shorthand_property_identifier': return 'ID';
    case 'number': return 'NUM';
    case 'string':
    case 'string_fragment':
    case 'template_string':
    case 'template_substitution': return 'STR';
    case 'true':
    case 'false': return 'BOOL';
    case 'null': return 'NULL';
    default: return n.type;
  }
}
