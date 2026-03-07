/**
 * Advanced Parser for ClaudeScript
 * Recursive descent parser with operator precedence
 */

import { Token, TokenType, LexerAdvanced } from "./lexer-advanced";

export interface ASTNode {
  type: string;
  [key: string]: any;
}

export class ParserAdvanced {
  private tokens: Token[];
  private current = 0;
  private errors: Array<{ message: string; line: number; column: number }> = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    const body: ASTNode[] = [];

    while (!this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) {
        body.push(stmt);
      }
    }

    return {
      type: "Program",
      body,
    };
  }

  private statement(): ASTNode | null {
    try {
      if (this.match(TokenType.LET, TokenType.CONST)) {
        return this.varDeclaration();
      }
      if (this.match(TokenType.DEFN)) {
        return this.functionDeclaration();
      }
      if (this.match(TokenType.IF)) {
        return this.ifStatement();
      }
      if (this.match(TokenType.WHILE)) {
        return this.whileStatement();
      }
      if (this.match(TokenType.FOR)) {
        return this.forStatement();
      }
      if (this.match(TokenType.RETURN)) {
        return this.returnStatement();
      }
      if (this.match(TokenType.BREAK)) {
        this.consumeStatementEnd();
        return { type: "Break" };
      }
      if (this.match(TokenType.CONTINUE)) {
        this.consumeStatementEnd();
        return { type: "Continue" };
      }
      if (this.match(TokenType.LBRACE)) {
        return this.blockStatement();
      }

      return this.expressionStatement();
    } catch (e) {
      this.synchronize();
      return null;
    }
  }

  private varDeclaration(): ASTNode {
    const name = this.consume(TokenType.IDENTIFIER, "Expected variable name").lexeme;
    let init = null;

    if (this.match(TokenType.ASSIGN)) {
      init = this.expression();
    }

    this.consumeStatementEnd();
    return {
      type: "VarDecl",
      name,
      init,
    };
  }

  private functionDeclaration(): ASTNode {
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

    const body: ASTNode[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) body.push(stmt);
    }

    this.consume(TokenType.RBRACE, "Expected '}' after function body");

    return {
      type: "FunctionDecl",
      name,
      params,
      body,
    };
  }

  private ifStatement(): ASTNode {
    this.consume(TokenType.LPAREN, "Expected '(' after 'if'");
    const condition = this.expression();
    this.consume(TokenType.RPAREN, "Expected ')' after condition");

    const thenBranch = this.statement();
    let elseBranch = null;

    if (this.match(TokenType.ELSE)) {
      elseBranch = this.statement();
    }

    return {
      type: "If",
      condition,
      then: thenBranch,
      else: elseBranch,
    };
  }

  private whileStatement(): ASTNode {
    this.consume(TokenType.LPAREN, "Expected '(' after 'while'");
    const condition = this.expression();
    this.consume(TokenType.RPAREN, "Expected ')' after condition");
    const body = this.statement();

    return {
      type: "While",
      condition,
      body,
    };
  }

  private forStatement(): ASTNode {
    this.consume(TokenType.LPAREN, "Expected '(' after 'for'");

    let variable: string | null = null;
    let init: ASTNode | null = null;
    let condition: ASTNode | null = null;
    let update: ASTNode | null = null;
    let iterable: ASTNode | null = null;
    let iterableType: "in" | "of" | null = null;

    // Check for for...in or for...of
    if (this.check(TokenType.LET) || this.check(TokenType.CONST)) {
      const checkpoint = this.current;
      this.advance(); // skip let/const
      if (this.check(TokenType.IDENTIFIER)) {
        const name = this.advance().lexeme;
        if (this.check(TokenType.IN)) {
          variable = name;
          this.advance(); // skip 'in'
          iterable = this.expression();
          iterableType = "in";
          this.consume(TokenType.RPAREN, "Expected ')' after for...in");
          const body = this.statement();
          return {
            type: "ForIn",
            variable,
            iterable,
            body,
          };
        } else if (this.check(TokenType.OF)) {
          variable = name;
          this.advance(); // skip 'of'
          iterable = this.expression();
          iterableType = "of";
          this.consume(TokenType.RPAREN, "Expected ')' after for...of");
          const body = this.statement();
          return {
            type: "ForOf",
            variable,
            iterable,
            body,
          };
        } else {
          // Regular for loop
          this.current = checkpoint;
        }
      } else {
        this.current = checkpoint;
      }
    }

    // Regular C-style for loop
    if (!this.check(TokenType.SEMICOLON)) {
      init = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expected ';' after for init");

    if (!this.check(TokenType.SEMICOLON)) {
      condition = this.expression();
    }
    this.consume(TokenType.SEMICOLON, "Expected ';' after for condition");

    if (!this.check(TokenType.RPAREN)) {
      update = this.expression();
    }
    this.consume(TokenType.RPAREN, "Expected ')' after for clauses");

    const body = this.statement();

    return {
      type: "For",
      init,
      condition,
      update,
      body,
    };
  }

  private returnStatement(): ASTNode {
    let value = null;
    if (!this.check(TokenType.SEMICOLON) && !this.isAtEnd()) {
      value = this.expression();
    }
    this.consumeStatementEnd();
    return {
      type: "Return",
      value,
    };
  }

  private blockStatement(): ASTNode {
    const statements: ASTNode[] = [];
    while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
      const stmt = this.statement();
      if (stmt) statements.push(stmt);
    }
    this.consume(TokenType.RBRACE, "Expected '}' after block");
    return {
      type: "Block",
      statements,
    };
  }

  private expressionStatement(): ASTNode {
    const expr = this.expression();
    this.consumeStatementEnd();
    return expr;
  }

  private expression(): ASTNode {
    return this.assignment();
  }

  private assignment(): ASTNode {
    let expr = this.ternary();

    if (this.match(TokenType.ASSIGN)) {
      const value = this.assignment();
      if (expr.type === "Identifier") {
        return {
          type: "Assignment",
          name: expr.name,
          value,
        };
      }
    } else if (this.match(TokenType.PLUS_ASSIGN, TokenType.MINUS_ASSIGN)) {
      const op = this.previous().lexeme === "+=" ? "+" : "-";
      const value = this.assignment();
      if (expr.type === "Identifier") {
        return {
          type: "CompoundAssignment",
          name: expr.name,
          op,
          value,
        };
      }
    }

    return expr;
  }

  private ternary(): ASTNode {
    let expr = this.logicalOr();

    if (this.match(TokenType.QUESTION)) {
      const thenExpr = this.expression();
      this.consume(TokenType.COLON, "Expected ':' in ternary");
      const elseExpr = this.ternary();
      return {
        type: "Ternary",
        condition: expr,
        then: thenExpr,
        else: elseExpr,
      };
    }

    return expr;
  }

  private logicalOr(): ASTNode {
    let expr = this.logicalAnd();

    while (this.match(TokenType.OR)) {
      const operator = this.previous().lexeme;
      const right = this.logicalAnd();
      expr = {
        type: "Binary",
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private logicalAnd(): ASTNode {
    let expr = this.equality();

    while (this.match(TokenType.AND)) {
      const operator = this.previous().lexeme;
      const right = this.equality();
      expr = {
        type: "Binary",
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private equality(): ASTNode {
    let expr = this.comparison();

    while (this.match(TokenType.EQ, TokenType.NE)) {
      const operator = this.previous().lexeme;
      const right = this.comparison();
      expr = {
        type: "Binary",
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private comparison(): ASTNode {
    let expr = this.addition();

    while (this.match(TokenType.LT, TokenType.GT, TokenType.LE, TokenType.GE)) {
      const operator = this.previous().lexeme;
      const right = this.addition();
      expr = {
        type: "Binary",
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private addition(): ASTNode {
    let expr = this.multiplication();

    while (this.match(TokenType.PLUS, TokenType.MINUS)) {
      const operator = this.previous().lexeme;
      const right = this.multiplication();
      expr = {
        type: "Binary",
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private multiplication(): ASTNode {
    let expr = this.power();

    while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
      const operator = this.previous().lexeme;
      const right = this.power();
      expr = {
        type: "Binary",
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private power(): ASTNode {
    let expr = this.unary();

    while (this.match(TokenType.POWER)) {
      const operator = this.previous().lexeme;
      const right = this.unary();
      expr = {
        type: "Binary",
        operator,
        left: expr,
        right,
      };
    }

    return expr;
  }

  private unary(): ASTNode {
    if (this.match(TokenType.NOT, TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous().lexeme;
      const right = this.unary();
      return {
        type: "Unary",
        operator,
        operand: right,
      };
    }

    return this.postfix();
  }

  private postfix(): ASTNode {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.DOT)) {
        const property = this.consume(TokenType.IDENTIFIER, "Expected property name").lexeme;
        expr = {
          type: "Member",
          object: expr,
          property,
          computed: false,
        };
      } else if (this.match(TokenType.LBRACKET)) {
        const index = this.expression();
        this.consume(TokenType.RBRACKET, "Expected ']' after index");
        expr = {
          type: "Index",
          object: expr,
          index,
        };
      } else if (this.match(TokenType.LPAREN)) {
        const args: ASTNode[] = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.expression());
          } while (this.match(TokenType.COMMA));
        }
        this.consume(TokenType.RPAREN, "Expected ')' after arguments");
        expr = {
          type: "Call",
          callee: expr,
          arguments: args,
        };
      } else {
        break;
      }
    }

    return expr;
  }

  private primary(): ASTNode {
    if (this.match(TokenType.BOOLEAN)) {
      return {
        type: "BooleanLiteral",
        value: this.previous().value,
      };
    }

    if (this.match(TokenType.NUMBER)) {
      return {
        type: "NumberLiteral",
        value: this.previous().value,
      };
    }

    if (this.match(TokenType.STRING)) {
      return {
        type: "StringLiteral",
        value: this.previous().value,
      };
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return {
        type: "Identifier",
        name: this.previous().lexeme,
      };
    }

    if (this.match(TokenType.LBRACKET)) {
      const elements: ASTNode[] = [];
      if (!this.check(TokenType.RBRACKET)) {
        do {
          elements.push(this.expression());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RBRACKET, "Expected ']' after array elements");
      return {
        type: "ArrayLiteral",
        elements,
      };
    }

    if (this.match(TokenType.LBRACE)) {
      const properties: Array<[string, ASTNode]> = [];
      if (!this.check(TokenType.RBRACE)) {
        do {
          const key = this.consume(TokenType.IDENTIFIER, "Expected property key").lexeme;
          this.consume(TokenType.COLON, "Expected ':' after property key");
          const value = this.expression();
          properties.push([key, value]);
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RBRACE, "Expected '}' after object properties");
      return {
        type: "ObjectLiteral",
        properties,
      };
    }

    if (this.match(TokenType.LPAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }

    throw this.error("Expected expression");
  }

  // Helper methods
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
    throw this.error(message);
  }

  private error(message: string): Error {
    const token = this.peek();
    this.errors.push({
      message,
      line: token.line,
      column: token.column,
    });
    return new Error(message);
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.DEFN:
        case TokenType.LET:
        case TokenType.CONST:
        case TokenType.FOR:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.RETURN:
          return;
      }

      this.advance();
    }
  }

  private consumeStatementEnd(): void {
    if (this.match(TokenType.SEMICOLON)) return;
    if (this.isAtEnd() || this.check(TokenType.RBRACE)) return;
    // Optional semicolon
  }

  getErrors(): Array<{ message: string; line: number; column: number }> {
    return this.errors;
  }
}

export function parse(source: string): ASTNode {
  const lexer = new LexerAdvanced(source);
  const tokens = lexer.scanTokens();
  const parser = new ParserAdvanced(tokens);
  return parser.parse();
}
