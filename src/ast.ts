/**
 * ClaudeScript AST 타입 정의
 * 이 파일은 JSON AST를 TypeScript 타입으로 변환합니다
 */

// ==================== 기본 타입 ====================

export type TypeSpec =
  | PrimitiveType
  | ArrayType
  | OptionType
  | ObjectType
  | MapType
  | GenericRef;

export interface PrimitiveType {
  base: "i32" | "i64" | "f64" | "string" | "bool";
}

export interface ArrayType {
  base: "Array";
  element_type: TypeSpec;
}

export interface OptionType {
  base: "Option";
  element_type: TypeSpec;
}

export interface ObjectType {
  base: "Object";
  value_type: TypeSpec;
}

export interface MapType {
  base: "Map";
  key_type: TypeSpec;
  value_type: TypeSpec;
}

export interface GenericRef {
  base: string;  // T, U, K, V 등
}

// ==================== 리터럴 ====================

export interface Literal {
  type: "literal";
  value_type: string;
  value: any;
}

export interface LiteralArray {
  type: "literal_array";
  element_type: TypeSpec;
  values: Expression[];
}

// ==================== 참조 ====================

export interface Ref {
  type: "ref";
  name: string;
}

export interface Index {
  type: "index";
  array: Expression;
  index: Expression;
}

export interface Field {
  type: "field";
  object: Expression;
  key: string;
}

// ==================== 연산 ====================

export interface BinaryOp {
  type: "binary_op";
  op: "+" | "-" | "*" | "/" | "%" | "==" | "!=" | "<" | ">" | "<=" | ">=" | "&&" | "||";
  left: Expression;
  right: Expression;
}

export interface UnaryOp {
  type: "unary_op";
  op: "-" | "!";
  operand: Expression;
}

// ==================== 함수 호출 ====================

export interface Call {
  type: "call";
  function: string;
  args: Expression[];
  assign_to?: string;
}

export interface MethodCall {
  type: "method_call";
  object: Expression;
  method: string;
  args: Expression[];
  assign_to?: string;
}

// ==================== 패턴 매칭 ====================

export interface Some {
  type: "some";
  value: Expression;
}

export interface None {
  type: "none";
}

export interface MatchCase {
  pattern: "Some" | "None";
  bind?: string;  // Some의 경우 바인딩된 변수 이름
  body: Statement[];
}

export interface Match {
  type: "match";
  value: Expression;
  cases: MatchCase[];
}

// ==================== 표현식 ====================

export type Expression =
  | Literal
  | LiteralArray
  | Ref
  | Index
  | Field
  | BinaryOp
  | UnaryOp
  | Call
  | MethodCall
  | Match
  | Some
  | None
  | Lambda;

// ==================== 문장 ====================

export interface VarDecl {
  type: "var";
  name: string;
  value_type?: TypeSpec;
  value: Expression;
}

export interface Assign {
  type: "assign";
  name: string;
  value: Expression;
}

export interface Return {
  type: "return";
  value: Expression;
}

export interface Condition {
  type: "condition";
  test: Expression;
  then: Statement[];
  else?: Statement[];
}

export interface For {
  type: "for";
  variable: string;
  range: {
    start: Expression;
    end: Expression;
  };
  body: Statement[];
}

export interface While {
  type: "while";
  condition: Expression;
  body: Statement[];
}

export interface Try {
  type: "try";
  body: Statement[];
  catch?: {
    error_var: string;
    error_type: string;
    body: Statement[];
  };
  finally?: Statement[];
}

export interface Throw {
  type: "throw";
  error_type: string;
  message: Expression;
}

export type Statement =
  | VarDecl
  | Assign
  | Return
  | Condition
  | For
  | While
  | Try
  | Throw
  | Call
  | MethodCall
  | Match;

// ==================== 함수 정의 ====================

export interface FunctionParam {
  name: string;
  type: TypeSpec;
}

export interface FunctionDef {
  type: "function";
  name: string;
  generics?: string[];  // 제너릭 타입 변수: ["T", "U"]
  params: FunctionParam[];
  return_type: TypeSpec;
  body: Statement[];
}

export interface Lambda {
  type: "lambda";
  params: FunctionParam[];
  return_type: TypeSpec;
  body: Statement[];
}

// ==================== 프로그램 ====================

export interface Program {
  type: "program";
  version: string;
  definitions: FunctionDef[];
  instructions: Statement[];
}

// ==================== 검증 결과 ====================

export interface ValidationError {
  line?: number;
  column?: number;
  message: string;
  code?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  ast?: Program;
}

export interface TypeCheckResult {
  valid: boolean;
  errors: ValidationError[];
  typeInfo: Map<string, TypeSpec>;
}
