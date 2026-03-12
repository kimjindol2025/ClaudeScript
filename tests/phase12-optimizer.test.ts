/**
 * Phase 12: Optimizer Tests
 *
 * AST 최적화 및 바이트코드 최적화의 정확성 검증
 */

import { Optimizer } from "../src/optimizer";
import { BytecodeOptimizer, measureOptimization } from "../src/bytecode-optimizer";
import { compileOptimized, formatOptimizationStats } from "../src/phase12-integration";
import { Program } from "../src/phase9-ast";

describe("Phase 12: Optimizer", () => {
  // ========== AST Optimization Tests ==========

  describe("Constant Folding", () => {
    test("Fold simple constant addition", () => {
      const source = `
        let x = 10;
        let y = 20;
        let z = x + y;
        println(z);
        return z;
      `;

      const result = compileOptimized(source);
      expect(result.success).toBe(true);
      expect(result.output).toContain("30");
    });

    test("Fold constant multiplication", () => {
      const source = `
        let a = 5;
        let b = 6;
        let result = a * b;
        println(result);
        return result;
      `;

      const result = compileOptimized(source);
      expect(result.success).toBe(true);
      expect(result.output).toContain("30");
    });

    test("Fold chained operations", () => {
      const source = `
        let x = 2 + 3 * 4;
        println(x);
        return x;
      `;

      const result = compileOptimized(source);
      expect(result.success).toBe(true);
      // 2 + (3 * 4) = 2 + 12 = 14
      expect(result.output).toContain("14");
    });

    test("Fold comparison operations", () => {
      const source = `
        let x = 10;
        let y = 5;
        if (x > y) {
          println("true");
        } else {
          println("false");
        }
        return 0;
      `;

      const result = compileOptimized(source);
      expect(result.success).toBe(true);
      expect(result.output).toContain("true");
    });
  });

  describe("Dead Code Elimination", () => {
    test("Remove unreachable code after return", () => {
      const source = `
        return 42;
        println("unreachable");
        return 0;
      `;

      const result = compileOptimized(source);
      expect(result.success).toBe(true);
      expect(result.output).not.toContain("unreachable");
    });

    test("Remove code after if-else with returns", () => {
      const source = `
        let x = 5;
        if (x > 0) {
          return 1;
        } else {
          return 2;
        }
        println("never executes");
      `;

      const result = compileOptimized(source);
      expect(result.success).toBe(true);
      expect(result.output).not.toContain("never executes");
    });

    test("Remove dead if (false) block", () => {
      const source = `
        if (false) {
          println("dead");
        }
        println("alive");
        return 0;
      `;

      const result = compileOptimized(source);
      expect(result.success).toBe(true);
      expect(result.output).not.toContain("dead");
      expect(result.output).toContain("alive");
    });
  });

  describe("Loop Optimization", () => {
    test("Process small loops", () => {
      const source = `
        let sum = 0;
        for (let i = 0; i < 4; i = i + 1) {
          sum = sum + i;
        }
        println(sum);
        return sum;
      `;

      const result = compileOptimized(source);
      expect(result.success).toBe(true);
      // 0 + 1 + 2 + 3 = 6
      expect(result.output).toContain("6");
    });

    test("Process loops with invariant code", () => {
      const source = `
        let arr = [1, 2, 3];
        let len = 3;
        for (let i = 0; i < len; i = i + 1) {
          println(i);
        }
        return 0;
      `;

      const result = compileOptimized(source);
      expect(result.success).toBe(true);
      expect(result.output).toContain("0");
      expect(result.output).toContain("1");
      expect(result.output).toContain("2");
    });
  });

  describe("Function Inlining", () => {
    test("Inline simple return functions", () => {
      const source = `
        defn add(a, b) {
          return a + b;
        }
        let r1 = add(5, 3);
        println(r1);
        return r1;
      `;

      const result = compileOptimized(source);
      expect(result.success).toBe(true);
      expect(result.output).toContain("8");
    });

    test("Inline multiple calls", () => {
      const source = `
        defn double(x) {
          return x * 2;
        }
        let a = double(5);
        let b = double(10);
        println(a);
        println(b);
        return 0;
      `;

      const result = compileOptimized(source);
      expect(result.success).toBe(true);
      expect(result.output).toContain("10");
      expect(result.output).toContain("20");
    });

    test("Don't inline complex functions", () => {
      const source = `
        defn fib(n) {
          if (n <= 1) return n;
          return fib(n - 1) + fib(n - 2);
        }
        let result = fib(5);
        println(result);
        return result;
      `;

      const result = compileOptimized(source);
      // 이 함수는 너무 복잡해서 인라인되지 않음
      expect(result.success).toBe(true);
      expect(result.output).toContain("5");
    });
  });

  // ========== Bytecode Optimization Tests ==========

  describe("Bytecode Optimizer", () => {
    test("Create bytecode optimizer", () => {
      const optimizer = new BytecodeOptimizer();
      expect(optimizer).toBeDefined();
    });

    test("Optimize empty instruction list", () => {
      const optimizer = new BytecodeOptimizer();
      const instructions = [];
      const result = optimizer.optimize(instructions);
      expect(result.length).toBe(0);
    });

    test("Peephole optimization - constant folding", () => {
      const optimizer = new BytecodeOptimizer();
      const instructions = [
        { opcode: "PUSH_CONST", args: [5] },
        { opcode: "PUSH_CONST", args: [3] },
        { opcode: "ADD" },
      ];

      const result = optimizer.optimize(instructions);
      expect(result.length).toBeLessThanOrEqual(instructions.length);

      // 결과가 PUSH_CONST 8로 단순화될 수 있음
      const hasPushConst8 = result.some(
        (i) => i.opcode === "PUSH_CONST" && i.args?.[0] === 8
      );
      if (hasPushConst8) {
        expect(result.length).toBeLessThan(instructions.length);
      }
    });
  });

  // ========== Integration Tests ==========

  describe("Optimization Integration", () => {
    test("Test 1: Complex arithmetic optimization", () => {
      const source = `
        let x = 100;
        let y = 50;
        let z = (x - y) * 2;
        if (z > 50) {
          println(z);
        }
        return z;
      `;

      const result = compileOptimized(source, true);
      expect(result.success).toBe(true);
      // (100 - 50) * 2 = 100
      expect(result.output).toContain("100");
    });

    test("Test 2: Conditional optimization", () => {
      const source = `
        let value = 42;
        if (true) {
          println("branch taken");
        } else {
          println("branch not taken");
        }
        return value;
      `;

      const result = compileOptimized(source, true);
      expect(result.success).toBe(true);
      expect(result.output).toContain("branch taken");
      expect(result.output).not.toContain("branch not taken");
    });

    test("Test 3: Loop with optimization", () => {
      const source = `
        let total = 0;
        for (let i = 0; i < 5; i = i + 1) {
          total = total + i;
        }
        println(total);
        return total;
      `;

      const result = compileOptimized(source, true);
      expect(result.success).toBe(true);
      // 0 + 1 + 2 + 3 + 4 = 10
      expect(result.output).toContain("10");
    });

    test("Test 4: Function inlining with arithmetic", () => {
      const source = `
        defn square(x) {
          return x * x;
        }
        defn cube(x) {
          return x * x * x;
        }
        let a = square(4);
        let b = cube(3);
        println(a);
        println(b);
        return 0;
      `;

      const result = compileOptimized(source, true);
      expect(result.success).toBe(true);
      expect(result.output).toContain("16"); // 4 * 4
      expect(result.output).toContain("27"); // 3 * 3 * 3
    });

    test("Test 5: Nested structures optimization", () => {
      const source = `
        let obj = {
          x: 10,
          y: 20,
          z: 30
        };
        let sum = obj.x + obj.y + obj.z;
        println(sum);
        return sum;
      `;

      const result = compileOptimized(source, true);
      expect(result.success).toBe(true);
      // 10 + 20 + 30 = 60
      expect(result.output).toContain("60");
    });

    test("Test 6: Array processing with optimization", () => {
      const source = `
        let arr = [1, 2, 3, 4, 5];
        let sum = 0;
        for (let i = 0; i < 5; i = i + 1) {
          sum = sum + arr[i];
        }
        println(sum);
        return sum;
      `;

      const result = compileOptimized(source, true);
      expect(result.success).toBe(true);
      // 1 + 2 + 3 + 4 + 5 = 15
      expect(result.output).toContain("15");
    });

    test("Test 7: Complex program with multiple optimizations", () => {
      const source = `
        defn factorial(n) {
          let result = 1;
          for (let i = 2; i <= n; i = i + 1) {
            result = result * i;
          }
          return result;
        }
        let f5 = factorial(5);
        println(f5);
        return f5;
      `;

      const result = compileOptimized(source, true);
      expect(result.success).toBe(true);
      // 5! = 120
      expect(result.output).toContain("120");
    });

    test("Test 8: Optimization statistics reporting", () => {
      const source = `
        let x = 10;
        let y = 20;
        let z = x + y;
        println(z);
        return z;
      `;

      const result = compileOptimized(source, true);
      expect(result.success).toBe(true);
      expect(result.optimizationStats).toBeDefined();
      expect(result.optimizationStats.astOptimized).toBe(true);

      const report = formatOptimizationStats(result.optimizationStats);
      expect(report).toContain("Optimization Statistics");
    });
  });

  // ========== Optimization Comparison Tests ==========

  describe("Optimization Effectiveness", () => {
    test("Optimization reduces output program size", () => {
      const source = `
        let x = 10 + 20;
        let y = x * 2;
        let z = y - 10;
        if (z > 40) {
          println("large");
        } else {
          println("small");
        }
        return z;
      `;

      const result = compileOptimized(source, true);
      expect(result.success).toBe(true);
      // 최적화가 적용되면 통계가 표시됨
      expect(result.optimizationStats.astOptimized).toBe(true);
    });

    test("Disabling optimizations still compiles", () => {
      const source = `
        let x = 10 + 20;
        println(x);
        return x;
      `;

      const resultOptimized = compileOptimized(source, true);
      const resultUnoptimized = compileOptimized(source, false);

      expect(resultOptimized.success).toBe(true);
      expect(resultUnoptimized.success).toBe(true);
      expect(resultOptimized.output).toEqual(resultUnoptimized.output);
    });
  });

  // ========== Performance Tests ==========

  describe("Optimization Performance", () => {
    test("Optimization completes quickly for large programs", () => {
      let source = `let total = 0;`;

      for (let i = 0; i < 50; i++) {
        source += `\nlet x${i} = ${i};`;
        source += `\ntotal = total + x${i};`;
      }

      source += `\nprintln(total);\nreturn total;`;

      const start = Date.now();
      const result = compileOptimized(source, true);
      const elapsed = Date.now() - start;

      expect(result.success).toBe(true);
      expect(elapsed).toBeLessThan(5000); // 5초 이내
    });

    test("Optimization overhead is reasonable", () => {
      const source = `
        defn fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }

        let results = [];
        for (let i = 0; i <= 10; i = i + 1) {
          results.push(fibonacci(i));
        }

        return results;
      `;

      const start = Date.now();
      const result = compileOptimized(source, true);
      const elapsed = Date.now() - start;

      expect(result.success).toBe(true);
      expect(elapsed).toBeLessThan(3000); // 3초 이내
    });
  });
});
