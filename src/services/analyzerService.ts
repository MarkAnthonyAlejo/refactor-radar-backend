// services/analyzerService.ts
import { parseCodeToAST } from '../utils/treeSitterParser';
import {
  detectLongFunctions,
  detectDeepNesting,
  detectDuplicateCode,
  detectDuplicateBlocks,
  detectDeadCode,
  detectBadNaming,
  detectCyclomaticComplexity,
  type Issue,
} from '../utils/astIssuesDetector';
import 'dotenv/config'
import OpenAI from 'openai';

// 🔹 NEW: import diff generator
import { createTwoFilesPatch } from 'diff';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeParseJSON(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const analyzeAndRefactorService = async (
  filename: string,
  code: string,
  language: string
) => {
  // 1 - AST analysis
  const ast = parseCodeToAST(filename, code, language);

  const longFunctionIssues = detectLongFunctions(ast);
  const deepNestingIssues = detectDeepNesting(ast);
  const duplicateCodeIssues = detectDuplicateCode(ast);
  const duplicateBlockIssues = detectDuplicateBlocks(ast);
  const deadCodeIssues = detectDeadCode(ast);
  const badNamingIssues = detectBadNaming(ast);
  const ccIssues = detectCyclomaticComplexity(ast);

  const allIssues: Issue[] = [
    ...longFunctionIssues,
    ...deepNestingIssues,
    ...duplicateCodeIssues,
    ...duplicateBlockIssues,
    ...deadCodeIssues,
    ...badNamingIssues,
    ...ccIssues,
  ];

  // 2 - Prompt
  const codeSummary = allIssues.map(i => `${i.type}: ${i.message}`).join('\n');
  const prompt = `
You are an expert software engineer.

Analyze the following code:

\`\`\`
${code}
\`\`\`

Detected issues:
${codeSummary || '(none)'}

Tasks:
1. Assign a technical debt score (0-100).
2. Provide a refactored version of the code.
3. Explain why you assigned this score.

Respond strictly in JSON:
{
  "techDebtScore": number,
  "refactoredCode": "string",
  "explanation": "string"
}
`;

  // 3 - Call OpenAI
  let aiOutput: any = {
    techDebtScore: 50,
    refactoredCode: code,
    explanation: 'Default fallback.',
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
    });

    const raw = response.choices[0]?.message?.content ?? '';
    const parsed = safeParseJSON(raw);
    console.log('Ai parse resp: ', parsed)

    if (parsed) {
      aiOutput = parsed;
    }
  } catch (err) {
    console.error('OpenAI error:', err);
  }

  // 4 - Generate unified diff between original and refactored code
  let diff = '';
  try {
    diff = createTwoFilesPatch(
      filename,
      `${filename} (refactored)`,
      code,
      aiOutput.refactoredCode || code
    );
  } catch (err) {
    console.error('Diff generation error:', err);
    diff = '// Failed to generate diff';
  }

  // 5 - Return structured response
 return {
  filename,
  language,
  originalCode: code,
  techDebtScore: aiOutput.techDebtScore,
  refactoredCode: aiOutput.refactoredCode,
  explanation: aiOutput.explanation,
  suggestions: [
     ...longFunctionIssues.map(i => i.message),
    ...deepNestingIssues.map(i => i.message),
    ...duplicateCodeIssues.map(i => i.message),
    ...duplicateBlockIssues.map(i => i.message),
    ...deadCodeIssues.map(i => i.message),
    ...badNamingIssues.map(i => i.message),
  ],
  issues: allIssues,
  diff,  // the real unified diff string from step 9
};

};

// Alternative version for return (optional but not needed)
// return {
//   filename,
//   language,
//   originalCode: code,
//   techDebtScore: aiOutput.techDebtScore,
//   refactoredCode: aiOutput.refactoredCode,
//   explanation: aiOutput.explanation,
//   suggestions: [
//     ...longFunctionIssues.map(i => i.message),
//     ...deepNestingIssues.map(i => i.message),
//     ...
//   ],
//   issues: allIssues,
//   diff,  // the real unified diff string from step 9
// };

//  language,
//   techDebtScore: aiOutput.techDebtScore,
//   issues: allIssues,  // full list of issues (type + message)
//   complexity: ccIssues,  // per-function cyclomatic complexity info
//   refactoredCode: aiOutput.refactoredCode,
//   diff,  // generated unified diff
//   suggestions: [
//     ...longFunctionIssues.map(i => i.message),
//     ...deepNestingIssues.map(i => i.message),
//     ...duplicateCodeIssues.map(i => i.message),
//     ...duplicateBlockIssues.map(i => i.message),
//     ...deadCodeIssues.map(i => i.message),
//     ...badNamingIssues.map(i => i.message),
//   ],
//   explanation: aiOutput.explanation,