/**
 * Phase 10: Advanced Code Generator
 *
 * Phase 9 (Advanced Parser)의 AST를 바이트코드로 변환
 * - 배열 & 객체 지원
 * - 함수 정의 & 호출
 * - 깊은 중첩 구조
 * - 스코프 관리
 */

import {
  Program,
  Stmt,
  Expr,
  VarDecl,
  FunctionDecl,
  Assignment,
  Return,
  If,
  While,
  For,
  ForIn,
  ForOf,
  Block,
  Identifier,
  NumberLiteral,
  StringLiteral,
  BooleanLiteral,
  ArrayLiteral,
  ObjectLiteral,
  Binary,
  Unary,
  Ternary,
  Call,
  Member,
  Index,
  ArrowFunction,
} from "./phase9-ast";

export enum Opcode {
  // 상수 & 변수
  PUSH_CONST = 0,
  LOAD = 1,
  STORE = 2,

  // 연산
  ADD = 10,
  SUB = 11,
  MUL = 12,
  DIV = 13,
  MOD = 14,
  POW = 15,

  // 비교
  EQ = 20,
  NE = 21,
  LT = 22,
  GT = 23,
  LE = 24,
  GE = 25,

  // 논리
  AND = 30,
  OR = 31,
  NOT = 32,

  // 배열
  ARRAY_CREATE = 50,
  ARRAY_GET = 51,
  ARRAY_SET = 52,
  ARRAY_PUSH = 53,
  ARRAY_POP = 54,
  ARRAY_LEN = 55,

  // 객체
  OBJECT_CREATE = 60,
  OBJECT_GET = 61,
  OBJECT_SET = 62,
  OBJECT_KEYS = 63,

  // 함수
  FUNCTION_DEF = 70,
  FUNCTION_CALL = 71,
  RETURN = 72,
  CALL_NATIVE = 73,

  // 제어
  JMP = 80,
  JMP_IF = 81,
  BREAK = 82,
  CONTINUE = 83,

  // 기타
  HALT = 99,
  NOP = 100,
}

export interface Instruction {
  op: Opcode;
  arg?: any;
  label?: string;
}

export interface VariableInfo {
  name: string;
  index: number;
  depth: number;
}

export interface FunctionInfo {
  name: string;
  params: string[];
  instructions: Instruction[];
  localCount: number;
}

export class AdvancedCodeGenerator {
  private instructions: Instruction[] = [];
  private functions: Map<string, FunctionInfo> = new Map();
  private scopeStack: Map<string, VariableInfo>[] = [new Map()];
  private localCounter = 0;
  private labelCounter = 0;
  private errors: string[] = [];
  private breakLabel: string | null = null;
  private continueLabel: string | null = null;

  generate(program: Program): { instructions: Instruction[]; errors: string[] } {
    this.instructions = [];
    this.functions.clear();
    this.scopeStack = [new Map()];
    this.localCounter = 0;
    this.labelCounter = 0;
    this.errors = [];

    try {
      // 1단계: 함수 정의 수집
      for (const stmt of program.body) {
        if (stmt.type === "FunctionDecl") {
          this.collectFunction(stmt as FunctionDecl);
        }
      }

      // 2단계: 함수 정의 코드 생성
      for (const [_, funcInfo] of this.functions) {
        this.instructions.push({
          op: Opcode.FUNCTION_DEF,
          arg: funcInfo,
        });
      }

      // 3단계: 메인 프로그램 코드 생성
      for (const stmt of program.body) {
        if (stmt.type !== "FunctionDecl") {
          this.generateStatement(stmt);
        }
      }

      this.emit(Opcode.HALT);

      return {
        instructions: this.instructions,
        errors: this.errors,
      };
    } catch (error) {
      this.errors.push(`Code generation failed: ${error}`);
      return {
        instructions: [],
        errors: this.errors,
      };
    }
  }

  // ========== 함수 처리 ==========

  private collectFunction(funcDecl: FunctionDecl) {
    const funcGen = new AdvancedCodeGenerator();
    funcGen.scopeStack = [new Map()];
    funcGen.localCounter = 0;

    // 매개변수를 로컬 변수로 등록
    for (const param of funcDecl.params) {
      funcGen.declareLocal(param);
    }

    // 함수 본체 생성
    for (const stmt of funcDecl.body) {
      funcGen.generateStatement(stmt);
    }

    // 반환값이 없으면 undefined 반환
    funcGen.emit(Opcode.PUSH_CONST, undefined);
    funcGen.emit(Opcode.RETURN);

    this.functions.set(funcDecl.name, {
      name: funcDecl.name,
      params: funcDecl.params,
      instructions: funcGen.instructions,
      localCount: funcGen.localCounter,
    });
  }

  // ========== 문 생성 ==========

  private generateStatement(stmt: Stmt): void {
    switch (stmt.type) {
      case "VarDecl": {
        const varDecl = stmt as VarDecl;
        const index = this.declareLocal(varDecl.name);
        if (varDecl.init) {
          this.generateExpression(varDecl.init);
          this.emit(Opcode.STORE, index);
        } else {
          this.emit(Opcode.PUSH_CONST, undefined);
          this.emit(Opcode.STORE, index);
        }
        break;
      }

      case "Assignment": {
        const assign = stmt as Assignment;
        this.generateAssignment(assign.target, assign.value);
        break;
      }

      case "Return": {
        const ret = stmt as Return;
        if (ret.value) {
          this.generateExpression(ret.value);
        } else {
          this.emit(Opcode.PUSH_CONST, undefined);
        }
        this.emit(Opcode.RETURN);
        break;
      }

      case "If": {
        const ifStmt = stmt as If;
        const elseLabel = this.makeLabel();
        const endLabel = this.makeLabel();

        this.generateExpression(ifStmt.cond);
        this.emit(Opcode.JMP_IF, { label: elseLabel, negate: true });

        for (const s of ifStmt.then) {
          this.generateStatement(s);
        }

        if (ifStmt.else && ifStmt.else.length > 0) {
          this.emit(Opcode.JMP, { label: endLabel });
          this.placeLabel(elseLabel);
          for (const s of ifStmt.else) {
            this.generateStatement(s);
          }
          this.placeLabel(endLabel);
        } else {
          this.placeLabel(elseLabel);
        }
        break;
      }

      case "While": {
        const whileStmt = stmt as While;
        const loopLabel = this.makeLabel();
        const exitLabel = this.makeLabel();

        const prevBreak = this.breakLabel;
        const prevContinue = this.continueLabel;
        this.breakLabel = exitLabel;
        this.continueLabel = loopLabel;

        this.placeLabel(loopLabel);
        this.generateExpression(whileStmt.cond);
        this.emit(Opcode.JMP_IF, { label: exitLabel, negate: true });

        for (const s of whileStmt.body) {
          this.generateStatement(s);
        }

        this.emit(Opcode.JMP, { label: loopLabel });
        this.placeLabel(exitLabel);

        this.breakLabel = prevBreak;
        this.continueLabel = prevContinue;
        break;
      }

      case "For": {
        const forStmt = stmt as For;
        const loopLabel = this.makeLabel();
        const exitLabel = this.makeLabel();

        // 초기화
        if (forStmt.init) {
          if (typeof forStmt.init === "object" && forStmt.init.type === "VarDecl") {
            this.generateStatement(forStmt.init);
          } else {
            this.generateExpression(forStmt.init as Expr);
          }
        }

        this.placeLabel(loopLabel);

        // 조건
        if (forStmt.cond) {
          this.generateExpression(forStmt.cond);
          this.emit(Opcode.JMP_IF, { label: exitLabel, negate: true });
        }

        const prevBreak = this.breakLabel;
        const prevContinue = this.continueLabel;
        this.breakLabel = exitLabel;
        this.continueLabel = loopLabel;

        // 본체
        for (const s of forStmt.body) {
          this.generateStatement(s);
        }

        // 업데이트
        if (forStmt.update) {
          this.generateExpression(forStmt.update);
        }

        this.emit(Opcode.JMP, { label: loopLabel });
        this.placeLabel(exitLabel);

        this.breakLabel = prevBreak;
        this.continueLabel = prevContinue;
        break;
      }

      case "Block": {
        const block = stmt as Block;
        this.enterScope();
        for (const s of block.body) {
          this.generateStatement(s);
        }
        this.exitScope();
        break;
      }

      case "Break": {
        if (this.breakLabel) {
          this.emit(Opcode.JMP, { label: this.breakLabel });
        }
        break;
      }

      case "Continue": {
        if (this.continueLabel) {
          this.emit(Opcode.JMP, { label: this.continueLabel });
        }
        break;
      }
    }
  }

  private generateAssignment(target: Expr, value: Expr): void {
    if (target.type === "Identifier") {
      const id = target as Identifier;
      const info = this.resolveVariable(id.name);
      this.generateExpression(value);
      this.emit(Opcode.STORE, info.index);
    } else if (target.type === "Index") {
      const idx = target as Index;
      this.generateExpression(idx.object);
      this.generateExpression(idx.index);
      this.generateExpression(value);
      this.emit(Opcode.ARRAY_SET);
    } else if (target.type === "Member") {
      const member = target as Member;
      this.generateExpression(member.object);
      this.emit(Opcode.PUSH_CONST, member.property);
      this.generateExpression(value);
      this.emit(Opcode.OBJECT_SET);
    }
  }

  // ========== 표현식 생성 ==========

  private generateExpression(expr: Expr): void {
    switch (expr.type) {
      case "NumberLiteral": {
        const num = expr as NumberLiteral;
        this.emit(Opcode.PUSH_CONST, num.value);
        break;
      }

      case "StringLiteral": {
        const str = expr as StringLiteral;
        this.emit(Opcode.PUSH_CONST, str.value);
        break;
      }

      case "BooleanLiteral": {
        const bool = expr as BooleanLiteral;
        this.emit(Opcode.PUSH_CONST, bool.value);
        break;
      }

      case "Identifier": {
        const id = expr as Identifier;
        const info = this.resolveVariable(id.name);
        this.emit(Opcode.LOAD, info.index);
        break;
      }

      case "ArrayLiteral": {
        const arr = expr as ArrayLiteral;
        for (const elem of arr.elements) {
          this.generateExpression(elem);
        }
        this.emit(Opcode.ARRAY_CREATE, arr.elements.length);
        break;
      }

      case "ObjectLiteral": {
        const obj = expr as ObjectLiteral;
        for (const prop of obj.properties) {
          this.generateExpression(prop.value);
        }
        const keys = obj.properties.map((p) => p.key);
        this.emit(Opcode.OBJECT_CREATE, {
          keys,
          count: obj.properties.length,
        });
        break;
      }

      case "Binary": {
        const bin = expr as Binary;
        this.generateExpression(bin.left);
        this.generateExpression(bin.right);

        const opMap: Record<string, Opcode> = {
          "+": Opcode.ADD,
          "-": Opcode.SUB,
          "*": Opcode.MUL,
          "/": Opcode.DIV,
          "%": Opcode.MOD,
          "**": Opcode.POW,
          "==": Opcode.EQ,
          "!=": Opcode.NE,
          "<": Opcode.LT,
          ">": Opcode.GT,
          "<=": Opcode.LE,
          ">=": Opcode.GE,
          "&&": Opcode.AND,
          "||": Opcode.OR,
        };

        const op = opMap[bin.op];
        if (op !== undefined) {
          this.emit(op);
        } else {
          this.error(`Unknown binary operator: ${bin.op}`);
        }
        break;
      }

      case "Unary": {
        const un = expr as Unary;
        this.generateExpression(un.arg);

        if (un.op === "!") {
          this.emit(Opcode.NOT);
        } else if (un.op === "-") {
          this.emit(Opcode.PUSH_CONST, -1);
          this.emit(Opcode.MUL);
        } else if (un.op === "+") {
          // No-op
        }
        break;
      }

      case "Index": {
        const idx = expr as Index;
        this.generateExpression(idx.object);
        this.generateExpression(idx.index);
        this.emit(Opcode.ARRAY_GET);
        break;
      }

      case "Member": {
        const member = expr as Member;
        this.generateExpression(member.object);
        this.emit(Opcode.PUSH_CONST, member.property);
        this.emit(Opcode.OBJECT_GET);
        break;
      }

      case "Call": {
        const call = expr as Call;
        for (const arg of call.args) {
          this.generateExpression(arg);
        }

        // Built-in 함수 확인
        const builtins = ["println", "print", "length"];
        if (builtins.includes(call.name)) {
          this.emit(Opcode.CALL_NATIVE, {
            name: call.name,
            argc: call.args.length,
          });
        } else {
          // 사용자 정의 함수
          if (this.functions.has(call.name)) {
            this.emit(Opcode.FUNCTION_CALL, {
              name: call.name,
              argc: call.args.length,
            });
          } else {
            this.error(`Undefined function: ${call.name}`);
          }
        }
        break;
      }

      case "Ternary": {
        const tern = expr as Ternary;
        const falseLabel = this.makeLabel();
        const endLabel = this.makeLabel();

        this.generateExpression(tern.cond);
        this.emit(Opcode.JMP_IF, { label: falseLabel, negate: true });

        this.generateExpression(tern.then);
        this.emit(Opcode.JMP, { label: endLabel });

        this.placeLabel(falseLabel);
        this.generateExpression(tern.else);

        this.placeLabel(endLabel);
        break;
      }
    }
  }

  // ========== 유틸리티 ==========

  private emit(op: Opcode, arg?: any): void {
    this.instructions.push({ op, arg });
  }

  private makeLabel(): string {
    return `L${this.labelCounter++}`;
  }

  private placeLabel(label: string): void {
    this.instructions.push({ label });
  }

  private enterScope(): void {
    this.scopeStack.push(new Map());
  }

  private exitScope(): void {
    this.scopeStack.pop();
  }

  private declareLocal(name: string): number {
    const index = this.localCounter++;
    const currentScope = this.scopeStack[this.scopeStack.length - 1];
    currentScope.set(name, { name, index, depth: this.scopeStack.length });
    return index;
  }

  private resolveVariable(name: string): VariableInfo {
    // 가장 안쪽 스코프부터 검색
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      const scope = this.scopeStack[i];
      if (scope.has(name)) {
        return scope.get(name)!;
      }
    }
    this.error(`Undefined variable: ${name}`);
    throw new Error(`Undefined variable: ${name}`);
  }

  private error(message: string): void {
    this.errors.push(message);
  }
}
