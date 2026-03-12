/**
 * Phase 9 AST Types (Advanced Parser 출력)
 *
 * Phase 9에서 생성된 AST 노드들의 완전한 타입 정의
 */

// ============================================================================
// Expression Types
// ============================================================================

export type Expr =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | ArrayLiteral
  | ObjectLiteral
  | Identifier
  | Binary
  | Unary
  | Ternary
  | Call
  | Member
  | Index
  | ArrowFunction;

export interface NumberLiteral {
  type: "NumberLiteral";
  value: number;
}

export interface StringLiteral {
  type: "StringLiteral";
  value: string;
}

export interface BooleanLiteral {
  type: "BooleanLiteral";
  value: boolean;
}

export interface ArrayLiteral {
  type: "ArrayLiteral";
  elements: Expr[];
}

export interface ObjectLiteral {
  type: "ObjectLiteral";
  properties: Array<{
    key: string;
    value: Expr;
  }>;
}

export interface Identifier {
  type: "Identifier";
  name: string;
}

export interface Binary {
  type: "Binary";
  op: string; // +, -, *, /, %, **, ==, !=, <, >, <=, >=, &&, ||
  left: Expr;
  right: Expr;
}

export interface Unary {
  type: "Unary";
  op: string; // !, -, +
  arg: Expr;
}

export interface Ternary {
  type: "Ternary";
  cond: Expr;
  then: Expr;
  else: Expr;
}

export interface Call {
  type: "Call";
  name: string;
  args: Expr[];
}

export interface Member {
  type: "Member";
  object: Expr;
  property: string;
}

export interface Index {
  type: "Index";
  object: Expr;
  index: Expr;
}

export interface ArrowFunction {
  type: "ArrowFunction";
  params: string[];
  body: Expr;
}

// ============================================================================
// Statement Types
// ============================================================================

export type Stmt =
  | VarDecl
  | FunctionDecl
  | Assignment
  | CompoundAssignment
  | Return
  | If
  | While
  | For
  | ForIn
  | ForOf
  | Block
  | Break
  | Continue;

export interface VarDecl {
  type: "VarDecl";
  name: string;
  init?: Expr;
}

export interface FunctionDecl {
  type: "FunctionDecl";
  name: string;
  params: string[];
  body: Stmt[];
}

export interface Assignment {
  type: "Assignment";
  target: Expr; // Identifier, Member, Index
  value: Expr;
}

export interface CompoundAssignment {
  type: "CompoundAssignment";
  target: Expr;
  op: string; // +, -
  value: Expr;
}

export interface Return {
  type: "Return";
  value?: Expr;
}

export interface If {
  type: "If";
  cond: Expr;
  then: Stmt[];
  else?: Stmt[];
}

export interface While {
  type: "While";
  cond: Expr;
  body: Stmt[];
}

export interface For {
  type: "For";
  init?: Expr | Stmt;
  cond?: Expr;
  update?: Expr;
  body: Stmt[];
}

export interface ForIn {
  type: "ForIn";
  variable: string;
  iterable: Expr;
  body: Stmt[];
}

export interface ForOf {
  type: "ForOf";
  variable: string;
  iterable: Expr;
  body: Stmt[];
}

export interface Block {
  type: "Block";
  body: Stmt[];
}

export interface Break {
  type: "Break";
}

export interface Continue {
  type: "Continue";
}

// ============================================================================
// Program
// ============================================================================

export interface Program {
  body: Stmt[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * AST 노드가 표현식인지 확인
 */
export function isExpr(node: any): node is Expr {
  return node && typeof node.type === "string" && !isStmt(node);
}

/**
 * AST 노드가 문인지 확인
 */
export function isStmt(node: any): node is Stmt {
  const stmtTypes = [
    "VarDecl",
    "FunctionDecl",
    "Assignment",
    "CompoundAssignment",
    "Return",
    "If",
    "While",
    "For",
    "ForIn",
    "ForOf",
    "Block",
    "Break",
    "Continue",
  ];
  return node && stmtTypes.includes(node.type);
}

/**
 * 표현식을 문으로 변환 (Call 표현식만 가능)
 */
export function exprToStmt(expr: Expr): Stmt | null {
  if (expr.type === "Call") {
    return expr as any;
  }
  return null;
}

/**
 * AST 순회 헬퍼
 */
export function walkExpr(expr: Expr, visitor: (node: Expr) => void) {
  visitor(expr);

  if (expr.type === "Binary") {
    walkExpr((expr as Binary).left, visitor);
    walkExpr((expr as Binary).right, visitor);
  } else if (expr.type === "Unary") {
    walkExpr((expr as Unary).arg, visitor);
  } else if (expr.type === "Ternary") {
    walkExpr((expr as Ternary).cond, visitor);
    walkExpr((expr as Ternary).then, visitor);
    walkExpr((expr as Ternary).else, visitor);
  } else if (expr.type === "Call") {
    (expr as Call).args.forEach((arg) => walkExpr(arg, visitor));
  } else if (expr.type === "Member") {
    walkExpr((expr as Member).object, visitor);
  } else if (expr.type === "Index") {
    walkExpr((expr as Index).object, visitor);
    walkExpr((expr as Index).index, visitor);
  } else if (expr.type === "ArrayLiteral") {
    (expr as ArrayLiteral).elements.forEach((elem) => walkExpr(elem, visitor));
  } else if (expr.type === "ObjectLiteral") {
    (expr as ObjectLiteral).properties.forEach((prop) =>
      walkExpr(prop.value, visitor)
    );
  } else if (expr.type === "ArrowFunction") {
    walkExpr((expr as ArrowFunction).body, visitor);
  }
}

/**
 * AST 순회 헬퍼 (문)
 */
export function walkStmt(stmt: Stmt, visitor: (node: Stmt) => void) {
  visitor(stmt);

  if (stmt.type === "Return") {
    const returnStmt = stmt as Return;
    if (returnStmt.value) {
      // Expression visitor로 처리
    }
  } else if (stmt.type === "If") {
    const ifStmt = stmt as If;
    ifStmt.then.forEach((s) => walkStmt(s, visitor));
    if (ifStmt.else) {
      ifStmt.else.forEach((s) => walkStmt(s, visitor));
    }
  } else if (stmt.type === "While" || stmt.type === "For") {
    const loopStmt = stmt as While | For;
    loopStmt.body.forEach((s) => walkStmt(s, visitor));
  } else if (stmt.type === "ForIn" || stmt.type === "ForOf") {
    const forStmt = stmt as ForIn | ForOf;
    forStmt.body.forEach((s) => walkStmt(s, visitor));
  } else if (stmt.type === "Block") {
    const blockStmt = stmt as Block;
    blockStmt.body.forEach((s) => walkStmt(s, visitor));
  } else if (stmt.type === "FunctionDecl") {
    const funcStmt = stmt as FunctionDecl;
    funcStmt.body.forEach((s) => walkStmt(s, visitor));
  }
}

/**
 * 프로그램의 모든 함수 정의 찾기
 */
export function getFunctionDefs(program: Program): FunctionDecl[] {
  const functions: FunctionDecl[] = [];

  for (const stmt of program.body) {
    if (stmt.type === "FunctionDecl") {
      functions.push(stmt as FunctionDecl);
    }
  }

  return functions;
}

/**
 * 프로그램의 모든 변수 참조 찾기
 */
export function getVariableRefs(expr: Expr): string[] {
  const refs: string[] = [];

  walkExpr(expr, (node) => {
    if (node.type === "Identifier") {
      refs.push((node as Identifier).name);
    }
  });

  return refs;
}

/**
 * 프로그램의 모든 함수 호출 찾기
 */
export function getFunctionCalls(expr: Expr): string[] {
  const calls: string[] = [];

  walkExpr(expr, (node) => {
    if (node.type === "Call") {
      calls.push((node as Call).name);
    }
  });

  return calls;
}
