/**
 * Phase 9: Advanced Parser (깊이 있는 파서)
 *
 * 지원 기능:
 * - 배열 리터럴 [1, 2, 3]
 * - 객체 리터럴 {x: 1, y: 2}
 * - 배열/객체 접근 arr[0], obj.x
 * - 함수 정의 defn add(a, b) { return a + b; }
 * - for 루프 (C-style, for...in, for...of)
 * - 조건부 연산자 a ? b : c
 * - 복합 할당 +=, -=
 * - 에러 복구 (error recovery)
 * - 중첩된 구조 깊이 제한 없음
 */

import { Token, TokenType, LexerAdvanced } from "./lexer-advanced";

export interface Expr {
  type: string;
  [key: string]: any;
}

export interface Stmt {
  type: string;
  [key: string]: any;
}

export interface Program {
  body: Stmt[];
}

export interface ParseError {
  message: string;
  token: Token;
  line: number;
  column: number;
}

export class ParserAdvanced {
  private tokens: Token[];
  private current = 0;
  private errors: ParseError[] = [];
  private panicMode = false;
  private synchronizing = false;

  constructor(private source: string) {
    const lexer = new LexerAdvanced(source);
    this.tokens = lexer.tokenize();

    // 렉싱 에러 검사
    const lexErrors = lexer.getErrors();
    if (lexErrors.length > 0) {
      lexErrors.forEach((err) => {
        this.errors.push({
          message: err.message,
          token: this.peek(),
          line: err.line,
          column: err.column,
        });
      });
    }
  }

  parse(): Program {
    const body: Stmt[] = [];

    while (!this.isAtEnd()) {
      try {
        const stmt = this.statement();
        if (stmt) body.push(stmt);
      } catch (error) {
        this.panicMode = true;
        this.synchronize();
      }
    }

    return { body };
  }

  private statement(): Stmt | null {
    try {
      // let/const 선언
      if (this.match(TokenType.LET, TokenType.CONST)) {
        return this.varDeclStatement();
      }

      // 함수 정의
      if (this.match(TokenType.DEFN)) {
        return this.functionDeclStatement();
      }

      // while 루프
      if (this.match(TokenType.WHILE)) {
        return this.whileStatement();
      }

      // for 루프
      if (this.match(TokenType.FOR)) {
        return this.forStatement();
      }

      // if 문
      if (this.match(TokenType.IF)) {
        return this.ifStatement();
      }

      // return 문
      if (this.match(TokenType.RETURN)) {
        return this.returnStatement();
      }

      // break/continue
      if (this.match(TokenType.BREAK)) {
        this.consume(TokenType.SEMICOLON, "Expected ';' after break");
        return { type: "Break" };
      }

      if (this.match(TokenType.CONTINUE)) {
        this.consume(TokenType.SEMICOLON, "Expected ';' after continue");
        return { type: "Continue" };
      }

      // 블록 ({}로 감싼 문)
      if (this.check(TokenType.LBRACE)) {
        return this.blockStatement();
      }

      // 표현식 문
      const expr = this.expression();

      // 할당 또는 복합 할당
      if (this.match(TokenType.EQ)) {
        const value = this.expression();
        this.consume(TokenType.SEMICOLON, "Expected ';' after assignment");
        return {
          type: "Assignment",
          target: expr,
          value,
        };
      }

      if (this.match(TokenType.PLUS_EQ, TokenType.MINUS_EQ)) {
        const op = this.previous().lexeme;
        const value = this.expression();
        this.consume(TokenType.SEMICOLON, "Expected ';' after compound assignment");
        return {
          type: "CompoundAssignment",
          target: expr,
          op: op.substring(0, op.length - 1), // += → +, -= → -
          value,
        };
      }

      this.consume(TokenType.SEMICOLON, "Expected ';' after expression");

      // 함수 호출 문
      if (expr.type === "Call") {
        return expr as any;
      }

      throw this.error("Expected statement", this.previous());
    } catch (error) {
      if (!this.panicMode) {
        throw error;
      }
      return null;
    }
  }

  private varDeclStatement(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expected variable name").lexeme;
    let init: Expr | undefined;

    if (this.match(TokenType.EQ)) {
      init = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expected ';' after variable declaration");

    return { type: "VarDecl", name, init };
  }

  private functionDeclStatement(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expected function name").lexeme;
    this.consume(TokenType.LPAREN, "Expected '(' after function name");

    const params: string[] = [];
    if (!this.check(TokenType.RPAREN)) {
      do {
        params.push(this.consume(TokenType.IDENTIFIER, "Expected parameter name").lexeme);
      } while (this.match(TokenType.COMMA));
    }

    this.consume(TokenType.RPAREN, "Expected ')' after parameters");
    this.consume(TokenType.LBRACE, "Expected '{' before function body");

    const body: Stmt[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) body.push(stmt);
    }

    this.consume(TokenType.RBRACE, "Expected '}' after function body");

    return { type: "FunctionDecl", name, params, body };
  }

  private blockStatement(): Stmt {
    this.consume(TokenType.LBRACE, "Expected '{'");
    const body: Stmt[] = [];

    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) body.push(stmt);
    }

    this.consume(TokenType.RBRACE, "Expected '}' after block");
    return { type: "Block", body };
  }

  private whileStatement(): Stmt {
    this.consume(TokenType.LPAREN, "Expected '(' after 'while'");
    const cond = this.expression();
    this.consume(TokenType.RPAREN, "Expected ')' after while condition");
    this.consume(TokenType.LBRACE, "Expected '{' before while body");

    const body: Stmt[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) body.push(stmt);
    }

    this.consume(TokenType.RBRACE, "Expected '}' after while body");
    return { type: "While", cond, body };
  }

  private forStatement(): Stmt {
    this.consume(TokenType.LPAREN, "Expected '(' after 'for'");

    let init: Expr | Stmt | undefined;
    let cond: Expr | undefined;
    let update: Expr | undefined;
    let variable: string | undefined;
    let iterableExpr: Expr | undefined;
    let isForIn = false;
    let isForOf = false;

    // for...in 또는 for...of 확인
    const checkPoint = this.current;
    if (this.match(TokenType.LET)) {
      variable = this.consume(TokenType.IDENTIFIER, "Expected variable name").lexeme;

      if (this.match(TokenType.IN)) {
        isForIn = true;
        iterableExpr = this.expression();
      } else if (this.match(TokenType.OF)) {
        isForOf = true;
        iterableExpr = this.expression();
      } else {
        // 일반 for 루프로 복원
        this.current = checkPoint;
        init = this.varDeclStatement();
        if (!this.match(TokenType.SEMICOLON)) {
          cond = this.expression();
          this.consume(TokenType.SEMICOLON, "Expected ';' after for condition");
          if (!this.check(TokenType.RPAREN)) {
            update = this.expression();
          }
        }
      }
    } else if (!this.check(TokenType.SEMICOLON)) {
      init = this.expression();
      this.consume(TokenType.SEMICOLON, "Expected ';' after for init");
      if (!this.check(TokenType.SEMICOLON)) {
        cond = this.expression();
        this.consume(TokenType.SEMICOLON, "Expected ';' after for condition");
        if (!this.check(TokenType.RPAREN)) {
          update = this.expression();
        }
      }
    } else {
      this.advance(); // Skip ';'
      if (!this.check(TokenType.SEMICOLON)) {
        cond = this.expression();
        this.consume(TokenType.SEMICOLON, "Expected ';' after for condition");
        if (!this.check(TokenType.RPAREN)) {
          update = this.expression();
        }
      }
    }

    this.consume(TokenType.RPAREN, "Expected ')' after for clauses");
    this.consume(TokenType.LBRACE, "Expected '{' before for body");

    const body: Stmt[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) body.push(stmt);
    }

    this.consume(TokenType.RBRACE, "Expected '}' after for body");

    // for...in 또는 for...of
    if (isForIn) {
      return { type: "ForIn", variable, iterable: iterableExpr, body };
    }
    if (isForOf) {
      return { type: "ForOf", variable, iterable: iterableExpr, body };
    }

    // 일반 for 루프
    return { type: "For", init, cond, update, body };
  }

  private ifStatement(): Stmt {
    this.consume(TokenType.LPAREN, "Expected '(' after 'if'");
    const cond = this.expression();
    this.consume(TokenType.RPAREN, "Expected ')' after if condition");
    this.consume(TokenType.LBRACE, "Expected '{' before if body");

    const thenBody: Stmt[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) thenBody.push(stmt);
    }

    this.consume(TokenType.RBRACE, "Expected '}' after if body");

    let elseBody: Stmt[] | undefined;
    if (this.match(TokenType.ELSE)) {
      if (this.check(TokenType.IF)) {
        // else if를 else { if } 형태로 변환
        const elseIfStmt = this.statement();
        elseBody = elseIfStmt ? [elseIfStmt] : undefined;
      } else {
        this.consume(TokenType.LBRACE, "Expected '{' before else body");
        elseBody = [];
        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
          const stmt = this.statement();
          if (stmt) elseBody.push(stmt);
        }
        this.consume(TokenType.RBRACE, "Expected '}' after else body");
      }
    }

    return { type: "If", cond, then: thenBody, else: elseBody };
  }

  private returnStatement(): Stmt {
    let value: Expr | undefined;

    if (!this.check(TokenType.SEMICOLON)) {
      value = this.expression();
    }

    this.consume(TokenType.SEMICOLON, "Expected ';' after return");
    return { type: "Return", value };
  }

  private expression(): Expr {
    return this.assignment();
  }

  private assignment(): Expr {
    return this.ternary();
  }

  private ternary(): Expr {
    let expr = this.logicalOr();

    if (this.match(TokenType.QUESTION)) {
      const thenExpr = this.expression();
      this.consume(TokenType.COLON, "Expected ':' in ternary operator");
      const elseExpr = this.expression();
      return { type: "Ternary", cond: expr, then: thenExpr, else: elseExpr };
    }

    return expr;
  }

  private logicalOr(): Expr {
    let expr = this.logicalAnd();

    while (this.match(TokenType.OR)) {
      const op = "||";
      const right = this.logicalAnd();
      expr = { type: "Binary", op, left: expr, right };
    }

    return expr;
  }

  private logicalAnd(): Expr {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const op = "&&";
      const right = this.equality();
      expr = { type: "Binary", op, left: expr, right };
    }

    return expr;
  }

  private equality(): Expr {
    let expr = this.comparison();

    while (this.match(TokenType.EQ_EQ, TokenType.NOT_EQ)) {
      const op = this.previous().lexeme;
      const right = this.comparison();
      expr = { type: "Binary", op, left: expr, right };
    }

    return expr;
  }

  private comparison(): Expr {
    let expr = this.addition();

    while (this.match(TokenType.LT, TokenType.GT, TokenType.LT_EQ, TokenType.GT_EQ)) {
      const op = this.previous().lexeme;
      const right = this.addition();
      expr = { type: "Binary", op, left: expr, right };
    }

    return expr;
  }

  private addition(): Expr {
    let expr = this.multiplication();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const op = this.previous().lexeme;
      const right = this.multiplication();
      expr = { type: "Binary", op, left: expr, right };
    }

    return expr;
  }

  private multiplication(): Expr {
    let expr = this.power();

    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const op = this.previous().lexeme;
      const right = this.power();
      expr = { type: "Binary", op, left: expr, right };
    }

    return expr;
  }

  private power(): Expr {
    let expr = this.unary();

    if (this.match(TokenType.POWER)) {
      const right = this.power(); // Right associative
      expr = { type: "Binary", op: "**", left: expr, right };
    }

    return expr;
  }

  private unary(): Expr {
    if (this.match(TokenType.NOT, TokenType.MINUS, TokenType.PLUS)) {
      const op = this.previous().lexeme;
      const right = this.unary();
      return { type: "Unary", op, arg: right };
    }

    return this.postfix();
  }

  private postfix(): Expr {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LBRACKET)) {
        // 배열/객체 인덱싱: arr[i], obj[key]
        const index = this.expression();
        this.consume(TokenType.RBRACKET, "Expected ']' after array index");
        expr = { type: "Index", object: expr, index };
      } else if (this.match(TokenType.DOT)) {
        // 멤버 접근: obj.prop
        const prop = this.consume(TokenType.IDENTIFIER, "Expected property name after '.'").lexeme;
        expr = { type: "Member", object: expr, property: prop };
      } else if (expr.type === "Identifier" && this.match(TokenType.LPAREN)) {
        // 함수 호출: func(args)
        const args: Expr[] = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.expression());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RPAREN, "Expected ')' after arguments");
        expr = { type: "Call", name: (expr as any).name, args };
      } else {
        break;
      }
    }

    return expr;
  }

  private primary(): Expr {
    // 숫자 리터럴
    if (this.match(TokenType.NUMBER)) {
      return { type: "NumberLiteral", value: (this.previous() as any).value };
    }

    // 문자열 리터럴
    if (this.match(TokenType.STRING)) {
      return { type: "StringLiteral", value: (this.previous() as any).value };
    }

    // true/false
    if (this.match(TokenType.TRUE)) {
      return { type: "BooleanLiteral", value: true };
    }
    if (this.match(TokenType.FALSE)) {
      return { type: "BooleanLiteral", value: false };
    }

    // 배열 리터럴: [1, 2, 3]
    if (this.match(TokenType.LBRACKET)) {
      const elements: Expr[] = [];
      if (!this.check(TokenType.RBRACKET)) {
        do {
          elements.push(this.expression());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RBRACKET, "Expected ']' after array elements");
      return { type: "ArrayLiteral", elements };
    }

    // 객체 리터럴: {x: 1, y: 2}
    if (this.match(TokenType.LBRACE)) {
      const properties: Array<{ key: string; value: Expr }> = [];
      if (!this.check(TokenType.RBRACE)) {
        do {
          const key = this.consume(TokenType.IDENTIFIER, "Expected property name").lexeme;
          this.consume(TokenType.COLON, "Expected ':' after property name");
          const value = this.expression();
          properties.push({ key, value });
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RBRACE, "Expected '}' after object properties");
      return { type: "ObjectLiteral", properties };
    }

    // 식별자
    if (this.match(TokenType.IDENTIFIER)) {
      return { type: "Identifier", name: this.previous().lexeme };
    }

    // 그룹화된 표현식: (expr)
    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }

    // 화살표 함수: (a, b) => a + b
    if (this.check(TokenType.LPAREN)) {
      const checkPoint = this.current;
      try {
        this.advance(); // Skip '('
        const params: string[] = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            params.push(this.consume(TokenType.IDENTIFIER, "Expected parameter name").lexeme);
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RPAREN, "Expected ')' after parameters");

        if (this.match(TokenType.ARROW)) {
          const body = this.expression();
          return { type: "ArrowFunction", params, body };
        }
      } catch {
        // 실패하면 원래 위치로 복원
        this.current = checkPoint;
      }
    }

    throw this.error("Expected expression", this.peek());
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(message, this.peek());
  }

  private error(message: string, token: Token): Error {
    this.errors.push({
      message,
      token,
      line: token.line,
      column: token.column,
    });
    return new Error(`${message} at line ${token.line}`);
  }

  private synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.DEFN:
        case TokenType.LET:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }

  getErrors(): ParseError[] {
    return this.errors;
  }
}
