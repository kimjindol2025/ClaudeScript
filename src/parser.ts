/**
 * Phase 8: Parser (Token → AST)
 *
 * Token 스트림을 phase6-ast.ts 형식의 AST로 변환
 */

import { Token, TokenType, Lexer } from "./lexer";
import { Program, Stmt, Expr } from "./phase6-ast";

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(private source: string) {
    const lexer = new Lexer(source);
    this.tokens = lexer.tokenize();
  }

  parse(): Program {
    const body: Stmt[] = [];

    while (!this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) body.push(stmt);
    }

    return { body };
  }

  private statement(): Stmt | null {
    // let statement
    if (this.match(TokenType.LET)) {
      return this.varDeclStatement();
    }

    // while statement
    if (this.match(TokenType.WHILE)) {
      return this.whileStatement();
    }

    // if statement
    if (this.match(TokenType.IF)) {
      return this.ifStatement();
    }

    // return statement
    if (this.match(TokenType.RETURN)) {
      return this.returnStatement();
    }

    // expression statement (assignment or function call)
    const expr = this.expression();

    // Check for assignment (identifier = expression)
    if (expr.type === "Identifier" && this.match(TokenType.EQ)) {
      const name = (expr as any).name;
      const value = this.expression();
      this.consume(TokenType.SEMICOLON, "Expected ';' after assignment");

      // Transform to VarDecl (reuses same slot)
      return { type: "VarDecl", name, init: value };
    }

    this.consume(TokenType.SEMICOLON, "Expected ';' after statement");

    if (expr.type === "Call") {
      return expr as any; // Cast Call expression to statement
    }

    throw new Error("Expected statement");
  }

  private varDeclStatement(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expected variable name").lexeme;
    this.consume(TokenType.EQ, "Expected '=' in variable declaration");
    const init = this.expression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after variable declaration");

    return { type: "VarDecl", name, init };
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
      this.consume(TokenType.LBRACE, "Expected '{' before else body");
      elseBody = [];
      while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
        const stmt = this.statement();
        if (stmt) elseBody.push(stmt);
      }
      this.consume(TokenType.RBRACE, "Expected '}' after else body");
    }

    return { type: "If", cond, then: thenBody, else: elseBody };
  }

  private returnStatement(): Stmt {
    const value = this.expression();
    this.consume(TokenType.SEMICOLON, "Expected ';' after return");

    return { type: "Return", value };
  }

  private expression(): Expr {
    return this.comparison();
  }

  private comparison(): Expr {
    let expr = this.addition();

    while (true) {
      if (this.match(TokenType.EQ_EQ)) {
        const op = "==";
        const right = this.addition();
        expr = { type: "Binary", op, left: expr, right };
      } else if (this.match(TokenType.LT)) {
        const op = "<";
        const right = this.addition();
        expr = { type: "Binary", op, left: expr, right };
      } else if (this.match(TokenType.GT)) {
        const op = ">";
        const right = this.addition();
        expr = { type: "Binary", op, left: expr, right };
      } else {
        break;
      }
    }

    return expr;
  }

  private addition(): Expr {
    let expr = this.multiplication();

    while (true) {
      if (this.match(TokenType.PLUS)) {
        const op = "+";
        const right = this.multiplication();
        expr = { type: "Binary", op, left: expr, right };
      } else if (this.match(TokenType.MINUS)) {
        const op = "-";
        const right = this.multiplication();
        expr = { type: "Binary", op, left: expr, right };
      } else {
        break;
      }
    }

    return expr;
  }

  private multiplication(): Expr {
    let expr = this.call();

    while (true) {
      if (this.match(TokenType.STAR)) {
        const op = "*";
        const right = this.call();
        expr = { type: "Binary", op, left: expr, right };
      } else if (this.match(TokenType.SLASH)) {
        const op = "/";
        const right = this.call();
        expr = { type: "Binary", op, left: expr, right };
      } else {
        break;
      }
    }

    return expr;
  }

  private call(): Expr {
    let expr = this.primary();

    // Check for function call
    if (expr.type === "Identifier" && this.check(TokenType.LPAREN)) {
      this.advance(); // consume '('
      const args: Expr[] = [];

      if (!this.check(TokenType.RPAREN)) {
        do {
          args.push(this.expression());
        } while (this.match(TokenType.COMMA));
      }

      this.consume(TokenType.RPAREN, "Expected ')' after arguments");

      return { type: "Call", name: (expr as any).name, args };
    }

    return expr;
  }

  private primary(): Expr {
    if (this.match(TokenType.NUMBER)) {
      return { type: "NumberLiteral", value: (this.previous() as any).value };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return { type: "Identifier", name: this.previous().lexeme };
    }

    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }

    throw new Error(`Unexpected token: ${this.peek().lexeme}`);
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

    throw new Error(
      `${message} at line ${this.peek().line}, got ${this.peek().lexeme}`
    );
  }
}
