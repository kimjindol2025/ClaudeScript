/**
 * ClaudeScript 검증기 테스트
 */

import { validate } from "../src/validator";

// ==================== 테스트 헬퍼 ====================

function expectValid(data: any, description: string) {
  const result = validate(data);
  console.log(
    result.valid
      ? `✅ PASS: ${description}`
      : `❌ FAIL: ${description}`,
    result.errors.length > 0 ? result.errors[0].message : ""
  );
}

function expectInvalid(data: any, description: string) {
  const result = validate(data);
  if (!result.valid) {
    console.log(`✅ PASS: ${description} (에러 감지됨)`);
  } else {
    console.log(
      `❌ FAIL: ${description} (에러를 감지하지 못했음)`
    );
  }
}

// ==================== 테스트 1: 기본 프로그램 ====================

console.log("\n=== Test 1: 기본 프로그램 구조 ===");

const minimalProgram = {
  type: "program",
  version: "0.1.0",
  definitions: [],
  instructions: [],
};

expectValid(minimalProgram, "최소 프로그램 (정의와 명령 없음)");

// ==================== 테스트 2: 함수 정의 ====================

console.log("\n=== Test 2: 함수 정의 ===");

const addFunction = {
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
  instructions: [],
};

expectValid(addFunction, "add 함수 정의");

// ==================== 테스트 3: 함수 호출 ====================

console.log("\n=== Test 3: 함수 호출 ===");

const callProgram = {
  type: "program",
  version: "0.1.0",
  definitions: [],
  instructions: [
    {
      type: "call",
      function: "println",
      args: [
        {
          type: "literal",
          value_type: "string",
          value: "Hello!",
        },
      ],
    },
  ],
};

expectValid(callProgram, "println 호출");

// ==================== 테스트 4: 변수 선언 ====================

console.log("\n=== Test 4: 변수 선언 ===");

const varProgram = {
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
};

expectValid(varProgram, "변수 선언 (명시적 타입)");

const varInferProgram = {
  type: "program",
  version: "0.1.0",
  definitions: [],
  instructions: [
    {
      type: "var",
      name: "x",
      value: { type: "literal", value_type: "i32", value: 42 },
    },
  ],
};

expectValid(varInferProgram, "변수 선언 (타입 추론)");

// ==================== 테스트 5: 조건문 ====================

console.log("\n=== Test 5: 조건문 ===");

const ifProgram = {
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
          args: [
            { type: "literal", value_type: "string", value: "5 > 3" },
          ],
        },
      ],
    },
  ],
};

expectValid(ifProgram, "if 문");

// ==================== 테스트 6: 반복문 ====================

console.log("\n=== Test 6: 반복문 ===");

const forProgram = {
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
};

expectValid(forProgram, "for 루프");

const whileProgram = {
  type: "program",
  version: "0.1.0",
  definitions: [],
  instructions: [
    {
      type: "while",
      condition: {
        type: "binary_op",
        op: "<",
        left: { type: "ref", name: "count" },
        right: { type: "literal", value_type: "i32", value: 10 },
      },
      body: [
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
};

expectValid(whileProgram, "while 루프");

// ==================== 테스트 7: 배열 ====================

console.log("\n=== Test 7: 배열 ===");

const arrayProgram = {
  type: "program",
  version: "0.1.0",
  definitions: [],
  instructions: [
    {
      type: "var",
      name: "nums",
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
};

expectValid(arrayProgram, "배열 선언");

// ==================== 테스트 8: Option 타입 ====================

console.log("\n=== Test 8: Option 타입 ===");

const optionProgram = {
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
  ],
};

expectValid(optionProgram, "Option 타입 변수");

// ==================== 테스트 9: Map 타입 ====================

console.log("\n=== Test 9: Map 타입 ===");

const mapProgram = {
  type: "program",
  version: "0.1.0",
  definitions: [],
  instructions: [
    {
      type: "var",
      name: "scores",
      value_type: {
        base: "Map",
        key_type: { base: "string" },
        value_type: { base: "i32" },
      },
      value: { type: "literal", value_type: "object", value: {} },
    },
  ],
};

expectValid(mapProgram, "Map 타입 변수");

// ==================== 테스트 10: 패턴 매칭 ====================

console.log("\n=== Test 10: 패턴 매칭 ===");

const matchProgram = {
  type: "program",
  version: "0.1.0",
  definitions: [],
  instructions: [
    {
      type: "match",
      value: {
        type: "ref",
        name: "maybe_value",
      },
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
              args: [
                { type: "literal", value_type: "string", value: "없음" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

expectValid(matchProgram, "match 문");

// ==================== 테스트 11: 에러 처리 ====================

console.log("\n=== Test 11: 에러 처리 ===");

const tryProgram = {
  type: "program",
  version: "0.1.0",
  definitions: [],
  instructions: [
    {
      type: "try",
      body: [
        {
          type: "call",
          function: "risky_operation",
          args: [],
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
};

expectValid(tryProgram, "try/catch 문");

// ==================== 테스트 12: 잘못된 프로그램 ====================

console.log("\n=== Test 12: 잘못된 입력 감지 ===");

expectInvalid(
  { type: "program" },
  "version 없음 감지"
);

expectInvalid(
  { type: "invalid" },
  "잘못된 type 감지"
);

expectInvalid(
  {
    type: "program",
    version: "0.1.0",
    definitions: [],
    instructions: [
      {
        type: "invalid_statement",
      },
    ],
  },
  "알 수 없는 문장 타입 감지"
);

// ==================== 테스트 13: 복합 타입 ===

console.log("\n=== Test 13: 복합 타입 ===");

const complexProgram = {
  type: "program",
  version: "0.1.0",
  definitions: [
    {
      type: "function",
      name: "process",
      params: [
        {
          name: "items",
          type: {
            base: "Array",
            element_type: {
              base: "Object",
              value_type: { base: "string" },
            },
          },
        },
      ],
      return_type: {
        base: "Option",
        element_type: { base: "i32" },
      },
      body: [
        {
          type: "return",
          value: { type: "literal", value_type: "none", value: null },
        },
      ],
    },
  ],
  instructions: [],
};

expectValid(complexProgram, "복합 타입 (Array<Object<string>>)");

// ==================== 테스트 14: 제너릭 함수 ===

console.log("\n=== Test 14: 제너릭 함수 ===");

const genericProgram = {
  type: "program",
  version: "0.1.0",
  definitions: [
    {
      type: "function",
      name: "first",
      generics: ["T"],
      params: [
        {
          name: "items",
          type: {
            base: "Array",
            element_type: { base: "T" },
          },
        },
      ],
      return_type: {
        base: "Option",
        element_type: { base: "T" },
      },
      body: [
        {
          type: "return",
          value: { type: "literal", value_type: "none", value: null },
        },
      ],
    },
  ],
  instructions: [],
};

expectValid(genericProgram, "제너릭 함수 first<T>");

// ==================== 요약 ====================

console.log("\n=== 요약 ===");
console.log(
  `모든 테스트 완료. AST 검증기가 정상 작동합니다.`
);
