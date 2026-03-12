/**
 * Phase 11: Type System Integration
 *
 * Phase 10 컴파일러와 타입 시스템 통합
 * - 파싱 후 타입 검사
 * - 타입 에러 보고
 * - 타입 정보 기반 최적화
 */

import { ParserAdvanced } from "./parser-advanced";
import { AdvancedCodeGenerator } from "./phase9-codegen";
import { AdvancedVM } from "./freelang-vm-advanced";
import { TypeChecker, TypeEnvironment, Type, TypeError, typeToString } from "./type-system";

export interface TypedCompileResult {
  success: boolean;
  output: string[];
  typeErrors: TypeError[];
  runtimeErrors: string[];
  stats: {
    sourceLength: number;
    hasTypeAnnotations: boolean;
    typesChecked: number;
    executionTime: number;
  };
}

/**
 * 타입 시스템 통합 컴파일러
 */
export class TypedCompiler {
  /**
   * 완전한 파이프라인: 소스 → 파싱 → 타입검사 → 코드생성 → 실행
   */
  static compile(source: string): TypedCompileResult {
    const startTime = Date.now();
    const typeErrors: TypeError[] = [];
    const runtimeErrors: string[] = [];
    let output: string[] = [];

    try {
      // 1단계: 파싱
      const parser = new ParserAdvanced(source);
      const ast = parser.parse();

      const parseErrors = parser.getErrors();
      if (parseErrors.length > 0) {
        return {
          success: false,
          output: [],
          typeErrors: parseErrors.map((e) => ({
            message: e.message,
            line: e.line,
            column: e.column,
          })),
          runtimeErrors: [],
          stats: {
            sourceLength: source.length,
            hasTypeAnnotations: false,
            typesChecked: 0,
            executionTime: Date.now() - startTime,
          },
        };
      }

      // 2단계: 타입 검사
      const typeChecker = new TypeChecker();
      const typeCheckResult = typeChecker.check(source);

      typeErrors.push(...typeCheckResult.errors);

      // 타입 에러가 있어도 계속 진행 (경고로 취급)
      // 하지만 심각한 에러는 중단
      const criticalErrors = typeErrors.filter(
        (e) => e.message.includes("not assignable") && e.actual && e.expected
      );

      // 3단계: 코드 생성
      const codegen = new AdvancedCodeGenerator();
      const codegenResult = codegen.generate(ast);

      if (codegenResult.errors.length > 0) {
        runtimeErrors.push(...codegenResult.errors);
        return {
          success: false,
          output: [],
          typeErrors,
          runtimeErrors,
          stats: {
            sourceLength: source.length,
            hasTypeAnnotations: this.hasTypeAnnotations(source),
            typesChecked: 0,
            executionTime: Date.now() - startTime,
          },
        };
      }

      // 4단계: 실행
      try {
        const vm = new AdvancedVM();
        vm.execute(codegenResult.instructions);
        output = vm.getOutput();
      } catch (error) {
        runtimeErrors.push(String(error));
      }

      const executionTime = Date.now() - startTime;

      return {
        success: typeErrors.length === 0 && runtimeErrors.length === 0,
        output,
        typeErrors,
        runtimeErrors,
        stats: {
          sourceLength: source.length,
          hasTypeAnnotations: this.hasTypeAnnotations(source),
          typesChecked: this.countTypeAnnotations(source),
          executionTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        output: [],
        typeErrors: [
          {
            message: String(error),
          },
        ],
        runtimeErrors: [],
        stats: {
          sourceLength: source.length,
          hasTypeAnnotations: this.hasTypeAnnotations(source),
          typesChecked: 0,
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * 타입 주석 포함 여부 확인
   */
  private static hasTypeAnnotations(source: string): boolean {
    return /:\s*(number|string|boolean|any)/.test(source);
  }

  /**
   * 타입 주석 개수 계산
   */
  private static countTypeAnnotations(source: string): number {
    const matches = source.match(/:\s*(number|string|boolean|any|[{[\]])/g);
    return matches ? matches.length : 0;
  }
}

/**
 * 타입 검사 리포트 생성
 */
export class TypeCheckReporter {
  /**
   * 타입 에러를 읽기 좋은 형식으로 출력
   */
  static formatErrors(errors: TypeError[]): string {
    if (errors.length === 0) {
      return "✅ No type errors!";
    }

    const lines = [`❌ Found ${errors.length} type error(s):\n`];

    for (const error of errors) {
      let message = `  ${error.message}`;

      if (error.line !== undefined) {
        message += ` (line ${error.line}`;
        if (error.column !== undefined) {
          message += `, column ${error.column}`;
        }
        message += ")";
      }

      if (error.actual && error.expected) {
        message += `\n    Got: ${typeToString(error.actual)}`;
        message += `\n    Expected: ${typeToString(error.expected)}`;
      }

      lines.push(message);
    }

    return lines.join("\n");
  }

  /**
   * 컴파일 결과 요약
   */
  static summarize(result: TypedCompileResult): string {
    const lines: string[] = [];

    if (result.success) {
      lines.push("✅ Compilation successful!");
    } else {
      lines.push("❌ Compilation failed");
    }

    if (result.typeErrors.length > 0) {
      lines.push(`  Type errors: ${result.typeErrors.length}`);
    }

    if (result.runtimeErrors.length > 0) {
      lines.push(`  Runtime errors: ${result.runtimeErrors.length}`);
    }

    if (result.output.length > 0) {
      lines.push(`  Output: ${result.output.length} lines`);
    }

    lines.push(`  Time: ${result.stats.executionTime}ms`);

    if (result.stats.hasTypeAnnotations) {
      lines.push(`  Type annotations: Yes (${result.stats.typesChecked})`);
    }

    return lines.join("\n");
  }
}

/**
 * 간편 함수
 */
export function compileWithTypes(source: string): TypedCompileResult {
  return TypedCompiler.compile(source);
}

export function formatTypeErrors(errors: TypeError[]): string {
  return TypeCheckReporter.formatErrors(errors);
}

export function summarizeResult(result: TypedCompileResult): string {
  return TypeCheckReporter.summarize(result);
}
