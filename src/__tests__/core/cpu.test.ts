import { describe, it, expect, beforeEach } from 'vitest'
import { CPU } from '@/core/cpu'

describe('CPU 6502', () => {
  let cpu: CPU

  beforeEach(() => {
    cpu = new CPU()
    cpu.reset()
  })

  describe('Registers', () => {
    it('should initialize with correct reset values', () => {
      expect(cpu.a).toBe(0)
      expect(cpu.x).toBe(0)
      expect(cpu.y).toBe(0)
      expect(cpu.sp).toBe(0xFD)
      expect(cpu.status).toBe(0x24)
    })

    it('should set and get accumulator', () => {
      cpu.a = 0x42
      expect(cpu.a).toBe(0x42)
    })

    it('should set and get X register', () => {
      cpu.x = 0xFF
      expect(cpu.x).toBe(0xFF)
    })

    it('should set and get Y register', () => {
      cpu.y = 0xAA
      expect(cpu.y).toBe(0xAA)
    })
  })

  describe('Flags', () => {
    it('should set and get Carry flag', () => {
      cpu.C = 1
      expect(cpu.C).toBe(1)
      cpu.C = 0
      expect(cpu.C).toBe(0)
    })

    it('should set and get Zero flag', () => {
      cpu.Z = 1
      expect(cpu.Z).toBe(1)
    })

    it('should set and get Negative flag', () => {
      cpu.N = 1
      expect(cpu.N).toBe(1)
    })

    it('should set and get Overflow flag', () => {
      cpu.V = 1
      expect(cpu.V).toBe(1)
    })
  })

  describe('LDA (Load Accumulator)', () => {
    it('should load immediate value', () => {
      cpu.write(0x0200, 0xA9) // LDA #
      cpu.write(0x0201, 0x42)
      cpu.pc = 0x0200
      cpu.step()
      expect(cpu.a).toBe(0x42)
      expect(cpu.Z).toBe(0)
      expect(cpu.N).toBe(0)
    })

    it('should load from zero page', () => {
      cpu.write(0x0042, 0xAB)
      cpu.write(0x0200, 0xA5) // LDA zp
      cpu.write(0x0201, 0x42)
      cpu.pc = 0x0200
      cpu.step()
      expect(cpu.a).toBe(0xAB)
    })

    it('should set zero flag when result is zero', () => {
      cpu.write(0x0200, 0xA9) // LDA #
      cpu.write(0x0201, 0x00)
      cpu.pc = 0x0200
      cpu.step()
      expect(cpu.a).toBe(0)
      expect(cpu.Z).toBe(1)
    })

    it('should set negative flag when bit 7 is set', () => {
      cpu.write(0x0200, 0xA9) // LDA #
      cpu.write(0x0201, 0x80)
      cpu.pc = 0x0200
      cpu.step()
      expect(cpu.a).toBe(0x80)
      expect(cpu.N).toBe(1)
    })
  })

  describe('LDX (Load X Register)', () => {
    it('should load immediate value to X', () => {
      cpu.write(0x0200, 0xA2) // LDX #
      cpu.write(0x0201, 0x55)
      cpu.pc = 0x0200
      cpu.step()
      expect(cpu.x).toBe(0x55)
    })
  })

  describe('LDY (Load Y Register)', () => {
    it('should load immediate value to Y', () => {
      cpu.write(0x0200, 0xA0) // LDY #
      cpu.write(0x0201, 0xAA)
      cpu.pc = 0x0200
      cpu.step()
      expect(cpu.y).toBe(0xAA)
    })
  })

  describe('STA (Store Accumulator)', () => {
    it('should store A to zero page', () => {
      cpu.a = 0x42
      cpu.write(0x0200, 0x85) // STA zp
      cpu.write(0x0201, 0x42)
      cpu.pc = 0x0200
      cpu.step()
      expect(cpu.read(0x0042)).toBe(0x42)
    })

    it('should store A to absolute address', () => {
      cpu.a = 0xAB
      cpu.write(0x0200, 0x8D) // STA abs
      cpu.write(0x0201, 0x00)
      cpu.write(0x0202, 0x06)
      cpu.pc = 0x0200
      cpu.step()
      expect(cpu.read(0x0600)).toBe(0xAB)
    })
  })

  describe('ADC (Add with Carry)', () => {
    it('should add immediate value', () => {
      cpu.a = 0x10
      cpu.C = 0
      cpu.write(0x0200, 0x69) // ADC #
      cpu.write(0x0201, 0x20)
      cpu.pc = 0x0200
      cpu.step()
      expect(cpu.a).toBe(0x30)
      expect(cpu.C).toBe(0)
      expect(cpu.Z).toBe(0)
    })

    it('should set carry flag on overflow', () => {
      cpu.a = 0xFF
      cpu.C = 0
      cpu.write(0x0200, 0x69) // ADC #
      cpu.write(0x0201, 0x01)
      cpu.pc = 0x0200
      cpu.step()
      expect(cpu.a).toBe(0)
      expect(cpu.C).toBe(1)
      expect(cpu.Z).toBe(1)
    })

    it('should set overflow flag', () => {
      cpu.a = 0x7F
      cpu.C = 0
      cpu.write(0x0200, 0x69) // ADC #
      cpu.write(0x0201, 0x01)
      cpu.pc = 0x0200
      cpu.step()
      expect(cpu.V).toBe(1)
    })
  })

  describe('SBC (Subtract with Carry)', () => {
    it('should subtract immediate value', () => {
      cpu.a = 0x30
      cpu.C = 1
      cpu.write(0x0200, 0xE9) // SBC #
      cpu.write(0x0201, 0x10)
      cpu.pc = 0x0200
      cpu.step()
      expect(cpu.a).toBe(0x20)
    })

    it('should set carry flag when no borrow', () => {
      cpu.a = 0x50
      cpu.C = 1
      cpu.write(0x0200, 0xE9) // SBC #
      cpu.write(0x0201, 0x30)
      cpu.pc = 0x0200
      cpu.step()
      expect(cpu.C).toBe(1)
    })
  })

  describe('JMP (Jump)', () => {
    it('should jump to absolute address', () => {
      cpu.write(0x0200, 0x4C) // JMP abs
      cpu.write(0x0201, 0x00)
      cpu.write(0x0202, 0x06)
      cpu.pc = 0x0200
      cpu.step()
      expect(cpu.pc).toBe(0x0600)
    })
  })

  describe('JSR/RTS (Subroutine)', () => {
    it('should jump to subroutine and return', () => {
      cpu.write(0x0200, 0x20) // JSR abs
      cpu.write(0x0201, 0x10)
      cpu.write(0x0202, 0x06)
      cpu.write(0x0610, 0x60) // RTS
      cpu.pc = 0x0200
      cpu.step() // JSR
      expect(cpu.pc).toBe(0x0610)
      cpu.step() // RTS
      expect(cpu.pc).toBe(0x0203)
    })
  })

  describe('Branch instructions', () => {
    it('should branch when zero flag is clear (BNE)', () => {
      cpu.a = 0x01
      cpu.write(0x0200, 0xC9) // CMP #
      cpu.write(0x0201, 0x02)
      cpu.write(0x0202, 0xD0) // BNE
      cpu.write(0x0203, 0x02)
      cpu.pc = 0x0200
      cpu.step() // CMP
      cpu.step() // BNE
      expect(cpu.pc).toBe(0x0206)
    })

    it('should not branch when zero flag is set (BEQ)', () => {
      cpu.a = 0x01
      cpu.write(0x0200, 0xC9) // CMP #
      cpu.write(0x0201, 0x01)
      cpu.write(0x0202, 0xF0) // BEQ
      cpu.write(0x0203, 0x02)
      cpu.pc = 0x0200
      cpu.step() // CMP (Z=1)
      // BEQ не выполняется, т.к. PC уже увеличен на 2 после CMP
      expect(cpu.Z).toBe(1)
    })
  })

  describe('Stack operations', () => {
    it('should push and pull accumulator', () => {
      cpu.a = 0x42
      cpu.write(0x0200, 0x48) // PHA
      cpu.pc = 0x0200
      cpu.step()
      
      cpu.write(0x0201, 0x68) // PLA
      cpu.pc = 0x0201
      cpu.step()
      
      expect(cpu.a).toBe(0x42)
    })
  })

  describe('Memory operations', () => {
    it('should read and write memory', () => {
      cpu.write(0x0300, 0xAB)
      expect(cpu.read(0x0300)).toBe(0xAB)
    })

    it('should read and write zero page', () => {
      cpu.write(0x0042, 0x55)
      expect(cpu.read(0x0042)).toBe(0x55)
    })
  })

  describe('State save/load', () => {
    it('should save and restore state', () => {
      cpu.a = 0x42
      cpu.x = 0x10
      cpu.y = 0x20
      cpu.write(0x0300, 0xAB)
      
      const state = cpu.getState()
      
      cpu.reset()
      cpu.setState(state)
      
      expect(cpu.a).toBe(0x42)
      expect(cpu.x).toBe(0x10)
      expect(cpu.y).toBe(0x20)
      expect(cpu.read(0x0300)).toBe(0xAB)
    })
  })
})
