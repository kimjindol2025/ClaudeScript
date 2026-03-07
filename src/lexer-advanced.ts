/**
 * Phase 9: Advanced Lexer (깊이 있는 토크나이저)
 *
 * 지원 기능:
 * - 문자열 리터럴 ("...", '...')
 * - 부동소수점 숫자 (3.14)
 * - 16진수/8진수 (0x1F, 0o77)
 * - 다중행 주석 (/* ... */)
 * - 더 많은 연산자 (+=, -=, !, &&, ||, %)
 * - defn (함수 정의)
 * - 배열/객체 [, ], {, }
 * - 에러 메시지 with 위치 추적
 */

export enum TokenType {
  // Literals
  NUMBER = "NUMBER",
  STRING = "STRING",
  IDENTIFIER = "IDENTIFIER",
  TRUE = "TRUE",
  FALSE = "FALSE",

  // Keywords
  LET = "LET",
  CONST = "CONST",
  DEFN = "DEFN",        // 함수 정의
  WHILE = "WHILE",
  FOR = "FOR",           // for 루프
  IF = "IF",
  ELSE = "ELSE",
  RETURN = "RETURN",
  BREAK = "BREAK",       // 루프 탈출
  CONTINUE = "CONTINUE", // 루프 계속
  IN = "IN",             // for...in
  OF = "OF",             // for...of

  // Operators
  PLUS = "PLUS",
  MINUS = "MINUS",
  STAR = "STAR",
  SLASH = "SLASH",
  PERCENT = "PERCENT",   // %
  POWER = "POWER",       // **
  EQ_EQ = "EQ_EQ",       // ==
  NOT_EQ = "NOT_EQ",     // !=
  LT = "LT",
  GT = "GT",
  LT_EQ = "LT_EQ",       // <=
  GT_EQ = "GT_EQ",       // >=
  EQ = "EQ",
  PLUS_EQ = "PLUS_EQ",   // +=
  MINUS_EQ = "MINUS_EQ", // -=
  AND = "AND",           // &&
  OR = "OR",             // ||
  NOT = "NOT",           // !
  QUESTION = "QUESTION", // ?
  COLON = "COLON",       // :
  DOT = "DOT",           // .
  ARROW = "ARROW",       // =>

  // Punctuation
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
  ERROR = "ERROR",
}

export interface Token {
  type: TokenType;
  lexeme: string;
  value?: any;
  line: number;
  column: number;
  start: number;
  end: number;
}

export interface LexError {
  message: string;
  line: number;
  column: number;
  lexeme: string;
}

export class LexerAdvanced {
  private tokens: Token[] = [];
  private current = 0;
  private line = 1;
  private column = 1;
  private lineStart = 0;
  private errors: LexError[] = [];

  constructor(private source: string) {}

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.skipWhitespaceAndComments();
      if (this.isAtEnd()) break;

      const start = this.current;
      const c = this.peek();

      // 두 글자 연산자 먼저 확인
      if (!this.isAtEnd()) {
        const twoChar = c + (this.current + 1 < this.source.length ? this.source[this.current + 1] : "");

        if (twoChar === "==") {
          this.advance(); this.advance();
          this.tokens.push(this.makeToken(TokenType.EQ_EQ, "==", start));
          continue;
        }
        if (twoChar === "!=") {
          this.advance(); this.advance();
          this.tokens.push(this.makeToken(TokenType.NOT_EQ, "!=", start));
          continue;
        }
        if (twoChar === "<=") {
          this.advance(); this.advance();
          this.tokens.push(this.makeToken(TokenType.LT_EQ, "<=", start));
          continue;
        }
        if (twoChar === ">=") {
          this.advance(); this.advance();
          this.tokens.push(this.makeToken(TokenType.GT_EQ, ">=", start));
          continue;
        }
        if (twoChar === "&&") {
          this.advance(); this.advance();
          this.tokens.push(this.makeToken(TokenType.AND, "&&", start));
          continue;
        }
        if (twoChar === "||") {
          this.advance(); this.advance();
          this.tokens.push(this.makeToken(TokenType.OR, "||", start));
          continue;
        }
        if (twoChar === "+=") {
          this.advance(); this.advance();
          this.tokens.push(this.makeToken(TokenType.PLUS_EQ, "+=", start));
          continue;
        }
        if (twoChar === "-=") {
          this.advance(); this.advance();
          this.tokens.push(this.makeToken(TokenType.MINUS_EQ, "-=", start));
          continue;
        }
        if (twoChar === "**") {
          this.advance(); this.advance();
          this.tokens.push(this.makeToken(TokenType.POWER, "**", start));
          continue;
        }
        if (twoChar === "=>") {
          this.advance(); this.advance();
          this.tokens.push(this.makeToken(TokenType.ARROW, "=>", start));
          continue;
        }
      }

      // 한 글자 연산자 및 구분자
      if (c === "(") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.LPAREN, "(", start));
      } else if (c === ")") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.RPAREN, ")", start));
      } else if (c === "{") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.LBRACE, "{", start));
      } else if (c === "}") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.RBRACE, "}", start));
      } else if (c === "[") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.LBRACKET, "[", start));
      } else if (c === "]") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.RBRACKET, "]", start));
      } else if (c === ";") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.SEMICOLON, ";", start));
      } else if (c === ",") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.COMMA, ",", start));
      } else if (c === ".") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.DOT, ".", start));
      } else if (c === ":") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.COLON, ":", start));
      } else if (c === "?") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.QUESTION, "?", start));
      } else if (c === "+") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.PLUS, "+", start));
      } else if (c === "-") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.MINUS, "-", start));
      } else if (c === "*") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.STAR, "*", start));
      } else if (c === "/") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.SLASH, "/", start));
      } else if (c === "%") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.PERCENT, "%", start));
      } else if (c === "<") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.LT, "<", start));
      } else if (c === ">") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.GT, ">", start));
      } else if (c === "=") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.EQ, "=", start));
      } else if (c === "!") {
        this.advance();
        this.tokens.push(this.makeToken(TokenType.NOT, "!", start));
      } else if (c === '"' || c === "'") {
        this.scanString(c);
      } else if (c === "0" && this.peekNext() === "x") {
        this.scanHexNumber();
      } else if (c === "0" && this.peekNext() === "o") {
        this.scanOctalNumber();
      } else if (this.isDigit(c)) {
        this.scanNumber();
      } else if (this.isAlpha(c)) {
        this.scanIdentifier();
      } else {
        this.error(`Unexpected character: '${c}'`);
        this.advance();
      }
    }

    this.tokens.push({
      type: TokenType.EOF,
      lexeme: "",
      line: this.line,
      column: this.column,
      start: this.current,
      end: this.current,
    });

    return this.tokens;
  }

  private scanString(quote: string) {
    const start = this.current;
    const startLine = this.line;
    const startColumn = this.column;

    this.advance(); // Skip opening quote

    const chars: string[] = [];
    while (!this.isAtEnd() && this.peek() !== quote) {
      if (this.peek() === "\\") {
        this.advance();
        if (!this.isAtEnd()) {
          const escaped = this.peek();
          switch (escaped) {
            case "n": chars.push("\n"); break;
            case "t": chars.push("\t"); break;
            case "r": chars.push("\r"); break;
            case "\\": chars.push("\\"); break;
            case '"': chars.push('"'); break;
            case "'": chars.push("'"); break;
            default: chars.push(escaped);
          }
          this.advance();
        }
      } else {
        if (this.peek() === "\n") {
          this.line++;
          this.column = 0;
        }
        chars.push(this.peek());
        this.advance();
      }
    }

    if (this.isAtEnd()) {
      this.errors.push({
        message: `Unterminated string at line ${startLine}`,
        line: startLine,
        column: startColumn,
        lexeme: this.source.substring(start, this.current),
      });
      this.tokens.push({
        type: TokenType.ERROR,
        lexeme: this.source.substring(start, this.current),
        value: chars.join(""),
        line: startLine,
        column: startColumn,
        start,
        end: this.current,
      });
    } else {
      this.advance(); // Skip closing quote
      this.tokens.push({
        type: TokenType.STRING,
        lexeme: this.source.substring(start, this.current),
        value: chars.join(""),
        line: startLine,
        column: startColumn,
        start,
        end: this.current,
      });
    }
  }

  private scanNumber() {
    const start = this.current;
    const startCol = this.column;

    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // 부동소수점 지원
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      this.advance(); // Skip '.'
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = parseFloat(this.source.substring(start, this.current));
    this.tokens.push({
      type: TokenType.NUMBER,
      lexeme: this.source.substring(start, this.current),
      value,
      line: this.line,
      column: startCol,
      start,
      end: this.current,
    });
  }

  private scanHexNumber() {
    const start = this.current;
    const startCol = this.column;

    this.advance(); // Skip '0'
    this.advance(); // Skip 'x'

    while (this.isHexDigit(this.peek())) {
      this.advance();
    }

    const value = parseInt(this.source.substring(start + 2, this.current), 16);
    this.tokens.push({
      type: TokenType.NUMBER,
      lexeme: this.source.substring(start, this.current),
      value,
      line: this.line,
      column: startCol,
      start,
      end: this.current,
    });
  }

  private scanOctalNumber() {
    const start = this.current;
    const startCol = this.column;

    this.advance(); // Skip '0'
    this.advance(); // Skip 'o'

    while (this.isOctalDigit(this.peek())) {
      this.advance();
    }

    const value = parseInt(this.source.substring(start + 2, this.current), 8);
    this.tokens.push({
      type: TokenType.NUMBER,
      lexeme: this.source.substring(start, this.current),
      value,
      line: this.line,
      column: startCol,
      start,
      end: this.current,
    });
  }

  private scanIdentifier() {
    const start = this.current;
    const startCol = this.column;

    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(start, this.current);
    const keywordMap: Record<string, TokenType> = {
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
      true: TokenType.TRUE,
      false: TokenType.FALSE,
    };

    const type = keywordMap[text] || TokenType.IDENTIFIER;
    this.tokens.push({
      type,
      lexeme: text,
      line: this.line,
      column: startCol,
      start,
      end: this.current,
    });
  }

  private skipWhitespaceAndComments() {
    while (!this.isAtEnd()) {
      const c = this.peek();

      if (c === " " || c === "\r" || c === "\t") {
        this.advance();
      } else if (c === "\n") {
        this.line++;
        this.column = 1;
        this.lineStart = this.current + 1;
        this.advance();
      } else if (c === "/" && this.peekNext() === "/") {
        // Line comment
        while (this.peek() !== "\n" && !this.isAtEnd()) {
          this.advance();
        }
      } else if (c === "/" && this.peekNext() === "*") {
        // Block comment
        this.advance(); // Skip '/'
        this.advance(); // Skip '*'
        while (!this.isAtEnd()) {
          if (this.peek() === "*" && this.peekNext() === "/") {
            this.advance(); // Skip '*'
            this.advance(); // Skip '/'
            break;
          }
          if (this.peek() === "\n") {
            this.line++;
            this.column = 1;
            this.lineStart = this.current + 1;
          }
          this.advance();
        }
      } else {
        break;
      }
    }
  }

  private makeToken(
    type: TokenType,
    lexeme: string,
    start: number
  ): Token {
    return {
      type,
      lexeme,
      line: this.line,
      column: this.column - lexeme.length,
      start,
      end: this.current,
    };
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
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_" || c === "$";
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
    const c = this.source[this.current++];
    this.column++;
    return c;
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private error(message: string) {
    this.errors.push({
      message,
      line: this.line,
      column: this.column,
      lexeme: this.peek(),
    });
  }

  getErrors(): LexError[] {
    return this.errors;
  }
}
