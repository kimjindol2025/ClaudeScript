/**
 * VT 명령 구조
 */

import { OpCode } from "./vt-opcodes";

export interface Instruction {
  op: OpCode;
  arg?: number;
}
