/**
 * VT (Virtual Turing) Opcode 정의
 * 최소 실행 엔진을 위한 명령어 집합
 */

export enum OpCode {
  PUSH_CONST = 0,  // stack.push(const)
  LOAD = 1,        // stack.push(locals[idx])
  STORE = 2,       // locals[idx] = stack.pop()
  ADD = 3,
  SUB = 4,
  MUL = 5,
  DIV = 6,
  CALL = 7,        // 함수 호출
  RET = 8,         // 함수 반환
  HALT = 9         // 프로그램 종료
}
