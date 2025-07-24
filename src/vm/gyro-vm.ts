import { OpCode, OpcodeName } from './opcodes.js';
import readline from 'readline';

type GyroValue = number | string | boolean | null | undefined | any[];

interface CallFrame {
  returnIp: number;
  framePointer: number;
  numArgs: number;
}

export class GyroVM {
  private stack: GyroValue[] = [];
  private ip = 0;
  private bytecode: number[];
  private constantPool: GyroValue[];
  private running = true;

  private globals = new Map<number, GyroValue>();
  private callStack: CallFrame[] = [];
  private framePointer = 0;

  private rl: readline.Interface | null = null;

  constructor(bytecode: number[], constantPool: GyroValue[] = []) {
    this.bytecode = bytecode;
    this.constantPool = constantPool;
  }

  private ensureStack(size: number) {
    if (this.stack.length < size) {
      const opcode = this.bytecode[this.ip - 1];
      throw new Error(`Stack underflow at ${OpcodeName[opcode] || `OP_${opcode}`}, need ${size}, got ${this.stack.length}`);
    }
  }

  private readByte(): number {
    const byte = this.bytecode[this.ip++];
    if (byte === undefined) throw new Error(`Unexpected EOF at ip=${this.ip - 1}`);
    return byte;
  }

  async run(): Promise<GyroValue | undefined> {
    while (this.running && this.ip < this.bytecode.length) {
      const op = this.readByte();

      switch (op) {
        case OpCode.PUSH_CONST:
          this.stack.push(this.constantPool[this.readByte()]);
          break;

        case OpCode.PUSH_INT:
        case OpCode.PUSH_FLOAT:
          this.stack.push(this.readByte());
          break;

        case OpCode.PUSH_TRUE:
          this.stack.push(true);
          break;

        case OpCode.PUSH_FALSE:
          this.stack.push(false);
          break;

        case OpCode.PUSH_NULL:
          this.stack.push(null);
          break;

        case OpCode.POP:
          this.ensureStack(1);
          this.stack.pop();
          break;

        case OpCode.DUP:
          this.ensureStack(1);
          this.stack.push(this.stack[this.stack.length - 1]);
          break;

        case OpCode.SWAP:
          this.ensureStack(2);
          const top = this.stack.pop()!;
          const below = this.stack.pop()!;
          this.stack.push(top, below);
          break;

        case OpCode.ADD:
        case OpCode.SUB:
        case OpCode.MUL:
        case OpCode.DIV: {
          this.ensureStack(2);
          const b = this.stack.pop() as number;
          const a = this.stack.pop() as number;
          let result = 0;
          switch (op) {
            case OpCode.ADD: result = a + b; break;
            case OpCode.SUB: result = a - b; break;
            case OpCode.MUL: result = a * b; break;
            case OpCode.DIV:
              if (b === 0) throw new Error("Division by zero");
              result = Math.floor(a / b);
              break;
          }
          this.stack.push(result);
          break;
        }

        case OpCode.MOD:
          this.ensureStack(2);
          const modB = this.stack.pop() as number;
          const modA = this.stack.pop() as number;
          this.stack.push(modA % modB);
          break;

        case OpCode.NEG:
          this.ensureStack(1);
          this.stack.push(-(this.stack.pop() as number));
          break;

        case OpCode.NOT:
          this.ensureStack(1);
          this.stack.push(!this.stack.pop());
          break;

        case OpCode.EQ:
        case OpCode.NEQ:
        case OpCode.GT:
        case OpCode.GTE:
        case OpCode.LT:
        case OpCode.LTE: {
          this.ensureStack(2);
          const right = this.stack.pop();
          const left = this.stack.pop();
          let bool = false;
          switch (op) {
            case OpCode.EQ: bool = left === right; break;
            case OpCode.NEQ: bool = left !== right; break;
            case OpCode.GT: bool = (left as number) > (right as number); break;
            case OpCode.GTE: bool = (left as number) >= (right as number); break;
            case OpCode.LT: bool = (left as number) < (right as number); break;
            case OpCode.LTE: bool = (left as number) <= (right as number); break;
          }
          this.stack.push(bool);
          break;
        }

        case OpCode.JMP:
          this.ip = this.readByte();
          break;

        case OpCode.JZ:
        case OpCode.JNZ: {
          const addr = this.readByte();
          const cond = this.stack.pop();
          const isTrue = !!cond;
          if ((op === OpCode.JZ && !isTrue) || (op === OpCode.JNZ && isTrue)) {
            this.ip = addr;
          }
          break;
        }

        case OpCode.CALL: {
          const addr = this.readByte();
          const numArgs = this.readByte();
          this.callStack.push({ returnIp: this.ip, framePointer: this.framePointer, numArgs });
          this.framePointer = this.stack.length - numArgs;
          this.ip = addr;
          break;
        }

        case OpCode.RET: {
          const retVal = this.stack.pop();
          const frame = this.callStack.pop();
          if (!frame) {
            this.running = false;
            this.stack.push(retVal);
            break;
          }
          this.ip = frame.returnIp;
          this.framePointer = frame.framePointer;
          while (this.stack.length > this.framePointer) this.stack.pop();
          this.stack.push(retVal);
          break;
        }

        case OpCode.STORE_LOCAL:
        case OpCode.LOAD_LOCAL: {
          const offset = this.readByte();
          const index = this.framePointer + offset;
          if (index < 0 || index >= this.stack.length) {
            throw new Error(`Local variable access out of bounds at offset ${offset}`);
          }
          if (op === OpCode.STORE_LOCAL) {
            this.stack[index] = this.stack.pop();
          } else {
            this.stack.push(this.stack[index]);
          }
          break;
        }

        case OpCode.STORE_GLOBAL:
          this.globals.set(this.readByte(), this.stack.pop());
          break;

        case OpCode.LOAD_GLOBAL: {
          const index = this.readByte();
          const value = this.globals.get(index);
          if (value === undefined) throw new Error(`Access to uninitialized global at index ${index}`);
          this.stack.push(value);
          break;
        }

        case OpCode.PRINT:
          this.ensureStack(1);
          console.log(this.stack.pop());
          break;

        case OpCode.INPUT: {
          if (!this.rl) {
            this.rl = readline.createInterface({ input: process.stdin, output: process.stdout });
          }
          process.stdout.write("Input: ");
          const input = await new Promise<string>(res => this.rl!.question('', res));
          this.stack.push(input);
          break;
        }

        case OpCode.ARRAY_CREATE: {
          this.ensureStack(1);
          const size = this.stack.pop();
          if (typeof size !== 'number' || size < 0 || !Number.isInteger(size)) {
            throw new Error(`Invalid array size: ${size}`);
          }
          this.stack.push(new Array(size).fill(null));
          break;
        }

        case OpCode.ARRAY_GET: {
          this.ensureStack(2);
          const index = this.stack.pop() as number;
          const arr = this.stack.pop();
          if (!Array.isArray(arr)) throw new Error("ARRAY_GET expects an array");
          this.stack.push(arr[index]);
          break;
        }

        case OpCode.ARRAY_SET: {
          this.ensureStack(3);
          const value = this.stack.pop();
          const index = this.stack.pop() as number;
          const arr = this.stack.pop();
          if (!Array.isArray(arr)) throw new Error("ARRAY_SET expects an array");
          arr[index] = value;
          break;
        }

        case OpCode.HALT:
        case OpCode.EXIT:
          this.running = false;
          break;

        default:
          throw new Error(`Unknown opcode: 0x${op.toString(16)} at ip=${this.ip - 1}`);
      }
    }

    if (this.rl) this.rl.close();
    return this.stack.pop();
  }
}
