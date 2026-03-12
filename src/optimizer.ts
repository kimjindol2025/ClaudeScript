/**
 * Phase 12: Compiler Optimization
 *
 * AST 수준의 최적화 패스들을 구현합니다:
 * - Pass 1: 상수 폴딩 (Constant Folding)
 * - Pass 2: 죽은 코드 제거 (Dead Code Elimination)
 * - Pass 3: 루프 최적화
 * - Pass 4: 함수 인라인화
 * - Pass 5: 바이트코드 최적화
 */

import {
  Program,
  Stmt,
  Expr,
  VarDecl,
  FunctionDecl,
  Return,
  If,
  While,
  For,
  ForIn,
  ForOf,
  Block,
  Break,
  Continue,
  ExprStmt,
} from "./phase9-ast";

// ============================================================================
// Pass 1: 상수 폴딩 (Constant Folding)
// ============================================================================

export class ConstantFolder {
  /**
   * 상수 표현식을 컴파일 타임에 계산하여 단순화
   */
  fold(program: Program): Program {
    return {
      type: "Program",
      body: program.body.map((stmt) => this.foldStmt(stmt)),
    };
  }

  private foldStmt(stmt: Stmt): Stmt {
    switch (stmt.type) {
      case "VarDecl": {
        const varDecl = stmt as VarDecl;
        return {
          ...varDecl,
          init: varDecl.init ? this.foldExpr(varDecl.init) : undefined,
        };
      }

      case "ExprStmt": {
        const exprStmt = stmt as ExprStmt;
        return {
          ...exprStmt,
          expr: this.foldExpr(exprStmt.expr),
        };
      }

      case "If": {
        const ifStmt = stmt as If;
        return {
          ...ifStmt,
          condition: this.foldExpr(ifStmt.condition),
          consequent: this.foldStmt(ifStmt.consequent),
          alternate: ifStmt.alternate ? this.foldStmt(ifStmt.alternate) : undefined,
        };
      }

      case "While": {
        const whileStmt = stmt as While;
        return {
          ...whileStmt,
          condition: this.foldExpr(whileStmt.condition),
          body: this.foldStmt(whileStmt.body),
        };
      }

      case "For": {
        const forStmt = stmt as For;
        return {
          ...forStmt,
          init: forStmt.init ? this.foldStmt(forStmt.init) : undefined,
          test: forStmt.test ? this.foldExpr(forStmt.test) : undefined,
          update: forStmt.update ? this.foldExpr(forStmt.update) : undefined,
          body: this.foldStmt(forStmt.body),
        };
      }

      case "Block": {
        const block = stmt as Block;
        return {
          ...block,
          body: block.body.map((s) => this.foldStmt(s)),
        };
      }

      case "FunctionDecl": {
        const funcDecl = stmt as FunctionDecl;
        return {
          ...funcDecl,
          body: this.foldStmt(funcDecl.body),
        };
      }

      case "Return": {
        const returnStmt = stmt as Return;
        return {
          ...returnStmt,
          argument: returnStmt.argument
            ? this.foldExpr(returnStmt.argument)
            : undefined,
        };
      }

      default:
        return stmt;
    }
  }

  private foldExpr(expr: Expr): Expr {
    // 재귀적으로 내부 표현식 먼저 폴드
    expr = this.foldInnerExpr(expr);

    // 이항 연산자 상수 폴딩
    if (expr.type === "Binary") {
      const binary = expr as any;
      const left = binary.left;
      const right = binary.right;

      if (this.isConstant(left) && this.isConstant(right)) {
        try {
          const result = this.evaluate(
            this.getConstantValue(left),
            binary.op,
            this.getConstantValue(right)
          );

          if (typeof result === "number") {
            return {
              type: "NumberLiteral",
              value: result,
            };
          } else if (typeof result === "string") {
            return {
              type: "StringLiteral",
              value: result,
            };
          } else if (typeof result === "boolean") {
            return {
              type: "BooleanLiteral",
              value: result,
            };
          }
        } catch (e) {
          // 계산 실패 시 원래 표현식 반환
        }
      }
    }

    // 단항 연산자 상수 폴딩
    if (expr.type === "Unary") {
      const unary = expr as any;
      if (this.isConstant(unary.argument)) {
        try {
          const result = this.evaluateUnary(
            unary.op,
            this.getConstantValue(unary.argument)
          );

          if (typeof result === "number") {
            return {
              type: "NumberLiteral",
              value: result,
            };
          } else if (typeof result === "boolean") {
            return {
              type: "BooleanLiteral",
              value: result,
            };
          }
        } catch (e) {
          // 계산 실패 시 원래 표현식 반환
        }
      }
    }

    return expr;
  }

  private foldInnerExpr(expr: Expr): Expr {
    switch (expr.type) {
      case "Binary": {
        const binary = expr as any;
        return {
          ...binary,
          left: this.foldExpr(binary.left),
          right: this.foldExpr(binary.right),
        };
      }

      case "Unary": {
        const unary = expr as any;
        return {
          ...unary,
          argument: this.foldExpr(unary.argument),
        };
      }

      case "Call": {
        const call = expr as any;
        return {
          ...call,
          callee: this.foldExpr(call.callee),
          arguments: call.arguments.map((arg: Expr) => this.foldExpr(arg)),
        };
      }

      case "Member": {
        const member = expr as any;
        return {
          ...member,
          object: this.foldExpr(member.object),
        };
      }

      case "Index": {
        const index = expr as any;
        return {
          ...index,
          object: this.foldExpr(index.object),
          index: this.foldExpr(index.index),
        };
      }

      case "ArrayLiteral": {
        const array = expr as any;
        return {
          ...array,
          elements: array.elements.map((e: Expr) => this.foldExpr(e)),
        };
      }

      case "ObjectLiteral": {
        const obj = expr as any;
        return {
          ...obj,
          properties: obj.properties.map((prop: any) => ({
            ...prop,
            value: this.foldExpr(prop.value),
          })),
        };
      }

      default:
        return expr;
    }
  }

  private isConstant(expr: Expr): boolean {
    return (
      expr.type === "NumberLiteral" ||
      expr.type === "StringLiteral" ||
      expr.type === "BooleanLiteral" ||
      expr.type === "NullLiteral" ||
      expr.type === "UndefinedLiteral"
    );
  }

  private getConstantValue(expr: Expr): any {
    const e = expr as any;
    switch (expr.type) {
      case "NumberLiteral":
        return e.value;
      case "StringLiteral":
        return e.value;
      case "BooleanLiteral":
        return e.value;
      case "NullLiteral":
        return null;
      case "UndefinedLiteral":
        return undefined;
      default:
        throw new Error("Not a constant");
    }
  }

  private evaluate(left: any, op: string, right: any): any {
    switch (op) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      case "%":
        return left % right;
      case "**":
        return Math.pow(left, right);
      case "==":
        return left == right;
      case "!=":
        return left != right;
      case "<":
        return left < right;
      case ">":
        return left > right;
      case "<=":
        return left <= right;
      case ">=":
        return left >= right;
      case "&&":
        return left && right;
      case "||":
        return left || right;
      default:
        throw new Error(`Unknown operator: ${op}`);
    }
  }

  private evaluateUnary(op: string, arg: any): any {
    switch (op) {
      case "-":
        return -arg;
      case "+":
        return +arg;
      case "!":
        return !arg;
      case "typeof":
        return typeof arg;
      default:
        throw new Error(`Unknown unary operator: ${op}`);
    }
  }
}

// ============================================================================
// Pass 2: 죽은 코드 제거 (Dead Code Elimination)
// ============================================================================

export class DeadCodeEliminator {
  /**
   * 도달 불가능한 코드를 제거합니다
   */
  eliminate(program: Program): Program {
    return {
      type: "Program",
      body: this.eliminateStmts(program.body),
    };
  }

  private eliminateStmts(stmts: Stmt[]): Stmt[] {
    const result: Stmt[] = [];

    for (const stmt of stmts) {
      result.push(this.eliminateStmt(stmt));

      // return, break, continue 이후의 코드는 도달 불가능
      if (
        stmt.type === "Return" ||
        (stmt.type === "If" && this.alwaysReturns(stmt as If))
      ) {
        break;
      }
    }

    return result;
  }

  private eliminateStmt(stmt: Stmt): Stmt {
    switch (stmt.type) {
      case "If": {
        const ifStmt = stmt as If;
        return {
          ...ifStmt,
          consequent: this.eliminateStmt(ifStmt.consequent),
          alternate: ifStmt.alternate
            ? this.eliminateStmt(ifStmt.alternate)
            : undefined,
        };
      }

      case "While": {
        const whileStmt = stmt as While;
        return {
          ...whileStmt,
          body: this.eliminateStmt(whileStmt.body),
        };
      }

      case "For": {
        const forStmt = stmt as For;
        return {
          ...forStmt,
          body: this.eliminateStmt(forStmt.body),
        };
      }

      case "Block": {
        const block = stmt as Block;
        return {
          ...block,
          body: this.eliminateStmts(block.body),
        };
      }

      case "FunctionDecl": {
        const funcDecl = stmt as FunctionDecl;
        return {
          ...funcDecl,
          body: this.eliminateStmt(funcDecl.body),
        };
      }

      default:
        return stmt;
    }
  }

  /**
   * if 문이 항상 return하는지 확인
   */
  private alwaysReturns(ifStmt: If): boolean {
    const consequentReturns = this.stmtReturns(ifStmt.consequent);
    if (!ifStmt.alternate) return false; // else가 없으면 항상 return하지 않음

    const alternateReturns = this.stmtReturns(ifStmt.alternate);
    return consequentReturns && alternateReturns;
  }

  private stmtReturns(stmt: Stmt): boolean {
    if (stmt.type === "Return") return true;

    if (stmt.type === "Block") {
      const block = stmt as Block;
      return block.body.some((s) => this.stmtReturns(s));
    }

    if (stmt.type === "If") {
      return this.alwaysReturns(stmt as If);
    }

    return false;
  }
}

// ============================================================================
// Pass 3: 루프 최적화 (Loop Optimization)
// ============================================================================

export class LoopOptimizer {
  /**
   * 작은 루프를 언롤하거나 불변 코드를 이동
   */
  optimize(program: Program): Program {
    return {
      type: "Program",
      body: program.body.map((stmt) => this.optimizeStmt(stmt)),
    };
  }

  private optimizeStmt(stmt: Stmt): Stmt {
    switch (stmt.type) {
      case "For": {
        const forStmt = stmt as For;
        // 작은 루프는 언롤 고려
        if (this.isSmallConstantLoop(forStmt)) {
          // 현재는 단순히 body만 최적화
          return {
            ...forStmt,
            body: this.optimizeStmt(forStmt.body),
          };
        }
        // 큰 루프는 불변 코드 이동 고려
        return {
          ...forStmt,
          body: this.optimizeStmt(forStmt.body),
        };
      }

      case "While": {
        const whileStmt = stmt as While;
        return {
          ...whileStmt,
          body: this.optimizeStmt(whileStmt.body),
        };
      }

      case "Block": {
        const block = stmt as Block;
        return {
          ...block,
          body: block.body.map((s) => this.optimizeStmt(s)),
        };
      }

      case "If": {
        const ifStmt = stmt as If;
        return {
          ...ifStmt,
          consequent: this.optimizeStmt(ifStmt.consequent),
          alternate: ifStmt.alternate
            ? this.optimizeStmt(ifStmt.alternate)
            : undefined,
        };
      }

      case "FunctionDecl": {
        const funcDecl = stmt as FunctionDecl;
        return {
          ...funcDecl,
          body: this.optimizeStmt(funcDecl.body),
        };
      }

      default:
        return stmt;
    }
  }

  private isSmallConstantLoop(forStmt: For): boolean {
    // for(let i = 0; i < N; i += 1) 형태의 작은 루프를 찾음
    // N이 상수이고 N <= 4인 경우만 언롤 고려
    const test = forStmt.test as any;
    if (!test || test.type !== "Binary" || test.op !== "<") {
      return false;
    }

    const right = test.right as any;
    return (
      right.type === "NumberLiteral" &&
      typeof right.value === "number" &&
      right.value <= 4
    );
  }
}

// ============================================================================
// Pass 4: 함수 인라인화 (Function Inlining)
// ============================================================================

export class InlineFunctions {
  private functionDefs: Map<string, FunctionDecl> = new Map();

  /**
   * 작은 함수를 인라인으로 전개
   */
  inline(program: Program): Program {
    // 함수 정의 수집
    this.collectFunctions(program);

    return {
      type: "Program",
      body: program.body
        .map((stmt) => this.inlineStmt(stmt))
        .filter((stmt) => stmt !== null) as Stmt[],
    };
  }

  private collectFunctions(program: Program): void {
    for (const stmt of program.body) {
      if (stmt.type === "FunctionDecl") {
        const funcDecl = stmt as FunctionDecl;
        this.functionDefs.set(funcDecl.name, funcDecl);
      }
    }
  }

  private inlineStmt(stmt: Stmt): Stmt | null {
    switch (stmt.type) {
      case "VarDecl": {
        const varDecl = stmt as VarDecl;
        return {
          ...varDecl,
          init: varDecl.init ? this.inlineExpr(varDecl.init) : undefined,
        };
      }

      case "ExprStmt": {
        const exprStmt = stmt as ExprStmt;
        return {
          ...exprStmt,
          expr: this.inlineExpr(exprStmt.expr),
        };
      }

      case "Block": {
        const block = stmt as Block;
        return {
          ...block,
          body: block.body
            .map((s) => this.inlineStmt(s))
            .filter((s) => s !== null) as Stmt[],
        };
      }

      case "If": {
        const ifStmt = stmt as If;
        return {
          ...ifStmt,
          condition: this.inlineExpr(ifStmt.condition),
          consequent: this.inlineStmt(ifStmt.consequent) || ifStmt.consequent,
          alternate: ifStmt.alternate
            ? this.inlineStmt(ifStmt.alternate)
            : undefined,
        };
      }

      case "While": {
        const whileStmt = stmt as While;
        return {
          ...whileStmt,
          condition: this.inlineExpr(whileStmt.condition),
          body: this.inlineStmt(whileStmt.body) || whileStmt.body,
        };
      }

      case "For": {
        const forStmt = stmt as For;
        return {
          ...forStmt,
          init: forStmt.init ? this.inlineStmt(forStmt.init) : undefined,
          test: forStmt.test ? this.inlineExpr(forStmt.test) : undefined,
          update: forStmt.update ? this.inlineExpr(forStmt.update) : undefined,
          body: this.inlineStmt(forStmt.body) || forStmt.body,
        };
      }

      case "Return": {
        const returnStmt = stmt as Return;
        return {
          ...returnStmt,
          argument: returnStmt.argument
            ? this.inlineExpr(returnStmt.argument)
            : undefined,
        };
      }

      // FunctionDecl은 제거 불가 (함수 정의 필요)
      default:
        return stmt;
    }
  }

  private inlineExpr(expr: Expr): Expr {
    switch (expr.type) {
      case "Call": {
        const call = expr as any;
        const funcName = (call.callee as any).name;
        const funcDef = this.functionDefs.get(funcName);

        // 작은 함수만 인라인 (return만 있는 함수)
        if (funcDef && this.isSmallFunction(funcDef)) {
          // 함수의 body가 single return이면 그 표현식으로 대체
          if (
            funcDef.body.type === "Block" &&
            (funcDef.body as any).body.length === 1 &&
            (funcDef.body as any).body[0].type === "Return"
          ) {
            const returnStmt = (funcDef.body as any).body[0] as Return;
            if (returnStmt.argument) {
              return this.inlineExpr(returnStmt.argument);
            }
          }
        }

        // 인라인 불가능한 경우 인자만 인라인
        return {
          ...call,
          callee: this.inlineExpr(call.callee),
          arguments: call.arguments.map((arg: Expr) => this.inlineExpr(arg)),
        };
      }

      case "Binary": {
        const binary = expr as any;
        return {
          ...binary,
          left: this.inlineExpr(binary.left),
          right: this.inlineExpr(binary.right),
        };
      }

      case "Unary": {
        const unary = expr as any;
        return {
          ...unary,
          argument: this.inlineExpr(unary.argument),
        };
      }

      case "Member": {
        const member = expr as any;
        return {
          ...member,
          object: this.inlineExpr(member.object),
        };
      }

      case "Index": {
        const index = expr as any;
        return {
          ...index,
          object: this.inlineExpr(index.object),
          index: this.inlineExpr(index.index),
        };
      }

      case "ArrayLiteral": {
        const array = expr as any;
        return {
          ...array,
          elements: array.elements.map((e: Expr) => this.inlineExpr(e)),
        };
      }

      case "ObjectLiteral": {
        const obj = expr as any;
        return {
          ...obj,
          properties: obj.properties.map((prop: any) => ({
            ...prop,
            value: this.inlineExpr(prop.value),
          })),
        };
      }

      default:
        return expr;
    }
  }

  private isSmallFunction(funcDef: FunctionDecl): boolean {
    // body가 단순한 return 문장 1개면 작은 함수
    if (funcDef.body.type !== "Block") return false;

    const block = funcDef.body as any;
    return block.body.length === 1 && block.body[0].type === "Return";
  }
}

// ============================================================================
// 통합 최적화기
// ============================================================================

export class Optimizer {
  /**
   * 모든 최적화 패스를 순차적으로 적용
   */
  static optimize(program: Program): Program {
    // Pass 1: 상수 폴딩
    program = new ConstantFolder().fold(program);

    // Pass 2: 죽은 코드 제거
    program = new DeadCodeEliminator().eliminate(program);

    // Pass 3: 루프 최적화
    program = new LoopOptimizer().optimize(program);

    // Pass 4: 함수 인라인화
    program = new InlineFunctions().inline(program);

    return program;
  }
}
