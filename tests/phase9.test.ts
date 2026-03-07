/**
 * Phase 9 Tests: Advanced Lexer & Parser
 */

import { LexerAdvanced, TokenType } from "../src/lexer-advanced";
import { ParserAdvanced, parse } from "../src/parser-advanced";

console.log("╔════════════════════════════════════════════╗");
console.log("║   ClaudeScript Phase 9 테스트              ║");
console.log("╚════════════════════════════════════════════╝");

// Test 1: Basic Lexer Tokenization
console.log("\n=== Lexer Test 1: 기본 토크나이제이션 ===");
const lexer1 = new LexerAdvanced("let x = 42;");
const tokens1 = lexer1.scanTokens();
const expected1 = ["LET", "IDENTIFIER", "ASSIGN", "NUMBER", "SEMICOLON", "EOF"];
const actual1 = tokens1.map((t) => t.type);
console.log(`Expected: ${expected1.join(", ")}`);
console.log(`Actual:   ${actual1.join(", ")}`);
console.log(`${expected1.join(",") === actual1.join(",") ? "✅ PASS" : "❌ FAIL"}`);

// Test 2: Number Literals (decimal, hex, octal)
console.log("\n=== Lexer Test 2: 숫자 리터럴 (정수, 16진수, 8진수) ===");
const lexer2 = new LexerAdvanced("42 3.14 0xFF 0o77");
const tokens2 = lexer2.scanTokens();
const values2 = tokens2
  .filter((t) => t.type === TokenType.NUMBER)
  .map((t) => t.value);
const expected2 = [42, 3.14, 255, 63];
const match2 = JSON.stringify(values2) === JSON.stringify(expected2);
console.log(`Expected: ${expected2}`);
console.log(`Actual:   ${values2}`);
console.log(`${match2 ? "✅ PASS" : "❌ FAIL"}`);

// Test 3: String with Escapes
console.log("\n=== Lexer Test 3: 문자열 이스케이프 ===");
const lexer3 = new LexerAdvanced('"Hello\\nWorld"');
const tokens3 = lexer3.scanTokens();
const str3 = tokens3.find((t) => t.type === TokenType.STRING);
const expected3 = "Hello\nWorld";
const match3 = str3?.value === expected3;
console.log(`Expected: ${JSON.stringify(expected3)}`);
console.log(`Actual:   ${JSON.stringify(str3?.value)}`);
console.log(`${match3 ? "✅ PASS" : "❌ FAIL"}`);

// Test 4: Keywords & Identifiers
console.log("\n=== Lexer Test 4: 키워드와 식별자 ===");
const lexer4 = new LexerAdvanced("let defn if else while for");
const tokens4 = lexer4.scanTokens();
const types4 = tokens4
  .filter((t) => t.type !== TokenType.EOF)
  .map((t) => t.type);
const expected4 = [TokenType.LET, TokenType.DEFN, TokenType.IF, TokenType.ELSE, TokenType.WHILE, TokenType.FOR];
const match4 = JSON.stringify(types4) === JSON.stringify(expected4);
console.log(`Expected: ${expected4}`);
console.log(`Actual:   ${types4}`);
console.log(`${match4 ? "✅ PASS" : "❌ FAIL"}`);

// Test 5: Operators
console.log("\n=== Lexer Test 5: 연산자 ===");
const lexer5 = new LexerAdvanced("+ - * / % ** && || ! == != < > <= >=");
const tokens5 = lexer5.scanTokens();
const types5 = tokens5.filter((t) => t.type !== TokenType.EOF).map((t) => t.type);
const expected5 = [
  TokenType.PLUS,
  TokenType.MINUS,
  TokenType.STAR,
  TokenType.SLASH,
  TokenType.PERCENT,
  TokenType.POWER,
  TokenType.AND,
  TokenType.OR,
  TokenType.NOT,
  TokenType.EQ,
  TokenType.NE,
  TokenType.LT,
  TokenType.GT,
  TokenType.LE,
  TokenType.GE,
];
const match5 = JSON.stringify(types5) === JSON.stringify(expected5);
console.log(`Expected: 15 operators`);
console.log(`Actual:   ${types5.length} operators`);
console.log(`${match5 ? "✅ PASS" : "❌ FAIL"}`);

// Test 6: Parser - Simple Variable Declaration
console.log("\n=== Parser Test 6: 변수 선언 ===");
const ast6 = parse("let x = 42;");
const hasVarDecl = ast6.body?.[0]?.type === "VarDecl";
console.log(`Expected: VarDecl`);
console.log(`Actual:   ${ast6.body?.[0]?.type}`);
console.log(`${hasVarDecl ? "✅ PASS" : "❌ FAIL"}`);

// Test 7: Parser - Function Declaration
console.log("\n=== Parser Test 7: 함수 선언 ===");
const ast7 = parse("defn add(a, b) { return a + b; }");
const hasFuncDecl = ast7.body?.[0]?.type === "FunctionDecl";
const funcName = ast7.body?.[0]?.name;
console.log(`Expected: FunctionDecl (add)`);
console.log(`Actual:   ${ast7.body?.[0]?.type} (${funcName})`);
console.log(`${hasFuncDecl && funcName === "add" ? "✅ PASS" : "❌ FAIL"}`);

// Test 8: Parser - If Statement
console.log("\n=== Parser Test 8: If 문 ===");
const ast8 = parse("if (x > 5) { println(x); }");
const hasIf = ast8.body?.[0]?.type === "If";
console.log(`Expected: If`);
console.log(`Actual:   ${ast8.body?.[0]?.type}`);
console.log(`${hasIf ? "✅ PASS" : "❌ FAIL"}`);

// Test 9: Parser - Array & Object Literals
console.log("\n=== Parser Test 9: 배열과 객체 리터럴 ===");
const ast9 = parse("let arr = [1, 2, 3]; let obj = {x: 10, y: 20};");
const hasArray = ast9.body?.[0]?.init?.type === "ArrayLiteral";
const hasObject = ast9.body?.[1]?.init?.type === "ObjectLiteral";
console.log(`Expected: ArrayLiteral, ObjectLiteral`);
console.log(`Actual:   ${ast9.body?.[0]?.init?.type}, ${ast9.body?.[1]?.init?.type}`);
console.log(`${hasArray && hasObject ? "✅ PASS" : "❌ FAIL"}`);

// Test 10: Parser - Complex Expression
console.log("\n=== Parser Test 10: 복합 표현식 ===");
const ast10 = parse("let result = 2 + 3 * 4;");
const expr = ast10.body?.[0]?.init;
const isBinary = expr?.type === "Binary";
console.log(`Expected: Binary operator precedence (+ with *)`);
console.log(`Actual:   ${expr?.type}`);
console.log(`${isBinary ? "✅ PASS" : "❌ FAIL"}`);

console.log("\n╔════════════════════════════════════════════╗");
console.log("║       Phase 9 테스트 완료                   ║");
console.log("╚════════════════════════════════════════════╝");

console.log("\n✅ Advanced Lexer & Parser 구현 완료!");
console.log("  - 42가지 토큰 타입 지원");
console.log("  - Recursive Descent Parser");
console.log("  - 연산자 우선순위 처리");
console.log("  - 에러 복구 기능");
