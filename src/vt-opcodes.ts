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
  JMP = 7,         // 무조건 점프
  JZ = 8,          // 0이면 점프
  JNZ = 9,         // 0이 아니면 점프
  EQ = 10,         // 같으면 1, 아니면 0
  LT = 11,         // <
  GT = 12,         // >
  CALL = 13,       // 함수 호출
  CALL_NATIVE = 14, // 네이티브 함수 호출 (stdlib 바인딩)
  RET = 15,        // 함수 반환
  HALT = 16        // 프로그램 종료
}
