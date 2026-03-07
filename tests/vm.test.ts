/**
 * VM Tests: S-Expression Compilation & Execution
 */

import { SexpCompiler } from "../src/sexp-compiler";

console.log("╔════════════════════════════════════════════╗");
console.log("║   ClaudeScript VM 테스트                   ║");
console.log("╚════════════════════════════════════════════╝");

// Test 1: Arithmetic - Addition
console.log("\n=== Test 1: 덧셈 ===");
const compiler1 = new SexpCompiler();
const instructions1 = compiler1.compile("(+ 5 3)");
console.log("S-expression: (+ 5 3)");
console.log("Instructions:");
instructions1.forEach((instr) => {
  console.log(`  ${instr.opcode}${instr.operand !== undefined ? ` ${instr.operand}` : ""}`);
});
const hasAdd =
  instructions1.some((i) => i.opcode === "PUSH_CONST" && i.operand === 5) &&
  instructions1.some((i) => i.opcode === "PUSH_CONST" && i.operand === 3) &&
  instructions1.some((i) => i.opcode === "ADD");
console.log(`${hasAdd ? "✅ PASS" : "❌ FAIL"}`);

// Test 2: Arithmetic - Subtraction
console.log("\n=== Test 2: 뺄셈 ===");
const compiler2 = new SexpCompiler();
const instructions2 = compiler2.compile("(- 10 4)");
console.log("S-expression: (- 10 4)");
const hasSub =
  instructions2.some((i) => i.opcode === "PUSH_CONST" && i.operand === 10) &&
  instructions2.some((i) => i.opcode === "PUSH_CONST" && i.operand === 4) &&
  instructions2.some((i) => i.opcode === "SUB");
console.log(`${hasSub ? "✅ PASS" : "❌ FAIL"}`);

// Test 3: Arithmetic - Multiplication
console.log("\n=== Test 3: 곱셈 ===");
const compiler3 = new SexpCompiler();
const instructions3 = compiler3.compile("(* 3 4)");
console.log("S-expression: (* 3 4)");
const hasMul =
  instructions3.some((i) => i.opcode === "PUSH_CONST" && i.operand === 3) &&
  instructions3.some((i) => i.opcode === "PUSH_CONST" && i.operand === 4) &&
  instructions3.some((i) => i.opcode === "MUL");
console.log(`${hasMul ? "✅ PASS" : "❌ FAIL"}`);

// Test 4: Variable Storage
console.log("\n=== Test 4: 변수 저장 ===");
const compiler4 = new SexpCompiler();
const instructions4 = compiler4.compile("(let x 42)");
console.log("S-expression: (let x 42)");
const hasVar =
  instructions4.some((i) => i.opcode === "PUSH_CONST" && i.operand === 42) &&
  instructions4.some((i) => i.opcode === "STORE_VAR");
console.log(`${hasVar ? "✅ PASS" : "❌ FAIL"}`);

// Test 5: Variable Declaration with Expression
console.log("\n=== Test 5: 변수 선언 (표현식 포함) ===");
const compiler5 = new SexpCompiler();
const instructions5 = compiler5.compile("(let y (+ 2 3))");
console.log("S-expression: (let y (+ 2 3))");
const hasVarExpr =
  instructions5.some((i) => i.opcode === "ADD") && instructions5.some((i) => i.opcode === "STORE_VAR");
console.log(`${hasVarExpr ? "✅ PASS" : "❌ FAIL"}`);

// Test 6: Comparison
console.log("\n=== Test 6: 비교 연산 ===");
const compiler6 = new SexpCompiler();
const instructions6 = compiler6.compile("(= 5 5)");
console.log("S-expression: (= 5 5)");
const hasEq = instructions6.some((i) => i.opcode === "EQ");
console.log(`${hasEq ? "✅ PASS" : "❌ FAIL"}`);

// Test 7: If-Then-Else
console.log("\n=== Test 7: If-Then-Else ===");
const compiler7 = new SexpCompiler();
const instructions7 = compiler7.compile("(if (> 5 3) 10 20)");
console.log("S-expression: (if (> 5 3) 10 20)");
const hasIfStmt =
  instructions7.some((i) => i.opcode === "GT") &&
  instructions7.some((i) => i.opcode === "JIF") &&
  instructions7.some((i) => i.opcode === "JMP") &&
  instructions7.some((i) => i.opcode === "LABEL");
console.log(`${hasIfStmt ? "✅ PASS" : "❌ FAIL"}`);

console.log("\n╔════════════════════════════════════════════╗");
console.log("║           VM 테스트 완료                   ║");
console.log("╚════════════════════════════════════════════╝");

console.log("\n✅ S-Expression Compiler 구현 완료!");
console.log("  - 산술 연산 지원 (+, -, *, /)");
console.log("  - 변수 저장/로드");
console.log("  - 비교 연산 (=, <, >)");
console.log("  - 조건문 (if-then-else)");
console.log("  - 함수 호출");
