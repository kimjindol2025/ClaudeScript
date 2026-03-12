# Phase 7: StdLib Binding & Native Function Integration ✅ COMPLETE

**Date**: 2026-03-07
**Status**: COMPLETE
**Tests**: 4/4 passing ✅

## Overview

Phase 7 establishes the **runtime ecosystem connection** — linking the VM's bytecode execution to native JavaScript functions. This enables the language to interact with the host system.

```
Bytecode: CALL_NATIVE fnId → VM Native Registry → JS Function → Result → Stack
```

## Architecture

```
┌─────────────────────────────────────────────┐
│  Phase 7: StdLib Binding                    │
├─────────────────────────────────────────────┤
│                                             │
│  CodeGenerator (Phase 6)                    │
│  └─ Call(println, [expr])                  │
│     └─ emitExpr(expr)                      │
│     └─ PUSH_CONST argc                     │
│     └─ CALL_NATIVE 0 (println ID)          │
│                                             │
│  FreeLangVM                                 │
│  └─ CALL_NATIVE 0                          │
│     └─ Pop argc from stack                 │
│     └─ Pop argc args (reverse order)       │
│     └─ natives.get(0)(args)                │
│     └─ console.log(args[0])                │
│     └─ Push 0 to stack                     │
│                                             │
└─────────────────────────────────────────────┘
```

## Implementation Details

### 1. Extended OpCode (`src/vt-opcodes.ts`)

```typescript
export enum OpCode {
  // ... existing opcodes ...
  CALL = 13,         // User-defined function call
  CALL_NATIVE = 14,  // 🔥 Native function call (NEW)
  RET = 15,
  HALT = 16
}
```

**Key**: CALL_NATIVE takes a native function ID (0-N) as argument.

### 2. Native Registry (`src/freelang-vm.ts`)

```typescript
type NativeFn = (args: number[]) => number | void;

export class FreeLangVM {
  private natives = new Map<number, NativeFn>();

  constructor(private program: Instruction[]) {
    this.registerStdlib();  // Register built-in functions
  }

  private registerStdlib() {
    // ID 0 → println
    this.natives.set(0, (args) => {
      console.log(args[0]);
      return 0;
    });

    // ID 1 → print
    this.natives.set(1, (args) => {
      process.stdout.write(String(args[0]));
      return 0;
    });

    // ID 2 → length (future: array length)
    this.natives.set(2, (args) => {
      return args.length;
    });
  }
}
```

### 3. CALL_NATIVE Execution

```typescript
case OpCode.CALL_NATIVE: {
  const fnId = instr.arg!;              // Native function ID
  const argc = this.stack.pop()!;        // Argument count
  const args: number[] = [];

  // Pop argc arguments (in reverse order)
  for (let i = 0; i < argc; i++) {
    args.unshift(this.stack.pop()!);     // prepend to maintain order
  }

  // Call native function
  const result = this.natives.get(fnId)!(args);

  // Push result (or 0 if undefined)
  if (typeof result === "number") {
    this.stack.push(result);
  } else {
    this.stack.push(0);
  }

  break;
}
```

### 4. AST Extensions (`src/phase6-ast.ts`)

Added Call to both Expr and Stmt:

```typescript
export type Expr = ... | { type: "Call"; name: string; args: Expr[] };
export type Stmt = ... | { type: "Call"; name: string; args: Expr[] };
```

This allows:
- **Expression context**: `let x = println(5)` (unusual, but allowed)
- **Statement context**: `println(5)` (normal function call)

### 5. Code Generation (`src/phase6-codegen.ts`)

**For Call statements**:
```typescript
case "Call": {
  // Evaluate arguments
  stmt.args.forEach((arg) => this.emitExpr(arg));

  // Push argument count
  this.emit(OpCode.PUSH_CONST, stmt.args.length);

  // Call native function
  const fnId = this.getNativeFunctionId(stmt.name);
  this.emit(OpCode.CALL_NATIVE, fnId);
  break;
}

private getNativeFunctionId(name: string): number {
  const nativeMap: Record<string, number> = {
    println: 0,
    print: 1,
    length: 2,
  };
  return nativeMap[name];
}
```

## Test Coverage (4/4 ✅)

### Test 1: println with Expression

**Program**: `println(7 * 6)`

**Bytecode**:
```
PUSH_CONST 7
PUSH_CONST 6
MUL           (7 * 6 = 42)
PUSH_CONST 1  (argc)
CALL_NATIVE 0 (println)
PUSH_CONST 0
HALT
```

**Output**: `42` ✅

### Test 2: println with Factorial

**Program**:
```
let n = 5
let result = 1
while (n > 1) {
  result = result * n
  n = n - 1
}
println(result)
return result
```

**Output**: `120` ✅

### Test 3: print without Newline

**Program**:
```
print(100)
print(200)
```

**Output**: `100200` (no newline between) ✅

### Test 4: Multiple Native Calls

**Program**:
```
println(111)
println(22 + 33)
```

**Output**: 
```
111
55
```
✅

## Execution Flow (Detailed)

**Example**: `println(7 * 6)`

1. **Codegen Phase**:
   ```
   emitExpr(Binary(7 * 6))
     → PUSH_CONST 7
     → PUSH_CONST 6
     → MUL
   emit(PUSH_CONST, 1)     // argc = 1
   emit(CALL_NATIVE, 0)    // println ID
   ```

2. **VM Execution**:
   ```
   IP=0: PUSH_CONST 7      → Stack: [7]
   IP=1: PUSH_CONST 6      → Stack: [7, 6]
   IP=2: MUL               → Stack: [42]
   IP=3: PUSH_CONST 1      → Stack: [42, 1]
   IP=4: CALL_NATIVE 0
         - fnId = 0 (println)
         - argc = pop() = 1
         - args = [pop()] = [42]
         - natives.get(0)([42]) → console.log(42)
         - push(0)              → Stack: [0]
   IP=5: HALT              → return stack.pop() = 0
   ```

3. **Output**: `42`

## Code Quality Metrics

| Metric | Value |
|--------|-------|
| Native Functions | 3 (println, print, length) |
| Function Registry | HashMap (O(1) lookup) |
| Args Passing | Variable argc (stack-based) |
| Test Cases | 4 |
| Pass Rate | 100% |

## Key Design Decisions

### 1. Argument Count on Stack
Instead of embedding argc in CALL_NATIVE instruction:
```typescript
// Option A: Embed in instruction
CALL_NATIVE 0 1   // fnId=0, argc=1
// Problem: Fixed argument count, harder to extend

// Option B: Push argc before call (CHOSEN)
PUSH_CONST 1
CALL_NATIVE 0
// Advantage: Supports variable argument counts
```

### 2. Reverse Order Argument Popping
Stack discipline requires bottom-to-top storage but function expects left-to-right order:
```typescript
// Stack: [arg1, arg2, arg3]  (top on right)
// Function wants: [arg1, arg2, arg3]  (left to right)

// Solution: unshift (prepend) while popping
for (let i = 0; i < argc; i++) {
  args.unshift(this.stack.pop()!);  // pop in reverse, prepend
}
// Result: args = [arg1, arg2, arg3]
```

### 3. Undefined Return Handling
Some native functions return void:
```typescript
// println returns nothing (void)
// But VM stack expects a number
// Solution: Push 0 for void returns
if (typeof result === "number") {
  this.stack.push(result);
} else {
  this.stack.push(0);  // default return
}
```

## Known Limitations & Future Work

### Phase 8: Source Parser
- [ ] Lexer/Parser for ".claud" files
- [ ] Real syntax instead of JSON AST
- [ ] Error messages with line/column info

### Phase 9: Array & Heap
- [ ] Array type system
- [ ] Heap allocation
- [ ] push/pop/length operations
- [ ] Garbage collection

### Phase 10: String Operations
- [ ] String type
- [ ] Concatenation
- [ ] substr/split/join

### Phase 11: Advanced Features
- [ ] File I/O (read/write)
- [ ] Module system (import/export)
- [ ] Error handling (try-catch-finally)
- [ ] Object types

## Integration Points

### Input (from Phase 6)
```typescript
interface Program {
  body: Stmt[];  // Can include Call statements
}
```

### Native Function Signature
```typescript
type NativeFn = (args: number[]) => number | void;
```

### Bytecode Generated
```
CALL_NATIVE fnId  // where fnId is looked up at codegen time
```

## Testing Instructions

```bash
cd claudescript

# Run Phase 7 tests
npx ts-node tests/phase7-e2e.test.ts

# Expected output:
# 42         (println(7*6))
# 120        (println(5!))
# Output: 100200  (print without newline)
# 111        (println(111))
# 55         (println(55))
```

## Summary

**Phase 7 Success Criteria**: ✅ ALL MET
- ✅ Extend OpCode with CALL_NATIVE
- ✅ Implement Native Registry
- ✅ Register println/print functions
- ✅ Support variable argument counts
- ✅ Integrate with CodeGenerator
- ✅ 4/4 E2E tests passing
- ✅ Complete language ↔ runtime connection

**Total Project Status**:
- Phase 1: AST Specification ✅ (100%)
- Phase 2: Validator ✅ (100% - 18 tests)
- Phase 3: Type Checker ✅ (80% - 12/15 tests)
- Phase 4: Code Generator ✅ (100% - 15 tests)
- Phase 5: FreeLang VM ✅ (100% - 14 tests)
- Phase 6: E2E Pipeline ✅ (100% - 4 tests)
- **Phase 7: StdLib Binding** ✅ (100% - 4 tests, Runtime Ecosystem Connected)
- **Phase 8+: Advanced Features** (Ready to start)

## Key Insight

> "언어 ↔ 호스트 런타임 연결 완성"
> (Language ↔ Host Runtime Connection Complete)

This phase proves the language can escape its isolated bytecode world and interact with the outside system. Every feature the language needs — I/O, memory, data structures — can now be implemented as native functions.

**From this point**: Phase 8 adds real-world features (parser, arrays, strings), but the core architecture for language-runtime interaction is proven and extensible. 🚀
