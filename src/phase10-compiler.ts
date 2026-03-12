/**
 * Phase 10: Complete Compiler Pipeline
 *
 * 소스 코드 → 파싱 → 코드생성 → 실행
 * 하나의 통합 컴파일러 인터페이스
 */

import { ParserAdvanced } from "./parser-advanced";
import { AdvancedCodeGenerator } from "./phase9-codegen";
import { AdvancedVM } from "./freelang-vm-advanced";
import { Program } from "./phase9-ast";

export interface CompileResult {
  success: boolean;
  output: string[];
  errors: {
    parse: string[];
    codegen: string[];
    runtime: string[];
  };
  stats: {
    sourceLength: number;
    tokenCount: number;
    astNodes: number;
    instructions: number;
    executionTime: number;
  };
}

export class Phase10Compiler {
  /**
   * 소스 코드를 완전히 컴파일하고 실행
   */
  static compile(source: string): CompileResult {
    const startTime = Date.now();

    // 1단계: 파싱
    const parseErrors: string[] = [];
    let ast: Program;

    try {
      const parser = new ParserAdvanced(source);
      ast = parser.parse();
      parseErrors.push(...parser.getErrors().map((e) => `${e.message} at line ${e.line}`));
    } catch (error) {
      return {
        success: false,
        output: [],
        errors: {
          parse: [String(error)],
          codegen: [],
          runtime: [],
        },
        stats: {
          sourceLength: source.length,
          tokenCount: 0,
          astNodes: 0,
          instructions: 0,
          executionTime: Date.now() - startTime,
        },
      };
    }

    // 2단계: 코드 생성
    const codegenErrors: string[] = [];
    let instructions;

    try {
      const codegen = new AdvancedCodeGenerator();
      const result = codegen.generate(ast);
      instructions = result.instructions;
      codegenErrors.push(...result.errors);
    } catch (error) {
      return {
        success: false,
        output: [],
        errors: {
          parse: parseErrors,
          codegen: [String(error)],
          runtime: [],
        },
        stats: {
          sourceLength: source.length,
          tokenCount: 0,
          astNodes: this.countAstNodes(ast),
          instructions: 0,
          executionTime: Date.now() - startTime,
        },
      };
    }

    // 3단계: VM에서 실행
    const runtimeErrors: string[] = [];
    let output: string[] = [];

    try {
      const vm = new AdvancedVM();
      vm.execute(instructions);
      output = vm.getOutput();
    } catch (error) {
      runtimeErrors.push(String(error));
    }

    const executionTime = Date.now() - startTime;

    return {
      success: parseErrors.length === 0 && codegenErrors.length === 0 && runtimeErrors.length === 0,
      output,
      errors: {
        parse: parseErrors,
        codegen: codegenErrors,
        runtime: runtimeErrors,
      },
      stats: {
        sourceLength: source.length,
        tokenCount: 0, // 렉서에서 별도로 계산 필요
        astNodes: this.countAstNodes(ast),
        instructions: instructions.length,
        executionTime,
      },
    };
  }

  /**
   * 파싱만 수행
   */
  static parse(source: string) {
    const parser = new ParserAdvanced(source);
    const ast = parser.parse();
    const errors = parser.getErrors();

    return {
      ast,
      errors,
      success: errors.length === 0,
    };
  }

  /**
   * 파싱 + 코드생성만 수행
   */
  static generateCode(source: string) {
    const parseResult = this.parse(source);
    if (!parseResult.success) {
      return {
        instructions: [],
        errors: parseResult.errors,
        success: false,
      };
    }

    const codegen = new AdvancedCodeGenerator();
    const result = codegen.generate(parseResult.ast);

    return {
      instructions: result.instructions,
      errors: result.errors,
      success: result.errors.length === 0,
    };
  }

  /**
   * AST 노드 개수 계산
   */
  private static countAstNodes(ast: Program): number {
    let count = 1; // Program 자체

    function walkStmt(stmt: any): void {
      count++;
      if (stmt.body && Array.isArray(stmt.body)) {
        stmt.body.forEach(walkStmt);
      }
      if (stmt.then && Array.isArray(stmt.then)) {
        stmt.then.forEach(walkStmt);
      }
      if (stmt.else && Array.isArray(stmt.else)) {
        stmt.else.forEach(walkStmt);
      }
      if (stmt.init && typeof stmt.init === "object") {
        count++;
      }
      if (stmt.cond && typeof stmt.cond === "object") {
        count++;
      }
      if (stmt.update && typeof stmt.update === "object") {
        count++;
      }
      if (stmt.value && typeof stmt.value === "object") {
        count++;
      }
    }

    ast.body.forEach(walkStmt);
    return count;
  }
}

/**
 * 간편 함수들
 */
export function compile(source: string): CompileResult {
  return Phase10Compiler.compile(source);
}

export function parse(source: string) {
  return Phase10Compiler.parse(source);
}

export function generateCode(source: string) {
  return Phase10Compiler.generateCode(source);
}

/**
 * REPL 모드 지원
 */
export class InteractiveCompiler {
  private history: string[] = [];

  compile(source: string) {
    this.history.push(source);
    return Phase10Compiler.compile(source);
  }

  getHistory(): string[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }
}
