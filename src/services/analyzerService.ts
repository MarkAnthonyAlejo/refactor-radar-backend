// services/analyzerService.ts
import { parseCodeToAST } from '../utils/treeSitterParser';
import { detectLongFunctions } from '../utils/astIssuesDetector';
import { detectDeepNesting } from '../utils/astIssuesDetector';
import { detectDuplicateCode } from '../utils/astIssuesDetector';
import { detectDuplicateBlocks } from '../utils/astIssuesDetector';
import { detectDeadCode } from '../utils/astIssuesDetector';
import { detectBadNaming } from '../utils/astIssuesDetector';
import type { Issue } from '../utils/astIssuesDetector';

export const analyzeCodeService = async (
  filename: string,
  code: string,
  language: string
) => {
  // ✅ Step 1: Parse code into AST
  const ast = parseCodeToAST(filename, code, language);

  // Debug: Dump top-level AST as string (optional)
  console.log('AST rootNode string:', ast.toString());

  // ✅ Step 2: Detect long functions, Deep nesting, Code duplication
  const longFunctionIssues: Issue[] = detectLongFunctions(ast);
  //Console logs to test Long Functions
  // console.log('Detected long functions:', longFunctionIssues);
  // console.log('L.F', code)
  // console.log('language: ', language)

  const deepNestingIssues = detectDeepNesting(ast);
  //Console logs to test Deep Nesting
  // console.log('Detected deep nesting:', deepNestingIssues);
  // console.log('D.N', code)
  //console.log('language: ', language)

  const duplicateCodeIssues = detectDuplicateCode(ast);
  //Console logs to test Duplicated Code
  console.log('Duplicate Code: ', duplicateCodeIssues);
  console.log('D.C: ', code);
  console.log('language: ', language);

  const duplicateBlockIssues = detectDuplicateBlocks(ast);
  console.log('D.B.I', duplicateBlockIssues);
  console.log('D.B.I code:', code);
  console.log('language: ', language);

  const deadCodeIssues = detectDeadCode(ast);
  console.log('Dead Code Issues:', deadCodeIssues);

  const badNamingIssues = detectBadNaming(ast);
  console.log('Bad Naming Issues:', badNamingIssues);

  // Optional: Convert AST to JSON for debugging/visualization
  // console.log(JSON.stringify(astNodeToJSON(ast), null, 2));

  // ✅ Step 3: Return structured response including detected issues
  return {
    filename,
    language,
    originalCode: code,
    refactoredCode: '// Refactored code would go here', // placeholder
    suggestions: [
      ...longFunctionIssues.map((i) => i.message),
      ...deepNestingIssues.map((i) => i.message),
      ...duplicateCodeIssues.map((i) => i.message),
      ...duplicateBlockIssues, // actual issues
      ...deadCodeIssues.map((i) => i.message),
      ...badNamingIssues.map((i) => i.message),
      'Use const instead of let',
      'Extract logic into smaller functions',
    ],
    techDebtScore: 65, // placeholder
    issues: [
      ...longFunctionIssues,
      ...deepNestingIssues,
      ...deadCodeIssues,
      ...badNamingIssues,
    ], // send raw issues for frontend/extension use
    diff: '// Diff output will go here', // placeholder
  };
};
