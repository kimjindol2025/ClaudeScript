/**
 * S-Expression Compiler
 * Converts S-expression text to VM Instructions
 */

export interface Instruction {
  opcode: string;
  operand?: any;
}

export class SexpCompiler {
  private instructions: Instruction[] = [];
  private variables: Map<string, number> = new Map();
  private varCounter = 0;
  private labelCounter = 0;

  compile(sexpText: string): Instruction[] {
    this.instructions = [];
    this.variables.clear();
    this.varCounter = 0;

    const expr = this.parseSexp(sexpText);
    this.compileSexp(expr);

    return this.instructions;
  }

  private parseSexp(text: string): any {
    const tokens = this.tokenize(text);
    const { value } = this.parseTokens(tokens, 0);
    return value;
  }

  private tokenize(text: string): string[] {
    return text
      .replace(/\(/g, " ( ")
      .replace(/\)/g, " ) ")
      .split(/\s+/)
      .filter((t) => t.length > 0);
  }

  private parseTokens(tokens: string[], index: number): { value: any; nextIndex: number } {
    if (index >= tokens.length) {
      throw new Error("Unexpected end of input");
    }

    const token = tokens[index];

    if (token === "(") {
      const list = [];
      let i = index + 1;

      while (i < tokens.length && tokens[i] !== ")") {
        const { value, nextIndex } = this.parseTokens(tokens, i);
        list.push(value);
        i = nextIndex;
      }

      if (i >= tokens.length) {
        throw new Error("Unmatched parenthesis");
      }

      return { value: list, nextIndex: i + 1 };
    } else if (token === ")") {
      throw new Error("Unexpected )");
    } else if (!isNaN(Number(token))) {
      return { value: Number(token), nextIndex: index + 1 };
    } else if (token === "#t" || token === "#f") {
      return { value: token === "#t", nextIndex: index + 1 };
    } else if (token.startsWith('"') && token.endsWith('"')) {
      return { value: token.slice(1, -1), nextIndex: index + 1 };
    } else {
      return { value: token, nextIndex: index + 1 };
    }
  }

  private compileSexp(expr: any): void {
    if (typeof expr === "number") {
      this.emit("PUSH_CONST", expr);
    } else if (typeof expr === "boolean") {
      this.emit("PUSH_CONST", expr);
    } else if (typeof expr === "string") {
      // String literal
      this.emit("PUSH_CONST", expr);
    } else if (Array.isArray(expr)) {
      const [op, ...args] = expr;

      if (op === "let") {
        // (let name value)
        const [name, value] = args;
        this.compileSexp(value);
        this.storeVariable(name);
      } else if (op === "+") {
        // (+ a b)
        this.compileSexp(args[0]);
        this.compileSexp(args[1]);
        this.emit("ADD");
      } else if (op === "-") {
        // (- a b)
        this.compileSexp(args[0]);
        this.compileSexp(args[1]);
        this.emit("SUB");
      } else if (op === "*") {
        // (* a b)
        this.compileSexp(args[0]);
        this.compileSexp(args[1]);
        this.emit("MUL");
      } else if (op === "/") {
        // (/ a b)
        this.compileSexp(args[0]);
        this.compileSexp(args[1]);
        this.emit("DIV");
      } else if (op === "=") {
        // (= a b)
        this.compileSexp(args[0]);
        this.compileSexp(args[1]);
        this.emit("EQ");
      } else if (op === "<") {
        // (< a b)
        this.compileSexp(args[0]);
        this.compileSexp(args[1]);
        this.emit("LT");
      } else if (op === ">") {
        // (> a b)
        this.compileSexp(args[0]);
        this.compileSexp(args[1]);
        this.emit("GT");
      } else if (op === "if") {
        // (if condition then else)
        const [condition, thenExpr, elseExpr] = args;
        this.compileSexp(condition);
        const elseLabel = this.createLabel();
        const endLabel = this.createLabel();
        this.emit("JIF", elseLabel);
        this.compileSexp(thenExpr);
        this.emit("JMP", endLabel);
        this.emit("LABEL", elseLabel);
        if (elseExpr) {
          this.compileSexp(elseExpr);
        }
        this.emit("LABEL", endLabel);
      } else if (op === "defn") {
        // (defn name params body)
        const [name, params, ...bodyExprs] = args;
        // Store function (simplified)
        for (const bodyExpr of bodyExprs) {
          this.compileSexp(bodyExpr);
        }
      } else if (op === "println") {
        // (println arg)
        this.compileSexp(args[0]);
        this.emit("PRINT");
      } else if (op === "return") {
        // (return value)
        if (args.length > 0) {
          this.compileSexp(args[0]);
        }
        this.emit("RET");
      } else {
        // Function call
        this.compileSexp(args[0]);
        this.emit("CALL", op);
      }
    }
  }

  private storeVariable(name: string): void {
    if (!this.variables.has(name)) {
      this.variables.set(name, this.varCounter++);
    }
    const varIndex = this.variables.get(name)!;
    this.emit("STORE_VAR", varIndex);
  }

  private loadVariable(name: string): void {
    if (!this.variables.has(name)) {
      this.variables.set(name, this.varCounter++);
    }
    const varIndex = this.variables.get(name)!;
    this.emit("LOAD_VAR", varIndex);
  }

  private emit(opcode: string, operand?: any): void {
    const instruction: Instruction = { opcode };
    if (operand !== undefined) {
      instruction.operand = operand;
    }
    this.instructions.push(instruction);
  }

  private createLabel(): string {
    return `label_${this.labelCounter++}`;
  }

  getInstructions(): Instruction[] {
    return this.instructions;
  }
}

export function compileSexp(sexpText: string): Instruction[] {
  const compiler = new SexpCompiler();
  return compiler.compile(sexpText);
}
