// services/analyzerService.ts
import { parseCodeToAST } from '../utils/treeSitterParser';
import {
  detectLongFunctions,
  detectDeepNesting,
  detectDuplicateCode,
  detectDuplicateBlocks,
  detectDeadCode,
  detectBadNaming,
  detectCyclomaticComplexity, // ✅ NEW
} from '../utils/astIssuesDetector';

import type { Issue } from '../utils/astIssuesDetector';

export const analyzeCodeService = async (
  filename: string,
  code: string,
  language: string
) => {
  // ✅ Step 1: Parse into AST
  const ast = parseCodeToAST(filename, code, language);
  console.log('AST rootNode string:', ast.toString());

  // ✅ Step 2: Run all detectors

  const longFunctionIssues: Issue[] = detectLongFunctions(ast);
  // console.log('Detected long functions:', longFunctionIssues);

  const deepNestingIssues: Issue[] = detectDeepNesting(ast);
  // console.log('Detected deep nesting:', deepNestingIssues);

  const duplicateCodeIssues: Issue[] = detectDuplicateCode(ast);
  // console.log('Detected duplicate code:', duplicateCodeIssues);

  const duplicateBlockIssues: Issue[] = detectDuplicateBlocks(ast);
  // console.log('Detected duplicate blocks:', duplicateBlockIssues);

  const deadCodeIssues: Issue[] = detectDeadCode(ast);
  // console.log('Detected dead code:', deadCodeIssues);

  const badNamingIssues: Issue[] = detectBadNaming(ast);
  // console.log('Detected bad naming:', badNamingIssues);

  // 🚀 NEW: Cyclomatic Complexity
  const ccIssues: Issue[] = detectCyclomaticComplexity(ast, {
    warnAt: 10,
    noteAt: 5,
  });
  console.log('Detected cyclomatic complexity issues:', ccIssues);

  // ✅ Step 3: Return structured response
  return {
    filename,
    language,
    originalCode: code,
    refactoredCode: '// Refactored code would go here',
    suggestions: [
      ...longFunctionIssues.map(i => i.message),
      ...deepNestingIssues.map(i => i.message),
      ...duplicateCodeIssues.map(i => i.message),
      ...duplicateBlockIssues.map(i => i.message),
      ...deadCodeIssues.map(i => i.message),
      ...badNamingIssues.map(i => i.message),
      ...ccIssues.map(i => i.message),
      'Use const instead of let',
      'Extract logic into smaller functions',
    ],
    techDebtScore: 65,
    issues: [
      ...longFunctionIssues,
      ...deepNestingIssues,
      ...duplicateCodeIssues,
      ...duplicateBlockIssues,
      ...deadCodeIssues,
      ...badNamingIssues,
      ...ccIssues,
    ],
    diff: '// Diff output will go here',
  };
};
