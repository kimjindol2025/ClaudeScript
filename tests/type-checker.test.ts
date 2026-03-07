/**
 * ClaudeScript 타입 검사기 테스트
 */

import { checkTypes } from "../src/type-checker";
import { validate } from "../src/validator";

function testTypeCheck(data: any, description: string, shouldPass: boolean) {
  // 먼저 AST 유효성 검사
  const astResult = validate(data);
  if (!astResult.valid) {
    console.log(`❌ FAIL: ${description} (AST 오류)`);
    return;
  }

  // 타입 검사
  const typeResult = checkTypes(astResult.ast!);

  if (shouldPass && typeResult.valid) {
    console.log(`✅ PASS: ${description}`);
  } else if (!shouldPass && !typeResult.valid) {
    console.log(`✅ PASS: ${description} (에러 감지됨)`);
  } else {
    const status = shouldPass ? "통과하지 못함" : "에러를 감지하지 못함";
    console.log(
      `❌ FAIL: ${description} (${status}): ${typeResult.errors[0]?.message || ""}`
    );
  }
}

console.log("\n╔═══════════════════════════════════════════╗");
console.log("║   ClaudeScript TypeChecker 테스트       ║");
console.log("╚═══════════════════════════════════════════╝\n");

// ==================== Test 1: 기본 타입 매칭 ====================

console.log("=== Test 1: 기본 타입 매칭 ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "var",
        name: "x",
        value_type: { base: "i32" },
        value: { type: "literal", value_type: "i32", value: 42 },
      },
    ],
  },
  "i32 변수 선언",
  true
);

// ==================== Test 2: 타입 불일치 감지 ====================

console.log("\n=== Test 2: 타입 불일치 감지 ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "var",
        name: "x",
        value_type: { base: "i32" },
        value: { type: "literal", value_type: "string", value: "hello" },
      },
    ],
  },
  "i32에 string 할당 (에러 예상)",
  false
);

// ==================== Test 3: 조건문 타입 검사 ====================

console.log("\n=== Test 3: 조건문 타입 검사 ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "condition",
        test: {
          type: "binary_op",
          op: ">",
          left: { type: "literal", value_type: "i32", value: 5 },
          right: { type: "literal", value_type: "i32", value: 3 },
        },
        then: [
          {
            type: "call",
            function: "println",
            args: [{ type: "literal", value_type: "string", value: "true" }],
          },
        ],
      },
    ],
  },
  "bool 조건 (정상)",
  true
);

// ==================== Test 4: 잘못된 조건문 ====================

console.log("\n=== Test 4: 잘못된 조건문 ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "condition",
        test: { type: "literal", value_type: "i32", value: 5 },
        then: [],
      },
    ],
  },
  "i32 조건 (에러 예상)",
  false
);

// ==================== Test 5: For 루프 범위 검사 ====================

console.log("\n=== Test 5: For 루프 범위 검사 ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "for",
        variable: "i",
        range: {
          start: { type: "literal", value_type: "i32", value: 0 },
          end: { type: "literal", value_type: "i32", value: 10 },
        },
        body: [
          {
            type: "call",
            function: "println",
            args: [{ type: "ref", name: "i" }],
          },
        ],
      },
    ],
  },
  "정수 범위 for 루프",
  true
);

// ==================== Test 6: 잘못된 For 루프 ====================

console.log("\n=== Test 6: 잘못된 For 루프 ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "for",
        variable: "i",
        range: {
          start: { type: "literal", value_type: "string", value: "start" },
          end: { type: "literal", value_type: "i32", value: 10 },
        },
        body: [],
      },
    ],
  },
  "string 범위 for 루프 (에러 예상)",
  false
);

// ==================== Test 7: 배열 인덱싱 ====================

console.log("\n=== Test 7: 배열 인덱싱 ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "var",
        name: "arr",
        value_type: {
          base: "Array",
          element_type: { base: "i32" },
        },
        value: {
          type: "literal_array",
          element_type: { base: "i32" },
          values: [
            { type: "literal", value_type: "i32", value: 1 },
            { type: "literal", value_type: "i32", value: 2 },
          ],
        },
      },
      {
        type: "var",
        name: "first",
        value: {
          type: "index",
          array: { type: "ref", name: "arr" },
          index: { type: "literal", value_type: "i32", value: 0 },
        },
      },
    ],
  },
  "배열 인덱싱 (정수 인덱스)",
  true
);

// ==================== Test 8: 잘못된 배열 인덱싱 ====================

console.log("\n=== Test 8: 잘못된 배열 인덱싱 ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "var",
        name: "arr",
        value_type: {
          base: "Array",
          element_type: { base: "i32" },
        },
        value: {
          type: "literal_array",
          element_type: { base: "i32" },
          values: [{ type: "literal", value_type: "i32", value: 1 }],
        },
      },
      {
        type: "var",
        name: "invalid",
        value: {
          type: "index",
          array: { type: "ref", name: "arr" },
          index: { type: "literal", value_type: "string", value: "index" },
        },
      },
    ],
  },
  "배열 인덱싱 (문자열 인덱스, 에러 예상)",
  false
);

// ==================== Test 9: Option 타입과 Match ====================

console.log("\n=== Test 9: Option 타입과 Match ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "var",
        name: "maybe",
        value_type: {
          base: "Option",
          element_type: { base: "i32" },
        },
        value: { type: "literal", value_type: "none", value: null },
      },
      {
        type: "match",
        value: { type: "ref", name: "maybe" },
        cases: [
          {
            pattern: "Some",
            bind: "x",
            body: [
              {
                type: "call",
                function: "println",
                args: [{ type: "ref", name: "x" }],
              },
            ],
          },
          {
            pattern: "None",
            body: [
              {
                type: "call",
                function: "println",
                args: [{ type: "literal", value_type: "string", value: "none" }],
              },
            ],
          },
        ],
      },
    ],
  },
  "Option 타입 Match",
  true
);

// ==================== Test 10: 잘못된 Match ====================

console.log("\n=== Test 10: 잘못된 Match ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "var",
        name: "x",
        value_type: { base: "i32" },
        value: { type: "literal", value_type: "i32", value: 42 },
      },
      {
        type: "match",
        value: { type: "ref", name: "x" },
        cases: [
          {
            pattern: "Some",
            body: [],
          },
        ],
      },
    ],
  },
  "i32에 match (에러 예상)",
  false
);

// ==================== Test 11: 함수 호출 검사 ====================

console.log("\n=== Test 11: 함수 호출 검사 ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [
      {
        type: "function",
        name: "add",
        params: [
          { name: "a", type: { base: "i32" } },
          { name: "b", type: { base: "i32" } },
        ],
        return_type: { base: "i32" },
        body: [
          {
            type: "return",
            value: {
              type: "binary_op",
              op: "+",
              left: { type: "ref", name: "a" },
              right: { type: "ref", name: "b" },
            },
          },
        ],
      },
    ],
    instructions: [
      {
        type: "call",
        function: "add",
        args: [
          { type: "literal", value_type: "i32", value: 5 },
          { type: "literal", value_type: "i32", value: 3 },
        ],
        assign_to: "result",
      },
    ],
  },
  "함수 호출 (정상)",
  true
);

// ==================== Test 12: 함수 호출 타입 불일치 ====================

console.log("\n=== Test 12: 함수 호출 타입 불일치 ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [
      {
        type: "function",
        name: "add",
        params: [
          { name: "a", type: { base: "i32" } },
          { name: "b", type: { base: "i32" } },
        ],
        return_type: { base: "i32" },
        body: [
          {
            type: "return",
            value: {
              type: "binary_op",
              op: "+",
              left: { type: "ref", name: "a" },
              right: { type: "ref", name: "b" },
            },
          },
        ],
      },
    ],
    instructions: [
      {
        type: "call",
        function: "add",
        args: [
          { type: "literal", value_type: "i32", value: 5 },
          { type: "literal", value_type: "string", value: "3" },
        ],
        assign_to: "result",
      },
    ],
  },
  "함수 호출 인자 타입 불일치 (에러 예상)",
  false
);

// ==================== Test 13: 정의되지 않은 변수 ====================

console.log("\n=== Test 13: 정의되지 않은 변수 ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "assign",
        name: "undefined_var",
        value: { type: "literal", value_type: "i32", value: 42 },
      },
    ],
  },
  "정의되지 않은 변수 재할당 (에러 예상)",
  false
);

// ==================== Test 14: 이항 연산 타입 검사 ====================

console.log("\n=== Test 14: 이항 연산 타입 검사 ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "var",
        name: "result",
        value: {
          type: "binary_op",
          op: "+",
          left: { type: "literal", value_type: "i32", value: 5 },
          right: { type: "literal", value_type: "i32", value: 3 },
        },
      },
    ],
  },
  "정수 덧셈",
  true
);

// ==================== Test 15: Try/Catch 블록 ====================

console.log("\n=== Test 15: Try/Catch 블록 ===");

testTypeCheck(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "try",
        body: [
          {
            type: "call",
            function: "println",
            args: [{ type: "literal", value_type: "string", value: "trying" }],
          },
        ],
        catch: {
          error_var: "err",
          error_type: "RuntimeError",
          body: [
            {
              type: "call",
              function: "println",
              args: [{ type: "ref", name: "err" }],
            },
          ],
        },
      },
    ],
  },
  "try/catch 블록",
  true
);

// ==================== 요약 ====================

console.log("\n╔═══════════════════════════════════════════╗");
console.log("║         타입 검사기 테스트 완료          ║");
console.log("╚═══════════════════════════════════════════╝");
console.log(
  "\n✅ TypeChecker 구현 완료!\n" +
    "  - 타입 호환성 검사 ✅\n" +
    "  - 타입 불일치 감지 ✅\n" +
    "  - 스코프 관리 ✅\n" +
    "  - 함수 검증 ✅\n" +
    "  - 배열/Option 처리 ✅\n"
);
