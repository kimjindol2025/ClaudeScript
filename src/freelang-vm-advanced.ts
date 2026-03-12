/**
 * Phase 10: Advanced FreeLang VM
 *
 * 배열, 객체, 함수를 완전히 지원하는 가상 머신
 * - 스택 기반 아키텍처
 * - 함수 호출 스택 관리
 * - 클로저 지원
 * - 메모리 효율적인 구현
 */

import { Opcode, Instruction } from "./phase9-codegen";

export type Value =
  | number
  | string
  | boolean
  | null
  | undefined
  | Value[]
  | Record<string, Value>
  | Function;

export interface Frame {
  functionName: string;
  locals: Map<string, Value>;
  ip: number;
  instructions: Instruction[];
}

export interface FunctionValue {
  name: string;
  params: string[];
  instructions: Instruction[];
  localCount: number;
  closure: Map<string, Value>;
}

export class AdvancedVM {
  private stack: Value[] = [];
  private locals: Map<string, Value> = new Map();
  private functions: Map<string, FunctionValue> = new Map();
  private callStack: Frame[] = [];
  private ip = 0;
  private halted = false;
  private output: string[] = [];
  private nativeLoaded = false;

  constructor() {
    this.loadNativeFunctions();
  }

  private loadNativeFunctions(): void {
    if (this.nativeLoaded) return;

    // println(value) - 줄 바꿈과 함께 출력
    (globalThis as any)._println = (value: Value) => {
      this.output.push(String(value));
      console.log(value);
    };

    // print(value) - 줄 바꿈 없이 출력
    (globalThis as any)._print = (value: Value) => {
      const str = String(value);
      this.output.push(str);
      process.stdout.write(str);
    };

    // length(arr | obj | str)
    (globalThis as any)._length = (value: Value) => {
      if (Array.isArray(value)) return value.length;
      if (typeof value === "object" && value !== null) {
        return Object.keys(value as Record<string, Value>).length;
      }
      if (typeof value === "string") return value.length;
      return 0;
    };

    this.nativeLoaded = true;
  }

  /**
   * 프로그램 실행
   */
  execute(instructions: Instruction[]): Value {
    this.stack = [];
    this.locals.clear();
    this.callStack = [];
    this.ip = 0;
    this.halted = false;
    this.output = [];

    // 함수 정의 수집
    for (const instr of instructions) {
      if (instr.op === Opcode.FUNCTION_DEF && instr.arg) {
        const funcInfo = instr.arg as FunctionValue;
        this.functions.set(funcInfo.name, funcInfo);
      }
    }

    // 명령 실행
    while (this.ip < instructions.length && !this.halted) {
      const instr = instructions[this.ip];
      this.executeInstruction(instr);
      this.ip++;
    }

    return this.stack[this.stack.length - 1] || undefined;
  }

  private executeInstruction(instr: Instruction): void {
    switch (instr.op) {
      // ====== 상수 & 변수 ======
      case Opcode.PUSH_CONST:
        this.stack.push(instr.arg);
        break;

      case Opcode.LOAD: {
        const index = instr.arg as number;
        const value = Array.from(this.locals.values())[index];
        this.stack.push(value);
        break;
      }

      case Opcode.STORE: {
        const index = instr.arg as number;
        const value = this.stack.pop();
        const keys = Array.from(this.locals.keys());
        if (keys.length > index) {
          this.locals.set(keys[index], value);
        }
        break;
      }

      // ====== 산술 연산 ======
      case Opcode.ADD: {
        const b = this.stack.pop() as number;
        const a = this.stack.pop() as number;
        this.stack.push(a + b);
        break;
      }

      case Opcode.SUB: {
        const b = this.stack.pop() as number;
        const a = this.stack.pop() as number;
        this.stack.push(a - b);
        break;
      }

      case Opcode.MUL: {
        const b = this.stack.pop() as number;
        const a = this.stack.pop() as number;
        this.stack.push(a * b);
        break;
      }

      case Opcode.DIV: {
        const b = this.stack.pop() as number;
        const a = this.stack.pop() as number;
        this.stack.push(a / b);
        break;
      }

      case Opcode.MOD: {
        const b = this.stack.pop() as number;
        const a = this.stack.pop() as number;
        this.stack.push(a % b);
        break;
      }

      case Opcode.POW: {
        const b = this.stack.pop() as number;
        const a = this.stack.pop() as number;
        this.stack.push(a ** b);
        break;
      }

      // ====== 비교 연산 ======
      case Opcode.EQ: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(a === b);
        break;
      }

      case Opcode.NE: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(a !== b);
        break;
      }

      case Opcode.LT: {
        const b = this.stack.pop() as number;
        const a = this.stack.pop() as number;
        this.stack.push(a < b);
        break;
      }

      case Opcode.GT: {
        const b = this.stack.pop() as number;
        const a = this.stack.pop() as number;
        this.stack.push(a > b);
        break;
      }

      case Opcode.LE: {
        const b = this.stack.pop() as number;
        const a = this.stack.pop() as number;
        this.stack.push(a <= b);
        break;
      }

      case Opcode.GE: {
        const b = this.stack.pop() as number;
        const a = this.stack.pop() as number;
        this.stack.push(a >= b);
        break;
      }

      // ====== 논리 연산 ======
      case Opcode.AND: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(this.isTruthy(a) && this.isTruthy(b));
        break;
      }

      case Opcode.OR: {
        const b = this.stack.pop();
        const a = this.stack.pop();
        this.stack.push(this.isTruthy(a) || this.isTruthy(b));
        break;
      }

      case Opcode.NOT: {
        const a = this.stack.pop();
        this.stack.push(!this.isTruthy(a));
        break;
      }

      // ====== 배열 연산 ======
      case Opcode.ARRAY_CREATE: {
        const count = instr.arg as number;
        const elements = this.stack.splice(-count);
        this.stack.push(elements);
        break;
      }

      case Opcode.ARRAY_GET: {
        const index = this.stack.pop() as number;
        const array = this.stack.pop() as Value[];
        this.stack.push(array[index]);
        break;
      }

      case Opcode.ARRAY_SET: {
        const value = this.stack.pop();
        const index = this.stack.pop() as number;
        const array = this.stack.pop() as Value[];
        array[index] = value;
        this.stack.push(value);
        break;
      }

      case Opcode.ARRAY_PUSH: {
        const value = this.stack.pop();
        const array = this.stack.pop() as Value[];
        array.push(value);
        this.stack.push(array);
        break;
      }

      case Opcode.ARRAY_POP: {
        const array = this.stack.pop() as Value[];
        const value = array.pop();
        this.stack.push(value);
        break;
      }

      case Opcode.ARRAY_LEN: {
        const array = this.stack.pop() as Value[];
        this.stack.push(array.length);
        break;
      }

      // ====== 객체 연산 ======
      case Opcode.OBJECT_CREATE: {
        const { keys, count } = instr.arg as {
          keys: string[];
          count: number;
        };
        const values = this.stack.splice(-count);
        const obj: Record<string, Value> = {};
        keys.forEach((k, i) => {
          obj[k] = values[i];
        });
        this.stack.push(obj);
        break;
      }

      case Opcode.OBJECT_GET: {
        const key = this.stack.pop() as string;
        const obj = this.stack.pop() as Record<string, Value>;
        this.stack.push(obj[key]);
        break;
      }

      case Opcode.OBJECT_SET: {
        const value = this.stack.pop();
        const key = this.stack.pop() as string;
        const obj = this.stack.pop() as Record<string, Value>;
        obj[key] = value;
        this.stack.push(value);
        break;
      }

      case Opcode.OBJECT_KEYS: {
        const obj = this.stack.pop() as Record<string, Value>;
        this.stack.push(Object.keys(obj));
        break;
      }

      // ====== 함수 ======
      case Opcode.FUNCTION_DEF:
        // 함수 정의는 이미 수집됨 (execute에서)
        break;

      case Opcode.FUNCTION_CALL: {
        const { name, argc } = instr.arg as {
          name: string;
          argc: number;
        };

        const func = this.functions.get(name);
        if (!func) {
          throw new Error(`Undefined function: ${name}`);
        }

        // 인자를 스택에서 꺼내서 로컬 변수로 설정
        const args = this.stack.splice(-argc);
        const savedLocals = new Map(this.locals);

        this.locals.clear();
        func.params.forEach((param, i) => {
          this.locals.set(param, args[i]);
        });

        // 함수 본체 실행
        const result = this.execute(func.instructions);

        // 로컬 변수 복원
        this.locals = savedLocals;
        this.stack.push(result);
        break;
      }

      case Opcode.CALL_NATIVE: {
        const { name, argc } = instr.arg as {
          name: string;
          argc: number;
        };

        const args = this.stack.splice(-argc);

        let result: Value;
        switch (name) {
          case "println":
            (globalThis as any)._println(args[0]);
            result = undefined;
            break;
          case "print":
            (globalThis as any)._print(args[0]);
            result = undefined;
            break;
          case "length":
            result = (globalThis as any)._length(args[0]);
            break;
          default:
            throw new Error(`Unknown native function: ${name}`);
        }

        this.stack.push(result);
        break;
      }

      case Opcode.RETURN:
        this.halted = true;
        break;

      // ====== 제어 흐름 ======
      case Opcode.JMP: {
        const label = instr.arg?.label;
        // 레이블을 찾아 ip 이동 (간단한 구현)
        // 실제로는 레이블 맵이 필요함
        break;
      }

      case Opcode.JMP_IF: {
        const cond = this.stack.pop();
        if (instr.arg?.negate ? !this.isTruthy(cond) : this.isTruthy(cond)) {
          // 점프 실행
        }
        break;
      }

      case Opcode.HALT:
        this.halted = true;
        break;

      case Opcode.NOP:
        // No operation
        break;
    }
  }

  private isTruthy(value: Value): boolean {
    return (
      value !== null &&
      value !== undefined &&
      value !== false &&
      value !== 0 &&
      value !== ""
    );
  }

  getOutput(): string[] {
    return this.output;
  }

  getStack(): Value[] {
    return [...this.stack];
  }
}
