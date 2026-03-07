/**
 * ClaudeScript 코드 생성기
 * 검증된 & 타입 검사된 ClaudeScript AST를 FreeLang VT 바이트코드로 컴파일합니다
 *
 * 출력 형식: S-expression (Lisp-like syntax)
 * 예:
 *   (let x 42)
 *   (if (> x 0) (println "positive") (println "non-positive"))
 *   (defn add (a b) (+ a b))
 */

import { Program, Statement, Expression, TypeSpec, FunctionDef } from "./ast";

export interface CodeGenResult {
  code: string;
  success: boolean;
  errors: string[];
}

export class CodeGenerator {
  private code: string[] = [];
  private indentLevel: number = 0;
  private errors: string[] = [];
  private functionRegistry: Map<string, FunctionDef> = new Map();
  private builtins: Set<string> = new Set([
    "println",
    "print",
    "to_string",
    "to_i32",
    "to_f64",
    "length",
    "push",
    "pop",
    "get",
    "set",
  ]);

  /**
   * 프로그램 전체 코드 생성
   */
  generate(program: Program): CodeGenResult {
    this.code = [];
    this.indentLevel = 0;
    this.errors = [];
    this.functionRegistry.clear();

    try {
      // 1단계: 함수 정의 수집
      for (const def of program.definitions) {
        this.functionRegistry.set(def.name, def);
      }

      // 2단계: 함수 정의 코드 생성
      for (const def of program.definitions) {
        this.generateFunctionDef(def);
      }

      // 3단계: 메인 프로그램 코드 생성
      this.emitLine("; === Main Program ===");
      for (const stmt of program.instructions) {
        this.generateStatement(stmt);
      }

      return {
        code: this.code.join("\n"),
        success: this.errors.length === 0,
        errors: this.errors,
      };
    } catch (e) {
      this.errors.push(`Code generation failed: ${e}`);
      return {
        code: "",
        success: false,
        errors: this.errors,
      };
    }
  }

  /**
   * 함수 정의 생성
   */
  private generateFunctionDef(def: FunctionDef) {
    const paramNames = def.params.map((p) => p.name);
    this.emit(`(defn ${def.name} (${paramNames.join(" ")})`);
    this.indentLevel++;

    // 함수 본체
    for (const stmt of def.body) {
      this.generateStatement(stmt);
    }

    this.indentLevel--;
    this.emit(")");
  }

  /**
   * 문장 코드 생성
   */
  private generateStatement(stmt: Statement): void {
    const indent = "  ".repeat(this.indentLevel);

    switch (stmt.type) {
      case "var":
        // (let name value)
        this.emitLine(`(let ${stmt.name} ${this.generateExpression(stmt.value)})`);
        break;

      case "assign":
        // (set! name value)
        this.emitLine(`(set! ${stmt.name} ${this.generateExpression(stmt.value)})`);
        break;

      case "return":
        // (return value) → VT에서는 마지막 값이 반환
        this.emitLine(this.generateExpression(stmt.value));
        break;

      case "call":
        // (function-name arg1 arg2 ...)
        const callExpr = this.generateExpression(stmt);
        if (stmt.assign_to) {
          this.emitLine(`(let ${stmt.assign_to} ${callExpr})`);
        } else {
          this.emitLine(callExpr);
        }
        break;

      case "condition":
        // (if test then-body else-body)
        this.generateCondition(stmt);
        break;

      case "for":
        // (loop-range var start end body)
        this.generateFor(stmt);
        break;

      case "while":
        // (while condition body)
        this.generateWhile(stmt);
        break;

      case "match":
        // (match value cases...)
        this.generateMatch(stmt);
        break;

      case "try":
        // (try-catch body catch-var catch-body finally-body)
        this.generateTry(stmt);
        break;

      case "throw":
        // (throw error-type message)
        this.emitLine(
          `(throw ${stmt.error_type} "${this.generateExpression(stmt.message)}")`
        );
        break;

      default:
        this.errors.push(`Unknown statement type: ${(stmt as any).type}`);
    }
  }

  /**
   * 조건문 생성
   */
  private generateCondition(stmt: any): void {
    const test = this.generateExpression(stmt.test);
    this.emitLine(`(if ${test}`);
    this.indentLevel++;

    // then 블록
    for (const s of stmt.then) {
      this.generateStatement(s);
    }

    this.indentLevel--;

    // else 블록
    if (stmt.else && stmt.else.length > 0) {
      this.indentLevel++;
      for (const s of stmt.else) {
        this.generateStatement(s);
      }
      this.indentLevel--;
    }

    this.emitLine(")");
  }

  /**
   * For 루프 생성
   */
  private generateFor(stmt: any): void {
    const start = this.generateExpression(stmt.range.start);
    const end = this.generateExpression(stmt.range.end);

    this.emitLine(`(loop-range ${stmt.variable} ${start} ${end}`);
    this.indentLevel++;

    for (const s of stmt.body) {
      this.generateStatement(s);
    }

    this.indentLevel--;
    this.emitLine(")");
  }

  /**
   * While 루프 생성
   */
  private generateWhile(stmt: any): void {
    const condition = this.generateExpression(stmt.condition);
    this.emitLine(`(while ${condition}`);
    this.indentLevel++;

    for (const s of stmt.body) {
      this.generateStatement(s);
    }

    this.indentLevel--;
    this.emitLine(")");
  }

  /**
   * Match 표현식 생성
   */
  private generateMatch(stmt: any): void {
    const value = this.generateExpression(stmt.value);
    this.emitLine(`(match ${value}`);
    this.indentLevel++;

    for (const caseItem of stmt.cases) {
      if (caseItem.pattern === "Some") {
        this.emitLine(`(Some ${caseItem.bind || "_"}`);
        this.indentLevel++;
        for (const s of caseItem.body) {
          this.generateStatement(s);
        }
        this.indentLevel--;
        this.emit(")");
      } else if (caseItem.pattern === "None") {
        this.emitLine(`(None`);
        this.indentLevel++;
        for (const s of caseItem.body) {
          this.generateStatement(s);
        }
        this.indentLevel--;
        this.emit(")");
      }
    }

    this.indentLevel--;
    this.emitLine(")");
  }

  /**
   * Try/Catch 생성
   */
  private generateTry(stmt: any): void {
    const indent = "  ".repeat(this.indentLevel);

    this.code.push(`${indent}(try-catch`);
    this.indentLevel++;

    // try 본체
    for (const s of stmt.body) {
      this.generateStatement(s);
    }

    this.indentLevel--;

    // catch 블록
    if (stmt.catch) {
      const catchIndent = "  ".repeat(this.indentLevel);
      this.code.push(`${catchIndent}(catch ${stmt.catch.error_var}`);
      this.indentLevel++;
      for (const s of stmt.catch.body) {
        this.generateStatement(s);
      }
      this.indentLevel--;
      const endIndent = "  ".repeat(this.indentLevel);
      this.code.push(`${endIndent})`);
    }

    // finally 블록
    if (stmt.finally && stmt.finally.length > 0) {
      const finallyIndent = "  ".repeat(this.indentLevel);
      this.code.push(`${finallyIndent}(finally`);
      this.indentLevel++;
      for (const s of stmt.finally) {
        this.generateStatement(s);
      }
      this.indentLevel--;
      const endIndent = "  ".repeat(this.indentLevel);
      this.code.push(`${endIndent})`);
    }

    const finalIndent = "  ".repeat(this.indentLevel);
    this.code.push(`${finalIndent})`);
  }

  /**
   * 표현식 코드 생성
   */
  private generateExpression(expr: Expression | any): string {
    switch (expr.type) {
      case "literal":
        return this.generateLiteral(expr);

      case "ref":
        return expr.name;

      case "binary_op":
        return this.generateBinaryOp(expr);

      case "unary_op":
        return this.generateUnaryOp(expr);

      case "index":
        // (array-get array index)
        return `(array-get ${this.generateExpression(expr.array)} ${this.generateExpression(
          expr.index
        )})`;

      case "field":
        // (field-get object field)
        return `(field-get ${this.generateExpression(expr.object)} ${expr.field})`;

      case "call":
        return this.generateCall(expr);

      case "some":
        // (some value)
        return `(some ${this.generateExpression(expr.value)})`;

      case "none":
        // (none)
        return "(none)";

      case "literal_array":
        // (array-create elem1 elem2 ...)
        const values = expr.values.map((v: Expression) => this.generateExpression(v));
        return `(array-create ${values.join(" ")})`;

      case "literal_object":
        // (object-create (field1 val1) (field2 val2) ...)
        const fields = Object.entries(expr.fields).map(
          ([k, v]) => `(${k} ${this.generateExpression(v as Expression)})`
        );
        return `(object-create ${fields.join(" ")})`;

      default:
        this.errors.push(`Unknown expression type: ${(expr as any).type}`);
        return "nil";
    }
  }

  /**
   * 리터럴 값 생성
   */
  private generateLiteral(expr: any): string {
    switch (expr.value_type) {
      case "i32":
      case "i64":
      case "f64":
        return String(expr.value);

      case "string":
        return `"${expr.value.replace(/"/g, '\\"')}"`;

      case "bool":
        return expr.value ? "#t" : "#f";

      case "none":
        return "(none)";

      default:
        return String(expr.value);
    }
  }

  /**
   * 이항 연산자 생성
   */
  private generateBinaryOp(expr: any): string {
    const left = this.generateExpression(expr.left);
    const right = this.generateExpression(expr.right);
    const op = this.mapOperator(expr.op);
    return `(${op} ${left} ${right})`;
  }

  /**
   * 단항 연산자 생성
   */
  private generateUnaryOp(expr: any): string {
    const operand = this.generateExpression(expr.operand);
    const op = this.mapOperator(expr.op);
    return `(${op} ${operand})`;
  }

  /**
   * 함수 호출 생성
   */
  private generateCall(expr: any): string {
    const args = expr.args.map((a: Expression) => this.generateExpression(a)).join(" ");

    // 내장 함수 처리
    if (this.builtins.has(expr.function)) {
      return `(${expr.function} ${args})`.trim();
    }

    // 사용자 정의 함수
    if (this.functionRegistry.has(expr.function)) {
      return `(${expr.function} ${args})`.trim();
    }

    this.errors.push(`Unknown function: ${expr.function}`);
    return `(${expr.function} ${args})`.trim();
  }

  /**
   * 연산자를 VT 형식으로 매핑
   */
  private mapOperator(op: string): string {
    const opMap: { [key: string]: string } = {
      "+": "+",
      "-": "-",
      "*": "*",
      "/": "/",
      "%": "%",
      "==": "=",
      "!=": "!=",
      "<": "<",
      ">": ">",
      "<=": "<=",
      ">=": ">=",
      "&&": "and",
      "||": "or",
      "!": "not",
    };
    return opMap[op] || op;
  }

  /**
   * 코드 줄 추가 (자동 들여쓰기)
   */
  private emitLine(text: string): void {
    const indent = "  ".repeat(this.indentLevel);
    this.code.push(indent + text);
  }

  /**
   * 코드 추가 (들여쓰기 없음)
   */
  private emit(text: string): void {
    if (this.code.length > 0) {
      this.code[this.code.length - 1] += text;
    } else {
      this.code.push(text);
    }
  }
}

/**
 * 간편 함수: 프로그램을 바로 코드로 생성
 */
export function generate(program: Program): CodeGenResult {
  const generator = new CodeGenerator();
  return generator.generate(program);
}
