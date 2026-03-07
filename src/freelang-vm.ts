/**
 * FreeLang VM - 최소 실행 엔진
 * 산술 + 변수 + 함수 호출 지원
 */

import { OpCode } from "./vt-opcodes";
import { Instruction } from "./vt-instruction";

interface Frame {
  returnAddress: number;
  locals: number[];
}

export class FreeLangVM {
  private stack: number[] = [];
  private frames: Frame[] = [];
  private ip = 0;

  constructor(private program: Instruction[]) {}

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

        case OpCode.CALL: {
          const frame: Frame = {
            returnAddress: this.ip,
            locals: new Array(256).fill(0)
          };
          this.frames.push(frame);
          this.ip = instr.arg!;
          continue;
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
