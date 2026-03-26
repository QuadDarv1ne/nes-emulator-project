/**
 * CPU 6502 Emulator
 * 
 * Адресное пространство: 64KB (0x0000 - 0xFFFF)
 * - Zero Page: 0x0000 - 0x00FF
 * - Stack: 0x0100 - 0x01FF
 * - RAM: 0x0000 - 0x07FF (mirrored to 0x0800 - 0x1FFF)
 * - PPU Registers: 0x2000 - 0x2007
 * - APU Registers: 0x4000 - 0x4017
 * - Cartridge: 0x4020 - 0xFFFF
 */

export interface Registers {
  a: number   // Accumulator
  x: number   // X register
  y: number   // Y register
  sp: number  // Stack pointer
  pc: number  // Program counter
}

export interface Flags {
  C: number  // Carry
  Z: number  // Zero
  I: number  // Interrupt disable
  D: number  // Decimal mode (not used on NES)
  B: number  // Break
  U: number  // Unused (always 1)
  V: number  // Overflow
  N: number  // Negative
}

type AddressingMode = 
  | 'immediate'
  | 'zeroPage'
  | 'zeroPageX'
  | 'zeroPageY'
  | 'absolute'
  | 'absoluteX'
  | 'absoluteY'
  | 'indirect'
  | 'indexedIndirect'
  | 'indirectIndexed'
  | 'relative'
  | 'implicit'
  | 'accumulator'

interface Instruction {
  opcode: number
  mnemonic: string
  mode: AddressingMode
  cycles: number
  execute: (cpu: CPU) => void
}

export class CPU {
  // Registers
  a = 0
  x = 0
  y = 0
  sp = 0xFF
  pc = 0
  status = 0x24 // U flag always set

  // Memory
  private memory: Uint8Array
  private zeroPage: Uint8Array
  private stack: Uint8Array

  // Interrupts
  private nmiPending = false
  private irqPending = false

  // Cycle tracking
  private extraCycles = 0

  // Callbacks
  private onNMI?: () => void
  private onDMA?: (page: number) => void

  // Flags getters/setters
  get C(): number { return (this.status >> 0) & 1 }
  set C(v: number) { this.status = (this.status & 0xFE) | (v & 1) }

  get Z(): number { return (this.status >> 1) & 1 }
  set Z(v: number) { this.status = (this.status & 0xFD) | ((v & 1) << 1) }

  get I(): number { return (this.status >> 2) & 1 }
  set I(v: number) { this.status = (this.status & 0xFB) | ((v & 1) << 2) }

  get D(): number { return (this.status >> 3) & 1 }
  set D(v: number) { this.status = (this.status & 0xF7) | ((v & 1) << 3) }

  get B(): number { return (this.status >> 4) & 1 }
  set B(v: number) { this.status = (this.status & 0xEF) | ((v & 1) << 4) }

  get U(): number { return (this.status >> 5) & 1 }
  set U(v: number) { this.status = (this.status & 0xDF) | ((v & 1) << 5) }

  get V(): number { return (this.status >> 6) & 1 }
  set V(v: number) { this.status = (this.status & 0xBF) | ((v & 1) << 6) }

  get N(): number { return (this.status >> 7) & 1 }
  set N(v: number) { this.status = (this.status & 0x7F) | ((v & 1) << 7) }

  private instructions: Map<number, Instruction>

  constructor() {
    this.memory = new Uint8Array(0x10000) // 64KB
    this.zeroPage = new Uint8Array(this.memory.buffer, 0x0000, 0x0100)
    this.stack = new Uint8Array(this.memory.buffer, 0x0100, 0x0100)
    this.instructions = this.createInstructions()
  }

  setNMIHandler(handler: () => void) {
    this.onNMI = handler
  }

  setDMAHandler(handler: (page: number) => void) {
    this.onDMA = handler
  }

  triggerNMI() {
    this.nmiPending = true
  }

  // Sprite DMA - transfer 256 bytes from CPU memory to PPU OAM
  // Takes 513 CPU cycles (256 bytes * 2 cycles per byte + 1 cycle overhead)
  writeOAMDMA(page: number) {
    if (this.onDMA) {
      this.onDMA(page)
    }
  }

  triggerIRQ() {
    this.irqPending = true
  }

  reset() {
    this.a = 0
    this.x = 0
    this.y = 0
    this.sp = 0xFD
    this.status = 0x24
    this.pc = this.read16(0xFFFC) // Reset vector
    this.nmiPending = false
    this.irqPending = false
  }

  // Memory operations with proper mirroring
  read(addr: number): number {
    addr &= 0xFFFF
    // RAM mirrors every 2KB
    if (addr < 0x2000) {
      return this.memory[addr & 0x07FF]
    }
    return this.memory[addr]
  }

  write(addr: number, value: number) {
    addr &= 0xFFFF
    // RAM mirrors every 2KB
    if (addr < 0x2000) {
      this.memory[addr & 0x07FF] = value & 0xFF
      return
    }
    this.memory[addr] = value & 0xFF
  }

  read16(addr: number): number {
    return this.read(addr) | (this.read(addr + 1) << 8)
  }

  write16(addr: number, value: number) {
    this.write(addr, value & 0xFF)
    this.write(addr + 1, (value >> 8) & 0xFF)
  }

  // Stack operations
  push(value: number) {
    this.stack[this.sp--] = value & 0xFF
  }

  push16(value: number) {
    this.push((value >> 8) & 0xFF)
    this.push(value & 0xFF)
  }

  pop(): number {
    return this.stack[++this.sp]
  }

  pop16(): number {
    const lo = this.pop()
    const hi = this.pop()
    return lo | (hi << 8)
  }

  // Flag helpers
  setZN(value: number) {
    this.Z = value === 0 ? 1 : 0
    this.N = (value >> 7) & 1
  }

  // Addressing modes
  private getImmediate(): number {
    return this.read(this.pc++)
  }

  private getZeroPage(): number {
    return this.read(this.read(this.pc++))
  }

  private getZeroPageX(): number {
    const addr = (this.read(this.pc++) + this.x) & 0xFF
    return this.read(addr)
  }

  private getZeroPageY(): number {
    const addr = (this.read(this.pc++) + this.y) & 0xFF
    return this.read(addr)
  }

  private getAbsolute(): number {
    const addr = this.read16(this.pc)
    this.pc += 2
    return this.read(addr)
  }

  private getAbsoluteX(): number {
    const addr = (this.read16(this.pc) + this.x) & 0xFFFF
    this.pc += 2
    return this.read(addr)
  }

  private getAbsoluteY(): number {
    const addr = (this.read16(this.pc) + this.y) & 0xFFFF
    this.pc += 2
    return this.read(addr)
  }

  private getIndirect(): number {
    const ptr = this.read16(this.pc)
    this.pc += 2
    return this.read(this.read16(ptr))
  }

  private getIndexedIndirect(): number {
    const ptr = (this.read(this.pc++) + this.x) & 0xFF
    return this.read(this.read16(ptr))
  }

  private getIndirectIndexed(): number {
    const ptr = this.read(this.pc++)
    const addr = (this.read16(ptr) + this.y) & 0xFFFF
    return this.read(addr)
  }

  private getRelative(): number {
    const offset = this.read(this.pc++)
    // Sign extend
    return offset & 0x80 ? offset - 0x100 : offset
  }

  // Instructions
  private createInstructions(): Map<number, Instruction> {
    const instructions = new Map<number, Instruction>()

    // LDA - Load Accumulator
    instructions.set(0xA9, { opcode: 0xA9, mnemonic: 'LDA', mode: 'immediate', cycles: 2, execute: (cpu) => {
      cpu.a = cpu.getImmediate()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0xA5, { opcode: 0xA5, mnemonic: 'LDA', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      cpu.a = cpu.getZeroPage()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0xB5, { opcode: 0xB5, mnemonic: 'LDA', mode: 'zeroPageX', cycles: 4, execute: (cpu) => {
      cpu.a = cpu.getZeroPageX()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0xAD, { opcode: 0xAD, mnemonic: 'LDA', mode: 'absolute', cycles: 4, execute: (cpu) => {
      cpu.a = cpu.getAbsolute()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0xBD, { opcode: 0xBD, mnemonic: 'LDA', mode: 'absoluteX', cycles: 4, execute: (cpu) => {
      cpu.a = cpu.getAbsoluteX()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0xB9, { opcode: 0xB9, mnemonic: 'LDA', mode: 'absoluteY', cycles: 4, execute: (cpu) => {
      cpu.a = cpu.getAbsoluteY()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0xA1, { opcode: 0xA1, mnemonic: 'LDA', mode: 'indexedIndirect', cycles: 6, execute: (cpu) => {
      cpu.a = cpu.getIndexedIndirect()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0xB1, { opcode: 0xB1, mnemonic: 'LDA', mode: 'indirectIndexed', cycles: 5, execute: (cpu) => {
      cpu.a = cpu.getIndirectIndexed()
      cpu.setZN(cpu.a)
    }})

    // LDX - Load X Register
    instructions.set(0xA2, { opcode: 0xA2, mnemonic: 'LDX', mode: 'immediate', cycles: 2, execute: (cpu) => {
      cpu.x = cpu.getImmediate()
      cpu.setZN(cpu.x)
    }})
    instructions.set(0xA6, { opcode: 0xA6, mnemonic: 'LDX', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      cpu.x = cpu.getZeroPage()
      cpu.setZN(cpu.x)
    }})
    instructions.set(0xB6, { opcode: 0xB6, mnemonic: 'LDX', mode: 'zeroPageY', cycles: 4, execute: (cpu) => {
      cpu.x = cpu.getZeroPageY()
      cpu.setZN(cpu.x)
    }})
    instructions.set(0xAE, { opcode: 0xAE, mnemonic: 'LDX', mode: 'absolute', cycles: 4, execute: (cpu) => {
      cpu.x = cpu.getAbsolute()
      cpu.setZN(cpu.x)
    }})
    instructions.set(0xBE, { opcode: 0xBE, mnemonic: 'LDX', mode: 'absoluteY', cycles: 4, execute: (cpu) => {
      cpu.x = cpu.getAbsoluteY()
      cpu.setZN(cpu.x)
    }})

    // LDY - Load Y Register
    instructions.set(0xA0, { opcode: 0xA0, mnemonic: 'LDY', mode: 'immediate', cycles: 2, execute: (cpu) => {
      cpu.y = cpu.getImmediate()
      cpu.setZN(cpu.y)
    }})
    instructions.set(0xA4, { opcode: 0xA4, mnemonic: 'LDY', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      cpu.y = cpu.getZeroPage()
      cpu.setZN(cpu.y)
    }})
    instructions.set(0xB4, { opcode: 0xB4, mnemonic: 'LDY', mode: 'zeroPageX', cycles: 4, execute: (cpu) => {
      cpu.y = cpu.getZeroPageX()
      cpu.setZN(cpu.y)
    }})
    instructions.set(0xAC, { opcode: 0xAC, mnemonic: 'LDY', mode: 'absolute', cycles: 4, execute: (cpu) => {
      cpu.y = cpu.getAbsolute()
      cpu.setZN(cpu.y)
    }})
    instructions.set(0xBC, { opcode: 0xBC, mnemonic: 'LDY', mode: 'absoluteX', cycles: 4, execute: (cpu) => {
      cpu.y = cpu.getAbsoluteX()
      cpu.setZN(cpu.y)
    }})

    // STA - Store Accumulator
    instructions.set(0x85, { opcode: 0x85, mnemonic: 'STA', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      const addr = cpu.read(cpu.pc++)
      cpu.write(addr, cpu.a)
    }})
    instructions.set(0x95, { opcode: 0x95, mnemonic: 'STA', mode: 'zeroPageX', cycles: 4, execute: (cpu) => {
      const addr = (cpu.read(cpu.pc++) + cpu.x) & 0xFF
      cpu.write(addr, cpu.a)
    }})
    instructions.set(0x8D, { opcode: 0x8D, mnemonic: 'STA', mode: 'absolute', cycles: 4, execute: (cpu) => {
      const addr = cpu.read16(cpu.pc)
      cpu.pc += 2
      cpu.write(addr, cpu.a)
    }})
    instructions.set(0x9D, { opcode: 0x9D, mnemonic: 'STA', mode: 'absoluteX', cycles: 5, execute: (cpu) => {
      const addr = (cpu.read16(cpu.pc) + cpu.x) & 0xFFFF
      cpu.pc += 2
      cpu.write(addr, cpu.a)
    }})
    instructions.set(0x99, { opcode: 0x99, mnemonic: 'STA', mode: 'absoluteY', cycles: 5, execute: (cpu) => {
      const addr = (cpu.read16(cpu.pc) + cpu.y) & 0xFFFF
      cpu.pc += 2
      cpu.write(addr, cpu.a)
    }})
    instructions.set(0x81, { opcode: 0x81, mnemonic: 'STA', mode: 'indexedIndirect', cycles: 6, execute: (cpu) => {
      const ptr = (cpu.read(cpu.pc++) + cpu.x) & 0xFF
      const addr = cpu.read16(ptr)
      cpu.write(addr, cpu.a)
    }})
    instructions.set(0x91, { opcode: 0x91, mnemonic: 'STA', mode: 'indirectIndexed', cycles: 6, execute: (cpu) => {
      const ptr = cpu.read(cpu.pc++)
      const addr = (cpu.read16(ptr) + cpu.y) & 0xFFFF
      cpu.write(addr, cpu.a)
    }})

    // STX - Store X Register
    instructions.set(0x86, { opcode: 0x86, mnemonic: 'STX', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      const addr = cpu.read(cpu.pc++)
      cpu.write(addr, cpu.x)
    }})
    instructions.set(0x96, { opcode: 0x96, mnemonic: 'STX', mode: 'zeroPageY', cycles: 4, execute: (cpu) => {
      const addr = (cpu.read(cpu.pc++) + cpu.y) & 0xFF
      cpu.write(addr, cpu.x)
    }})
    instructions.set(0x8E, { opcode: 0x8E, mnemonic: 'STX', mode: 'absolute', cycles: 4, execute: (cpu) => {
      const addr = cpu.read16(cpu.pc)
      cpu.pc += 2
      cpu.write(addr, cpu.x)
    }})

    // STY - Store Y Register
    instructions.set(0x84, { opcode: 0x84, mnemonic: 'STY', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      const addr = cpu.read(cpu.pc++)
      cpu.write(addr, cpu.y)
    }})
    instructions.set(0x94, { opcode: 0x94, mnemonic: 'STY', mode: 'zeroPageX', cycles: 4, execute: (cpu) => {
      const addr = (cpu.read(cpu.pc++) + cpu.x) & 0xFF
      cpu.write(addr, cpu.y)
    }})
    instructions.set(0x8C, { opcode: 0x8C, mnemonic: 'STY', mode: 'absolute', cycles: 4, execute: (cpu) => {
      const addr = cpu.read16(cpu.pc)
      cpu.pc += 2
      cpu.write(addr, cpu.y)
    }})

    // TAX - Transfer A to X
    instructions.set(0xAA, { opcode: 0xAA, mnemonic: 'TAX', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.x = cpu.a
      cpu.setZN(cpu.x)
    }})

    // TAY - Transfer A to Y
    instructions.set(0xA8, { opcode: 0xA8, mnemonic: 'TAY', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.y = cpu.a
      cpu.setZN(cpu.y)
    }})

    // TXA - Transfer X to A
    instructions.set(0x8A, { opcode: 0x8A, mnemonic: 'TXA', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.a = cpu.x
      cpu.setZN(cpu.a)
    }})

    // TYA - Transfer Y to A
    instructions.set(0x98, { opcode: 0x98, mnemonic: 'TYA', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.a = cpu.y
      cpu.setZN(cpu.a)
    }})

    // TSX - Transfer SP to X
    instructions.set(0xBA, { opcode: 0xBA, mnemonic: 'TSX', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.x = cpu.sp
      cpu.setZN(cpu.x)
    }})

    // TXS - Transfer X to SP
    instructions.set(0x9A, { opcode: 0x9A, mnemonic: 'TXS', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.sp = cpu.x
    }})

    // ADC - Add with Carry
    instructions.set(0x69, { opcode: 0x69, mnemonic: 'ADC', mode: 'immediate', cycles: 2, execute: (cpu) => {
      const value = cpu.getImmediate()
      cpu.adc(value)
    }})
    instructions.set(0x65, { opcode: 0x65, mnemonic: 'ADC', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      const value = cpu.getZeroPage()
      cpu.adc(value)
    }})
    instructions.set(0x75, { opcode: 0x75, mnemonic: 'ADC', mode: 'zeroPageX', cycles: 4, execute: (cpu) => {
      const value = cpu.getZeroPageX()
      cpu.adc(value)
    }})
    instructions.set(0x6D, { opcode: 0x6D, mnemonic: 'ADC', mode: 'absolute', cycles: 4, execute: (cpu) => {
      const value = cpu.getAbsolute()
      cpu.adc(value)
    }})
    instructions.set(0x7D, { opcode: 0x7D, mnemonic: 'ADC', mode: 'absoluteX', cycles: 4, execute: (cpu) => {
      const value = cpu.getAbsoluteX()
      cpu.adc(value)
    }})
    instructions.set(0x79, { opcode: 0x79, mnemonic: 'ADC', mode: 'absoluteY', cycles: 4, execute: (cpu) => {
      const value = cpu.getAbsoluteY()
      cpu.adc(value)
    }})
    instructions.set(0x61, { opcode: 0x61, mnemonic: 'ADC', mode: 'indexedIndirect', cycles: 6, execute: (cpu) => {
      const value = cpu.getIndexedIndirect()
      cpu.adc(value)
    }})
    instructions.set(0x71, { opcode: 0x71, mnemonic: 'ADC', mode: 'indirectIndexed', cycles: 5, execute: (cpu) => {
      const value = cpu.getIndirectIndexed()
      cpu.adc(value)
    }})

    // SBC - Subtract with Carry
    instructions.set(0xE9, { opcode: 0xE9, mnemonic: 'SBC', mode: 'immediate', cycles: 2, execute: (cpu) => {
      const value = cpu.getImmediate()
      cpu.sbc(value)
    }})
    instructions.set(0xE5, { opcode: 0xE5, mnemonic: 'SBC', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      const value = cpu.getZeroPage()
      cpu.sbc(value)
    }})
    instructions.set(0xF5, { opcode: 0xF5, mnemonic: 'SBC', mode: 'zeroPageX', cycles: 4, execute: (cpu) => {
      const value = cpu.getZeroPageX()
      cpu.sbc(value)
    }})
    instructions.set(0xED, { opcode: 0xED, mnemonic: 'SBC', mode: 'absolute', cycles: 4, execute: (cpu) => {
      const value = cpu.getAbsolute()
      cpu.sbc(value)
    }})
    instructions.set(0xFD, { opcode: 0xFD, mnemonic: 'SBC', mode: 'absoluteX', cycles: 4, execute: (cpu) => {
      const value = cpu.getAbsoluteX()
      cpu.sbc(value)
    }})
    instructions.set(0xF9, { opcode: 0xF9, mnemonic: 'SBC', mode: 'absoluteY', cycles: 4, execute: (cpu) => {
      const value = cpu.getAbsoluteY()
      cpu.sbc(value)
    }})
    instructions.set(0xE1, { opcode: 0xE1, mnemonic: 'SBC', mode: 'indexedIndirect', cycles: 6, execute: (cpu) => {
      const value = cpu.getIndexedIndirect()
      cpu.sbc(value)
    }})
    instructions.set(0xF1, { opcode: 0xF1, mnemonic: 'SBC', mode: 'indirectIndexed', cycles: 5, execute: (cpu) => {
      const value = cpu.getIndirectIndexed()
      cpu.sbc(value)
    }})

    // AND - Bitwise AND
    instructions.set(0x29, { opcode: 0x29, mnemonic: 'AND', mode: 'immediate', cycles: 2, execute: (cpu) => {
      cpu.a &= cpu.getImmediate()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x25, { opcode: 0x25, mnemonic: 'AND', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      cpu.a &= cpu.getZeroPage()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x35, { opcode: 0x35, mnemonic: 'AND', mode: 'zeroPageX', cycles: 4, execute: (cpu) => {
      cpu.a &= cpu.getZeroPageX()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x2D, { opcode: 0x2D, mnemonic: 'AND', mode: 'absolute', cycles: 4, execute: (cpu) => {
      cpu.a &= cpu.getAbsolute()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x3D, { opcode: 0x3D, mnemonic: 'AND', mode: 'absoluteX', cycles: 4, execute: (cpu) => {
      cpu.a &= cpu.getAbsoluteX()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x39, { opcode: 0x39, mnemonic: 'AND', mode: 'absoluteY', cycles: 4, execute: (cpu) => {
      cpu.a &= cpu.getAbsoluteY()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x21, { opcode: 0x21, mnemonic: 'AND', mode: 'indexedIndirect', cycles: 6, execute: (cpu) => {
      cpu.a &= cpu.getIndexedIndirect()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x31, { opcode: 0x31, mnemonic: 'AND', mode: 'indirectIndexed', cycles: 5, execute: (cpu) => {
      cpu.a &= cpu.getIndirectIndexed()
      cpu.setZN(cpu.a)
    }})

    // ORA - Bitwise OR
    instructions.set(0x09, { opcode: 0x09, mnemonic: 'ORA', mode: 'immediate', cycles: 2, execute: (cpu) => {
      cpu.a |= cpu.getImmediate()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x05, { opcode: 0x05, mnemonic: 'ORA', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      cpu.a |= cpu.getZeroPage()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x15, { opcode: 0x15, mnemonic: 'ORA', mode: 'zeroPageX', cycles: 4, execute: (cpu) => {
      cpu.a |= cpu.getZeroPageX()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x0D, { opcode: 0x0D, mnemonic: 'ORA', mode: 'absolute', cycles: 4, execute: (cpu) => {
      cpu.a |= cpu.getAbsolute()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x1D, { opcode: 0x1D, mnemonic: 'ORA', mode: 'absoluteX', cycles: 4, execute: (cpu) => {
      cpu.a |= cpu.getAbsoluteX()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x19, { opcode: 0x19, mnemonic: 'ORA', mode: 'absoluteY', cycles: 4, execute: (cpu) => {
      cpu.a |= cpu.getAbsoluteY()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x01, { opcode: 0x01, mnemonic: 'ORA', mode: 'indexedIndirect', cycles: 6, execute: (cpu) => {
      cpu.a |= cpu.getIndexedIndirect()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x11, { opcode: 0x11, mnemonic: 'ORA', mode: 'indirectIndexed', cycles: 5, execute: (cpu) => {
      cpu.a |= cpu.getIndirectIndexed()
      cpu.setZN(cpu.a)
    }})

    // EOR - Bitwise XOR
    instructions.set(0x49, { opcode: 0x49, mnemonic: 'EOR', mode: 'immediate', cycles: 2, execute: (cpu) => {
      cpu.a ^= cpu.getImmediate()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x45, { opcode: 0x45, mnemonic: 'EOR', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      cpu.a ^= cpu.getZeroPage()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x55, { opcode: 0x55, mnemonic: 'EOR', mode: 'zeroPageX', cycles: 4, execute: (cpu) => {
      cpu.a ^= cpu.getZeroPageX()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x4D, { opcode: 0x4D, mnemonic: 'EOR', mode: 'absolute', cycles: 4, execute: (cpu) => {
      cpu.a ^= cpu.getAbsolute()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x5D, { opcode: 0x5D, mnemonic: 'EOR', mode: 'absoluteX', cycles: 4, execute: (cpu) => {
      cpu.a ^= cpu.getAbsoluteX()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x59, { opcode: 0x59, mnemonic: 'EOR', mode: 'absoluteY', cycles: 4, execute: (cpu) => {
      cpu.a ^= cpu.getAbsoluteY()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x41, { opcode: 0x41, mnemonic: 'EOR', mode: 'indexedIndirect', cycles: 6, execute: (cpu) => {
      cpu.a ^= cpu.getIndexedIndirect()
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x51, { opcode: 0x51, mnemonic: 'EOR', mode: 'indirectIndexed', cycles: 5, execute: (cpu) => {
      cpu.a ^= cpu.getIndirectIndexed()
      cpu.setZN(cpu.a)
    }})

    // CMP - Compare A
    instructions.set(0xC9, { opcode: 0xC9, mnemonic: 'CMP', mode: 'immediate', cycles: 2, execute: (cpu) => {
      cpu.compare(cpu.a, cpu.getImmediate())
    }})
    instructions.set(0xC5, { opcode: 0xC5, mnemonic: 'CMP', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      cpu.compare(cpu.a, cpu.getZeroPage())
    }})
    instructions.set(0xD5, { opcode: 0xD5, mnemonic: 'CMP', mode: 'zeroPageX', cycles: 4, execute: (cpu) => {
      cpu.compare(cpu.a, cpu.getZeroPageX())
    }})
    instructions.set(0xCD, { opcode: 0xCD, mnemonic: 'CMP', mode: 'absolute', cycles: 4, execute: (cpu) => {
      cpu.compare(cpu.a, cpu.getAbsolute())
    }})
    instructions.set(0xDD, { opcode: 0xDD, mnemonic: 'CMP', mode: 'absoluteX', cycles: 4, execute: (cpu) => {
      cpu.compare(cpu.a, cpu.getAbsoluteX())
    }})
    instructions.set(0xD9, { opcode: 0xD9, mnemonic: 'CMP', mode: 'absoluteY', cycles: 4, execute: (cpu) => {
      cpu.compare(cpu.a, cpu.getAbsoluteY())
    }})
    instructions.set(0xC1, { opcode: 0xC1, mnemonic: 'CMP', mode: 'indexedIndirect', cycles: 6, execute: (cpu) => {
      cpu.compare(cpu.a, cpu.getIndexedIndirect())
    }})
    instructions.set(0xD1, { opcode: 0xD1, mnemonic: 'CMP', mode: 'indirectIndexed', cycles: 5, execute: (cpu) => {
      cpu.compare(cpu.a, cpu.getIndirectIndexed())
    }})

    // CPX - Compare X
    instructions.set(0xE0, { opcode: 0xE0, mnemonic: 'CPX', mode: 'immediate', cycles: 2, execute: (cpu) => {
      cpu.compare(cpu.x, cpu.getImmediate())
    }})
    instructions.set(0xE4, { opcode: 0xE4, mnemonic: 'CPX', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      cpu.compare(cpu.x, cpu.getZeroPage())
    }})
    instructions.set(0xEC, { opcode: 0xEC, mnemonic: 'CPX', mode: 'absolute', cycles: 4, execute: (cpu) => {
      cpu.compare(cpu.x, cpu.getAbsolute())
    }})

    // CPY - Compare Y
    instructions.set(0xC0, { opcode: 0xC0, mnemonic: 'CPY', mode: 'immediate', cycles: 2, execute: (cpu) => {
      cpu.compare(cpu.y, cpu.getImmediate())
    }})
    instructions.set(0xC4, { opcode: 0xC4, mnemonic: 'CPY', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      cpu.compare(cpu.y, cpu.getZeroPage())
    }})
    instructions.set(0xCC, { opcode: 0xCC, mnemonic: 'CPY', mode: 'absolute', cycles: 4, execute: (cpu) => {
      cpu.compare(cpu.y, cpu.getAbsolute())
    }})

    // INC - Increment Memory
    instructions.set(0xE6, { opcode: 0xE6, mnemonic: 'INC', mode: 'zeroPage', cycles: 5, execute: (cpu) => {
      const addr = cpu.read(cpu.pc++)
      let value = (cpu.read(addr) + 1) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0xF6, { opcode: 0xF6, mnemonic: 'INC', mode: 'zeroPageX', cycles: 6, execute: (cpu) => {
      const addr = (cpu.read(cpu.pc++) + cpu.x) & 0xFF
      let value = (cpu.read(addr) + 1) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0xEE, { opcode: 0xEE, mnemonic: 'INC', mode: 'absolute', cycles: 6, execute: (cpu) => {
      const addr = cpu.read16(cpu.pc)
      cpu.pc += 2
      let value = (cpu.read(addr) + 1) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0xFE, { opcode: 0xFE, mnemonic: 'INC', mode: 'absoluteX', cycles: 7, execute: (cpu) => {
      const addr = (cpu.read16(cpu.pc) + cpu.x) & 0xFFFF
      cpu.pc += 2
      let value = (cpu.read(addr) + 1) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})

    // INX - Increment X
    instructions.set(0xE8, { opcode: 0xE8, mnemonic: 'INX', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.x = (cpu.x + 1) & 0xFF
      cpu.setZN(cpu.x)
    }})

    // INY - Increment Y
    instructions.set(0xC8, { opcode: 0xC8, mnemonic: 'INY', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.y = (cpu.y + 1) & 0xFF
      cpu.setZN(cpu.y)
    }})

    // DEC - Decrement Memory
    instructions.set(0xC6, { opcode: 0xC6, mnemonic: 'DEC', mode: 'zeroPage', cycles: 5, execute: (cpu) => {
      const addr = cpu.read(cpu.pc++)
      let value = (cpu.read(addr) - 1) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0xD6, { opcode: 0xD6, mnemonic: 'DEC', mode: 'zeroPageX', cycles: 6, execute: (cpu) => {
      const addr = (cpu.read(cpu.pc++) + cpu.x) & 0xFF
      let value = (cpu.read(addr) - 1) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0xCE, { opcode: 0xCE, mnemonic: 'DEC', mode: 'absolute', cycles: 6, execute: (cpu) => {
      const addr = cpu.read16(cpu.pc)
      cpu.pc += 2
      let value = (cpu.read(addr) - 1) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0xDE, { opcode: 0xDE, mnemonic: 'DEC', mode: 'absoluteX', cycles: 7, execute: (cpu) => {
      const addr = (cpu.read16(cpu.pc) + cpu.x) & 0xFFFF
      cpu.pc += 2
      let value = (cpu.read(addr) - 1) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})

    // DEX - Decrement X
    instructions.set(0xCA, { opcode: 0xCA, mnemonic: 'DEX', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.x = (cpu.x - 1) & 0xFF
      cpu.setZN(cpu.x)
    }})

    // DEY - Decrement Y
    instructions.set(0x88, { opcode: 0x88, mnemonic: 'DEY', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.y = (cpu.y - 1) & 0xFF
      cpu.setZN(cpu.y)
    }})

    // ASL - Arithmetic Shift Left
    instructions.set(0x0A, { opcode: 0x0A, mnemonic: 'ASL', mode: 'accumulator', cycles: 2, execute: (cpu) => {
      cpu.C = (cpu.a >> 7) & 1
      cpu.a = (cpu.a << 1) & 0xFF
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x06, { opcode: 0x06, mnemonic: 'ASL', mode: 'zeroPage', cycles: 5, execute: (cpu) => {
      const addr = cpu.read(cpu.pc++)
      let value = cpu.read(addr)
      cpu.C = (value >> 7) & 1
      value = (value << 1) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0x16, { opcode: 0x16, mnemonic: 'ASL', mode: 'zeroPageX', cycles: 6, execute: (cpu) => {
      const addr = (cpu.read(cpu.pc++) + cpu.x) & 0xFF
      let value = cpu.read(addr)
      cpu.C = (value >> 7) & 1
      value = (value << 1) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0x0E, { opcode: 0x0E, mnemonic: 'ASL', mode: 'absolute', cycles: 6, execute: (cpu) => {
      const addr = cpu.read16(cpu.pc)
      cpu.pc += 2
      let value = cpu.read(addr)
      cpu.C = (value >> 7) & 1
      value = (value << 1) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0x1E, { opcode: 0x1E, mnemonic: 'ASL', mode: 'absoluteX', cycles: 7, execute: (cpu) => {
      const addr = (cpu.read16(cpu.pc) + cpu.x) & 0xFFFF
      cpu.pc += 2
      let value = cpu.read(addr)
      cpu.C = (value >> 7) & 1
      value = (value << 1) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})

    // LSR - Logical Shift Right
    instructions.set(0x4A, { opcode: 0x4A, mnemonic: 'LSR', mode: 'accumulator', cycles: 2, execute: (cpu) => {
      cpu.C = cpu.a & 1
      cpu.a = cpu.a >> 1
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x46, { opcode: 0x46, mnemonic: 'LSR', mode: 'zeroPage', cycles: 5, execute: (cpu) => {
      const addr = cpu.read(cpu.pc++)
      let value = cpu.read(addr)
      cpu.C = value & 1
      value = value >> 1
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0x56, { opcode: 0x56, mnemonic: 'LSR', mode: 'zeroPageX', cycles: 6, execute: (cpu) => {
      const addr = (cpu.read(cpu.pc++) + cpu.x) & 0xFF
      let value = cpu.read(addr)
      cpu.C = value & 1
      value = value >> 1
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0x4E, { opcode: 0x4E, mnemonic: 'LSR', mode: 'absolute', cycles: 6, execute: (cpu) => {
      const addr = cpu.read16(cpu.pc)
      cpu.pc += 2
      let value = cpu.read(addr)
      cpu.C = value & 1
      value = value >> 1
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0x5E, { opcode: 0x5E, mnemonic: 'LSR', mode: 'absoluteX', cycles: 7, execute: (cpu) => {
      const addr = (cpu.read16(cpu.pc) + cpu.x) & 0xFFFF
      cpu.pc += 2
      let value = cpu.read(addr)
      cpu.C = value & 1
      value = value >> 1
      cpu.write(addr, value)
      cpu.setZN(value)
    }})

    // ROL - Rotate Left
    instructions.set(0x2A, { opcode: 0x2A, mnemonic: 'ROL', mode: 'accumulator', cycles: 2, execute: (cpu) => {
      const carry = cpu.C
      cpu.C = (cpu.a >> 7) & 1
      cpu.a = ((cpu.a << 1) | carry) & 0xFF
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x26, { opcode: 0x26, mnemonic: 'ROL', mode: 'zeroPage', cycles: 5, execute: (cpu) => {
      const addr = cpu.read(cpu.pc++)
      let value = cpu.read(addr)
      const carry = cpu.C
      cpu.C = (value >> 7) & 1
      value = ((value << 1) | carry) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0x36, { opcode: 0x36, mnemonic: 'ROL', mode: 'zeroPageX', cycles: 6, execute: (cpu) => {
      const addr = (cpu.read(cpu.pc++) + cpu.x) & 0xFF
      let value = cpu.read(addr)
      const carry = cpu.C
      cpu.C = (value >> 7) & 1
      value = ((value << 1) | carry) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0x2E, { opcode: 0x2E, mnemonic: 'ROL', mode: 'absolute', cycles: 6, execute: (cpu) => {
      const addr = cpu.read16(cpu.pc)
      cpu.pc += 2
      let value = cpu.read(addr)
      const carry = cpu.C
      cpu.C = (value >> 7) & 1
      value = ((value << 1) | carry) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0x3E, { opcode: 0x3E, mnemonic: 'ROL', mode: 'absoluteX', cycles: 7, execute: (cpu) => {
      const addr = (cpu.read16(cpu.pc) + cpu.x) & 0xFFFF
      cpu.pc += 2
      let value = cpu.read(addr)
      const carry = cpu.C
      cpu.C = (value >> 7) & 1
      value = ((value << 1) | carry) & 0xFF
      cpu.write(addr, value)
      cpu.setZN(value)
    }})

    // ROR - Rotate Right
    instructions.set(0x6A, { opcode: 0x6A, mnemonic: 'ROR', mode: 'accumulator', cycles: 2, execute: (cpu) => {
      const carry = cpu.C << 7
      cpu.C = cpu.a & 1
      cpu.a = (cpu.a >> 1) | carry
      cpu.setZN(cpu.a)
    }})
    instructions.set(0x66, { opcode: 0x66, mnemonic: 'ROR', mode: 'zeroPage', cycles: 5, execute: (cpu) => {
      const addr = cpu.read(cpu.pc++)
      let value = cpu.read(addr)
      const carry = cpu.C << 7
      cpu.C = value & 1
      value = (value >> 1) | carry
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0x76, { opcode: 0x76, mnemonic: 'ROR', mode: 'zeroPageX', cycles: 6, execute: (cpu) => {
      const addr = (cpu.read(cpu.pc++) + cpu.x) & 0xFF
      let value = cpu.read(addr)
      const carry = cpu.C << 7
      cpu.C = value & 1
      value = (value >> 1) | carry
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0x6E, { opcode: 0x6E, mnemonic: 'ROR', mode: 'absolute', cycles: 6, execute: (cpu) => {
      const addr = cpu.read16(cpu.pc)
      cpu.pc += 2
      let value = cpu.read(addr)
      const carry = cpu.C << 7
      cpu.C = value & 1
      value = (value >> 1) | carry
      cpu.write(addr, value)
      cpu.setZN(value)
    }})
    instructions.set(0x7E, { opcode: 0x7E, mnemonic: 'ROR', mode: 'absoluteX', cycles: 7, execute: (cpu) => {
      const addr = (cpu.read16(cpu.pc) + cpu.x) & 0xFFFF
      cpu.pc += 2
      let value = cpu.read(addr)
      const carry = cpu.C << 7
      cpu.C = value & 1
      value = (value >> 1) | carry
      cpu.write(addr, value)
      cpu.setZN(value)
    }})

    // JMP - Jump
    instructions.set(0x4C, { opcode: 0x4C, mnemonic: 'JMP', mode: 'absolute', cycles: 3, execute: (cpu) => {
      cpu.pc = cpu.read16(cpu.pc)
    }})
    instructions.set(0x6C, { opcode: 0x6C, mnemonic: 'JMP', mode: 'indirect', cycles: 5, execute: (cpu) => {
      const ptr = cpu.read16(cpu.pc)
      cpu.pc += 2
      cpu.pc = cpu.read16(ptr)
    }})

    // JSR - Jump to Subroutine
    instructions.set(0x20, { opcode: 0x20, mnemonic: 'JSR', mode: 'absolute', cycles: 6, execute: (cpu) => {
      const addr = cpu.read16(cpu.pc)
      cpu.pc += 2
      cpu.push16(cpu.pc - 1)
      cpu.pc = addr
    }})

    // RTS - Return from Subroutine
    instructions.set(0x60, { opcode: 0x60, mnemonic: 'RTS', mode: 'implicit', cycles: 6, execute: (cpu) => {
      cpu.pc = cpu.pop16() + 1
    }})

    // RTI - Return from Interrupt
    instructions.set(0x40, { opcode: 0x40, mnemonic: 'RTI', mode: 'implicit', cycles: 6, execute: (cpu) => {
      cpu.status = cpu.pop() | 0x20 // U flag always set
      cpu.pc = cpu.pop16()
    }})

    // BRK - Break (Software Interrupt)
    instructions.set(0x00, { opcode: 0x00, mnemonic: 'BRK', mode: 'implicit', cycles: 7, execute: (cpu) => {
      cpu.pc++ // Skip the BRK byte
      cpu.push16(cpu.pc)
      cpu.push(cpu.status | 0x30) // Set B and U flags
      cpu.I = 1 // Disable interrupts
      cpu.pc = cpu.read16(0xFFFE) // IRQ/BRK vector (shared with IRQ)
    }})

    // PHA - Push Accumulator
    instructions.set(0x48, { opcode: 0x48, mnemonic: 'PHA', mode: 'implicit', cycles: 3, execute: (cpu) => {
      cpu.push(cpu.a)
    }})

    // PHP - Push Processor Status
    instructions.set(0x08, { opcode: 0x08, mnemonic: 'PHP', mode: 'implicit', cycles: 3, execute: (cpu) => {
      cpu.push(cpu.status | 0x30) // B and U flags set
    }})

    // PLA - Pull Accumulator
    instructions.set(0x68, { opcode: 0x68, mnemonic: 'PLA', mode: 'implicit', cycles: 4, execute: (cpu) => {
      cpu.a = cpu.pop()
      cpu.setZN(cpu.a)
    }})

    // PLP - Pull Processor Status
    instructions.set(0x28, { opcode: 0x28, mnemonic: 'PLP', mode: 'implicit', cycles: 4, execute: (cpu) => {
      cpu.status = (cpu.pop() & 0xEF) | 0x20 // Clear B, set U
    }})

    // BIT - Bit Test
    instructions.set(0x24, { opcode: 0x24, mnemonic: 'BIT', mode: 'zeroPage', cycles: 3, execute: (cpu) => {
      const value = cpu.getZeroPage()
      cpu.Z = (cpu.a & value) === 0 ? 1 : 0
      cpu.V = (value >> 6) & 1
      cpu.N = (value >> 7) & 1
    }})
    instructions.set(0x2C, { opcode: 0x2C, mnemonic: 'BIT', mode: 'absolute', cycles: 4, execute: (cpu) => {
      const value = cpu.getAbsolute()
      cpu.Z = (cpu.a & value) === 0 ? 1 : 0
      cpu.V = (value >> 6) & 1
      cpu.N = (value >> 7) & 1
    }})

    // Branch instructions
    instructions.set(0x10, { opcode: 0x10, mnemonic: 'BPL', mode: 'relative', cycles: 2, execute: (cpu) => {
      const offset = cpu.getRelative()
      if (cpu.N === 0) { const penalty = cpu.branch(offset); cpu.addCycles(penalty) }
    }})
    instructions.set(0x30, { opcode: 0x30, mnemonic: 'BMI', mode: 'relative', cycles: 2, execute: (cpu) => {
      const offset = cpu.getRelative()
      if (cpu.N === 1) { const penalty = cpu.branch(offset); cpu.addCycles(penalty) }
    }})
    instructions.set(0x50, { opcode: 0x50, mnemonic: 'BVC', mode: 'relative', cycles: 2, execute: (cpu) => {
      const offset = cpu.getRelative()
      if (cpu.V === 0) { const penalty = cpu.branch(offset); cpu.addCycles(penalty) }
    }})
    instructions.set(0x70, { opcode: 0x70, mnemonic: 'BVS', mode: 'relative', cycles: 2, execute: (cpu) => {
      const offset = cpu.getRelative()
      if (cpu.V === 1) { const penalty = cpu.branch(offset); cpu.addCycles(penalty) }
    }})
    instructions.set(0x90, { opcode: 0x90, mnemonic: 'BCC', mode: 'relative', cycles: 2, execute: (cpu) => {
      const offset = cpu.getRelative()
      if (cpu.C === 0) { const penalty = cpu.branch(offset); cpu.addCycles(penalty) }
    }})
    instructions.set(0xB0, { opcode: 0xB0, mnemonic: 'BCS', mode: 'relative', cycles: 2, execute: (cpu) => {
      const offset = cpu.getRelative()
      if (cpu.C === 1) { const penalty = cpu.branch(offset); cpu.addCycles(penalty) }
    }})
    instructions.set(0xD0, { opcode: 0xD0, mnemonic: 'BNE', mode: 'relative', cycles: 2, execute: (cpu) => {
      const offset = cpu.getRelative()
      if (cpu.Z === 0) { const penalty = cpu.branch(offset); cpu.addCycles(penalty) }
    }})
    instructions.set(0xF0, { opcode: 0xF0, mnemonic: 'BEQ', mode: 'relative', cycles: 2, execute: (cpu) => {
      const offset = cpu.getRelative()
      if (cpu.Z === 1) { const penalty = cpu.branch(offset); cpu.addCycles(penalty) }
    }})

    // CLC - Clear Carry
    instructions.set(0x18, { opcode: 0x18, mnemonic: 'CLC', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.C = 0
    }})

    // CLD - Clear Decimal
    instructions.set(0xD8, { opcode: 0xD8, mnemonic: 'CLD', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.D = 0
    }})

    // CLI - Clear Interrupt Disable
    instructions.set(0x58, { opcode: 0x58, mnemonic: 'CLI', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.I = 0
    }})

    // CLV - Clear Overflow
    instructions.set(0xB8, { opcode: 0xB8, mnemonic: 'CLV', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.V = 0
    }})

    // SEC - Set Carry
    instructions.set(0x38, { opcode: 0x38, mnemonic: 'SEC', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.C = 1
    }})

    // SED - Set Decimal
    instructions.set(0xF8, { opcode: 0xF8, mnemonic: 'SED', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.D = 1
    }})

    // SEI - Set Interrupt Disable
    instructions.set(0x78, { opcode: 0x78, mnemonic: 'SEI', mode: 'implicit', cycles: 2, execute: (cpu) => {
      cpu.I = 1
    }})

    // NOP - No Operation
    instructions.set(0xEA, { opcode: 0xEA, mnemonic: 'NOP', mode: 'implicit', cycles: 2, execute: () => {
      // Do nothing
    }})

    return instructions
  }

  addCycles(cycles: number) {
    this.extraCycles += cycles
  }

  private branch(offset: number): number {
    const oldPC = this.pc
    this.pc = (this.pc + offset) & 0xFFFF
    // Page crossing adds 1 extra cycle
    return (oldPC & 0xFF00) !== (this.pc & 0xFF00) ? 1 : 0
  }

  private adc(value: number) {
    let sum = this.a + value + this.C
    this.C = sum > 0xFF ? 1 : 0
    this.V = ((this.a ^ sum) & (value ^ sum) & 0x80) !== 0 ? 1 : 0
    this.a = sum & 0xFF
    this.setZN(this.a)
  }

  private sbc(value: number) {
    let diff = this.a - value - (1 - this.C)
    this.C = diff >= 0 ? 1 : 0
    this.V = ((this.a ^ diff) & (this.a ^ value) & 0x80) !== 0 ? 1 : 0
    this.a = diff & 0xFF
    this.setZN(this.a)
  }

  private compare(register: number, value: number) {
    const result = register - value
    this.C = result >= 0 ? 1 : 0
    this.setZN(result & 0xFF)
  }

  step(): number {
    // Reset extra cycles
    this.extraCycles = 0

    // Handle NMI (highest priority)
    if (this.nmiPending) {
      this.nmiPending = false
      this.handleNMI()
      return 7 // NMI takes 7 cycles
    }

    // Handle IRQ (if interrupts not disabled)
    if (this.irqPending && !this.I) {
      this.irqPending = false
      this.handleIRQ()
      return 7
    }

    const opcode = this.read(this.pc++)
    const instruction = this.instructions.get(opcode)

    if (!instruction) {
      console.error(`Unknown opcode: 0x${opcode.toString(16).toUpperCase()} at PC: 0x${(this.pc - 1).toString(16).toUpperCase()}`)
      return 2
    }

    instruction.execute(this)
    return instruction.cycles + this.extraCycles
  }

  private handleNMI() {
    this.push16(this.pc)
    this.push(this.status & ~0x10) // Clear B flag
    this.I = 1 // Disable interrupts
    this.pc = this.read16(0xFFFA) // NMI vector
  }

  private handleIRQ() {
    this.push16(this.pc)
    this.push(this.status & ~0x10) // Clear B flag
    this.I = 1 // Disable interrupts
    this.pc = this.read16(0xFFFE) // IRQ vector
  }

  run(cycles: number): number {
    let executedCycles = 0
    while (executedCycles < cycles) {
      executedCycles += this.step()
    }
    return executedCycles
  }

  getMemory(): Uint8Array {
    return this.memory
  }

  getState() {
    return {
      a: this.a,
      x: this.x,
      y: this.y,
      sp: this.sp,
      pc: this.pc,
      status: this.status,
      nmiPending: this.nmiPending,
      irqPending: this.irqPending,
      memory: new Uint8Array(this.memory),
    }
  }

  setState(state: ReturnType<typeof this.getState>) {
    this.a = state.a
    this.x = state.x
    this.y = state.y
    this.sp = state.sp
    this.pc = state.pc
    this.status = state.status
    this.nmiPending = state.nmiPending
    this.irqPending = state.irqPending
    this.memory.set(state.memory)
  }
}
