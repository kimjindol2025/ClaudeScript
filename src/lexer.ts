/**
 * Phase 8: Lexer (소스 코드 → Token)
 *
 * 최소형 토크나이저
 * - 키워드: let, while, if, else, return
 * - 식별자, 숫자, 연산자, 괄호
 */

export enum TokenType {
  // Literals
  NUMBER = "NUMBER",
  IDENTIFIER = "IDENTIFIER",

  // Keywords
  LET = "LET",
  WHILE = "WHILE",
  IF = "IF",
  ELSE = "ELSE",
  RETURN = "RETURN",

  // Operators
  PLUS = "PLUS",
  MINUS = "MINUS",
  STAR = "STAR",
  SLASH = "SLASH",
  EQ_EQ = "EQ_EQ",
  LT = "LT",
  GT = "GT",
  EQ = "EQ",

  // Punctuation
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  LBRACE = "LBRACE",
  RBRACE = "RBRACE",
  SEMICOLON = "SEMICOLON",
  COMMA = "COMMA",

  // Special
  EOF = "EOF",
}

export interface Token {
  type: TokenType;
  lexeme: string;
  value?: any;
  line: number;
}

export class Lexer {
  private tokens: Token[] = [];
  private current = 0;
  private line = 1;

  constructor(private source: string) {}

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.skipWhitespaceAndComments();
      if (this.isAtEnd()) break;

      const c = this.peek();

      if (c === "(") {
        this.tokens.push(this.makeToken(TokenType.LPAREN, "("));
        this.advance();
      } else if (c === ")") {
        this.tokens.push(this.makeToken(TokenType.RPAREN, ")"));
        this.advance();
      } else if (c === "{") {
        this.tokens.push(this.makeToken(TokenType.LBRACE, "{"));
        this.advance();
      } else if (c === "}") {
        this.tokens.push(this.makeToken(TokenType.RBRACE, "}"));
        this.advance();
      } else if (c === ";") {
        this.tokens.push(this.makeToken(TokenType.SEMICOLON, ";"));
        this.advance();
      } else if (c === ",") {
        this.tokens.push(this.makeToken(TokenType.COMMA, ","));
        this.advance();
      } else if (c === "+") {
        this.tokens.push(this.makeToken(TokenType.PLUS, "+"));
        this.advance();
      } else if (c === "-") {
        this.tokens.push(this.makeToken(TokenType.MINUS, "-"));
        this.advance();
      } else if (c === "*") {
        this.tokens.push(this.makeToken(TokenType.STAR, "*"));
        this.advance();
      } else if (c === "/") {
        this.tokens.push(this.makeToken(TokenType.SLASH, "/"));
        this.advance();
      } else if (c === "<") {
        this.tokens.push(this.makeToken(TokenType.LT, "<"));
        this.advance();
      } else if (c === ">") {
        this.tokens.push(this.makeToken(TokenType.GT, ">"));
        this.advance();
      } else if (c === "=") {
        this.advance();
        if (this.peek() === "=") {
          this.advance();
          this.tokens.push(this.makeToken(TokenType.EQ_EQ, "=="));
        } else {
          this.tokens.push(this.makeToken(TokenType.EQ, "="));
        }
      } else if (this.isDigit(c)) {
        this.scanNumber();
      } else if (this.isAlpha(c)) {
        this.scanIdentifier();
      } else {
        throw new Error(`Unexpected character: ${c} at line ${this.line}`);
      }
    }

    this.tokens.push({ type: TokenType.EOF, lexeme: "", line: this.line });
    return this.tokens;
  }

  private scanNumber() {
    const start = this.current;

    while (this.isDigit(this.peek())) {
      this.advance();
    }

    const value = parseInt(this.source.substring(start, this.current), 10);
    this.tokens.push({
      type: TokenType.NUMBER,
      lexeme: this.source.substring(start, this.current),
      value,
      line: this.line,
    });
  }

  private scanIdentifier() {
    const start = this.current;

    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(start, this.current);
    const keywordMap: Record<string, TokenType> = {
      let: TokenType.LET,
      while: TokenType.WHILE,
      if: TokenType.IF,
      else: TokenType.ELSE,
      return: TokenType.RETURN,
    };

    const type = keywordMap[text] || TokenType.IDENTIFIER;
    this.tokens.push(this.makeToken(type, text));
  }

  private skipWhitespaceAndComments() {
    while (!this.isAtEnd()) {
      const c = this.peek();

      if (c === " " || c === "\r" || c === "\t") {
        this.advance();
      } else if (c === "\n") {
        this.line++;
        this.advance();
      } else if (c === "/" && this.peekNext() === "/") {
        // Line comment
        while (this.peek() !== "\n" && !this.isAtEnd()) {
          this.advance();
        }
      } else {
        break;
      }
    }
  }

  private makeToken(type: TokenType, lexeme: string): Token {
    return { type, lexeme, line: this.line };
  }

  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  private isAlpha(c: string): boolean {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source[this.current];
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source[this.current + 1];
  }

  private advance(): string {
    return this.source[this.current++];
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }
}
