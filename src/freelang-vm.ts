/**
 * FreeLang VM - 최소 실행 엔진
 * 산술 + 변수 + 함수 호출 + StdLib 바인딩 지원
 */

import { OpCode } from "./vt-opcodes";
import { Instruction } from "./vt-instruction";

interface Frame {
  returnAddress: number;
  locals: number[];
}

type NativeFn = (args: number[]) => number | void;

export class FreeLangVM {
  private stack: number[] = [];
  private frames: Frame[] = [];
  private ip = 0;
  private natives = new Map<number, NativeFn>();

  constructor(private program: Instruction[]) {
    this.registerStdlib();
  }

  /**
   * 프로그램 실행
   */
  run(): number {
    // 전역 프레임 초기화 (충분한 로컬 변수 슬롯 할당)
    this.frames.push({ returnAddress: -1, locals: new Array(256).fill(0) });

    while (true) {
      const instr = this.program[this.ip];

      if (!instr) {
        throw new Error(`Invalid instruction pointer: ${this.ip}`);
      }

      switch (instr.op) {
        case OpCode.PUSH_CONST:
          this.stack.push(instr.arg!);
          break;

        case OpCode.LOAD:
          this.stack.push(this.currentFrame().locals[instr.arg!]);
          break;

        case OpCode.STORE:
          this.currentFrame().locals[instr.arg!] = this.stack.pop()!;
          break;

        case OpCode.ADD: {
          const b = this.stack.pop()!;
          const a = this.stack.pop()!;
          this.stack.push(a + b);
          break;
        }

        case OpCode.SUB: {
          const b = this.stack.pop()!;
          const a = this.stack.pop()!;
          this.stack.push(a - b);
          break;
        }

        case OpCode.MUL: {
          const b = this.stack.pop()!;
          const a = this.stack.pop()!;
          this.stack.push(a * b);
          break;
        }

        case OpCode.DIV: {
          const b = this.stack.pop()!;
          const a = this.stack.pop()!;
          if (b === 0) {
            throw new Error("Division by zero");
          }
          this.stack.push(Math.floor(a / b));
          break;
        }

        case OpCode.EQ: {
          const b = this.stack.pop()!;
          const a = this.stack.pop()!;
          this.stack.push(a === b ? 1 : 0);
          break;
        }

        case OpCode.LT: {
          const b = this.stack.pop()!;
          const a = this.stack.pop()!;
          this.stack.push(a < b ? 1 : 0);
          break;
        }

        case OpCode.GT: {
          const b = this.stack.pop()!;
          const a = this.stack.pop()!;
          this.stack.push(a > b ? 1 : 0);
          break;
        }

        case OpCode.JMP:
          // 무조건 점프
          this.ip = instr.arg!;
          continue;

        case OpCode.JZ: {
          // 0이면 점프
          const value = this.stack.pop()!;
          if (value === 0) {
            this.ip = instr.arg!;
            continue;
          }
          break;
        }

        case OpCode.JNZ: {
          // 0이 아니면 점프
          const value = this.stack.pop()!;
          if (value !== 0) {
            this.ip = instr.arg!;
            continue;
          }
          break;
        }

        case OpCode.CALL: {
          const frame: Frame = {
            returnAddress: this.ip,
            locals: new Array(256).fill(0)
          };
          this.frames.push(frame);
          this.ip = instr.arg!;
          continue;
        }

        case OpCode.CALL_NATIVE: {
          const fnId = instr.arg!;
          const argc = this.stack.pop()!;
          const args: number[] = [];

          for (let i = 0; i < argc; i++) {
            args.unshift(this.stack.pop()!);
          }

          const result = this.natives.get(fnId)!(args);

          if (typeof result === "number") {
            this.stack.push(result);
          } else {
            // undefined 반환값이면 0을 push
            this.stack.push(0);
          }

          break;
        }

        case OpCode.RET: {
          const returnValue = this.stack.pop()!;
          const frame = this.frames.pop()!;
          this.ip = frame.returnAddress;
          this.stack.push(returnValue);
          break;
        }

        case OpCode.HALT:
          return this.stack.pop()!;

        default:
          throw new Error(`Unknown opcode: ${instr.op}`);
      }

      this.ip++;
    }
  }

  /**
   * StdLib 함수 등록
   */
  private registerStdlib() {
    // ID 0 → println (값 출력 + 개행)
    this.natives.set(0, (args) => {
      console.log(args[0]);
      return 0;
    });

    // ID 1 → print (값 출력, 개행 없음)
    this.natives.set(1, (args) => {
      process.stdout.write(String(args[0]));
      return 0;
    });

    // ID 2 → length (배열 길이, 향후 배열 타입 도입 시 확장)
    this.natives.set(2, (args) => {
      // 임시: 단순히 첫 인자 반환
      return args.length;
    });
  }

  /**
   * 현재 실행 프레임
   */
  private currentFrame(): Frame {
    return this.frames[this.frames.length - 1];
  }

  /**
   * 디버그: 스택 상태 출력
   */
  debug(): string {
    return `Stack: [${this.stack.join(", ")}], IP: ${this.ip}`;
  }
}
