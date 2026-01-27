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
import 'dotenv/config';
import OpenAI from 'openai';
import { createTwoFilesPatch } from 'diff';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Enhanced JSON parser to handle cases where the AI 
 * might wrap responses in markdown code blocks.
 */
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
  // 1 - AST analysis: Gather all technical issues
  const ast = parseCodeToAST(filename, code, language);

  const longFunctionIssues = detectLongFunctions(ast);
  const deepNestingIssues = detectDeepNesting(ast);
  const duplicateCodeIssues = detectDuplicateCode(ast);
  const duplicateBlockIssues = detectDuplicateBlocks(ast);
  const deadCodeIssues = detectDeadCode(ast);
  const badNamingIssues = detectBadNaming(ast);
  const ccIssues = detectCyclomaticComplexity(ast);

  // Combine all issues into one array for the prompt and the response
  const allIssues: Issue[] = [
    ...longFunctionIssues,
    ...deepNestingIssues,
    ...duplicateCodeIssues,
    ...duplicateBlockIssues,
    ...deadCodeIssues,
    ...badNamingIssues,
    ...ccIssues,
  ];

  // 2 - Create the Prompt
  const codeSummary = allIssues.map(i => `${i.type}: ${i.message}`).join('\n');

  const prompt = `
You are an expert software engineer. Respond ONLY in a valid JSON object.

Analyze the following code:
\`\`\`
${code}
\`\`\`

Detected issues from static analysis:
${codeSummary || '(none)'}

Tasks:
1. Assign a technical debt score (0-100).
2. Provide a refactored version of the code.
3. Explain why you assigned this score.
4. Provide a list of specific, actionable suggestions for further improvement.

Respond strictly in JSON with this structure:
{
  "techDebtScore": number,
  "refactoredCode": "string",
  "explanation": "string",
  "suggestions": ["string"]
}

Rules for refactoredCode:
- Preserve original structure unless simplifying.
- DO NOT include comments.
- DO NOT duplicate existing function calls.
- Make code clean, readable, and runnable.
`;

  // 3 - Call OpenAI
  let aiOutput: any = {
    techDebtScore: 50,
    refactoredCode: code,
    explanation: 'Default fallback (AI failed to respond).',
    suggestions: []
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      // Forces the model to output a valid JSON object
      response_format: { type: "json_object" } 
    });

    const raw = response.choices[0]?.message?.content ?? '';
    
    // Check your Render/Terminal logs for this output!
    console.log(`--- [AI Response for ${filename}] ---`);
    console.log(raw);
    console.log("--------------------------------------");

    const parsed = safeParseJSON(raw);

    if (parsed) {
      aiOutput = parsed;
    }
  } catch (err) {
    console.error('OpenAI error:', err);
  }

  // 4 - Generate unified diff
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

  // 5 - Merge AST issues and AI suggestions into the final 'suggestions' array
  const finalSuggestions = Array.from(new Set([
    ...(aiOutput.suggestions || []),
    ...allIssues.map(i => i.message)
  ]));

  return {
    filename,
    language,
    originalCode: code,
    techDebtScore: aiOutput.techDebtScore,
    refactoredCode: aiOutput.refactoredCode,
    explanation: aiOutput.explanation,
    suggestions: finalSuggestions,
    issues: allIssues,
    diff,
  };
};