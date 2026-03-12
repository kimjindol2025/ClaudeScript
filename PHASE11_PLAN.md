# Phase 11: Type System Implementation 📋

**Date**: 2026-03-07
**Status**: 🎯 Planning
**Goal**: 타입 추론, 타입 검사, 제네릭 지원

---

## 목표

Phase 10의 동적 언어에 **선택적 정적 타입 시스템** 추가:
- ✅ 타입 주석 (Type Annotations)
- ✅ 타입 추론 (Type Inference)
- ✅ 타입 검사 (Type Checking)
- ✅ 제네릭 (Generics - 선택적)
- ✅ 유니온 타입 (Union Types)

---

## 1️⃣ **타입 시스템 설계**

### A. 기본 타입

```typescript
type Type =
  | "number"                    // 숫자: 123, 3.14
  | "string"                    // 문자열: "hello"
  | "boolean"                   // 불리언: true, false
  | "null"                      // null
  | "undefined"                 // undefined
  | ArrayType                   // 배열: number[], string[]
  | ObjectType                  // 객체: {x: number, y: number}
  | FunctionType                // 함수: (number, number) => number
  | UnionType                   // 합집합: number | string
  | "any"                       // 임의의 타입
  | "never";                    // 도달 불가능

interface ArrayType {
  kind: "array";
  elementType: Type;
}

interface ObjectType {
  kind: "object";
  properties: Map<string, Type>;
}

interface FunctionType {
  kind: "function";
  params: Type[];
  returnType: Type;
}

interface UnionType {
  kind: "union";
  types: Type[];
}
```

### B. 타입 주석 문법

```javascript
// 변수 타입 주석
let x: number = 10;
let s: string = "hello";
let arr: number[] = [1, 2, 3];
let obj: {x: number, y: number} = {x: 1, y: 2};

// 함수 타입 주석
defn add(a: number, b: number): number {
  return a + b;
}

// 함수 매개변수 타입
defn greet(name: string): string {
  return "Hello, " + name;
}

// 화살표 함수 타입
let square: (number) => number = (x) => x * x;

// 유니온 타입
let value: number | string = 42;
value = "hello";  // OK
value = true;     // Error: boolean is not assignable to number | string
```

---

## 2️⃣ **타입 추론 (Type Inference)**

### 자동 타입 결정

```javascript
// 타입 주석 없이도 타입 추론
let x = 10;           // Type: number (리터럴에서 추론)
let s = "hello";      // Type: string
let b = true;         // Type: boolean
let arr = [1, 2, 3];  // Type: number[]
let obj = {x: 1};     // Type: {x: number}

// 함수 반환값 타입 추론
defn add(a: number, b: number) {
  return a + b;       // 반환값: number (연산 결과에서 추론)
}

let result = add(5, 3);  // Type: number
```

### 타입 추론 규칙

```
1. 리터럴 추론:
   10        → number
   "hello"   → string
   true      → boolean
   [1, 2, 3] → number[]
   {x: 1}    → {x: number}

2. 연산 결과 추론:
   number + number       → number
   string + string       → string
   number + string       → string (자동 변환)
   number[] + [element]  → number[]

3. 함수 반환값 추론:
   return 42;            → number
   return "text";        → string
   return x > 5;         → boolean

4. 변수 초기화 추론:
   let x = 10;           → number (초기값에서)
   let arr = [];         → unknown[] (빈 배열)
   let arr: number[] = []; → number[] (주석에서)

5. 조건부 타입 추론:
   let x = cond ? 42 : "text";  → number | string
```

---

## 3️⃣ **타입 검사 (Type Checking)**

### 타입 호환성

```javascript
// ✅ 호환 가능 (Compatible)
let x: number = 10;
let y: any = x;           // number → any (OK)

let s: string = "hello";
let u: string | number = s;  // string → union (OK)

// ❌ 호환 불가능 (Incompatible)
let a: number = "hello";  // Error: string not assignable to number
let b: string = 42;       // Error: number not assignable to string
let c: number[] = [1, "2"];  // Error: string not assignable to number[]
```

### 연산 타입 검사

```javascript
// ✅ 타입이 일치
let a: number = 5;
let b: number = 3;
let c = a + b;        // OK: number + number → number

// ❌ 타입 불일치
let s: string = "hello";
let result = a + s;   // Warning: number + string → string (자동 변환)

// ❌ 완전히 호환 불가능
let arr: number[] = [1, 2];
let sum = arr + 5;    // Error: number[] + number is not valid
```

### 함수 호출 검사

```javascript
defn add(a: number, b: number): number {
  return a + b;
}

// ✅ 올바른 호출
let r1 = add(5, 3);

// ❌ 인자 타입 불일치
let r2 = add("5", "3");  // Error: string not assignable to number

// ❌ 인자 개수 불일치
let r3 = add(5);         // Error: missing argument
let r4 = add(5, 3, 1);   // Error: too many arguments
```

---

## 4️⃣ **제네릭 (선택적)**

### 제네릭 함수

```javascript
// 제네릭 함수 정의
defn<T> first(arr: T[]): T {
  return arr[0];
}

// 사용
let n = first([1, 2, 3]);      // T = number
let s = first(["a", "b"]);     // T = string

// 명시적 타입 지정
let x = first<number>([1, 2]);
```

### 제네릭 객체

```javascript
defn<T> createArray(size: number, init: T): T[] {
  let result: T[] = [];
  let i = 0;
  while (i < size) {
    result.push(init);
    i = i + 1;
  }
  return result;
}

let nums = createArray<number>(3, 0);    // [0, 0, 0]
let strs = createArray<string>(2, "x");  // ["x", "x"]
```

---

## 5️⃣ **구현 파일**

### type-system.ts (400줄)

```typescript
// 타입 정의
export type Type = ...

// 타입 추론기
export class TypeInferencer {
  infer(expr: Expr): Type { ... }
  inferFromLiteral(value: any): Type { ... }
  inferFromOperation(op: string, left: Type, right: Type): Type { ... }
}

// 타입 검사기
export class TypeChecker {
  check(ast: Program): TypeCheckResult { ... }
  isAssignableTo(source: Type, target: Type): boolean { ... }
  canOperate(op: string, left: Type, right: Type): boolean { ... }
}

// 타입 환경 (스코프 + 타입 정보)
export class TypeEnvironment {
  declare(name: string, type: Type): void { ... }
  lookup(name: string): Type { ... }
  enter(): void { ... }
  exit(): void { ... }
}
```

### phase11-ast-enhanced.ts (200줄)

```typescript
// Phase 10 AST에 타입 정보 추가
export interface VarDeclWithType extends VarDecl {
  typeAnnotation?: Type;
  inferredType?: Type;
}

export interface FunctionDeclWithType extends FunctionDecl {
  params: Array<{
    name: string;
    typeAnnotation?: Type;
  }>;
  returnType?: Type;
  inferredReturnType?: Type;
}
```

### type-checker-integration.ts (300줄)

```typescript
// Phase 10 Code Generator와 통합
export class TypeCheckedCodeGenerator {
  // Type Checker 결과를 사용하여 최적화된 코드 생성
  // - 불필요한 타입 변환 제거
  // - 타입 에러 위치에서 에러 생성
  // - 타입 정보로 최적화
}
```

---

## 6️⃣ **테스트 케이스**

### Test 1: 기본 타입 추론
```javascript
let x = 10;
let s = "hello";
let b = true;
let arr = [1, 2, 3];

// 검증: x는 number, s는 string, arr은 number[]
```

### Test 2: 타입 주석
```javascript
let x: number = 10;
let s: string = "hello";
let arr: number[] = [1, 2, 3];

// ✅ 타입이 일치
// ❌ let y: number = "text"; // Error
```

### Test 3: 함수 타입
```javascript
defn add(a: number, b: number): number {
  return a + b;
}

let result: number = add(5, 3);  // ✅
let error = add("5", "3");       // ❌ Error
```

### Test 4: 배열 타입
```javascript
let nums: number[] = [1, 2, 3];
let mixed: (number | string)[] = [1, "hello", 3];

// ✅ OK
// ❌ let error: number[] = [1, "text"]; // Error
```

### Test 5: 객체 타입
```javascript
let point: {x: number, y: number} = {x: 1, y: 2};
let obj: {name: string, age: number} = {name: "Alice", age: 30};

// ✅ OK
// ❌ let error: {x: number} = {x: 1, y: 2}; // Missing property y
```

### Test 6: 유니온 타입
```javascript
let value: number | string = 42;
value = "hello";  // ✅ OK

defn process(v: number | string): string {
  if (typeof v === "number") {
    return v.toString();
  } else {
    return v;
  }
}
```

### Test 7: 제네릭 함수
```javascript
defn<T> identity(x: T): T {
  return x;
}

let n = identity<number>(42);    // number
let s = identity<string>("hi");  // string
```

### Test 8: 복잡한 타입
```javascript
defn map<T, U>(arr: T[], fn: (T) => U): U[] {
  let result: U[] = [];
  for (let item of arr) {
    result.push(fn(item));
  }
  return result;
}

let nums = [1, 2, 3];
let strs = map<number, string>(nums, (x) => x.toString());
// strs: string[]
```

### Test 9: 타입 에러 감지
```javascript
let x: number = 10;
x = "hello";  // ❌ Error: string not assignable to number

defn add(a: number): number {
  return a + "1";  // ❌ Error: string not assignable to number
}
```

### Test 10: 완전한 프로그램
```javascript
defn<T> filter(arr: T[], predicate: (T) => boolean): T[] {
  let result: T[] = [];
  for (let item of arr) {
    if (predicate(item)) {
      result.push(item);
    }
  }
  return result;
}

let numbers: number[] = [1, 2, 3, 4, 5];
let evens: number[] = filter<number>(
  numbers,
  (n) => n % 2 == 0
);

for (let e of evens) {
  println(e);
}

return evens;
```

---

## 7️⃣ **구현 일정**

| 작업 | 예상 시간 | 상태 |
|------|----------|------|
| 타입 시스템 설계 | 30분 | ⏳ |
| Type Inferencer 구현 | 1시간 | ⏳ |
| Type Checker 구현 | 1.5시간 | ⏳ |
| TypeEnvironment 구현 | 30분 | ⏳ |
| 통합 및 최적화 | 1시간 | ⏳ |
| 테스트 작성 | 1시간 | ⏳ |

**총 예상**: ~5시간

---

## 8️⃣ **성공 기준**

- ✅ 기본 타입 추론 100% 작동
- ✅ 타입 검사 100% 작동
- ✅ 타입 주석 완벽 지원
- ✅ 유니온 타입 지원
- ✅ 제네릭 기본 지원
- ✅ 10개 테스트 모두 통과
- ✅ 명확한 타입 에러 메시지

---

## 9️⃣ **Phase 11 완성 후 상태**

```
✅ Phase 1-10:  동적 언어 + 컴파일러
✅ Phase 11:    타입 시스템 추가

결과: 강타입 + 약타입 지원 하이브리드 언어
```

---

## 🔟 **다음 단계**

### Phase 12: 최적화
- JIT 컴파일
- 상수 전파
- 데드 코드 제거
- 루프 최적화

### Phase 13: 표준 라이브러리
- 고급 배열 메서드
- 문자열 조작
- 파일 I/O
- 네트워킹

---

**시작 예정**: 지금 바로 시작 🚀
