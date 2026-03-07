/**
 * ClaudeScript 타입 검사기
 * AST의 타입 안전성을 검증합니다
 */

import {
  Program,
  Statement,
  Expression,
  TypeSpec,
  TypeCheckResult,
  ValidationError,
  FunctionDef,
} from "./ast";

type TypeInfo = {
  [name: string]: TypeSpec;
};

interface FunctionInfo {
  [name: string]: {
    params: Array<{ name: string; type: TypeSpec }>;
    return_type: TypeSpec;
  };
}

export class TypeChecker {
  private errors: ValidationError[] = [];
  private variables: TypeInfo = {};
  private functions: FunctionInfo = {};
  private scopes: Array<TypeInfo> = [];

  /**
   * 프로그램 전체 타입 검사
   */
  checkProgram(ast: Program): TypeCheckResult {
    this.errors = [];
    this.variables = {};
    this.functions = {};
    this.scopes = [{}];  // 전역 스코프

    // 1단계: 함수 정의 수집
    this.collectFunctionDefinitions(ast.definitions);

    // 2단계: 함수 본체 검사
    for (const def of ast.definitions) {
      this.checkFunctionDef(def);
    }

    // 3단계: 실행 명령 검사
    for (let i = 0; i < ast.instructions.length; i++) {
      this.checkStatement(ast.instructions[i], i);
    }

    const typeInfoMap = new Map<string, TypeSpec>(Object.entries(this.variables));
    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      typeInfo: typeInfoMap,
    };
  }

  /**
   * 함수 정의 수집 (선언-사용 순서 보장)
   */
  private collectFunctionDefinitions(definitions: FunctionDef[]) {
    for (const def of definitions) {
      this.functions[def.name] = {
        params: def.params,
        return_type: def.return_type,
      };
    }
  }

  /**
   * 함수 정의 검사
   */
  private checkFunctionDef(def: FunctionDef) {
    // 함수 파라미터를 함수 스코프에 추가
    const funcScope: TypeInfo = {};
    for (const param of def.params) {
      funcScope[param.name] = param.type;
    }

    // 이전 스코프 저장
    const prevScope = this.scopes[this.scopes.length - 1];
    this.scopes[this.scopes.length - 1] = funcScope;

    // 함수 본체 검사
    for (let i = 0; i < def.body.length; i++) {
      this.checkStatement(def.body[i], i, `function ${def.name}`);
    }

    // 스코프 복원
    this.scopes[this.scopes.length - 1] = prevScope;
  }

  /**
   * 문장 검사
   */
  private checkStatement(stmt: any, index: number, context: string = "instructions") {
    const stmtPrefix = `${context}[${index}]`;

    switch (stmt.type) {
      case "var":
        this.checkVarDecl(stmt, stmtPrefix);
        break;
      case "assign":
        this.checkAssign(stmt, stmtPrefix);
        break;
      case "return":
        this.checkReturn(stmt, stmtPrefix);
        break;
      case "condition":
        this.checkCondition(stmt, stmtPrefix);
        break;
      case "for":
        this.checkFor(stmt, stmtPrefix);
        break;
      case "while":
        this.checkWhile(stmt, stmtPrefix);
        break;
      case "match":
        this.checkMatch(stmt, stmtPrefix);
        break;
      case "call":
      case "method_call":
        this.checkCall(stmt, stmtPrefix);
        break;
      case "try":
        this.checkTry(stmt, stmtPrefix);
        break;
    }
  }

  /**
   * 변수 선언 검사
   */
  private checkVarDecl(stmt: any, prefix: string) {
    const varType = stmt.value_type || this.inferType(stmt.value);

    if (!varType) {
      this.errors.push({
        message: `${prefix}: ${stmt.name}의 타입을 추론할 수 없습니다`,
        code: "TYPE_INFERENCE_FAILED",
      });
      return;
    }

    // 값의 타입 검사
    const valueType = this.getExpressionType(stmt.value);
    if (valueType && !this.isCompatible(varType, valueType)) {
      this.errors.push({
        message: `${prefix}: 타입 불일치 - ${this.typeToString(varType)}을(를) 기대했으나 ${this.typeToString(valueType)} 받음`,
        code: "TYPE_MISMATCH",
      });
      return;
    }

    // 변수 등록
    this.setVariable(stmt.name, varType);
  }

  /**
   * 변수 재할당 검사
   */
  private checkAssign(stmt: any, prefix: string) {
    const varType = this.getVariable(stmt.name);
    if (!varType) {
      this.errors.push({
        message: `${prefix}: 정의되지 않은 변수 "${stmt.name}"`,
        code: "UNDEFINED_VARIABLE",
      });
      return;
    }

    const valueType = this.getExpressionType(stmt.value);
    if (valueType && !this.isCompatible(varType, valueType)) {
      this.errors.push({
        message: `${prefix}: 타입 불일치 - ${this.typeToString(varType)}을(를) 기대했으나 ${this.typeToString(valueType)} 받음`,
        code: "TYPE_MISMATCH",
      });
    }
  }

  /**
   * Return 문 검사
   */
  private checkReturn(stmt: any, prefix: string) {
    if (stmt.value) {
      const returnType = this.getExpressionType(stmt.value);
      // 실제 함수의 반환 타입과 비교는 나중에 함수 컨텍스트에서 수행
    }
  }

  /**
   * 조건문 검사
   */
  private checkCondition(stmt: any, prefix: string) {
    // 조건식이 bool 타입인지 검사
    const testType = this.getExpressionType(stmt.test);
    if (testType && !this.isBoolType(testType)) {
      this.errors.push({
        message: `${prefix}: 조건식은 bool 타입이어야 합니다. 받은 타입: ${this.typeToString(testType)}`,
        code: "CONDITION_TYPE_ERROR",
      });
    }

    // then 블록 검사
    for (let i = 0; i < stmt.then.length; i++) {
      this.checkStatement(stmt.then[i], i, `${prefix}.then`);
    }

    // else 블록 검사
    if (stmt.else) {
      for (let i = 0; i < stmt.else.length; i++) {
        this.checkStatement(stmt.else[i], i, `${prefix}.else`);
      }
    }
  }

  /**
   * For 루프 검사
   */
  private checkFor(stmt: any, prefix: string) {
    // 범위의 시작과 끝이 정수 타입인지 검사
    const startType = this.getExpressionType(stmt.range.start);
    const endType = this.getExpressionType(stmt.range.end);

    if (startType && !this.isIntegerType(startType)) {
      this.errors.push({
        message: `${prefix}: 루프 범위의 시작은 정수 타입이어야 합니다`,
        code: "RANGE_TYPE_ERROR",
      });
    }

    if (endType && !this.isIntegerType(endType)) {
      this.errors.push({
        message: `${prefix}: 루프 범위의 끝은 정수 타입이어야 합니다`,
        code: "RANGE_TYPE_ERROR",
      });
    }

    // 루프 변수를 정수 타입으로 등록
    this.setVariable(stmt.variable, { base: "i32" });

    // 루프 본체 검사
    for (let i = 0; i < stmt.body.length; i++) {
      this.checkStatement(stmt.body[i], i, `${prefix}.body`);
    }
  }

  /**
   * While 루프 검사
   */
  private checkWhile(stmt: any, prefix: string) {
    const condType = this.getExpressionType(stmt.condition);
    if (condType && !this.isBoolType(condType)) {
      this.errors.push({
        message: `${prefix}: 루프 조건은 bool 타입이어야 합니다`,
        code: "CONDITION_TYPE_ERROR",
      });
    }

    // 루프 본체 검사
    for (let i = 0; i < stmt.body.length; i++) {
      this.checkStatement(stmt.body[i], i, `${prefix}.body`);
    }
  }

  /**
   * Match (패턴 매칭) 검사
   */
  private checkMatch(stmt: any, prefix: string) {
    const valueType = this.getExpressionType(stmt.value);

    // Option 타입인지 확인
    if (
      !valueType ||
      valueType.base !== "Option"
    ) {
      this.errors.push({
        message: `${prefix}: match는 Option 타입에만 사용 가능합니다. 받은 타입: ${this.typeToString(valueType || { base: "unknown" })}`,
        code: "MATCH_TYPE_ERROR",
      });
    }

    // 각 케이스 검사
    for (const caseItem of stmt.cases) {
      if (caseItem.bind && valueType && valueType.base === "Option") {
        // Some 케이스: 바인딩된 변수의 타입 설정
        const elemType = this.getTypeProperty(valueType, "element_type") || { base: "unknown" };
        this.setVariable(caseItem.bind, elemType);
      }

      for (let i = 0; i < caseItem.body.length; i++) {
        this.checkStatement(caseItem.body[i], i, `${prefix}.case(${caseItem.pattern})`);
      }
    }
  }

  /**
   * 함수 호출 검사
   */
  private checkCall(stmt: any, prefix: string) {
    const funcInfo = this.functions[stmt.function];

    if (!funcInfo && !this.isBuiltinFunction(stmt.function)) {
      this.errors.push({
        message: `${prefix}: 정의되지 않은 함수 "${stmt.function}"`,
        code: "UNDEFINED_FUNCTION",
      });
      return;
    }

    if (funcInfo) {
      // 인자 개수 검사
      if (stmt.args.length !== funcInfo.params.length) {
        this.errors.push({
          message: `${prefix}: ${stmt.function}은 ${funcInfo.params.length}개의 인자를 기대하나 ${stmt.args.length}개 받음`,
          code: "ARGUMENT_COUNT_MISMATCH",
        });
      }

      // 인자 타입 검사
      for (let i = 0; i < Math.min(stmt.args.length, funcInfo.params.length); i++) {
        const argType = this.getExpressionType(stmt.args[i]);
        const paramType = funcInfo.params[i].type;

        if (argType && !this.isCompatible(paramType, argType)) {
          this.errors.push({
            message: `${prefix}: 인자 ${i + 1}의 타입 불일치 - ${this.typeToString(paramType)}을(를) 기대했으나 ${this.typeToString(argType)} 받음`,
            code: "ARGUMENT_TYPE_MISMATCH",
          });
        }
      }
    }

    // 반환값이 할당되는 경우
    if (stmt.assign_to && funcInfo) {
      this.setVariable(stmt.assign_to, funcInfo.return_type);
    }
  }

  /**
   * Try/Catch 검사
   */
  private checkTry(stmt: any, prefix: string) {
    // try 블록
    for (let i = 0; i < stmt.body.length; i++) {
      this.checkStatement(stmt.body[i], i, `${prefix}.try`);
    }

    // catch 블록
    if (stmt.catch) {
      this.setVariable(stmt.catch.error_var, { base: "string" });
      for (let i = 0; i < stmt.catch.body.length; i++) {
        this.checkStatement(stmt.catch.body[i], i, `${prefix}.catch`);
      }
    }

    // finally 블록
    if (stmt.finally) {
      for (let i = 0; i < stmt.finally.length; i++) {
        this.checkStatement(stmt.finally[i], i, `${prefix}.finally`);
      }
    }
  }

  /**
   * 표현식의 타입 얻기
   */
  private getExpressionType(expr: any): TypeSpec | null {
    if (!expr) return null;

    switch (expr.type) {
      case "literal":
        return { base: expr.value_type };
      case "ref":
        return this.getVariable(expr.name);
      case "binary_op":
        return this.getBinaryOpType(expr);
      case "unary_op":
        return this.getUnaryOpType(expr);
      case "call":
        return this.getCallReturnType(expr);
      case "index":
        return this.getIndexType(expr);
      case "some": {
        const val = this.getExpressionType(expr.value) || { base: "unknown" };
        const result: any = { base: "Option", element_type: val };
        return result as TypeSpec;
      }
      case "none": {
        const result: any = { base: "Option", element_type: { base: "unknown" } };
        return result as TypeSpec;
      }
      case "literal_array":
        return {
          base: "Array",
          element_type: expr.element_type,
        };
      default:
        return null;
    }
  }

  /**
   * 이항 연산 타입
   */
  private getBinaryOpType(expr: any): TypeSpec | null {
    const leftType = this.getExpressionType(expr.left);
    const rightType = this.getExpressionType(expr.right);

    if (!leftType || !rightType) return null;

    // 산술 연산
    if (["+", "-", "*", "/", "%"].includes(expr.op)) {
      if (this.isCompatible(leftType, rightType)) {
        return leftType;
      }
      return null;
    }

    // 비교 연산
    if (["==", "!=", "<", ">", "<=", ">="].includes(expr.op)) {
      return { base: "bool" };
    }

    // 논리 연산
    if (["&&", "||"].includes(expr.op)) {
      return { base: "bool" };
    }

    return null;
  }

  private getTypeProperty(type: TypeSpec, prop: string): TypeSpec | undefined {
    const anyType = type as any;
    return anyType[prop];
  }

  /**
   * 단항 연산 타입
   */
  private getUnaryOpType(expr: any): TypeSpec | null {
    const operandType = this.getExpressionType(expr.operand);

    if (!operandType) return null;

    if (expr.op === "-") {
      return operandType;  // 부호 반전은 같은 타입 반환
    }

    if (expr.op === "!") {
      return { base: "bool" };  // 논리 부정은 bool 반환
    }

    return null;
  }

  /**
   * 함수 호출의 반환 타입
   */
  private getCallReturnType(expr: any): TypeSpec | null {
    const funcInfo = this.functions[expr.function];
    if (funcInfo) {
      return funcInfo.return_type;
    }

    // 내장 함수
    if (expr.function === "to_string") return { base: "string" };
    if (expr.function === "to_i32") return { base: "i32" };
    if (expr.function === "to_f64") return { base: "f64" };
    if (expr.function === "length") return { base: "i32" };

    return null;
  }

  /**
   * 배열 인덱싱 타입
   */
  private getIndexType(expr: any): TypeSpec | null {
    const arrayType = this.getExpressionType(expr.array);
    const indexType = this.getExpressionType(expr.index);

    if (!arrayType || !indexType) return null;

    // 인덱스는 정수여야 함
    if (!this.isIntegerType(indexType)) {
      this.errors.push({
        message: `배열 인덱스는 정수 타입이어야 합니다. 받은 타입: ${this.typeToString(indexType)}`,
        code: "INDEX_TYPE_ERROR",
      });
      return null;
    }

    // 배열 타입이어야 함
    if (arrayType.base !== "Array") {
      this.errors.push({
        message: `배열 인덱싱은 Array 타입에만 사용 가능합니다. 받은 타입: ${this.typeToString(arrayType)}`,
        code: "INDEX_ON_NON_ARRAY",
      });
      return null;
    }

    // 원소 타입 반환
    const elemType = this.getTypeProperty(arrayType, "element_type") || { base: "unknown" };
    return elemType;
  }

  /**
   * 타입 추론
   */
  private inferType(expr: any): TypeSpec | null {
    // getExpressionType으로 위임 (더 넓은 타입 처리)
    return this.getExpressionType(expr);
  }

  /**
   * 타입 호환성 검사
   */
  private isCompatible(expected: TypeSpec, actual: TypeSpec): boolean {
    // none 리터럴은 모든 Option<T>과 호환
    if (actual.base === "none" && expected.base === "Option") {
      return true;
    }

    // 같은 기본 타입
    if (expected.base === actual.base) {
      // 복합 타입의 경우 재귀적으로 검사
      if (expected.base === "Array" && actual.base === "Array") {
        const expectedElem = this.getTypeProperty(expected, "element_type") || { base: "unknown" };
        const actualElem = this.getTypeProperty(actual, "element_type") || { base: "unknown" };
        return this.isCompatible(expectedElem, actualElem);
      }
      if (expected.base === "Option" && actual.base === "Option") {
        const expectedElem = this.getTypeProperty(expected, "element_type") || { base: "unknown" };
        const actualElem = this.getTypeProperty(actual, "element_type") || { base: "unknown" };
        return this.isCompatible(expectedElem, actualElem);
      }
      return true;
    }

    // 암묵적 변환 금지
    return false;
  }

  /**
   * Bool 타입 확인
   */
  private isBoolType(type: TypeSpec): boolean {
    return type.base === "bool";
  }

  /**
   * 정수 타입 확인
   */
  private isIntegerType(type: TypeSpec): boolean {
    return type.base === "i32" || type.base === "i64";
  }

  /**
   * 내장 함수 확인
   */
  private isBuiltinFunction(name: string): boolean {
    const builtins = [
      "println",
      "print",
      "to_string",
      "to_i32",
      "to_f64",
      "length",
      "Array.get",
      "Array.set",
      "Array.push",
      "Array.pop",
    ];
    return builtins.includes(name);
  }

  /**
   * 변수 등록
   */
  private setVariable(name: string, type: TypeSpec) {
    const currentScope = this.scopes[this.scopes.length - 1];
    currentScope[name] = type;
    this.variables[name] = type;
  }

  /**
   * 변수 조회
   */
  private getVariable(name: string): TypeSpec | null {
    // 현재 스코프부터 역순으로 탐색
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i][name]) {
        return this.scopes[i][name];
      }
    }
    return null;
  }

  /**
   * 타입을 문자열로 변환
   */
  private typeToString(type: TypeSpec): string {
    if (type.base === "Array") {
      const elemType = this.getTypeProperty(type, "element_type") || { base: "unknown" };
      return `Array<${this.typeToString(elemType)}>`;
    }
    if (type.base === "Option") {
      const elemType = this.getTypeProperty(type, "element_type") || { base: "unknown" };
      return `Option<${this.typeToString(elemType)}>`;
    }
    if (type.base === "Map") {
      const keyType = this.getTypeProperty(type, "key_type") || { base: "unknown" };
      const valueType = this.getTypeProperty(type, "value_type") || { base: "unknown" };
      return `Map<${this.typeToString(keyType)}, ${this.typeToString(valueType)}>`;
    }
    return type.base;
  }
}

export function checkTypes(ast: Program): TypeCheckResult {
  const checker = new TypeChecker();
  return checker.checkProgram(ast);
}
