# Phase 10: Advanced Code Generation & VM Extension 📋

**Date**: 2026-03-07
**Status**: 🎯 Planning
**Goal**: Phase 9의 Advanced Parser 출력을 효율적으로 컴파일

---

## 목표

Phase 9에서 파싱한 복잡한 AST를 **실제 바이트코드**로 변환:
- ✅ 배열 & 객체 지원
- ✅ 함수 정의 & 호출
- ✅ 깊은 중첩 구조
- ✅ 스코프 관리

---

## 구현 계획

### 1️⃣ **Advanced Code Generator** (`phase9-codegen.ts`)

#### A. 배열 처리

```typescript
// AST 입력
{
  type: "ArrayLiteral",
  elements: [
    { type: "NumberLiteral", value: 1 },
    { type: "NumberLiteral", value: 2 },
    { type: "NumberLiteral", value: 3 }
  ]
}

// 생성 바이트코드
PUSH_CONST 1          // 요소들을 스택에 쌓기
PUSH_CONST 2
PUSH_CONST 3
ARRAY_CREATE 3        // 3개 요소로 배열 생성
STORE 0               // 변수에 저장
```

#### B. 객체 처리

```typescript
// AST 입력
{
  type: "ObjectLiteral",
  properties: [
    { key: "x", value: { type: "NumberLiteral", value: 1 } },
    { key: "y", value: { type: "NumberLiteral", value: 2 } }
  ]
}

// 생성 바이트코드
PUSH_CONST 1          // 값들을 스택에 쌓기
PUSH_CONST 2
OBJECT_CREATE 2 ["x", "y"]  // 2개 프로퍼티로 객체 생성
STORE 0               // 변수에 저장
```

#### C. 배열 접근

```typescript
// arr[0]
LOAD 0                // arr 로드
PUSH_CONST 0          // 인덱스
ARRAY_GET             // 배열 접근

// obj[key]
LOAD 1                // obj 로드
LOAD 2                // key 로드
OBJECT_GET            // 객체 접근
```

#### D. 함수 정의

```typescript
// defn add(a, b) { return a + b; }
FUNCTION_DEF "add" 2  // 2개 매개변수
  LOAD 0              // a 로드
  LOAD 1              // b 로드
  ADD                 // a + b
  RETURN              // 값 반환
FUNCTION_END
```

#### E. 함수 호출

```typescript
// result = add(3, 5)
PUSH_CONST 3
PUSH_CONST 5
CALL "add" 2          // 2개 인자로 add 호출
STORE 0               // 결과 저장
```

---

### 2️⃣ **VM 확장** (`freelang-vm-extended.ts`)

#### 새로운 Opcodes

```typescript
enum VT_Opcode {
  // 배열
  ARRAY_CREATE = 50,    // 스택의 N개 요소로 배열 생성
  ARRAY_GET = 51,       // 배열[인덱스] 접근
  ARRAY_SET = 52,       // 배열[인덱스] = 값
  ARRAY_PUSH = 53,      // 배열.push(값)
  ARRAY_POP = 54,       // 배열.pop()
  ARRAY_LEN = 55,       // 배열.length

  // 객체
  OBJECT_CREATE = 60,   // 키-값으로 객체 생성
  OBJECT_GET = 61,      // 객체[키] 또는 객체.속성
  OBJECT_SET = 62,      // 객체[키] = 값
  OBJECT_KEYS = 63,     // Object.keys(obj)

  // 함수
  FUNCTION_DEF = 70,    // 함수 정의 시작
  FUNCTION_END = 71,    // 함수 정의 끝
  CALL = 72,            // 함수 호출
  RETURN = 73,          // 함수 반환
  CALL_NATIVE = 74,     // 네이티브 함수 호출

  // 제어
  BREAK = 80,
  CONTINUE = 81,
}
```

#### 런타임 값 타입 확장

```typescript
type Value =
  | number
  | string
  | boolean
  | null
  | Array<Value>           // 배열
  | Record<string, Value>  // 객체
  | Function               // 함수
  | NativeFunction;        // 네이티브 함수

// 함수 객체
interface FunctionValue {
  name: string;
  params: string[];
  body: Instruction[];
  closure: Map<string, Value>;  // 클로저 캡처
}
```

#### 스택 기반 실행

```typescript
class VM {
  private stack: Value[] = [];
  private locals: Map<string, Value> = new Map();
  private functions: Map<string, FunctionValue> = new Map();
  private callStack: Frame[] = [];

  execute(instructions: Instruction[]): Value {
    for (const instr of instructions) {
      switch (instr.op) {
        case VT_Opcode.ARRAY_CREATE: {
          const count = instr.arg as number;
          const elements = this.stack.splice(-count);
          this.stack.push(elements);
          break;
        }
        case VT_Opcode.ARRAY_GET: {
          const index = this.stack.pop() as number;
          const array = this.stack.pop() as Value[];
          this.stack.push(array[index]);
          break;
        }
        case VT_Opcode.OBJECT_CREATE: {
          const keys = instr.arg as string[];
          const values = this.stack.splice(-keys.length);
          const obj: Record<string, Value> = {};
          keys.forEach((k, i) => obj[k] = values[i]);
          this.stack.push(obj);
          break;
        }
        // ... 더 많은 opcode 처리
      }
    }
    return this.stack[0];
  }
}
```

---

### 3️⃣ **스코프 관리**

#### 중첩 스코프 지원

```typescript
// 컴파일러에서 스코프 추적
class CodeGenerator {
  private scopeStack: Map<string, VariableInfo>[] = [];

  private enterScope() {
    this.scopeStack.push(new Map());
  }

  private exitScope() {
    this.scopeStack.pop();
  }

  private declareVariable(name: string, info: VariableInfo) {
    const currentScope = this.scopeStack[this.scopeStack.length - 1];
    currentScope.set(name, info);
  }

  private resolveVariable(name: string): VariableInfo {
    // 가장 안쪽 스코프부터 검색
    for (let i = this.scopeStack.length - 1; i >= 0; i--) {
      if (this.scopeStack[i].has(name)) {
        return this.scopeStack[i].get(name)!;
      }
    }
    throw new Error(`Undefined variable: ${name}`);
  }
}
```

---

## 파일 구조

```
claudescript/src/
├── lexer-advanced.ts         (Phase 9)
├── parser-advanced.ts        (Phase 9)
├── phase9-codegen.ts         (Phase 10) ← 새로 생성
├── freelang-vm-extended.ts   (Phase 10) ← 확장
├── phase9-ast.ts             (Phase 10) ← AST 타입 정의
└── tests/
    └── phase10-e2e.test.ts   (Phase 10) ← 테스트
```

---

## 테스트 케이스 계획

### Test 1: 배열 생성 & 접근
```javascript
let arr = [10, 20, 30];
let x = arr[0];
let y = arr[2];
println(x);  // 10
println(y);  // 30
return arr.length;  // 3
```

### Test 2: 객체 생성 & 접근
```javascript
let person = {
  name: "Alice",
  age: 30,
  active: true
};
println(person.name);    // "Alice"
println(person["age"]);  // 30
return person.active;    // true
```

### Test 3: 함수 정의 & 호출
```javascript
defn multiply(a, b) {
  return a * b;
}

let result = multiply(6, 7);
println(result);  // 42
return result;
```

### Test 4: 중첩된 배열과 객체
```javascript
let matrix = [[1, 2], [3, 4], [5, 6]];
let data = {
  matrix: matrix,
  sum: 21
};
let val = data.matrix[1][0];
println(val);  // 3
return val;
```

### Test 5: 배열 메서드
```javascript
let arr = [1, 2, 3];
arr.push(4);
let popped = arr.pop();  // 4
println(arr.length);     // 3
return popped;
```

### Test 6: 함수를 배열에 저장
```javascript
defn add(a, b) {
  return a + b;
}

let ops = [add];
let result = ops[0](5, 3);
println(result);  // 8
return result;
```

### Test 7: 복잡한 프로그램
```javascript
defn fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

let results = [
  fibonacci(5),
  fibonacci(6),
  fibonacci(7)
];

for (let i in results) {
  println(results[i]);
}

return results[2];  // 13
```

### Test 8: 클로저
```javascript
defn makeCounter() {
  let count = 0;
  return (x) => {
    count = count + x;
    return count;
  };
}

let counter = makeCounter();
println(counter(1));  // 1
println(counter(2));  // 3
println(counter(3));  // 6
return counter(4);    // 10
```

---

## 구현 일정

| 작업 | 예상 시간 | 상태 |
|------|----------|------|
| AST 타입 정의 | 30분 | ⏳ |
| Code Generator 구현 | 2시간 | ⏳ |
| VM 확장 | 1.5시간 | ⏳ |
| 테스트 작성 | 1시간 | ⏳ |
| 문서화 | 30분 | ⏳ |

**총 예상**: ~5시간

---

## 성공 기준

- ✅ 8개 테스트 모두 통과 (100%)
- ✅ 배열, 객체, 함수 완전 지원
- ✅ 중첩된 구조 (깊이 제한 없음)
- ✅ 명확한 에러 메시지
- ✅ 1000줄 이상 프로그램 컴파일 가능

---

## Next Steps

### Phase 11: 타입 시스템
- 타입 추론
- 타입 검사
- 제네릭

### Phase 12: 최적화
- 상수 전파 (Constant Propagation)
- 데드 코드 제거
- 루프 언롤링

---

**시작 예정**: 지금 바로 시작 🚀
