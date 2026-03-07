/**
 * ClaudeScript AST 검증기
 * JSON 문법의 올바름을 검사합니다
 */

import {
  Program,
  ValidationResult,
  ValidationError,
  Statement,
  Expression,
  FunctionDef,
  TypeSpec,
} from "./ast";

export class ASTValidator {
  private errors: ValidationError[] = [];

  /**
   * 프로그램 전체 검증
   */
  validateProgram(data: any): ValidationResult {
    this.errors = [];

    if (!data || typeof data !== "object") {
      this.errors.push({
        message: "프로그램은 객체여야 합니다",
        code: "INVALID_PROGRAM",
      });
      return { valid: false, errors: this.errors };
    }

    // type 검증
    if (data.type !== "program") {
      this.errors.push({
        message: `type은 "program"이어야 합니다. 받은 값: ${data.type}`,
        code: "INVALID_TYPE",
      });
    }

    // version 검증
    if (!data.version || typeof data.version !== "string") {
      this.errors.push({
        message: `version은 문자열이어야 합니다`,
        code: "MISSING_VERSION",
      });
    }

    // definitions 검증
    if (!Array.isArray(data.definitions)) {
      this.errors.push({
        message: `definitions은 배열이어야 합니다`,
        code: "INVALID_DEFINITIONS",
      });
    } else {
      for (let i = 0; i < data.definitions.length; i++) {
        this.validateDefinition(data.definitions[i], i);
      }
    }

    // instructions 검증
    if (!Array.isArray(data.instructions)) {
      this.errors.push({
        message: `instructions는 배열이어야 합니다`,
        code: "INVALID_INSTRUCTIONS",
      });
    } else {
      for (let i = 0; i < data.instructions.length; i++) {
        this.validateStatement(data.instructions[i], i);
      }
    }

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      ast: this.errors.length === 0 ? (data as Program) : undefined,
    };
  }

  private validateDefinition(data: any, index: number) {
    const prefix = `definitions[${index}]`;

    if (data.type !== "function") {
      this.errors.push({
        message: `${prefix}: type은 "function"이어야 합니다. 받은 값: ${data.type}`,
        code: "INVALID_DEF_TYPE",
      });
      return;
    }

    // 함수명
    if (!data.name || typeof data.name !== "string") {
      this.errors.push({
        message: `${prefix}: name은 문자열이어야 합니다`,
        code: "MISSING_FUNCTION_NAME",
      });
    }

    // 파라미터
    if (!Array.isArray(data.params)) {
      this.errors.push({
        message: `${prefix}: params는 배열이어야 합니다`,
        code: "INVALID_PARAMS",
      });
    } else {
      data.params.forEach((param: any, i: number) => {
        this.validateParam(param, `${prefix}.params[${i}]`);
      });
    }

    // 반환 타입
    if (!data.return_type) {
      this.errors.push({
        message: `${prefix}: return_type은 필수입니다`,
        code: "MISSING_RETURN_TYPE",
      });
    } else {
      this.validateType(data.return_type, `${prefix}.return_type`);
    }

    // 본체
    if (!Array.isArray(data.body)) {
      this.errors.push({
        message: `${prefix}: body는 배열이어야 합니다`,
        code: "INVALID_BODY",
      });
    } else {
      data.body.forEach((stmt: any, i: number) => {
        this.validateStatement(stmt, i, `${prefix}.body`);
      });
    }
  }

  private validateParam(data: any, prefix: string) {
    if (!data.name || typeof data.name !== "string") {
      this.errors.push({
        message: `${prefix}: name은 문자열이어야 합니다`,
        code: "INVALID_PARAM_NAME",
      });
    }

    if (!data.type) {
      this.errors.push({
        message: `${prefix}: type은 필수입니다`,
        code: "MISSING_PARAM_TYPE",
      });
    } else {
      this.validateType(data.type, `${prefix}.type`);
    }
  }

  private validateType(data: any, prefix: string) {
    if (!data.base) {
      this.errors.push({
        message: `${prefix}: base는 필수입니다`,
        code: "MISSING_TYPE_BASE",
      });
      return;
    }

    // 기본 타입
    const primitives = ["i32", "i64", "f64", "string", "bool", "none"];
    if (primitives.includes(data.base)) {
      return;  // 기본 타입은 OK
    }

    // 복합 타입
    if (data.base === "Array") {
      if (!data.element_type) {
        this.errors.push({
          message: `${prefix}: Array에는 element_type이 필수입니다`,
          code: "MISSING_ELEMENT_TYPE",
        });
      } else {
        this.validateType(data.element_type, `${prefix}.element_type`);
      }
    } else if (data.base === "Option") {
      if (!data.element_type) {
        this.errors.push({
          message: `${prefix}: Option에는 element_type이 필수입니다`,
          code: "MISSING_ELEMENT_TYPE",
        });
      } else {
        this.validateType(data.element_type, `${prefix}.element_type`);
      }
    } else if (data.base === "Object") {
      if (!data.value_type) {
        this.errors.push({
          message: `${prefix}: Object에는 value_type이 필수입니다`,
          code: "MISSING_VALUE_TYPE",
        });
      } else {
        this.validateType(data.value_type, `${prefix}.value_type`);
      }
    } else if (data.base === "Map") {
      if (!data.key_type) {
        this.errors.push({
          message: `${prefix}: Map에는 key_type이 필수입니다`,
          code: "MISSING_KEY_TYPE",
        });
      } else {
        this.validateType(data.key_type, `${prefix}.key_type`);
      }

      if (!data.value_type) {
        this.errors.push({
          message: `${prefix}: Map에는 value_type이 필수입니다`,
          code: "MISSING_VALUE_TYPE",
        });
      } else {
        this.validateType(data.value_type, `${prefix}.value_type`);
      }
    } else if (data.base.length === 1 && data.base === data.base.toUpperCase()) {
      // 제너릭 참조 (T, U, K, V 등)
      return;
    } else {
      // 미정의된 타입
      this.errors.push({
        message: `${prefix}: 알 수 없는 타입 "${data.base}"`,
        code: "UNKNOWN_TYPE",
      });
    }
  }

  private validateStatement(data: any, index: number, prefix: string = "instructions") {
    const stmtPrefix = `${prefix}[${index}]`;

    if (!data || typeof data !== "object") {
      this.errors.push({
        message: `${stmtPrefix}: 문장은 객체여야 합니다`,
        code: "INVALID_STATEMENT",
      });
      return;
    }

    const type = data.type;

    switch (type) {
      case "var":
        this.validateVarDecl(data, stmtPrefix);
        break;
      case "assign":
        this.validateAssign(data, stmtPrefix);
        break;
      case "call":
      case "method_call":
        this.validateCall(data, stmtPrefix);
        break;
      case "return":
        this.validateReturn(data, stmtPrefix);
        break;
      case "condition":
        this.validateCondition(data, stmtPrefix);
        break;
      case "for":
        this.validateFor(data, stmtPrefix);
        break;
      case "while":
        this.validateWhile(data, stmtPrefix);
        break;
      case "match":
        this.validateMatch(data, stmtPrefix);
        break;
      case "try":
        this.validateTry(data, stmtPrefix);
        break;
      case "throw":
        this.validateThrow(data, stmtPrefix);
        break;
      default:
        this.errors.push({
          message: `${stmtPrefix}: 알 수 없는 문장 타입 "${type}"`,
          code: "UNKNOWN_STATEMENT_TYPE",
        });
    }
  }

  private validateVarDecl(data: any, prefix: string) {
    if (!data.name || typeof data.name !== "string") {
      this.errors.push({
        message: `${prefix}: name은 문자열이어야 합니다`,
        code: "MISSING_VAR_NAME",
      });
    }

    if (!data.value) {
      this.errors.push({
        message: `${prefix}: value는 필수입니다`,
        code: "MISSING_VAR_VALUE",
      });
    } else {
      this.validateExpression(data.value, `${prefix}.value`);
    }

    if (data.value_type) {
      this.validateType(data.value_type, `${prefix}.value_type`);
    }
  }

  private validateAssign(data: any, prefix: string) {
    if (!data.name || typeof data.name !== "string") {
      this.errors.push({
        message: `${prefix}: name은 문자열이어야 합니다`,
        code: "MISSING_ASSIGN_NAME",
      });
    }

    if (!data.value) {
      this.errors.push({
        message: `${prefix}: value는 필수입니다`,
        code: "MISSING_ASSIGN_VALUE",
      });
    } else {
      this.validateExpression(data.value, `${prefix}.value`);
    }
  }

  private validateCall(data: any, prefix: string) {
    if (!data.function || typeof data.function !== "string") {
      this.errors.push({
        message: `${prefix}: function은 문자열이어야 합니다`,
        code: "MISSING_FUNCTION_NAME",
      });
    }

    if (!Array.isArray(data.args)) {
      this.errors.push({
        message: `${prefix}: args는 배열이어야 합니다`,
        code: "INVALID_ARGS",
      });
    } else {
      data.args.forEach((arg: any, i: number) => {
        this.validateExpression(arg, `${prefix}.args[${i}]`);
      });
    }
  }

  private validateReturn(data: any, prefix: string) {
    if (!data.value) {
      this.errors.push({
        message: `${prefix}: value는 필수입니다`,
        code: "MISSING_RETURN_VALUE",
      });
    } else {
      this.validateExpression(data.value, `${prefix}.value`);
    }
  }

  private validateCondition(data: any, prefix: string) {
    if (!data.test) {
      this.errors.push({
        message: `${prefix}: test는 필수입니다`,
        code: "MISSING_TEST",
      });
    } else {
      this.validateExpression(data.test, `${prefix}.test`);
    }

    if (!Array.isArray(data.then)) {
      this.errors.push({
        message: `${prefix}: then은 배열이어야 합니다`,
        code: "INVALID_THEN",
      });
    } else {
      data.then.forEach((stmt: any, i: number) => {
        this.validateStatement(stmt, i, `${prefix}.then`);
      });
    }

    if (data.else) {
      if (!Array.isArray(data.else)) {
        this.errors.push({
          message: `${prefix}: else는 배열이어야 합니다`,
          code: "INVALID_ELSE",
        });
      } else {
        data.else.forEach((stmt: any, i: number) => {
          this.validateStatement(stmt, i, `${prefix}.else`);
        });
      }
    }
  }

  private validateFor(data: any, prefix: string) {
    if (!data.variable || typeof data.variable !== "string") {
      this.errors.push({
        message: `${prefix}: variable은 문자열이어야 합니다`,
        code: "MISSING_FOR_VAR",
      });
    }

    if (!data.range || typeof data.range !== "object") {
      this.errors.push({
        message: `${prefix}: range는 객체여야 합니다`,
        code: "MISSING_RANGE",
      });
    } else {
      if (data.range.start) {
        this.validateExpression(data.range.start, `${prefix}.range.start`);
      }
      if (data.range.end) {
        this.validateExpression(data.range.end, `${prefix}.range.end`);
      }
    }

    if (!Array.isArray(data.body)) {
      this.errors.push({
        message: `${prefix}: body는 배열이어야 합니다`,
        code: "INVALID_FOR_BODY",
      });
    } else {
      data.body.forEach((stmt: any, i: number) => {
        this.validateStatement(stmt, i, `${prefix}.body`);
      });
    }
  }

  private validateWhile(data: any, prefix: string) {
    if (!data.condition) {
      this.errors.push({
        message: `${prefix}: condition은 필수입니다`,
        code: "MISSING_WHILE_CONDITION",
      });
    } else {
      this.validateExpression(data.condition, `${prefix}.condition`);
    }

    if (!Array.isArray(data.body)) {
      this.errors.push({
        message: `${prefix}: body는 배열이어야 합니다`,
        code: "INVALID_WHILE_BODY",
      });
    } else {
      data.body.forEach((stmt: any, i: number) => {
        this.validateStatement(stmt, i, `${prefix}.body`);
      });
    }
  }

  private validateMatch(data: any, prefix: string) {
    if (!data.value) {
      this.errors.push({
        message: `${prefix}: value는 필수입니다`,
        code: "MISSING_MATCH_VALUE",
      });
    } else {
      this.validateExpression(data.value, `${prefix}.value`);
    }

    if (!Array.isArray(data.cases)) {
      this.errors.push({
        message: `${prefix}: cases는 배열이어야 합니다`,
        code: "INVALID_CASES",
      });
    } else {
      data.cases.forEach((caseItem: any, i: number) => {
        if (!caseItem.pattern) {
          this.errors.push({
            message: `${prefix}.cases[${i}]: pattern은 필수입니다`,
            code: "MISSING_PATTERN",
          });
        }
        if (!Array.isArray(caseItem.body)) {
          this.errors.push({
            message: `${prefix}.cases[${i}]: body는 배열이어야 합니다`,
            code: "INVALID_CASE_BODY",
          });
        } else {
          caseItem.body.forEach((stmt: any, j: number) => {
            this.validateStatement(stmt, j, `${prefix}.cases[${i}].body`);
          });
        }
      });
    }
  }

  private validateTry(data: any, prefix: string) {
    if (!Array.isArray(data.body)) {
      this.errors.push({
        message: `${prefix}: body는 배열이어야 합니다`,
        code: "INVALID_TRY_BODY",
      });
    } else {
      data.body.forEach((stmt: any, i: number) => {
        this.validateStatement(stmt, i, `${prefix}.body`);
      });
    }

    if (data.catch && typeof data.catch === "object") {
      if (!data.catch.error_var || typeof data.catch.error_var !== "string") {
        this.errors.push({
          message: `${prefix}.catch: error_var은 문자열이어야 합니다`,
          code: "INVALID_CATCH_VAR",
        });
      }
      if (!Array.isArray(data.catch.body)) {
        this.errors.push({
          message: `${prefix}.catch: body는 배열이어야 합니다`,
          code: "INVALID_CATCH_BODY",
        });
      } else {
        data.catch.body.forEach((stmt: any, i: number) => {
          this.validateStatement(stmt, i, `${prefix}.catch.body`);
        });
      }
    }

    if (data.finally && Array.isArray(data.finally)) {
      data.finally.forEach((stmt: any, i: number) => {
        this.validateStatement(stmt, i, `${prefix}.finally`);
      });
    }
  }

  private validateThrow(data: any, prefix: string) {
    if (!data.error_type || typeof data.error_type !== "string") {
      this.errors.push({
        message: `${prefix}: error_type은 문자열이어야 합니다`,
        code: "MISSING_ERROR_TYPE",
      });
    }

    if (!data.message) {
      this.errors.push({
        message: `${prefix}: message는 필수입니다`,
        code: "MISSING_ERROR_MESSAGE",
      });
    } else {
      this.validateExpression(data.message, `${prefix}.message`);
    }
  }

  private validateExpression(data: any, prefix: string) {
    if (!data || typeof data !== "object") {
      this.errors.push({
        message: `${prefix}: 표현식은 객체여야 합니다`,
        code: "INVALID_EXPRESSION",
      });
      return;
    }

    const type = data.type;

    switch (type) {
      case "literal":
        // value_type과 value는 선택사항 (종속적)
        break;
      case "literal_array":
        if (!data.element_type) {
          this.errors.push({
            message: `${prefix}: element_type은 필수입니다`,
            code: "MISSING_ELEMENT_TYPE",
          });
        }
        if (Array.isArray(data.values)) {
          data.values.forEach((val: any, i: number) => {
            this.validateExpression(val, `${prefix}.values[${i}]`);
          });
        }
        break;
      case "ref":
        if (!data.name || typeof data.name !== "string") {
          this.errors.push({
            message: `${prefix}: name은 문자열이어야 합니다`,
            code: "MISSING_REF_NAME",
          });
        }
        break;
      case "index":
        if (data.array) {
          this.validateExpression(data.array, `${prefix}.array`);
        }
        if (data.index) {
          this.validateExpression(data.index, `${prefix}.index`);
        }
        break;
      case "binary_op":
        if (data.left) {
          this.validateExpression(data.left, `${prefix}.left`);
        }
        if (data.right) {
          this.validateExpression(data.right, `${prefix}.right`);
        }
        break;
      case "unary_op":
        if (data.operand) {
          this.validateExpression(data.operand, `${prefix}.operand`);
        }
        break;
      case "call":
      case "method_call":
        this.validateCall(data, prefix);
        break;
      case "some":
        if (data.value) {
          this.validateExpression(data.value, `${prefix}.value`);
        }
        break;
      default:
        this.errors.push({
          message: `${prefix}: 알 수 없는 표현식 타입 "${type}"`,
          code: "UNKNOWN_EXPRESSION_TYPE",
        });
    }
  }
}

export function validate(data: any): ValidationResult {
  const validator = new ASTValidator();
  return validator.validateProgram(data);
}
