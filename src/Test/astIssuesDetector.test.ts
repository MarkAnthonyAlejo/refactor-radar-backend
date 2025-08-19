import Parser from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import { detectDeadCode, detectBadNaming } from '../utils/astIssuesDetector';

//install jest:
// npm install --save-dev jest ts-jest @types/jest

//configure for typescript:
// npx ts-jest config:init

//run test:
// npx jest

const parser = new Parser();
parser.setLanguage(JavaScript);

describe('AST Issue Detectors', () => {
  it('detects dead code', () => {
    const code = `
      function foo() {
        return 1;
        let x = 2; // unreachable
      }
    `;
    const tree = parser.parse(code);
    const issues = detectDeadCode(tree.rootNode);
    expect(issues.some((i) => i.type === 'dead-code')).toBe(true);
  });

  it('detects bad naming', () => {
    const code = `
      let foo = 1;
      let x = 2;
      let i = 3;
      let z = 4;
    `;
    const tree = parser.parse(code);
    const issues = detectBadNaming(tree.rootNode);
    expect(issues.some((i) => i.message.includes('foo'))).toBe(true);
    expect(issues.some((i) => i.message.includes('z'))).toBe(true);
    expect(
      issues.some((i) => i.message === 'Suspicious variable name: "i"')
    ).toBe(false); // i is allowed as it is used in loops so it should not be flagged
    //use exact match rather than includes to avoid false positives from other words in the message
  });
});
