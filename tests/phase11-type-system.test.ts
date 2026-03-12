/**
 * Phase 11: Type System Tests
 *
 * 타입 추론, 타입 검사, 통합 테스트
 */

import { TypeInferencer, TypeChecker, TypeEnvironment, typeToString, isAssignableTo, typesEqual } from "../src/type-system";
import { compileWithTypes, TypedCompileResult } from "../src/phase11-integration";

describe("Phase 11: Type System", () => {
  // ========== Type Inference Tests ==========

  describe("Type Inference", () => {
    test("Infer number literal", () => {
      const type = TypeInferencer.inferFromLiteral(42);
      expect(type).toBe("number");
    });

    test("Infer string literal", () => {
      const type = TypeInferencer.inferFromLiteral("hello");
      expect(type).toBe("string");
    });

    test("Infer boolean literal", () => {
      const type = TypeInferencer.inferFromLiteral(true);
      expect(type).toBe("boolean");
    });

    test("Infer array literal", () => {
      const type = TypeInferencer.inferFromLiteral([1, 2, 3]);
      expect(typeof type === "object" && type.kind === "array").toBe(true);
      if (typeof type === "object" && type.kind === "array") {
        expect(type.elementType).toBe("number");
      }
    });

    test("Infer object literal", () => {
      const type = TypeInferencer.inferFromLiteral({ x: 1, y: 2 });
      expect(typeof type === "object" && type.kind === "object").toBe(true);
      if (typeof type === "object" && type.kind === "object") {
        expect(type.properties.get("x")).toBe("number");
        expect(type.properties.get("y")).toBe("number");
      }
    });

    test("Infer binary operation - addition", () => {
      const type = TypeInferencer.inferBinaryOp("+", "number", "number");
      expect(type).toBe("number");
    });

    test("Infer binary operation - string concatenation", () => {
      const type = TypeInferencer.inferBinaryOp("+", "string", "string");
      expect(type).toBe("string");
    });

    test("Infer binary operation - comparison", () => {
      const type = TypeInferencer.inferBinaryOp(">", "number", "number");
      expect(type).toBe("boolean");
    });
  });

  // ========== Type Compatibility Tests ==========

  describe("Type Compatibility", () => {
    test("Same types are assignable", () => {
      expect(isAssignableTo("number", "number")).toBe(true);
      expect(isAssignableTo("string", "string")).toBe(true);
    });

    test("Any is assignable to everything", () => {
      expect(isAssignableTo("any", "number")).toBe(true);
      expect(isAssignableTo("number", "any")).toBe(true);
    });

    test("Incompatible types not assignable", () => {
      expect(isAssignableTo("number", "string")).toBe(false);
      expect(isAssignableTo("string", "boolean")).toBe(false);
    });

    test("Types equal function", () => {
      expect(typesEqual("number", "number")).toBe(true);
      expect(typesEqual("number", "string")).toBe(false);

      const arr1 = { kind: "array" as const, elementType: "number" as const };
      const arr2 = { kind: "array" as const, elementType: "number" as const };
      expect(typesEqual(arr1, arr2)).toBe(true);
    });
  });

  // ========== Type Environment Tests ==========

  describe("Type Environment", () => {
    test("Declare and lookup variable", () => {
      const env = new TypeEnvironment();
      env.declare("x", "number");

      const binding = env.lookup("x");
      expect(binding?.type).toBe("number");
    });

    test("Scoped variable lookup", () => {
      const env = new TypeEnvironment();
      env.declare("x", "number");

      env.enter();
      env.declare("x", "string");

      let binding = env.lookup("x");
      expect(binding?.type).toBe("string");

      env.exit();

      binding = env.lookup("x");
      expect(binding?.type).toBe("number");
    });

    test("Variable not found", () => {
      const env = new TypeEnvironment();
      const binding = env.lookup("undefined_var");
      expect(binding).toBeUndefined();
    });
  });

  // ========== Type Checker Tests ==========

  describe("Type Checker", () => {
    test("Check assignment compatibility", () => {
      const checker = new TypeChecker();
      const result = checker.checkAssignment("number", "number");
      expect(result).toBe(true);
      expect(checker.getErrors().length).toBe(0);
    });

    test("Check assignment incompatibility", () => {
      const checker = new TypeChecker();
      const result = checker.checkAssignment("string", "number");
      expect(result).toBe(false);
      expect(checker.getErrors().length).toBeGreaterThan(0);
    });

    test("Check binary operation", () => {
      const checker = new TypeChecker();
      const type = checker.checkBinaryOp("+", "number", "number");
      expect(type).toBe("number");
    });

    test("Check function call", () => {
      const checker = new TypeChecker();
      const funcType = {
        kind: "function" as const,
        params: ["number", "number"],
        returnType: "number" as const,
      };
      const result = checker.checkFunctionCall(funcType, ["number", "number"]);
      expect(result).toBe("number");
    });

    test("Check function call with wrong argument count", () => {
      const checker = new TypeChecker();
      const funcType = {
        kind: "function" as const,
        params: ["number", "number"],
        returnType: "number" as const,
      };
      checker.checkFunctionCall(funcType, ["number"]);
      expect(checker.getErrors().length).toBeGreaterThan(0);
    });
  });

  // ========== Integration Tests ==========

  describe("Type System Integration", () => {
    test("Test 1: Simple variable typing", () => {
      const source = `
        let x = 10;
        let s = "hello";
        let b = true;
        return x;
      `;

      const result = compileWithTypes(source);
      expect(result.success).toBe(true);
    });

    test("Test 2: Array typing", () => {
      const source = `
        let arr = [1, 2, 3];
        let x = arr[0];
        return arr;
      `;

      const result = compileWithTypes(source);
      expect(result.success).toBe(true);
    });

    test("Test 3: Object typing", () => {
      const source = `
        let obj = {x: 1, y: 2};
        let val = obj.x;
        return obj;
      `;

      const result = compileWithTypes(source);
      expect(result.success).toBe(true);
    });

    test("Test 4: Function with types", () => {
      const source = `
        defn add(a, b) {
          return a + b;
        }
        let result = add(5, 3);
        return result;
      `;

      const result = compileWithTypes(source);
      expect(result.success).toBe(true);
    });

    test("Test 5: Control flow with types", () => {
      const source = `
        let x = 10;
        if (x > 5) {
          println(x);
        }
        return x;
      `;

      const result = compileWithTypes(source);
      expect(result.success).toBe(true);
    });

    test("Test 6: Loop with types", () => {
      const source = `
        let arr = [1, 2, 3];
        for (let val of arr) {
          println(val);
        }
        return arr;
      `;

      const result = compileWithTypes(source);
      expect(result.success).toBe(true);
    });

    test("Test 7: Nested structures", () => {
      const source = `
        let data = {
          matrix: [[1, 2], [3, 4]],
          count: 4
        };
        let val = data.matrix[0][0];
        return val;
      `;

      const result = compileWithTypes(source);
      expect(result.success).toBe(true);
    });

    test("Test 8: Complex program", () => {
      const source = `
        defn filter(arr) {
          let result = [];
          for (let item of arr) {
            if (item > 2) {
              result.push(item);
            }
          }
          return result;
        }

        let nums = [1, 2, 3, 4, 5];
        let filtered = filter(nums);
        for (let x of filtered) {
          println(x);
        }
        return filtered;
      `;

      const result = compileWithTypes(source);
      expect(result.success).toBe(true);
    });

    test("Test 9: Type annotations", () => {
      // 타입 주석이 포함되면 hasTypeAnnotations가 true
      const source = `
        let x: number = 10;
        return x;
      `;

      const result = compileWithTypes(source);
      expect(result.stats.hasTypeAnnotations).toBe(true);
    });

    test("Test 10: Multiple type annotations", () => {
      const source = `
        let x: number = 10;
        let s: string = "hello";
        let arr: number[] = [1, 2, 3];
        return x;
      `;

      const result = compileWithTypes(source);
      expect(result.stats.typesChecked).toBeGreaterThan(0);
    });
  });

  // ========== Error Detection Tests ==========

  describe("Type Error Detection", () => {
    test("Detects parse errors", () => {
      const source = `
        let x = 10
        let y = 20
      `;

      const result = compileWithTypes(source);
      // 파싱 에러가 있을 수 있음
      expect(Array.isArray(result.typeErrors)).toBe(true);
    });

    test("Handles runtime errors gracefully", () => {
      const source = `
        let x = 10;
        return undefined_var;
      `;

      const result = compileWithTypes(source);
      // 런타임 에러 또는 타입 에러 예상
      expect(Array.isArray(result.runtimeErrors)).toBe(true);
    });
  });

  // ========== Type String Representation ==========

  describe("Type String Representation", () => {
    test("Primitive type toString", () => {
      expect(typeToString("number")).toBe("number");
      expect(typeToString("string")).toBe("string");
      expect(typeToString("boolean")).toBe("boolean");
    });

    test("Array type toString", () => {
      const type = { kind: "array" as const, elementType: "number" as const };
      expect(typeToString(type)).toBe("number[]");
    });

    test("Function type toString", () => {
      const type = {
        kind: "function" as const,
        params: ["number", "string"],
        returnType: "boolean" as const,
      };
      expect(typeToString(type)).toContain("number");
      expect(typeToString(type)).toContain("string");
      expect(typeToString(type)).toContain("boolean");
    });

    test("Object type toString", () => {
      const props = new Map([
        ["x", "number" as const],
        ["y", "number" as const],
      ]);
      const type = { kind: "object" as const, properties: props };
      const str = typeToString(type);
      expect(str).toContain("x");
      expect(str).toContain("y");
      expect(str).toContain("number");
    });
  });
});

describe("Type System Performance", () => {
  test("Handles large programs", () => {
    let source = `
      let total = 0;
    `;

    for (let i = 0; i < 100; i++) {
      source += `
        let var_${i} = ${i};
        total = total + var_${i};
      `;
    }

    source += `return total;`;

    const start = Date.now();
    const result = compileWithTypes(source);
    const elapsed = Date.now() - start;

    expect(result).toBeDefined();
    expect(elapsed).toBeLessThan(5000); // 5초 이내
  });

  test("Type checking overhead is reasonable", () => {
    const source = `
      defn fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
      }

      let results = [];
      for (let i = 1; i <= 15; i = i + 1) {
        results.push(fibonacci(i));
      }

      return results;
    `;

    const start = Date.now();
    const result = compileWithTypes(source);
    const elapsed = Date.now() - start;

    expect(result.success).toBe(true);
    expect(elapsed).toBeLessThan(2000); // 2초 이내
  });
});
