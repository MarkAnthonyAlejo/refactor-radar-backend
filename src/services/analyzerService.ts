// services/analyzerService.ts
import { parseCodeToAST } from '../utils/treeSitterParser';
// import { astNodeToJSON } from '../utils/astNodeToJSON';
import { detectLongFunctions } from '../utils/astIssuesDetector';
import type { Issue } from '../utils/astIssuesDetector';
import { detectDeepNesting } from '../utils/astIssuesDetector';

export const analyzeCodeService = async (
  filename: string,
  code: string,
  language: string
) => {
  // ✅ Step 1: Parse code into AST
  const ast = parseCodeToAST(filename, code, language);

  // Debug: Dump top-level AST as string (optional)
  console.log('AST rootNode string:', ast.toString());

  // ✅ Step 2: Detect long functions, Deep nesting 
  const longFunctionIssues: Issue[] = detectLongFunctions(ast);
  //Console logs to test Long Functions 
  // console.log('Detected long functions:', longFunctionIssues);
  // console.log('L.F', code)
  // console.log('Type lang', language)

  const deepNestingIssues = detectDeepNesting(ast);
  //Console logs to test Deep Nesting 
  // console.log('Detected deep nesting:', deepNestingIssues);
  // console.log('D.N', code)
  // console.log('Type lang:', language)

  // Optional: Convert AST to JSON for debugging/visualization
  // console.log(JSON.stringify(astNodeToJSON(ast), null, 2));

  // ✅ Step 3: Return structured response including detected issues
  return {
    filename,
    language,
    originalCode: code,
    refactoredCode: '// Refactored code would go here', // placeholder
    suggestions: [
      ...longFunctionIssues.map(i => i.message),
      ...deepNestingIssues.map(i => i.message), // actual issues
      'Use const instead of let',
      'Extract logic into smaller functions',
    ],
    techDebtScore: 65, // placeholder
    issues: [...longFunctionIssues,...deepNestingIssues], // send raw issues for frontend/extension use
    diff: '// Diff output will go here', // placeholder
  };
};
