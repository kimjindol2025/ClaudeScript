/**
 * Phase 6: 최소형 AST
 *
 * 엔드투엔드 파이프라인 증명용 최소 기능:
 * - 리터럴 (숫자)
 * - 이항 연산 (+, -, *, /, ==, <, >)
 * - 변수 참조
 * - 변수 선언, 반환, 조건문, 반복문
 */

export type Expr =
  | { type: "NumberLiteral"; value: number }
  | {
      type: "Binary";
      op: "+" | "-" | "*" | "/" | "==" | "<" | ">";
      left: Expr;
      right: Expr;
    }
  | { type: "Identifier"; name: string }
  | { type: "Call"; name: string; args: Expr[] };

export type Stmt =
  | { type: "VarDecl"; name: string; init: Expr }
  | { type: "Return"; value: Expr }
  | { type: "If"; cond: Expr; then: Stmt[]; else?: Stmt[] }
  | { type: "While"; cond: Expr; body: Stmt[] }
  | { type: "Call"; name: string; args: Expr[] };

export interface Program {
  body: Stmt[];
}
