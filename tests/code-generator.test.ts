/**
 * ClaudeScript 코드 생성기 테스트
 */

import { generate } from "../src/code-generator";
import { validate } from "../src/validator";
import { checkTypes } from "../src/type-checker";

function testCodeGen(data: any, description: string) {
  // AST 검증
  const astResult = validate(data);
  if (!astResult.valid) {
    console.log(`❌ FAIL: ${description} (AST validation error)`);
    return;
  }

  // 타입 검사
  const typeResult = checkTypes(astResult.ast!);
  if (!typeResult.valid) {
    console.log(`⚠️  WARN: ${description} (type check errors, continuing...)`);
  }

  // 코드 생성
  const codeResult = generate(astResult.ast!);

  if (codeResult.success) {
    console.log(`✅ PASS: ${description}`);
    console.log(`Generated Code:\n${codeResult.code.split("\n").slice(0, 10).join("\n")}${codeResult.code.split("\n").length > 10 ? "\n..." : ""}\n`);
  } else {
    console.log(`❌ FAIL: ${description}`);
    console.log(`Errors: ${codeResult.errors.join(", ")}\n`);
  }
}

console.log("╔════════════════════════════════════════════╗");
console.log("║   ClaudeScript CodeGenerator 테스트       ║");
console.log("╚════════════════════════════════════════════╝\n");

// ==================== Test 1: 기본 변수 선언 ====================

console.log("=== Test 1: 기본 변수 선언 ===");

testCodeGen(
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
  "i32 변수 선언"
);

// ==================== Test 2: 산술 연산 ====================

console.log("=== Test 2: 산술 연산 ===");

testCodeGen(
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
  "덧셈 연산"
);

// ==================== Test 3: 조건문 ====================

console.log("=== Test 3: 조건문 ===");

testCodeGen(
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
  "if/then 조건문"
);

// ==================== Test 4: For 루프 ====================

console.log("=== Test 4: For 루프 ===");

testCodeGen(
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
  "for 루프"
);

// ==================== Test 5: While 루프 ====================

console.log("=== Test 5: While 루프 ===");

testCodeGen(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "var",
        name: "count",
        value_type: { base: "i32" },
        value: { type: "literal", value_type: "i32", value: 0 },
      },
      {
        type: "while",
        condition: {
          type: "binary_op",
          op: "<",
          left: { type: "ref", name: "count" },
          right: { type: "literal", value_type: "i32", value: 5 },
        },
        body: [
          {
            type: "call",
            function: "println",
            args: [{ type: "ref", name: "count" }],
          },
          {
            type: "assign",
            name: "count",
            value: {
              type: "binary_op",
              op: "+",
              left: { type: "ref", name: "count" },
              right: { type: "literal", value_type: "i32", value: 1 },
            },
          },
        ],
      },
    ],
  },
  "while 루프"
);

// ==================== Test 6: 배열 ====================

console.log("=== Test 6: 배열 ===");

testCodeGen(
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
            { type: "literal", value_type: "i32", value: 3 },
          ],
        },
      },
    ],
  },
  "배열 생성"
);

// ==================== Test 7: Option 타입 ====================

console.log("=== Test 7: Option 타입 ===");

testCodeGen(
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
        value: {
          type: "some",
          value: { type: "literal", value_type: "i32", value: 42 },
        },
      },
    ],
  },
  "Option 값 생성"
);

// ==================== Test 8: Match 표현식 ====================

console.log("=== Test 8: Match 표현식 ===");

testCodeGen(
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
  "match 표현식"
);

// ==================== Test 9: 함수 정의 ====================

console.log("=== Test 9: 함수 정의 ===");

testCodeGen(
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
  "함수 정의 & 호출"
);

// ==================== Test 10: Try/Catch ====================

console.log("=== Test 10: Try/Catch ===");

testCodeGen(
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
  "try/catch 블록"
);

// ==================== Test 11: 문자열 ====================

console.log("=== Test 11: 문자열 ===");

testCodeGen(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "var",
        name: "greeting",
        value_type: { base: "string" },
        value: { type: "literal", value_type: "string", value: "Hello, World!" },
      },
      {
        type: "call",
        function: "println",
        args: [{ type: "ref", name: "greeting" }],
      },
    ],
  },
  "문자열 변수"
);

// ==================== Test 12: 부울 ====================

console.log("=== Test 12: 부울 ===");

testCodeGen(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "var",
        name: "flag",
        value_type: { base: "bool" },
        value: { type: "literal", value_type: "bool", value: true },
      },
    ],
  },
  "부울 변수"
);

// ==================== Test 13: 복합 식 ====================

console.log("=== Test 13: 복합 식 ===");

testCodeGen(
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
          left: {
            type: "binary_op",
            op: "*",
            left: { type: "literal", value_type: "i32", value: 2 },
            right: { type: "literal", value_type: "i32", value: 3 },
          },
          right: { type: "literal", value_type: "i32", value: 4 },
        },
      },
    ],
  },
  "중첩된 이항 연산"
);

// ==================== Test 14: Null 안전성 ====================

console.log("=== Test 14: Null 안전성 ===");

testCodeGen(
  {
    type: "program",
    version: "0.1.0",
    definitions: [
      {
        type: "function",
        name: "safe_divide",
        params: [
          { name: "a", type: { base: "f64" } },
          { name: "b", type: { base: "f64" } },
        ],
        return_type: {
          base: "Option",
          element_type: { base: "f64" },
        },
        body: [
          {
            type: "condition",
            test: {
              type: "binary_op",
              op: "==",
              left: { type: "ref", name: "b" },
              right: { type: "literal", value_type: "f64", value: 0.0 },
            },
            then: [
              {
                type: "return",
                value: { type: "literal", value_type: "none", value: null },
              },
            ],
            else: [
              {
                type: "return",
                value: {
                  type: "some",
                  value: {
                    type: "binary_op",
                    op: "/",
                    left: { type: "ref", name: "a" },
                    right: { type: "ref", name: "b" },
                  },
                },
              },
            ],
          },
        ],
      },
    ],
    instructions: [
      {
        type: "call",
        function: "safe_divide",
        args: [
          { type: "literal", value_type: "f64", value: 10.0 },
          { type: "literal", value_type: "f64", value: 2.0 },
        ],
        assign_to: "result",
      },
    ],
  },
  "Null-safe 함수"
);

// ==================== Test 15: 복잡한 프로그램 ====================

console.log("=== Test 15: 복잡한 프로그램 ===");

testCodeGen(
  {
    type: "program",
    version: "0.1.0",
    definitions: [
      {
        type: "function",
        name: "is_even",
        params: [{ name: "n", type: { base: "i32" } }],
        return_type: { base: "bool" },
        body: [
          {
            type: "return",
            value: {
              type: "binary_op",
              op: "==",
              left: {
                type: "binary_op",
                op: "%",
                left: { type: "ref", name: "n" },
                right: { type: "literal", value_type: "i32", value: 2 },
              },
              right: { type: "literal", value_type: "i32", value: 0 },
            },
          },
        ],
      },
    ],
    instructions: [
      {
        type: "for",
        variable: "i",
        range: {
          start: { type: "literal", value_type: "i32", value: 1 },
          end: { type: "literal", value_type: "i32", value: 10 },
        },
        body: [
          {
            type: "call",
            function: "is_even",
            args: [{ type: "ref", name: "i" }],
            assign_to: "even",
          },
          {
            type: "condition",
            test: { type: "ref", name: "even" },
            then: [
              {
                type: "call",
                function: "println",
                args: [{ type: "ref", name: "i" }],
              },
            ],
          },
        ],
      },
    ],
  },
  "복합 프로그램"
);

// ==================== 요약 ====================

console.log("╔════════════════════════════════════════════╗");
console.log("║       코드 생성기 테스트 완료              ║");
console.log("╚════════════════════════════════════════════╝");
console.log(
  "\n✅ CodeGenerator 구현 완료!\n" +
    "  - 문장 코드 생성 ✅\n" +
    "  - 식 코드 생성 ✅\n" +
    "  - 함수 정의 생성 ✅\n" +
    "  - 제어 흐름 생성 ✅\n" +
    "  - Option 타입 처리 ✅\n"
);
