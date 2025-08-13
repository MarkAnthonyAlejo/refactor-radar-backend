//For the exsiting code now is just for testing on postman 
//Extra code is needed for the service to work completed and is needing
//further testing. 

import { parseCodeToAST } from "../utils/treeSitterParser";
import { astNodeToJSON } from "../utils/astNodeToJSON.";

export const analyzeCodeService = async (code: string, filename: string, language: string) => {
  // In the real version, you'll:
  // - Parse the code with TreeSitter
   // ✅ Step 1: Parse code into AST
  const ast = parseCodeToAST(filename,code, language);

  // ✅ Step 2: Example debug output (view structure of AST)
 console.log(JSON.stringify(astNodeToJSON(ast), null, 2));

  // ⏳ Step 3: You’ll analyze this AST in the next steps...

  // - Calculate metrics
  // - Ask GPT for suggestions

  // Dummy response for now:
  return {
    filename,
    language,
    originalCode: code,
    refactoredCode: "// Refactored code would go here", // Dummy response for now
    suggestions: ["Use const instead of let", "Extract logic into a function"], // Dummy response for now
    techDebtScore: 65, // Dummy response for now
    diff: "// Diff output will go here" // Dummy response for now
  };
};
