/**
 * Phase 10: E2E Tests
 *
 * Advanced Parser → Advanced Code Generator → VM 통합 테스트
 */

import { ParserAdvanced } from "../src/parser-advanced";
import { AdvancedCodeGenerator } from "../src/phase9-codegen";

describe("Phase 10: Advanced Code Generation E2E", () => {
  function compile(source: string) {
    const parser = new ParserAdvanced(source);
    const ast = parser.parse();

    const codegen = new AdvancedCodeGenerator();
    const result = codegen.generate(ast);

    return {
      ast,
      instructions: result.instructions,
      errors: result.errors,
      success: result.errors.length === 0,
    };
  }

  test("Test 1: Array Creation & Access", () => {
    const source = `
      let arr = [10, 20, 30];
      let x = arr[0];
      let y = arr[2];
      return arr;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.instructions).toBeDefined();
    expect(result.instructions.length).toBeGreaterThan(0);
  });

  test("Test 2: Object Creation & Access", () => {
    const source = `
      let person = {name: "Alice", age: 30, active: true};
      let name = person.name;
      let age = person["age"];
      return person;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.ast.body.length).toBeGreaterThan(0);
  });

  test("Test 3: Function Definition & Call", () => {
    const source = `
      defn multiply(a, b) {
        return a * b;
      }

      let result = multiply(6, 7);
      return result;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.instructions).toBeDefined();
  });

  test("Test 4: Nested Structures", () => {
    const source = `
      let matrix = [[1, 2], [3, 4], [5, 6]];
      let data = {
        matrix: matrix,
        sum: 21
      };
      let val = data.matrix[1][0];
      return val;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test("Test 5: For...in Loop", () => {
    const source = `
      let obj = {x: 1, y: 2, z: 3};
      for (let key in obj) {
        println(obj[key]);
      }
      return obj;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test("Test 6: For...of Loop", () => {
    const source = `
      let arr = [1, 2, 3, 4, 5];
      for (let val of arr) {
        println(val);
      }
      return arr;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test("Test 7: Ternary Operator", () => {
    const source = `
      let x = 10;
      let result = x > 5 ? "big" : "small";
      return result;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test("Test 8: Arrow Function", () => {
    const source = `
      let square = (x) => x * x;
      let result = square(5);
      return result;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test("Test 9: Compound Assignment", () => {
    const source = `
      let x = 10;
      x += 5;
      let y = 20;
      y -= 3;
      return x + y;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test("Test 10: Complex Program", () => {
    const source = `
      defn fibonacci(n) {
        if (n <= 1) {
          return n;
        } else {
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
      }

      let results = [
        fibonacci(5),
        fibonacci(6),
        fibonacci(7)
      ];

      for (let i of results) {
        println(i);
      }

      return results;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.ast.body.length).toBeGreaterThan(0);
  });

  test("Test 11: Deep Nesting", () => {
    const source = `
      let data = {
        users: [
          {name: "Alice", scores: [10, 20, 30]},
          {name: "Bob", scores: [15, 25, 35]}
        ],
        meta: {
          version: "1.0",
          active: true
        }
      };

      let aliceFirstScore = data.users[0].scores[0];
      return aliceFirstScore;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test("Test 12: Error Handling - Undefined Variable", () => {
    const source = `
      let x = 10;
      return undefined_var;
    `;

    const result = compile(source);
    // 코드 생성 시 에러 감지
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("Test 13: Lexer - String Escapes", () => {
    const source = `
      let str = "Hello\\nWorld\\t!";
      let quoted = "It's working";
      return str;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test("Test 14: Lexer - Hex & Octal Numbers", () => {
    const source = `
      let hex = 0xFF;
      let octal = 0o77;
      let decimal = 255;
      return hex + octal;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test("Test 15: Operator Precedence", () => {
    const source = `
      let result1 = 2 + 3 * 4;
      let result2 = (2 + 3) * 4;
      let result3 = 2 ** 3 * 2;
      let check = 5 > 3 && 4 < 6;
      return check;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test("Test 16: Multi-line Comments", () => {
    const source = `
      /* This is a
         multi-line comment
         spanning multiple lines */
      let x = 10;
      // This is a line comment
      let y = 20;
      return x + y;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test("Test 17: Block Scoping", () => {
    const source = `
      let x = 10;
      {
        let x = 20;
        let y = 30;
      }
      return x;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test("Test 18: Break & Continue", () => {
    const source = `
      let sum = 0;
      let i = 0;
      while (i < 10) {
        if (i == 5) {
          break;
        }
        sum += i;
        i += 1;
      }
      return sum;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
  });

  test("Test 19: Long Source File (simulated)", () => {
    let source = `
      // Generated test with 100+ statements
    `;

    for (let i = 0; i < 50; i++) {
      source += `
        let var_${i} = ${i};
      `;
    }

    source += `
      return var_49;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.ast.body.length).toBeGreaterThan(50);
  });

  test("Test 20: All Features Combined", () => {
    const source = `
      defn process(data) {
        let result = [];
        for (let item of data) {
          if (item > 5) {
            result.push(item * 2);
          }
        }
        return result;
      }

      let input = [1, 3, 6, 8, 10];
      let output = process(input);

      let stats = {
        input: input,
        output: output,
        count: output.length
      };

      for (let key in stats) {
        println(stats[key]);
      }

      return stats;
    `;

    const result = compile(source);
    expect(result.success).toBe(true);
    expect(result.ast.body.length).toBeGreaterThan(0);
    expect(result.instructions.length).toBeGreaterThan(0);
  });
});

describe("Code Generation Metrics", () => {
  test("Generates valid bytecode", () => {
    const source = `
      let arr = [1, 2, 3];
      let sum = 0;
      for (let x of arr) {
        sum = sum + x;
      }
      return sum;
    `;

    const parser = new ParserAdvanced(source);
    const ast = parser.parse();
    const codegen = new AdvancedCodeGenerator();
    const result = codegen.generate(ast);

    expect(result.errors.length).toBe(0);
    expect(result.instructions.length).toBeGreaterThan(0);

    // 마지막 명령이 HALT인지 확인
    const lastInstr = result.instructions[result.instructions.length - 1];
    expect(lastInstr.op).toBe(99); // Opcode.HALT
  });

  test("Collects all functions", () => {
    const source = `
      defn func1() { return 1; }
      defn func2(a) { return a * 2; }
      defn func3(a, b, c) { return a + b + c; }

      let x = func1();
      let y = func2(x);
      let z = func3(1, 2, 3);
      return z;
    `;

    const parser = new ParserAdvanced(source);
    const ast = parser.parse();
    const codegen = new AdvancedCodeGenerator();
    const result = codegen.generate(ast);

    expect(result.errors.length).toBe(0);
    // FUNCTION_DEF 명령들 확인
    const funcDefs = result.instructions.filter((i) => i.op === 70); // Opcode.FUNCTION_DEF
    expect(funcDefs.length).toBe(3);
  });
});
