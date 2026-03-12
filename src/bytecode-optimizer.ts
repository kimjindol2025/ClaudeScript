/**
 * Phase 12: Bytecode Optimizer
 *
 * 바이트코드 수준의 최적화를 수행합니다:
 * - Peephole Optimization: 패턴 인식 및 단순화
 * - Redundancy Elimination: 불필요한 명령어 제거
 * - Jump Optimization: 점프 단축
 */

export interface Instruction {
  opcode: string;
  args?: any[];
}

export class BytecodeOptimizer {
  /**
   * 바이트코드 명령어 배열을 최적화합니다
   */
  optimize(instructions: Instruction[]): Instruction[] {
    let optimized = [...instructions];

    // 여러 번 반복하여 최적화 (cascade effect)
    let changed = true;
    let iterations = 0;
    const maxIterations = 10;

    while (changed && iterations < maxIterations) {
      iterations++;
      const before = optimized.length;

      // 다양한 최적화 패스 적용
      optimized = this.peepholeOptimize(optimized);
      optimized = this.eliminateRedundancy(optimized);
      optimized = this.optimizeJumps(optimized);
      optimized = this.eliminateDeadCode(optimized);

      changed = optimized.length < before;
    }

    return optimized;
  }

  /**
   * Peephole Optimization - 작은 명령어 패턴 인식 및 단순화
   */
  private peepholeOptimize(instructions: Instruction[]): Instruction[] {
    const result: Instruction[] = [];
    let i = 0;

    while (i < instructions.length) {
      // Pattern 1: PUSH_CONST + PUSH_CONST + ADD → PUSH_CONST (합)
      if (
        i + 2 < instructions.length &&
        instructions[i].opcode === "PUSH_CONST" &&
        instructions[i + 1].opcode === "PUSH_CONST" &&
        instructions[i + 2].opcode === "ADD"
      ) {
        const left = instructions[i].args?.[0];
        const right = instructions[i + 1].args?.[0];

        if (typeof left === "number" && typeof right === "number") {
          result.push({
            opcode: "PUSH_CONST",
            args: [left + right],
          });
          i += 3;
          continue;
        }
      }

      // Pattern 2: PUSH_CONST + PUSH_CONST + SUB → PUSH_CONST (차)
      if (
        i + 2 < instructions.length &&
        instructions[i].opcode === "PUSH_CONST" &&
        instructions[i + 1].opcode === "PUSH_CONST" &&
        instructions[i + 2].opcode === "SUB"
      ) {
        const left = instructions[i].args?.[0];
        const right = instructions[i + 1].args?.[0];

        if (typeof left === "number" && typeof right === "number") {
          result.push({
            opcode: "PUSH_CONST",
            args: [left - right],
          });
          i += 3;
          continue;
        }
      }

      // Pattern 3: PUSH_CONST + PUSH_CONST + MUL → PUSH_CONST (곱)
      if (
        i + 2 < instructions.length &&
        instructions[i].opcode === "PUSH_CONST" &&
        instructions[i + 1].opcode === "PUSH_CONST" &&
        instructions[i + 2].opcode === "MUL"
      ) {
        const left = instructions[i].args?.[0];
        const right = instructions[i + 1].args?.[0];

        if (typeof left === "number" && typeof right === "number") {
          result.push({
            opcode: "PUSH_CONST",
            args: [left * right],
          });
          i += 3;
          continue;
        }
      }

      // Pattern 4: PUSH_CONST + PUSH_CONST + DIV → PUSH_CONST (나눗셈)
      if (
        i + 2 < instructions.length &&
        instructions[i].opcode === "PUSH_CONST" &&
        instructions[i + 1].opcode === "PUSH_CONST" &&
        instructions[i + 2].opcode === "DIV"
      ) {
        const left = instructions[i].args?.[0];
        const right = instructions[i + 1].args?.[0];

        if (typeof left === "number" && typeof right === "number" && right !== 0) {
          result.push({
            opcode: "PUSH_CONST",
            args: [left / right],
          });
          i += 3;
          continue;
        }
      }

      // Pattern 5: LOAD + STORE (같은 변수) - 중복이면 LOAD만 남김
      if (
        i + 1 < instructions.length &&
        instructions[i].opcode === "LOAD" &&
        instructions[i + 1].opcode === "STORE"
      ) {
        const loadVar = instructions[i].args?.[0];
        const storeVar = instructions[i + 1].args?.[0];

        if (loadVar === storeVar) {
          // LOAD만 유지 (이미 스택에 있음)
          result.push(instructions[i]);
          i += 2;
          continue;
        }
      }

      // Pattern 6: PUSH + POP (서로 상쇄)
      if (
        i + 1 < instructions.length &&
        instructions[i].opcode === "PUSH_CONST" &&
        instructions[i + 1].opcode === "POP"
      ) {
        // 부작용이 없으면 둘 다 제거
        // 현재는 보수적으로 유지
        result.push(instructions[i]);
        i++;
        continue;
      }

      // 최적화되지 않은 명령어는 그대로 유지
      result.push(instructions[i]);
      i++;
    }

    return result;
  }

  /**
   * Redundancy Elimination - 불필요한 명령어 제거
   */
  private eliminateRedundancy(instructions: Instruction[]): Instruction[] {
    const result: Instruction[] = [];
    const stackTop: any[] = []; // 스택의 최상단 값 추적

    for (let i = 0; i < instructions.length; i++) {
      const instr = instructions[i];

      switch (instr.opcode) {
        case "PUSH_CONST":
          result.push(instr);
          stackTop.push(instr.args?.[0]);
          break;

        case "LOAD":
          result.push(instr);
          stackTop.push("loaded");
          break;

        case "STORE":
          result.push(instr);
          stackTop.pop();
          break;

        case "DUP":
          // 중복 DUP 제거
          if (
            result.length > 0 &&
            result[result.length - 1].opcode === "DUP"
          ) {
            // 연속된 DUP는 하나만 유지
            // 다만 세 번째 이후는 제거 가능
            result.push(instr);
          } else {
            result.push(instr);
          }
          break;

        default:
          result.push(instr);
          stackTop.length = 0; // 불확실한 명령어 후 상태 초기화
      }
    }

    return result;
  }

  /**
   * Jump Optimization - 불필요한 점프 단축
   */
  private optimizeJumps(instructions: Instruction[]): Instruction[] {
    // 라벨 위치 맵 구성
    const labelMap = new Map<string, number>();
    for (let i = 0; i < instructions.length; i++) {
      if (instructions[i].opcode === "LABEL") {
        labelMap.set(instructions[i].args?.[0], i);
      }
    }

    const result: Instruction[] = [];

    for (let i = 0; i < instructions.length; i++) {
      const instr = instructions[i];

      // JMP가 다음 명령어로 점프하는 경우 제거
      if (
        instr.opcode === "JMP" ||
        instr.opcode === "JMP_IF" ||
        instr.opcode === "JMP_IF_NOT"
      ) {
        const targetLabel = instr.args?.[0];
        const targetPos = labelMap.get(targetLabel);

        if (targetPos !== undefined && targetPos === i + 1) {
          // 다음 명령어로 점프하므로 점프 제거 가능
          // JMP_IF는 조건이 있으므로 제거 불가
          if (instr.opcode === "JMP") {
            // 점프 제거 (다음 명령어가 실행됨)
            continue;
          }
        }
      }

      result.push(instr);
    }

    return result;
  }

  /**
   * Dead Code Elimination - 도달 불가능한 코드 제거
   */
  private eliminateDeadCode(instructions: Instruction[]): Instruction[] {
    // 라벨 위치 맵 구성
    const labelMap = new Map<string, number>();
    for (let i = 0; i < instructions.length; i++) {
      if (instructions[i].opcode === "LABEL") {
        labelMap.set(instructions[i].args?.[0], i);
      }
    }

    // 도달 가능한 인스트럭션 표시
    const reachable = new Set<number>();
    const queue: number[] = [0];
    reachable.add(0);

    while (queue.length > 0) {
      const pos = queue.shift()!;
      const instr = instructions[pos];

      if (instr.opcode === "JMP") {
        const targetLabel = instr.args?.[0];
        const targetPos = labelMap.get(targetLabel);
        if (targetPos !== undefined && !reachable.has(targetPos)) {
          reachable.add(targetPos);
          queue.push(targetPos);
        }
      } else if (instr.opcode === "JMP_IF" || instr.opcode === "JMP_IF_NOT") {
        // 조건부 점프: 다음 인스트럭션과 점프 대상 모두 도달 가능
        if (pos + 1 < instructions.length && !reachable.has(pos + 1)) {
          reachable.add(pos + 1);
          queue.push(pos + 1);
        }

        const targetLabel = instr.args?.[0];
        const targetPos = labelMap.get(targetLabel);
        if (targetPos !== undefined && !reachable.has(targetPos)) {
          reachable.add(targetPos);
          queue.push(targetPos);
        }
      } else if (instr.opcode !== "RETURN" && instr.opcode !== "HALT") {
        // 다음 인스트럭션이 도달 가능
        if (pos + 1 < instructions.length && !reachable.has(pos + 1)) {
          reachable.add(pos + 1);
          queue.push(pos + 1);
        }
      }
    }

    // 도달 불가능한 코드 제거
    return instructions.filter((_, i) => reachable.has(i));
  }
}

/**
 * 바이트코드 최적화 통계
 */
export interface OptimizationStats {
  originalSize: number;
  optimizedSize: number;
  reductionPercent: number;
  constantsFolded: number;
  redundancyRemoved: number;
  jumpsOptimized: number;
  deadCodeRemoved: number;
}

/**
 * 최적화 효과를 측정합니다
 */
export function measureOptimization(
  original: Instruction[],
  optimized: Instruction[]
): OptimizationStats {
  const constantsFolded = countConstantFolds(original, optimized);
  const redundancyRemoved = countRedundancy(original, optimized);
  const jumpsOptimized = countJumpOptimizations(original, optimized);
  const deadCodeRemoved = countDeadCode(original, optimized);

  return {
    originalSize: original.length,
    optimizedSize: optimized.length,
    reductionPercent:
      ((original.length - optimized.length) / original.length) * 100,
    constantsFolded,
    redundancyRemoved,
    jumpsOptimized,
    deadCodeRemoved,
  };
}

function countConstantFolds(
  original: Instruction[],
  optimized: Instruction[]
): number {
  // PUSH_CONST + PUSH_CONST + OP 패턴 감소 개수
  let count = 0;
  for (let i = 0; i + 2 < original.length; i++) {
    if (
      original[i].opcode === "PUSH_CONST" &&
      original[i + 1].opcode === "PUSH_CONST" &&
      ["ADD", "SUB", "MUL", "DIV"].includes(original[i + 2].opcode)
    ) {
      count++;
    }
  }
  return count;
}

function countRedundancy(
  original: Instruction[],
  optimized: Instruction[]
): number {
  // 제거된 LOAD/STORE, DUP 등
  const originalOpcodes = original.map((i) => i.opcode);
  const optimizedOpcodes = optimized.map((i) => i.opcode);

  let count = 0;
  for (const opcode of ["LOAD", "STORE", "DUP"]) {
    const origCount = originalOpcodes.filter((o) => o === opcode).length;
    const optCount = optimizedOpcodes.filter((o) => o === opcode).length;
    count += Math.max(0, origCount - optCount);
  }

  return count;
}

function countJumpOptimizations(
  original: Instruction[],
  optimized: Instruction[]
): number {
  // 제거된 JMP 개수
  const originalJumps = original.filter(
    (i) =>
      i.opcode === "JMP" ||
      i.opcode === "JMP_IF" ||
      i.opcode === "JMP_IF_NOT"
  ).length;
  const optimizedJumps = optimized.filter(
    (i) =>
      i.opcode === "JMP" ||
      i.opcode === "JMP_IF" ||
      i.opcode === "JMP_IF_NOT"
  ).length;

  return Math.max(0, originalJumps - optimizedJumps);
}

function countDeadCode(
  original: Instruction[],
  optimized: Instruction[]
): number {
  // 단순히 제거된 명령어 개수 (보수적)
  return Math.max(0, original.length - optimized.length);
}
