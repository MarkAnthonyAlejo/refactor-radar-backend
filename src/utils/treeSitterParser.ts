// utils/treeSitterParser.ts
import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript/typescript';
import TSX from 'tree-sitter-typescript/tsx';

// Map language name to the correct grammar module
const languageMap: Record<string, any> = {
    javascript: JavaScript,
    typescript: TypeScript,
    tsx: TSX
};

export function parseCodeToAST(filename: string, code: string, language: string) {
    const parser = new Parser();

    const treeSitterLang = languageMap[language];

    if (!treeSitterLang) {
        throw new Error(`Unsupported Tree-sitter language: ${language}`);
    }

    parser.setLanguage(treeSitterLang);
    const tree = parser.parse(code);

    return tree.rootNode; // This is the AST's root
}
