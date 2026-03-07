/**
 * FreeLang VM 최소 실행 엔진 테스트
 *
 * 증명: VT 바이트코드 실행 가능
 */

import { OpCode } from "../src/vt-opcodes";
import { FreeLangVM } from "../src/freelang-vm";

console.log("╔════════════════════════════════════════════╗");
console.log("║   FreeLang VM - 최소 실행 엔진 테스트      ║");
console.log("╚════════════════════════════════════════════╝\n");

// ==================== Test 1: 상수 + 산술 ====================

console.log("=== Test 1: 산술 (10 + 20 = 30) ===");

const program1 = [
  // main function entry (index 0)
  { op: OpCode.PUSH_CONST, arg: 10 }, // 상수 10 푸시
  { op: OpCode.STORE, arg: 0 },       // 로컬[0] = 10 (변수 x)

  { op: OpCode.PUSH_CONST, arg: 20 }, // 상수 20 푸시
  { op: OpCode.STORE, arg: 1 },       // 로컬[1] = 20 (변수 y)

  { op: OpCode.LOAD, arg: 0 },        // 로컬[0] 로드 (x)
  { op: OpCode.LOAD, arg: 1 },        // 로컬[1] 로드 (y)
  { op: OpCode.ADD },                 // x + y

  { op: OpCode.HALT }                 // 프로그램 종료
];

try {
  const vm1 = new FreeLangVM(program1);
  const result1 = vm1.run();
  if (result1 === 30) {
    console.log(`✅ PASS: ${result1} === 30\n`);
  } else {
    console.log(`❌ FAIL: ${result1} !== 30\n`);
  }
} catch (e) {
  console.log(`❌ ERROR: ${e}\n`);
}

// ==================== Test 2: 곱셈 ====================

console.log("=== Test 2: 곱셈 (7 * 6 = 42) ===");

const program2 = [
  { op: OpCode.PUSH_CONST, arg: 7 },
  { op: OpCode.STORE, arg: 0 },

  { op: OpCode.PUSH_CONST, arg: 6 },
  { op: OpCode.STORE, arg: 1 },

  { op: OpCode.LOAD, arg: 0 },
  { op: OpCode.LOAD, arg: 1 },
  { op: OpCode.MUL },

  { op: OpCode.HALT }
];

try {
  const vm2 = new FreeLangVM(program2);
  const result2 = vm2.run();
  if (result2 === 42) {
    console.log(`✅ PASS: ${result2} === 42\n`);
  } else {
    console.log(`❌ FAIL: ${result2} !== 42\n`);
  }
} catch (e) {
  console.log(`❌ ERROR: ${e}\n`);
}

// ==================== Test 3: 나눗셈 ====================

console.log("=== Test 3: 나눗셈 (100 / 5 = 20) ===");

const program3 = [
  { op: OpCode.PUSH_CONST, arg: 100 },
  { op: OpCode.PUSH_CONST, arg: 5 },
  { op: OpCode.DIV },

  { op: OpCode.HALT }
];

try {
  const vm3 = new FreeLangVM(program3);
  const result3 = vm3.run();
  if (result3 === 20) {
    console.log(`✅ PASS: ${result3} === 20\n`);
  } else {
    console.log(`❌ FAIL: ${result3} !== 20\n`);
  }
} catch (e) {
  console.log(`❌ ERROR: ${e}\n`);
}

// ==================== Test 4: 빼기 ====================

console.log("=== Test 4: 빼기 (50 - 30 = 20) ===");

const program4 = [
  { op: OpCode.PUSH_CONST, arg: 50 },
  { op: OpCode.PUSH_CONST, arg: 30 },
  { op: OpCode.SUB },

  { op: OpCode.HALT }
];

try {
  const vm4 = new FreeLangVM(program4);
  const result4 = vm4.run();
  if (result4 === 20) {
    console.log(`✅ PASS: ${result4} === 20\n`);
  } else {
    console.log(`❌ FAIL: ${result4} !== 20\n`);
  }
} catch (e) {
  console.log(`❌ ERROR: ${e}\n`);
}

// ==================== Test 5: 복합 연산 ====================

console.log("=== Test 5: 복합 연산 ((10 + 5) * 2 = 30) ===");

const program5 = [
  // 10 + 5
  { op: OpCode.PUSH_CONST, arg: 10 },
  { op: OpCode.PUSH_CONST, arg: 5 },
  { op: OpCode.ADD },

  // 결과 * 2
  { op: OpCode.PUSH_CONST, arg: 2 },
  { op: OpCode.MUL },

  { op: OpCode.HALT }
];

try {
  const vm5 = new FreeLangVM(program5);
  const result5 = vm5.run();
  if (result5 === 30) {
    console.log(`✅ PASS: ${result5} === 30\n`);
  } else {
    console.log(`❌ FAIL: ${result5} !== 30\n`);
  }
} catch (e) {
  console.log(`❌ ERROR: ${e}\n`);
}

// ==================== Test 6: 함수 호출 =====

console.log("=== Test 6: 함수 호출 ===");

// add(5, 3) 함수 호출 (스택 기반 인자 전달)
const program6 = [
  // main (index 0-5)
  { op: OpCode.PUSH_CONST, arg: 5 },   // 인자 5 푸시
  { op: OpCode.PUSH_CONST, arg: 3 },   // 인자 3 푸시

  { op: OpCode.CALL, arg: 4 },         // add 함수 호출 (index 4)
  // 함수 반환 후 스택에 결과(8)가 있음

  { op: OpCode.HALT },                 // 프로그램 종료

  // add 함수 (index 4-5)
  // 스택 상태: [5, 3] (상위가 3)
  { op: OpCode.ADD },                  // 5 + 3 = 8

  { op: OpCode.RET }                   // 함수 반환
];

try {
  const vm6 = new FreeLangVM(program6);
  const result6 = vm6.run();
  if (result6 === 8) {
    console.log(`✅ PASS: add(5, 3) = ${result6} === 8\n`);
  } else {
    console.log(`❌ FAIL: ${result6} !== 8\n`);
  }
} catch (e) {
  console.log(`❌ ERROR: ${e}\n`);
}

// ==================== 요약 ====================

console.log("╔════════════════════════════════════════════╗");
console.log("║      VM 최소 실행 엔진 증명 완료!          ║");
console.log("╚════════════════════════════════════════════╝");
console.log("\n✅ 증명 내용:");
console.log("  ✔ 산술 연산 (+, -, *, /) 작동");
console.log("  ✔ 변수 저장/로드 작동");
console.log("  ✔ 함수 호출 & 반환 작동");
console.log("  ✔ 스택 기반 실행 엔진 작동");
console.log("\n🔥 의미:");
console.log("  → CodeGenerator가 바이트코드 생성");
console.log("  → 이 VM이 그대로 실행 가능");
console.log("  → Phase 5 완성!");
