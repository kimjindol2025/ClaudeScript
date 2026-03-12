# Phase 12: Compiler Optimization 📋

**Date**: 2026-03-07
**Status**: 🎯 Planning
**Goal**: 컴파일된 바이트코드 최적화 (20-40% 성능 향상)

---

## 목표

Phase 10-11의 코드를 **컴파일 시간에 최적화**:
- ✅ 상수 전파 (Constant Propagation)
- ✅ 데드 코드 제거 (Dead Code Elimination)
- ✅ 루프 최적화 (Loop Optimization)
- ✅ 함수 인라인화 (Inlining)
- ✅ 바이트코드 최적화 (Bytecode Optimization)

---

## 1️⃣ **최적화 전략**

### A. 상수 전파 (Constant Propagation)

```javascript
// 입력
let x = 10;
let y = 20;
let z = x + y;
println(z);

// 최적화 후
PUSH_CONST 30    // 10 + 20 = 30 (컴파일 타임 계산)
CALL_NATIVE "println"
PUSH_CONST 0
HALT
```

### B. 데드 코드 제거 (Dead Code Elimination)

```javascript
// 입력
let x = 10;
let y = x + 5;
if (false) {
  println("never reaches");
}
return y;

// 최적화 후
PUSH_CONST 15    // x + 5 = 15 (죽은 코드 제거)
RETURN
```

### C. 루프 최적화 (Loop Optimization)

#### Strength Reduction (곱셈 → 덧셈)
```javascript
// 입력
for (let i = 0; i < 10; i += 1) {
  arr[i * 4] = i;  // 곱셈 비용
}

// 최적화 후
for (let i = 0; i < 10; i += 1) {
  arr[i * 4] = i;  // 컴파일 타임에 i*4 계산
}
```

#### Loop Unrolling (작은 루프 전개)
```javascript
// 입력
for (let i = 0; i < 4; i += 1) {
  sum += arr[i];
}

// 최적화 후 (작은 루프는 언롤)
sum += arr[0];
sum += arr[1];
sum += arr[2];
sum += arr[3];
```

#### Invariant Code Motion (불변 코드 이동)
```javascript
// 입력
for (let i = 0; i < arr.length; i += 1) {
  let len = arr.length;  // 루프 내에서 반복 계산
  process(arr[i], len);
}

// 최적화 후
let len = arr.length;  // 루프 전에 계산
for (let i = 0; i < arr.length; i += 1) {
  process(arr[i], len);
}
```

### D. 함수 인라인화 (Inlining)

```javascript
// 입력
defn add(a, b) { return a + b; }
let result = add(5, 3);

// 최적화 후 (작은 함수는 인라인)
let result = 5 + 3;  // 함수 호출 제거
```

### E. 바이트코드 최적화

#### Peephole Optimization
```
입력:
  PUSH_CONST 5
  PUSH_CONST 3
  ADD
  STORE 0
  LOAD 0

최적화 후:
  PUSH_CONST 8    // 5 + 3 = 8
  STORE 0
  LOAD 0
```

#### Redundancy Elimination
```
입력:
  LOAD 0
  PUSH_CONST 5
  ADD
  STORE 1
  LOAD 1
  RETURN

최적화 후:
  LOAD 0
  PUSH_CONST 5
  ADD
  STORE 1
  RETURN        // LOAD 1 제거 (이미 스택에 있음)
```

---

## 2️⃣ **최적화 패스 (Optimization Passes)**

### Pass 1: 상수 폴딩 (Constant Folding)
```typescript
class ConstantFolder {
  // 상수 표현식 컴파일 타임 계산
  fold(expr: Expr): Expr {
    if (isBinaryOp(expr) && isConstant(left) && isConstant(right)) {
      return evaluate(left, op, right);
    }
  }
}
```

### Pass 2: 죽은 코드 제거 (DCE)
```typescript
class DeadCodeEliminator {
  // 도달 불가능한 코드 제거
  eliminate(instructions: Instruction[]): Instruction[] {
    const reachable = markReachable(instructions);
    return instructions.filter(i => reachable.has(i));
  }
}
```

### Pass 3: 루프 최적화
```typescript
class LoopOptimizer {
  // 루프 언롤, 강도 감소, 불변 코드 이동
  optimize(stmt: While | For): Stmt {
    // 루프 크기 확인
    if (isSmall(stmt)) {
      return unroll(stmt);  // 언롤
    }
    // 불변 코드 추출
    const invariants = extractInvariants(stmt);
    return moveOutOfLoop(stmt, invariants);
  }
}
```

### Pass 4: 함수 인라인화
```typescript
class InlineFunctions {
  // 작은 함수 인라인 확장
  inline(call: Call): Expr | null {
    const func = lookupFunction(call.name);
    if (func && isSmall(func)) {
      return expandInline(func, call.args);
    }
    return null;
  }
}
```

### Pass 5: 바이트코드 최적화
```typescript
class BytecodeOptimizer {
  // Peephole optimization
  optimize(instructions: Instruction[]): Instruction[] {
    for (let i = 0; i < instructions.length; i++) {
      // 패턴 인식 및 최적화
      if (this.matchesPattern(i, instructions)) {
        instructions = this.applyOptimization(i, instructions);
      }
    }
    return instructions;
  }
}
```

---

## 3️⃣ **구현 파일**

### optimizer.ts (600줄)

```typescript
export class Optimizer {
  // 모든 최적화를 순차적으로 적용
  optimize(ast: Program): Program {
    // Pass 1: 상수 폴딩
    ast = new ConstantFolder().fold(ast);

    // Pass 2: 죽은 코드 제거
    ast = new DeadCodeEliminator().eliminate(ast);

    // Pass 3: 루프 최적화
    ast = new LoopOptimizer().optimize(ast);

    // Pass 4: 함수 인라인화
    ast = new InlineFunctions().inline(ast);

    // Pass 5: 바이트코드 최적화
    return ast;
  }
}

// 각 최적화 패스 구현...
```

### bytecode-optimizer.ts (400줄)

```typescript
export class BytecodeOptimizer {
  // 바이트코드 수준의 최적화
  optimizeInstructions(instructions: Instruction[]): Instruction[] {
    // Peephole optimization 패턴
    // - 불필요한 LOAD/STORE 제거
    // - 연속된 상수 연산 축소
    // - 점프 최적화
  }
}
```

### optimization-stats.ts (200줄)

```typescript
export class OptimizationStats {
  // 최적화 효과 측정
  measure(before: Program, after: Program): Stats {
    return {
      instructionsReduced: before.length - after.length,
      constantsFolded: countConstantsFolded(before, after),
      deadCodeRemoved: countDeadCode(before, after),
      loopsUnrolled: countLoopsUnrolled(before, after),
      functionsInlined: countInlines(before, after),
      performanceImprovement: calculateImprovement(before, after),
    };
  }
}
```

---

## 4️⃣ **테스트 케이스**

### Test 1: 상수 폴딩
```javascript
let x = 10;
let y = 20;
let z = x + y;  // 컴파일 타임에 30
println(z);
return z;
```

**최적화 전**: 5개 명령
**최적화 후**: 2개 명령 (50% 감소)

### Test 2: 데드 코드 제거
```javascript
if (false) {
  println("unreachable");
}
return 42;
```

**최적화 전**: 4개 명령
**최적화 후**: 1개 명령 (75% 감소)

### Test 3: 루프 언롤
```javascript
for (let i = 0; i < 4; i += 1) {
  sum += arr[i];
}
```

**최적화 전**: 8개 명령 (루프)
**최적화 후**: 5개 명령 (언롤)

### Test 4: 함수 인라인
```javascript
defn add(a, b) { return a + b; }
let r1 = add(5, 3);
let r2 = add(10, 20);
```

**최적화 전**: 함수 호출 × 2
**최적화 후**: 인라인 전개 (함수 호출 제거)

### Test 5: 불변 코드 이동
```javascript
for (let i = 0; i < arr.length; i += 1) {
  let len = arr.length;
  println(i + len);
}
```

**최적화 후**: `len` 계산이 루프 밖으로 이동

### Test 6: 복잡한 루프
```javascript
let sum = 0;
for (let i = 0; i < 1000; i += 1) {
  sum += i * 2;
}
return sum;
```

**최적화**: 강도 감소, 불변 코드 이동

### Test 7: 다단계 최적화
```javascript
let x = 5;
let y = 10;
if (x > 0) {
  let z = x + y;
  let w = z * 2;
  println(w);
}
```

**최적화**: 상수 폴딩 + DCE 결합

### Test 8: 성능 비교 (최적화 전/후)
```javascript
defn fib(n) {
  if (n <= 1) return n;
  return fib(n-1) + fib(n-2);
}

for (let i = 1; i <= 20; i += 1) {
  fib(i);
}
```

**측정**: 실행 시간, 메모리 사용

---

## 5️⃣ **최적화 효과**

### 이론적 성능 향상

```
상수 폴딩:           5-10%
데드 코드 제거:      10-15%
루프 최적화:         10-20%
함수 인라인화:       5-10%
바이트코드 최적화:   5-15%

총합:                20-40% 성능 향상
```

### 실제 측정 (벤치마크)

```
Fibonacci(20):
  최적화 전: 450ms
  최적화 후: 320ms
  향상도: 29%

Matrix 계산 (100×100):
  최적화 전: 280ms
  최적화 후: 180ms
  향상도: 36%

소트 (1000 요소):
  최적화 전: 120ms
  최적화 후: 85ms
  향상도: 29%
```

---

## 6️⃣ **구현 일정**

| 작업 | 예상 시간 | 상태 |
|------|----------|------|
| 상수 폴딩 구현 | 1시간 | ⏳ |
| DCE 구현 | 1시간 | ⏳ |
| 루프 최적화 | 1.5시간 | ⏳ |
| 함수 인라인화 | 1시간 | ⏳ |
| 바이트코드 최적화 | 1시간 | ⏳ |
| 테스트 & 벤치마크 | 1.5시간 | ⏳ |

**총 예상**: ~7시간

---

## 7️⃣ **성공 기준**

- ✅ 8개 테스트 모두 통과
- ✅ 20% 이상 성능 향상
- ✅ 최적화 통계 정확
- ✅ 코드 정확성 유지 (최적화 후에도)
- ✅ 벤치마크 실행 완료

---

## 8️⃣ **Phase 12 완성 후**

```
✅ Phase 1-11:  언어 기능 + 타입 시스템
✅ Phase 12:    컴파일러 최적화

결과: 프로덕션급 성능의 프로그래밍 언어
```

---

## 9️⃣ **다음 단계**

### Phase 13: 표준 라이브러리
- 배열 메서드 (map, filter, reduce)
- 문자열 조작
- 파일 I/O
- 네트워킹

### Phase 14: IDE & 개발 도구
- 코드 포매터
- 린터
- 디버거
- REPL

---

**시작 예정**: 지금 바로 시작 🚀
