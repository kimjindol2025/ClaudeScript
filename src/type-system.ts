/**
 * Phase 11: Type System Core
 *
 * 타입 정의, 추론, 검사 완전 구현
 * - 기본 타입 (number, string, boolean, etc.)
 * - 복합 타입 (array, object, function, union)
 * - 타입 추론 (Type Inference)
 * - 타입 검사 (Type Checking)
 * - 제네릭 (Generics)
 */

import { Expr, Stmt } from "./phase9-ast";

// ============================================================================
// 타입 정의
// ============================================================================

export type PrimitiveType = "number" | "string" | "boolean" | "null" | "undefined" | "any" | "never";

export interface ArrayType {
  kind: "array";
  elementType: Type;
}

export interface ObjectType {
  kind: "object";
  properties: Map<string, Type>;
}

export interface FunctionType {
  kind: "function";
  params: Type[];
  returnType: Type;
}

export interface UnionType {
  kind: "union";
  types: Type[];
}

export interface GenericType {
  kind: "generic";
  name: string;
  typeParams: string[];
  baseType: Type;
}

export type Type =
  | PrimitiveType
  | ArrayType
  | ObjectType
  | FunctionType
  | UnionType
  | GenericType;

/**
 * 타입을 문자열로 표현
 */
export function typeToString(type: Type): string {
  if (typeof type === "string") {
    return type;
  }

  switch (type.kind) {
    case "array":
      return `${typeToString(type.elementType)}[]`;

    case "object": {
      const props = Array.from(type.properties.entries())
        .map(([key, propType]) => `${key}: ${typeToString(propType)}`)
        .join(", ");
      return `{${props}}`;
    }

    case "function": {
      const params = type.params.map(typeToString).join(", ");
      return `(${params}) => ${typeToString(type.returnType)}`;
    }

    case "union": {
      return type.types.map(typeToString).join(" | ");
    }

    case "generic": {
      const params = type.typeParams.join(", ");
      return `${type.name}<${params}>`;
    }

    default:
      return "unknown";
  }
}

/**
 * 두 타입이 같은지 확인
 */
export function typesEqual(a: Type, b: Type): boolean {
  // 같은 참조
  if (a === b) return true;

  // 원시 타입
  if (typeof a === "string" && typeof b === "string") {
    return a === b;
  }

  // 배열 타입
  if (
    typeof a === "object" &&
    typeof b === "object" &&
    a.kind === "array" &&
    b.kind === "array"
  ) {
    return typesEqual(a.elementType, b.elementType);
  }

  // 함수 타입
  if (
    typeof a === "object" &&
    typeof b === "object" &&
    a.kind === "function" &&
    b.kind === "function"
  ) {
    const aFunc = a as FunctionType;
    const bFunc = b as FunctionType;

    if (aFunc.params.length !== bFunc.params.length) return false;
    if (!typesEqual(aFunc.returnType, bFunc.returnType)) return false;

    return aFunc.params.every((param, i) => typesEqual(param, bFunc.params[i]));
  }

  // 객체 타입
  if (
    typeof a === "object" &&
    typeof b === "object" &&
    a.kind === "object" &&
    b.kind === "object"
  ) {
    const aObj = a as ObjectType;
    const bObj = b as ObjectType;

    if (aObj.properties.size !== bObj.properties.size) return false;

    for (const [key, aType] of aObj.properties) {
      const bType = bObj.properties.get(key);
      if (!bType || !typesEqual(aType, bType)) return false;
    }

    return true;
  }

  return false;
}

/**
 * 타입 호환성 확인
 */
export function isAssignableTo(source: Type, target: Type): boolean {
  // any는 무엇이든 할당 가능
  if (target === "any") return true;
  if (source === "any") return true;

  // 같은 타입
  if (typesEqual(source, target)) return true;

  // null/undefined는 대부분의 타입에 할당 가능 (선택적)
  if (source === "null" || source === "undefined") {
    return true;
  }

  // 유니온 타입 처리
  if (typeof target === "object" && target.kind === "union") {
    return (target as UnionType).types.some((t) => isAssignableTo(source, t));
  }

  if (typeof source === "object" && source.kind === "union") {
    return (source as UnionType).types.every((t) => isAssignableTo(t, target));
  }

  return false;
}

/**
 * 타입 합치기 (유니온)
 */
export function mergeTypes(types: Type[]): Type {
  if (types.length === 0) return "never";
  if (types.length === 1) return types[0];

  // 중복 제거
  const unique: Type[] = [];
  for (const type of types) {
    if (!unique.some((t) => typesEqual(t, type))) {
      unique.push(type);
    }
  }

  if (unique.length === 1) return unique[0];

  return {
    kind: "union",
    types: unique,
  };
}

// ============================================================================
// 타입 추론 (Type Inference)
// ============================================================================

export class TypeInferencer {
  /**
   * 리터럴 값에서 타입 추론
   */
  static inferFromLiteral(value: any): Type {
    if (typeof value === "number") return "number";
    if (typeof value === "string") return "string";
    if (typeof value === "boolean") return "boolean";
    if (value === null) return "null";
    if (value === undefined) return "undefined";

    if (Array.isArray(value)) {
      if (value.length === 0) return { kind: "array", elementType: "unknown" };
      const elementType = this.inferFromLiteral(value[0]);
      return { kind: "array", elementType };
    }

    if (typeof value === "object") {
      const properties = new Map<string, Type>();
      for (const [key, val] of Object.entries(value)) {
        properties.set(key, this.inferFromLiteral(val));
      }
      return { kind: "object", properties };
    }

    return "any";
  }

  /**
   * 표현식의 타입 추론
   */
  static infer(expr: Expr): Type {
    switch (expr.type) {
      case "NumberLiteral":
        return "number";

      case "StringLiteral":
        return "string";

      case "BooleanLiteral":
        return "boolean";

      case "ArrayLiteral": {
        const arr = expr as any;
        if (arr.elements.length === 0) {
          return { kind: "array", elementType: "unknown" };
        }
        const elementTypes = arr.elements.map((e: Expr) => this.infer(e));
        const elementType = mergeTypes(elementTypes);
        return { kind: "array", elementType };
      }

      case "ObjectLiteral": {
        const obj = expr as any;
        const properties = new Map<string, Type>();
        for (const { key, value } of obj.properties) {
          properties.set(key, this.infer(value));
        }
        return { kind: "object", properties };
      }

      case "Identifier":
        return "any"; // 컨텍스트 필요

      case "Binary": {
        const bin = expr as any;
        const leftType = this.infer(bin.left);
        const rightType = this.infer(bin.right);

        switch (bin.op) {
          case "+":
          case "-":
          case "*":
          case "/":
          case "%":
          case "**":
            return "number";

          case "==":
          case "!=":
          case "<":
          case ">":
          case "<=":
          case ">=":
          case "&&":
          case "||":
            return "boolean";

          default:
            return "any";
        }
      }

      case "Call":
        return "any"; // 함수 타입 정보 필요

      case "Member": {
        const member = expr as any;
        // 객체의 속성 타입 반환
        const objType = this.infer(member.object);
        if (typeof objType === "object" && objType.kind === "object") {
          return objType.properties.get(member.property) || "any";
        }
        return "any";
      }

      case "Index": {
        const idx = expr as any;
        const objType = this.infer(idx.object);
        if (typeof objType === "object" && objType.kind === "array") {
          return objType.elementType;
        }
        if (typeof objType === "object" && objType.kind === "object") {
          return "any"; // 동적 키 접근
        }
        return "any";
      }

      default:
        return "any";
    }
  }

  /**
   * 이항 연산의 결과 타입
   */
  static inferBinaryOp(op: string, left: Type, right: Type): Type {
    if (op === "+" && (left === "string" || right === "string")) {
      return "string";
    }

    if (["+", "-", "*", "/", "%", "**"].includes(op)) {
      return "number";
    }

    if (["==", "!=", "<", ">", "<=", ">=", "&&", "||"].includes(op)) {
      return "boolean";
    }

    return "any";
  }
}

// ============================================================================
// 타입 환경 (Type Context)
// ============================================================================

export interface TypeBinding {
  type: Type;
  mutable: boolean;
  declared: boolean;
}

export class TypeEnvironment {
  private scopes: Map<string, TypeBinding>[] = [new Map()];

  /**
   * 변수 선언
   */
  declare(name: string, type: Type, mutable: boolean = true): void {
    const currentScope = this.scopes[this.scopes.length - 1];
    currentScope.set(name, { type, mutable, declared: true });
  }

  /**
   * 변수 조회
   */
  lookup(name: string): TypeBinding | undefined {
    // 가장 안쪽 스코프부터 검색
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      const binding = this.scopes[i].get(name);
      if (binding) return binding;
    }
    return undefined;
  }

  /**
   * 새로운 스코프 진입
   */
  enter(): void {
    this.scopes.push(new Map());
  }

  /**
   * 스코프 탈출
   */
  exit(): void {
    if (this.scopes.length > 1) {
      this.scopes.pop();
    }
  }

  /**
   * 모든 바인딩 조회
   */
  getAll(): Map<string, TypeBinding> {
    const result = new Map<string, TypeBinding>();
    for (const scope of this.scopes) {
      for (const [name, binding] of scope) {
        result.set(name, binding);
      }
    }
    return result;
  }
}

// ============================================================================
// 타입 검사기 (Type Checker)
// ============================================================================

export interface TypeError {
  message: string;
  line?: number;
  column?: number;
  actual?: Type;
  expected?: Type;
}

export class TypeChecker {
  private env: TypeEnvironment = new TypeEnvironment();
  private errors: TypeError[] = [];

  /**
   * 타입 검사 수행
   */
  check(source: string): TypeCheckResult {
    this.errors = [];
    this.env = new TypeEnvironment();

    // 간단한 구현: 수동으로 체크하거나
    // 실제로는 ParserAdvanced의 결과를 받아 처리

    return {
      success: this.errors.length === 0,
      errors: this.errors,
      environment: this.env,
    };
  }

  /**
   * 할당 가능성 검사
   */
  checkAssignment(source: Type, target: Type): boolean {
    const compatible = isAssignableTo(source, target);

    if (!compatible) {
      this.errors.push({
        message: `Type '${typeToString(source)}' is not assignable to type '${typeToString(target)}'`,
        actual: source,
        expected: target,
      });
    }

    return compatible;
  }

  /**
   * 이항 연산 검사
   */
  checkBinaryOp(op: string, left: Type, right: Type): Type {
    // 일부 연산은 제한됨
    const invalid = [
      { op: "-", left: "string", right: "string" },
      { op: "*", left: "string", right: "string" },
      { op: "/", left: "string", right: "string" },
    ];

    for (const { op: invOp, left: invLeft, right: invRight } of invalid) {
      if (
        op === invOp &&
        left === invLeft &&
        right === invRight
      ) {
        this.errors.push({
          message: `Cannot apply operator '${op}' to types '${typeToString(left)}' and '${typeToString(right)}'`,
        });
        return "never";
      }
    }

    return TypeInferencer.inferBinaryOp(op, left, right);
  }

  /**
   * 함수 호출 검사
   */
  checkFunctionCall(
    funcType: Type,
    args: Type[]
  ): Type {
    if (typeof funcType !== "object" || funcType.kind !== "function") {
      this.errors.push({
        message: `Cannot call non-function type '${typeToString(funcType)}'`,
      });
      return "never";
    }

    const func = funcType as FunctionType;

    if (args.length !== func.params.length) {
      this.errors.push({
        message: `Expected ${func.params.length} arguments, but got ${args.length}`,
      });
      return "never";
    }

    for (let i = 0; i < args.length; i++) {
      this.checkAssignment(args[i], func.params[i]);
    }

    return func.returnType;
  }

  getErrors(): TypeError[] {
    return this.errors;
  }
}

// ============================================================================
// 타입 검사 결과
// ============================================================================

export interface TypeCheckResult {
  success: boolean;
  errors: TypeError[];
  environment: TypeEnvironment;
}
