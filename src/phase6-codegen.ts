/**
 * Phase 6: Code Generator
 *
 * AST → VT Bytecode로 변환
 * 사용자 변수 → 로컬 인덱스 맵핑
 * 제어 흐름 점프 주소 패치
 */

import { OpCode } from "./vt-opcodes";
import { Instruction } from "./vt-instruction";
import { Program, Stmt, Expr } from "./phase6-ast";

export class Phase6CodeGenerator {
  private instructions: Instruction[] = [];
  private locals = new Map<string, number>();
  private localIndex = 0;

  generate(program: Program): Instruction[] {
    program.body.forEach((stmt) => this.emitStmt(stmt));

    // 명시적 Return이 없으면 implicit 0 반환
    if (
      this.instructions.length === 0 ||
      this.instructions[this.instructions.length - 1].op !== OpCode.HALT
    ) {
      this.emit(OpCode.PUSH_CONST, 0);
      this.emit(OpCode.HALT);
    }

    return this.instructions;
  }

  private emit(op: OpCode, arg?: number) {
    this.instructions.push({ op, arg });
  }

  private emitStmt(stmt: Stmt) {
    switch (stmt.type) {
      case "VarDecl": {
        this.emitExpr(stmt.init);

        // 이미 선언된 변수면 기존 인덱스 사용
        if (!this.locals.has(stmt.name)) {
          this.locals.set(stmt.name, this.localIndex++);
        }

        const index = this.locals.get(stmt.name)!;
        this.emit(OpCode.STORE, index);
        break;
      }

      case "Return": {
        this.emitExpr(stmt.value);
        this.emit(OpCode.HALT);
        break;
      }

      case "If": {
        this.emitExpr(stmt.cond);
        const jzIndex = this.instructions.length;
        this.emit(OpCode.JZ, 0); // placeholder

        stmt.then.forEach((s) => this.emitStmt(s));

        const jmpIndex = this.instructions.length;
        this.emit(OpCode.JMP, 0);

        // patch JZ
        this.instructions[jzIndex].arg = this.instructions.length;

        stmt.else?.forEach((s) => this.emitStmt(s));

        // patch JMP
        this.instructions[jmpIndex].arg = this.instructions.length;
        break;
      }

      case "While": {
        const loopStart = this.instructions.length;
        this.emitExpr(stmt.cond);

        const jzIndex = this.instructions.length;
        this.emit(OpCode.JZ, 0);

        stmt.body.forEach((s) => this.emitStmt(s));

        this.emit(OpCode.JMP, loopStart);

        this.instructions[jzIndex].arg = this.instructions.length;
        break;
      }

      case "Call": {
        // 인자 평가
        stmt.args.forEach((arg) => this.emitExpr(arg));

        // 인자 개수를 스택에 push
        this.emit(OpCode.PUSH_CONST, stmt.args.length);

        // 네이티브 함수 호출
        const fnId = this.getNativeFunctionId(stmt.name);
        this.emit(OpCode.CALL_NATIVE, fnId);
        break;
      }
    }
  }

  private emitExpr(expr: Expr) {
    switch (expr.type) {
      case "NumberLiteral":
        this.emit(OpCode.PUSH_CONST, expr.value);
        break;

      case "Identifier":
        this.emit(OpCode.LOAD, this.locals.get(expr.name)!);
        break;

      case "Binary": {
        this.emitExpr(expr.left);
        this.emitExpr(expr.right);

        switch (expr.op) {
          case "+":
            this.emit(OpCode.ADD);
            break;
          case "-":
            this.emit(OpCode.SUB);
            break;
          case "*":
            this.emit(OpCode.MUL);
            break;
          case "/":
            this.emit(OpCode.DIV);
            break;
          case "==":
            this.emit(OpCode.EQ);
            break;
          case "<":
            this.emit(OpCode.LT);
            break;
          case ">":
            this.emit(OpCode.GT);
            break;
        }
        break;
      }

      case "Call": {
        // 인자 평가
        expr.args.forEach((arg) => this.emitExpr(arg));

        // 인자 개수를 스택에 push
        this.emit(OpCode.PUSH_CONST, expr.args.length);

        // 네이티브 함수 호출
        const fnId = this.getNativeFunctionId(expr.name);
        this.emit(OpCode.CALL_NATIVE, fnId);
        break;
      }
    }
  }

  /**
   * 함수 이름 → 네이티브 함수 ID 매핑
   */
  private getNativeFunctionId(name: string): number {
    const nativeMap: Record<string, number> = {
      println: 0,
      print: 1,
      length: 2,
    };

    if (!(name in nativeMap)) {
      throw new Error(`Unknown native function: ${name}`);
    }

    return nativeMap[name];
  }
}
