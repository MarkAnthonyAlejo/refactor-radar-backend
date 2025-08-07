// utils/treeSitterParser.ts
import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';

// Map language name to the correct grammar module
const languageMap: Record<string, any> = {
    javascript: JavaScript
};

export function parseCodeToAST(code: string, language: string) {
    const parser = new Parser();

    const treeSitterLang = languageMap[language];

    if (!treeSitterLang) {
        throw new Error(`Unsupported Tree-sitter language: ${language}`);
    }

    parser.setLanguage(treeSitterLang);
    const tree = parser.parse(code);

    return tree.rootNode; // This is the AST's root
}
