# Phase 13: Standard Library 📚

**Date**: 2026-03-07
**Status**: 🎯 Planning
**Goal**: 핵심 표준 라이브러리 제공 (배열, 문자열, 수학, 파일 I/O, 기본 네트워킹)

---

## 목표

Phase 12의 최적화된 컴파일러를 실용적으로 사용할 수 있게 표준 라이브러리 추가:
- ✅ 배열 메서드 (map, filter, reduce, forEach, find, some, every)
- ✅ 문자열 조작 (length, charAt, substring, indexOf, split, trim, toUpperCase)
- ✅ 수학 함수 (Math.sqrt, Math.pow, Math.abs, Math.floor, Math.ceil, Math.round, Math.min, Math.max)
- ✅ 파일 I/O (readFile, writeFile, appendFile)
- ✅ 기본 네트워킹 (fetch, http GET/POST)
- ✅ 유틸리티 (Object.keys, Object.values, JSON.stringify, JSON.parse)

---

## 1️⃣ **배열 메서드 (Array Methods)**

### A. 고차 함수 메서드

#### map(arr, fn) - 변환
```javascript
let nums = [1, 2, 3];
let doubled = map(nums, (x) => x * 2);
// doubled = [2, 4, 6]
```

**구현**:
```javascript
defn map(arr, fn) {
  let result = [];
  for (let item of arr) {
    result.push(fn(item));
  }
  return result;
}
```

#### filter(arr, predicate) - 필터링
```javascript
let nums = [1, 2, 3, 4, 5];
let evens = filter(nums, (x) => x % 2 == 0);
// evens = [2, 4]
```

**구현**:
```javascript
defn filter(arr, predicate) {
  let result = [];
  for (let item of arr) {
    if (predicate(item)) {
      result.push(item);
    }
  }
  return result;
}
```

#### reduce(arr, fn, initial) - 축약
```javascript
let nums = [1, 2, 3, 4];
let sum = reduce(nums, (acc, x) => acc + x, 0);
// sum = 10
```

**구현**:
```javascript
defn reduce(arr, fn, initial) {
  let acc = initial;
  for (let item of arr) {
    acc = fn(acc, item);
  }
  return acc;
}
```

#### forEach(arr, fn) - 순회
```javascript
forEach([1, 2, 3], (x) => println(x));
// 출력: 1, 2, 3
```

**구현**:
```javascript
defn forEach(arr, fn) {
  for (let item of arr) {
    fn(item);
  }
}
```

### B. 탐색 메서드

#### find(arr, predicate) - 첫 항목 찾기
```javascript
let nums = [1, 2, 3, 4];
let first_even = find(nums, (x) => x % 2 == 0);
// first_even = 2
```

#### indexOf(arr, value) - 인덱스 찾기
```javascript
let nums = [10, 20, 30];
let idx = indexOf(nums, 20);
// idx = 1
```

#### includes(arr, value) - 포함 확인
```javascript
let nums = [1, 2, 3];
let has_two = includes(nums, 2);
// has_two = true
```

### C. 집계 메서드

#### some(arr, predicate) - 조건 만족 여부
```javascript
let nums = [1, 2, 3];
let has_even = some(nums, (x) => x % 2 == 0);
// has_even = true
```

#### every(arr, predicate) - 모두 조건 만족
```javascript
let nums = [2, 4, 6];
let all_even = every(nums, (x) => x % 2 == 0);
// all_even = true
```

#### length(arr) - 길이
```javascript
let nums = [1, 2, 3];
let len = length(nums);
// len = 3
```

---

## 2️⃣ **문자열 조작 (String Methods)**

### A. 기본 메서드

#### length(str) - 길이
```javascript
let s = "hello";
let len = length(s);
// len = 5
```

#### charAt(str, index) - 문자 접근
```javascript
let s = "hello";
let c = charAt(s, 1);
// c = "e"
```

#### substring(str, start, end) - 부분 문자열
```javascript
let s = "hello";
let sub = substring(s, 1, 4);
// sub = "ell"
```

#### indexOf(str, search) - 인덱스 찾기
```javascript
let s = "hello";
let idx = indexOf(s, "ll");
// idx = 2
```

### B. 변환 메서드

#### toUpperCase(str) - 대문자
```javascript
let s = "hello";
let upper = toUpperCase(s);
// upper = "HELLO"
```

#### toLowerCase(str) - 소문자
```javascript
let s = "HELLO";
let lower = toLowerCase(s);
// lower = "hello"
```

#### trim(str) - 공백 제거
```javascript
let s = "  hello  ";
let trimmed = trim(s);
// trimmed = "hello"
```

#### split(str, delimiter) - 분할
```javascript
let s = "a,b,c";
let parts = split(s, ",");
// parts = ["a", "b", "c"]
```

#### join(arr, separator) - 연결
```javascript
let arr = ["a", "b", "c"];
let s = join(arr, ",");
// s = "a,b,c"
```

### C. 검색 메서드

#### startsWith(str, prefix) - 시작 확인
```javascript
let s = "hello";
let starts = startsWith(s, "he");
// starts = true
```

#### endsWith(str, suffix) - 종료 확인
```javascript
let s = "hello";
let ends = endsWith(s, "lo");
// ends = true
```

#### includes(str, search) - 포함 확인
```javascript
let s = "hello";
let has = includes(s, "ll");
// has = true
```

---

## 3️⃣ **수학 함수 (Math Module)**

### A. 기본 함수

#### Math.abs(x) - 절댓값
```javascript
Math.abs(-5);      // 5
Math.abs(3.14);    // 3.14
```

#### Math.sqrt(x) - 제곱근
```javascript
Math.sqrt(4);      // 2
Math.sqrt(2);      // 1.414...
```

#### Math.pow(x, y) - 거듭제곱
```javascript
Math.pow(2, 3);    // 8
Math.pow(5, 2);    // 25
```

#### Math.floor(x) - 내림
```javascript
Math.floor(3.7);   // 3
Math.floor(-2.3);  // -3
```

#### Math.ceil(x) - 올림
```javascript
Math.ceil(3.2);    // 4
Math.ceil(-2.8);   // -2
```

#### Math.round(x) - 반올림
```javascript
Math.round(3.5);   // 4
Math.round(3.4);   // 3
```

### B. 비교 함수

#### Math.min(a, b, ...) - 최솟값
```javascript
Math.min(3, 1, 4);    // 1
Math.min(-5, -2);     // -5
```

#### Math.max(a, b, ...) - 최댓값
```javascript
Math.max(3, 1, 4);    // 4
Math.max(-5, -2);     // -2
```

### C. 삼각 함수

#### Math.sin(x) - 사인
#### Math.cos(x) - 코사인
#### Math.tan(x) - 탄젠트

### D. 상수

```javascript
Math.PI;      // 3.14159...
Math.E;       // 2.71828...
```

---

## 4️⃣ **파일 I/O**

### readFile(path) - 파일 읽기
```javascript
let content = readFile("input.txt");
// content = 파일 내용 (문자열)
```

**구현**:
```javascript
// Node.js fs 모듈 래퍼
defn readFile(path) {
  // fs.readFileSync(path, 'utf8') 호출
}
```

### writeFile(path, content) - 파일 쓰기
```javascript
writeFile("output.txt", "Hello, World!");
// output.txt 파일 생성/덮어쓰기
```

**구현**:
```javascript
defn writeFile(path, content) {
  // fs.writeFileSync(path, content, 'utf8') 호출
}
```

### appendFile(path, content) - 파일 추가
```javascript
appendFile("log.txt", "New log line\n");
// log.txt에 내용 추가
```

**구현**:
```javascript
defn appendFile(path, content) {
  // fs.appendFileSync(path, content, 'utf8') 호출
}
```

### fileExists(path) - 파일 존재 확인
```javascript
if (fileExists("config.json")) {
  let config = readFile("config.json");
}
```

---

## 5️⃣ **기본 네트워킹**

### fetch(url, options) - HTTP 요청
```javascript
let response = fetch("https://api.example.com/users", {
  method: "GET",
  headers: {
    "Content-Type": "application/json"
  }
});

let data = JSON.parse(response.body);
```

**구현**:
```javascript
defn fetch(url, options) {
  // node-fetch 또는 axios 래퍼
  // {
  //   status: number,
  //   body: string,
  //   headers: object
  // }
}
```

### http.get(url, callback) - GET 요청
```javascript
http.get("https://api.example.com/data", (response) => {
  println("Status: " + response.status);
  println("Body: " + response.body);
});
```

### http.post(url, data, callback) - POST 요청
```javascript
http.post("https://api.example.com/users", {
  name: "John",
  age: 30
}, (response) => {
  println(response.body);
});
```

---

## 6️⃣ **유틸리티 함수**

### Object.keys(obj) - 객체 키 추출
```javascript
let obj = {x: 1, y: 2, z: 3};
let keys = Object.keys(obj);
// keys = ["x", "y", "z"]
```

### Object.values(obj) - 객체 값 추출
```javascript
let obj = {x: 1, y: 2, z: 3};
let values = Object.values(obj);
// values = [1, 2, 3]
```

### JSON.stringify(obj) - JSON 문자열화
```javascript
let obj = {name: "John", age: 30};
let json = JSON.stringify(obj);
// json = '{"name":"John","age":30}'
```

### JSON.parse(jsonStr) - JSON 파싱
```javascript
let jsonStr = '{"name":"John","age":30}';
let obj = JSON.parse(jsonStr);
// obj = {name: "John", age: 30}
```

### typeof(value) - 타입 확인
```javascript
typeof(42);        // "number"
typeof("hello");   // "string"
typeof(true);      // "boolean"
typeof([]);        // "array"
typeof({});        // "object"
```

---

## 7️⃣ **구현 파일**

### stdlib-arrays.ts (400줄)
```typescript
// 배열 메서드 구현
export class ArrayMethods {
  static map(arr: any[], fn: Function): any[] { ... }
  static filter(arr: any[], predicate: Function): any[] { ... }
  static reduce(arr: any[], fn: Function, initial: any): any { ... }
  static forEach(arr: any[], fn: Function): void { ... }
  static find(arr: any[], predicate: Function): any { ... }
  static some(arr: any[], predicate: Function): boolean { ... }
  static every(arr: any[], predicate: Function): boolean { ... }
  static indexOf(arr: any[], value: any): number { ... }
}
```

### stdlib-strings.ts (350줄)
```typescript
// 문자열 메서드 구현
export class StringMethods {
  static length(str: string): number { ... }
  static charAt(str: string, index: number): string { ... }
  static substring(str: string, start: number, end: number): string { ... }
  static indexOf(str: string, search: string): number { ... }
  static toUpperCase(str: string): string { ... }
  static toLowerCase(str: string): string { ... }
  static split(str: string, delimiter: string): string[] { ... }
  static trim(str: string): string { ... }
}
```

### stdlib-math.ts (300줄)
```typescript
// Math 모듈
export class StdlibMath {
  static abs(x: number): number { ... }
  static sqrt(x: number): number { ... }
  static pow(x: number, y: number): number { ... }
  static floor(x: number): number { ... }
  static ceil(x: number): number { ... }
  static round(x: number): number { ... }
  static min(...args: number[]): number { ... }
  static max(...args: number[]): number { ... }

  static readonly PI = Math.PI;
  static readonly E = Math.E;
}
```

### stdlib-io.ts (250줄)
```typescript
// 파일 I/O
export class FileIO {
  static readFile(path: string): string { ... }
  static writeFile(path: string, content: string): void { ... }
  static appendFile(path: string, content: string): void { ... }
  static fileExists(path: string): boolean { ... }
  static deleteFile(path: string): void { ... }
}
```

### stdlib-net.ts (300줄)
```typescript
// 네트워킹
export class NetworkAPI {
  static fetch(url: string, options?: any): any { ... }
  static readonly http = {
    get: (url: string, callback: Function) => { ... },
    post: (url: string, data: any, callback: Function) => { ... }
  };
}
```

### stdlib-utils.ts (200줄)
```typescript
// 유틸리티
export class StdlibUtils {
  static objectKeys(obj: any): string[] { ... }
  static objectValues(obj: any): any[] { ... }
  static jsonStringify(obj: any): string { ... }
  static jsonParse(jsonStr: string): any { ... }
  static typeOf(value: any): string { ... }
}
```

### stdlib-bindings.ts (350줄)
```typescript
// Phase 10 VM과 연결
export class StdlibBindings {
  bindArrayMethods(vm: AdvancedVM): void { ... }
  bindStringMethods(vm: AdvancedVM): void { ... }
  bindMathModule(vm: AdvancedVM): void { ... }
  bindFileIO(vm: AdvancedVM): void { ... }
  bindNetworkAPI(vm: AdvancedVM): void { ... }
  bindUtilityFunctions(vm: AdvancedVM): void { ... }

  bindAll(vm: AdvancedVM): void {
    this.bindArrayMethods(vm);
    this.bindStringMethods(vm);
    this.bindMathModule(vm);
    this.bindFileIO(vm);
    this.bindNetworkAPI(vm);
    this.bindUtilityFunctions(vm);
  }
}
```

---

## 8️⃣ **테스트 케이스**

### Test 1: 배열 map
```javascript
let nums = [1, 2, 3];
let doubled = map(nums, (x) => x * 2);
return doubled;  // [2, 4, 6]
```

### Test 2: 배열 filter
```javascript
let nums = [1, 2, 3, 4, 5];
let evens = filter(nums, (x) => x % 2 == 0);
return evens;  // [2, 4]
```

### Test 3: 배열 reduce
```javascript
let nums = [1, 2, 3, 4];
let sum = reduce(nums, (a, x) => a + x, 0);
return sum;  // 10
```

### Test 4: 문자열 split & join
```javascript
let s = "a,b,c";
let parts = split(s, ",");
let joined = join(parts, "-");
return joined;  // "a-b-c"
```

### Test 5: 문자열 uppercase/lowercase
```javascript
let s = "Hello World";
let upper = toUpperCase(s);
let lower = toLowerCase(s);
return lower;  // "hello world"
```

### Test 6: Math 함수
```javascript
let a = Math.sqrt(16);     // 4
let b = Math.pow(2, 3);    // 8
let c = Math.abs(-5);      // 5
let min = Math.min(1, 2, 3);  // 1
return min;
```

### Test 7: 파일 I/O
```javascript
writeFile("test.txt", "Hello");
let content = readFile("test.txt");
return content;  // "Hello"
```

### Test 8: JSON 변환
```javascript
let obj = {name: "John", age: 30};
let json = JSON.stringify(obj);
let parsed = JSON.parse(json);
return parsed.name;  // "John"
```

### Test 9: 고차 함수 조합
```javascript
let nums = [1, 2, 3, 4, 5];
let result = map(
  filter(nums, (x) => x > 2),
  (x) => x * 2
);
return result;  // [6, 8, 10]
```

### Test 10: 복잡한 데이터 처리
```javascript
let users = [
  {name: "Alice", age: 25},
  {name: "Bob", age: 30},
  {name: "Charlie", age: 28}
];

let adults = filter(users, (u) => u.age >= 25);
let names = map(adults, (u) => u.name);
return names;  // ["Alice", "Bob", "Charlie"]
```

---

## 9️⃣ **구현 일정**

| 작업 | 예상 시간 | 상태 |
|------|----------|------|
| 배열 메서드 구현 | 1.5시간 | ⏳ |
| 문자열 메서드 구현 | 1시간 | ⏳ |
| Math 모듈 구현 | 1시간 | ⏳ |
| 파일 I/O 구현 | 1시간 | ⏳ |
| 네트워킹 API 구현 | 1.5시간 | ⏳ |
| 유틸리티 함수 구현 | 45분 | ⏳ |
| VM 바인딩 | 1.5시간 | ⏳ |
| 테스트 & 통합 | 2시간 | ⏳ |

**총 예상**: ~10시간

---

## 🔟 **성공 기준**

- ✅ 10개 테스트 모두 통과
- ✅ 배열 메서드 7개 이상 구현
- ✅ 문자열 메서드 8개 이상 구현
- ✅ Math 함수 8개 이상 구현
- ✅ 파일 I/O 기본 기능 구현
- ✅ JSON 변환 기능 구현
- ✅ 모든 함수가 실제로 동작하는지 테스트

---

## 1️⃣1️⃣ **Phase 13 완성 후 상태**

```
✅ Phase 1-12:   언어 + 컴파일러 + 최적화
✅ Phase 13:     표준 라이브러리

결과: 실용적인 프로그래밍 언어
```

---

## 1️⃣2️⃣ **다음 단계**

### Phase 14: IDE & 개발 도구
- 코드 포매터
- 린터
- 디버거
- REPL (대화형 쉘)

### Phase 15: 성능 측정 & 벤치마크
- 언어 성능 벤치마크
- 최적화 효과 측정
- 경쟁 언어와 비교

---

**시작 예정**: 지금 바로 시작 🚀
