/**
 * Advanced Lexer for ClaudeScript
 * Supports 42 token types with position tracking
 */

export enum TokenType {
  // Literals
  NUMBER = "NUMBER",
  STRING = "STRING",
  BOOLEAN = "BOOLEAN",

  // Keywords
  LET = "LET",
  CONST = "CONST",
  DEFN = "DEFN",
  WHILE = "WHILE",
  FOR = "FOR",
  IF = "IF",
  ELSE = "ELSE",
  RETURN = "RETURN",
  BREAK = "BREAK",
  CONTINUE = "CONTINUE",
  IN = "IN",
  OF = "OF",

  // Identifiers
  IDENTIFIER = "IDENTIFIER",

  // Operators
  PLUS = "PLUS",
  MINUS = "MINUS",
  STAR = "STAR",
  SLASH = "SLASH",
  PERCENT = "PERCENT",
  POWER = "POWER",

  // Comparison
  EQ = "EQ",
  NE = "NE",
  LT = "LT",
  GT = "GT",
  LE = "LE",
  GE = "GE",

  // Logical
  AND = "AND",
  OR = "OR",
  NOT = "NOT",

  // Assignment
  ASSIGN = "ASSIGN",
  PLUS_ASSIGN = "PLUS_ASSIGN",
  MINUS_ASSIGN = "MINUS_ASSIGN",

  // Other
  QUESTION = "QUESTION",
  COLON = "COLON",
  DOT = "DOT",
  ARROW = "ARROW",

  // Delimiters
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  LBRACE = "LBRACE",
  RBRACE = "RBRACE",
  LBRACKET = "LBRACKET",
  RBRACKET = "RBRACKET",
  SEMICOLON = "SEMICOLON",
  COMMA = "COMMA",

  // Special
  EOF = "EOF",
  NEWLINE = "NEWLINE",
}

export interface Token {
  type: TokenType;
  lexeme: string;
  value: any;
  line: number;
  column: number;
  start: number;
  end: number;
}

export class LexerAdvanced {
  private source: string;
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private column = 1;
  private errors: string[] = [];

  private keywords: Record<string, TokenType> = {
    let: TokenType.LET,
    const: TokenType.CONST,
    defn: TokenType.DEFN,
    while: TokenType.WHILE,
    for: TokenType.FOR,
    if: TokenType.IF,
    else: TokenType.ELSE,
    return: TokenType.RETURN,
    break: TokenType.BREAK,
    continue: TokenType.CONTINUE,
    in: TokenType.IN,
    of: TokenType.OF,
    true: TokenType.BOOLEAN,
    false: TokenType.BOOLEAN,
  };

  constructor(source: string) {
    this.source = source;
  }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      lexeme: "",
      value: null,
      line: this.line,
      column: this.column,
      start: this.current,
      end: this.current,
    });

    return this.tokens;
  }

  private scanToken(): void {
    const c = this.advance();

    switch (c) {
      case "(": this.addToken(TokenType.LPAREN); break;
      case ")": this.addToken(TokenType.RPAREN); break;
      case "{": this.addToken(TokenType.LBRACE); break;
      case "}": this.addToken(TokenType.RBRACE); break;
      case "[": this.addToken(TokenType.LBRACKET); break;
      case "]": this.addToken(TokenType.RBRACKET); break;
      case ",": this.addToken(TokenType.COMMA); break;
      case ";": this.addToken(TokenType.SEMICOLON); break;
      case "?": this.addToken(TokenType.QUESTION); break;
      case ":": this.addToken(TokenType.COLON); break;
      case ".": this.addToken(TokenType.DOT); break;

      case "+":
        if (this.match("=")) {
          this.addToken(TokenType.PLUS_ASSIGN);
        } else {
          this.addToken(TokenType.PLUS);
        }
        break;

      case "-":
        if (this.match("=")) {
          this.addToken(TokenType.MINUS_ASSIGN);
        } else if (this.match(">")) {
          this.addToken(TokenType.ARROW);
        } else {
          this.addToken(TokenType.MINUS);
        }
        break;

      case "*":
        if (this.match("*")) {
          this.addToken(TokenType.POWER);
        } else {
          this.addToken(TokenType.STAR);
        }
        break;

      case "/":
        if (this.match("/")) {
          // Line comment
          while (this.peek() !== "\n" && !this.isAtEnd()) this.advance();
        } else if (this.match("*")) {
          // Block comment
          while (!this.isAtEnd()) {
            if (this.peek() === "*" && this.peekNext() === "/") {
              this.advance(); // consume *
              this.advance(); // consume /
              break;
            }
            if (this.peek() === "\n") {
              this.line++;
              this.column = 0;
            }
            this.advance();
          }
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;

      case "%": this.addToken(TokenType.PERCENT); break;

      case "!":
        if (this.match("=")) {
          this.addToken(TokenType.NE);
        } else {
          this.addToken(TokenType.NOT);
        }
        break;

      case "=":
        if (this.match("=")) {
          this.addToken(TokenType.EQ);
        } else {
          this.addToken(TokenType.ASSIGN);
        }
        break;

      case "<":
        if (this.match("=")) {
          this.addToken(TokenType.LE);
        } else {
          this.addToken(TokenType.LT);
        }
        break;

      case ">":
        if (this.match("=")) {
          this.addToken(TokenType.GE);
        } else {
          this.addToken(TokenType.GT);
        }
        break;

      case "&":
        if (this.match("&")) {
          this.addToken(TokenType.AND);
        } else {
          this.errors.push(`Unexpected character: & at line ${this.line}`);
        }
        break;

      case "|":
        if (this.match("|")) {
          this.addToken(TokenType.OR);
        } else {
          this.errors.push(`Unexpected character: | at line ${this.line}`);
        }
        break;

      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace
        break;

      case "\n":
        this.line++;
        this.column = 1;
        break;

      case '"':
      case "'":
        this.string(c);
        break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          this.errors.push(`Unexpected character: ${c} at line ${this.line}`);
        }
        break;
    }
  }

  private string(quote: string): void {
    let value = "";
    while (this.peek() !== quote && !this.isAtEnd()) {
      if (this.peek() === "\n") {
        this.line++;
        this.column = 0;
      }
      if (this.peek() === "\\") {
        this.advance();
        const escaped = this.advance();
        switch (escaped) {
          case "n": value += "\n"; break;
          case "t": value += "\t"; break;
          case "r": value += "\r"; break;
          case "\\": value += "\\"; break;
          case '"': value += '"'; break;
          case "'": value += "'"; break;
          default: value += escaped;
        }
      } else {
        value += this.advance();
      }
    }

    if (this.isAtEnd()) {
      this.errors.push(`Unterminated string at line ${this.line}`);
      return;
    }

    this.advance(); // Consume closing quote
    this.addToken(TokenType.STRING, value);
  }

  private number(): void {
    // Check for hex or octal
    if (this.current - this.start === 1 && this.source[this.start] === "0") {
      if (this.peek() === "x" || this.peek() === "X") {
        this.advance(); // consume 'x'
        while (this.isHexDigit(this.peek())) this.advance();
        const lexeme = this.source.substring(this.start, this.current);
        const value = parseInt(lexeme, 16);
        this.addToken(TokenType.NUMBER, value);
        return;
      } else if (this.peek() === "o" || this.peek() === "O") {
        this.advance(); // consume 'o'
        while (this.isOctalDigit(this.peek())) this.advance();
        const lexeme = this.source.substring(this.start, this.current);
        const value = parseInt(lexeme.substring(2), 8);
        this.addToken(TokenType.NUMBER, value);
        return;
      }
    }

    while (this.isDigit(this.peek())) this.advance();

    // Check for decimal part
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      this.advance(); // consume '.'
      while (this.isDigit(this.peek())) this.advance();
    }

    const lexeme = this.source.substring(this.start, this.current);
    const value = parseFloat(lexeme);
    this.addToken(TokenType.NUMBER, value);
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) this.advance();

    const lexeme = this.source.substring(this.start, this.current);
    const type = this.keywords[lexeme] || TokenType.IDENTIFIER;

    if (type === TokenType.BOOLEAN) {
      this.addToken(type, lexeme === "true");
    } else {
      this.addToken(type, lexeme);
    }
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;
    this.current++;
    this.column++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  private isHexDigit(c: string): boolean {
    return this.isDigit(c) || (c >= "a" && c <= "f") || (c >= "A" && c <= "F");
  }

  private isOctalDigit(c: string): boolean {
    return c >= "0" && c <= "7";
  }

  private isAlpha(c: string): boolean {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private addToken(type: TokenType, value: any = null): void {
    const lexeme = this.source.substring(this.start, this.current);
    this.tokens.push({
      type,
      lexeme,
      value: value !== null ? value : lexeme,
      line: this.line,
      column: this.column - lexeme.length,
      start: this.start,
      end: this.current,
    });
    this.column += lexeme.length;
  }

  getErrors(): string[] {
    return this.errors;
  }
}
