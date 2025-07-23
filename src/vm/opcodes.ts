export enum OpCode {
    PUSH_CONST = 0x01,
    PUSH_INT = 0x02,
    PUSH_FLOAT = 0x03,
    PUSH_TRUE = 0x04,
    PUSH_FALSE = 0x05,
    PUSH_NULL = 0x06,
    POP = 0x07,
    DUP = 0x08,
    SWAP = 0x09,

    ADD = 0x10,
    SUB = 0x11,
    MUL = 0x12,
    DIV = 0x13,
    NEG = 0x14,
    MOD = 0x15,

    EQ  = 0x20,
    NEQ = 0x21,
    GT  = 0x22,
    LT  = 0x23,
    GTE = 0x24,
    LTE = 0x25,
    NOT = 0x26,

    JMP  = 0x30,
    JZ   = 0x31,
    JNZ  = 0x32,
    CALL = 0x33,
    RET  = 0x34,
    FUN  = 0x35,
    AND = 0x36,
    OR  = 0x37,

    LOAD_GLOBAL = 0x40,
    STORE_GLOBAL = 0x41,
    LOAD_LOCAL = 0x42,
    STORE_LOCAL = 0x43,

    PRINT = 0x50,
    INPUT = 0x51,
    EXIT  = 0x52,

    ARRAY_CREATE = 0x60,
    ARRAY_GET    = 0x61,
    ARRAY_SET    = 0x62,

    HALT = 0xF0,
}


export const OpcodeName: Record<number, string> = {
    [OpCode.PUSH_CONST]: "PUSH_CONST",
    [OpCode.PUSH_INT]: "PUSH_INT",
    [OpCode.PUSH_FLOAT]: "PUSH_FLOAT",
    [OpCode.PUSH_TRUE]: "PUSH_TRUE",
    [OpCode.PUSH_FALSE]: "PUSH_FALSE",
    [OpCode.PUSH_NULL]: "PUSH_NULL",
    [OpCode.POP]: "POP",
    [OpCode.DUP]: "DUP",
    [OpCode.SWAP]: "SWAP",

    [OpCode.ADD]: "ADD",
    [OpCode.SUB]: "SUB",
    [OpCode.MUL]: "MUL",
    [OpCode.DIV]: "DIV",
    [OpCode.NEG]: "NEG",
    [OpCode.MOD]: "MOD",

    [OpCode.EQ ]: "EQ",
    [OpCode.NEQ]: "NEQ",
    [OpCode.GT ]: "GT",
    [OpCode.LT ]: "LT",
    [OpCode.GTE]: "GTE",
    [OpCode.LTE]: "LTE",
    [OpCode.NOT]: "NOT",

    [OpCode.JMP]: "JMP",
    [OpCode.JZ]: "JZ",
    [OpCode.JNZ]: "JNZ",
    [OpCode.CALL]: "CALL",
    [OpCode.RET]: "RET",
    [OpCode.FUN]: "FUN",

    [OpCode.LOAD_GLOBAL]: "LOAD_GLOBAL",
    [OpCode.STORE_GLOBAL]: "STORE_GLOBAL",
    [OpCode.LOAD_LOCAL]: "LOAD_LOCAL",
    [OpCode.STORE_LOCAL]: "STORE_LOCAL",

    [OpCode.PRINT]: "PRINT",
    [OpCode.INPUT]: "INPUT",
    [OpCode.EXIT]: "EXIT",

    [OpCode.ARRAY_CREATE]: "ARRAY_CREATE",
    [OpCode.ARRAY_GET]: "ARRAY_GET",
    [OpCode.ARRAY_SET]: "ARRAY_SET",

    [OpCode.HALT]: "HALT",
};