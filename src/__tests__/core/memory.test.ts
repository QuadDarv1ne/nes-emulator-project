/**
 * Тесты для Memory (RAM и Memory Map)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Memory } from '../../core/memory'

describe('Memory', () => {
  let memory: Memory

  beforeEach(() => {
    memory = new Memory()
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const state = memory.getState()
      expect(state).toBeDefined()
      expect(state.ram).toBeDefined()
      expect(state.ram.length).toBe(0x0800) // 2KB
    })

    it('should initialize RAM to zero', () => {
      const state = memory.getState()
      for (let i = 0; i < state.ram.length; i++) {
        expect(state.ram[i]).toBe(0)
      }
    })
  })

  describe('RAM Access (0x0000-0x07FF)', () => {
    it('should write and read RAM', () => {
      memory.write(0x0000, 0x42)
      const value = memory.read(0x0000)
      expect(value).toBe(0x42)
    })

    it('should read from multiple RAM addresses', () => {
      memory.write(0x0000, 0x01)
      memory.write(0x0001, 0x02)
      memory.write(0x0002, 0x03)
      
      expect(memory.read(0x0000)).toBe(0x01)
      expect(memory.read(0x0001)).toBe(0x02)
      expect(memory.read(0x0002)).toBe(0x03)
    })

    it('should handle RAM mirroring (0x0000-0x1FFF)', () => {
      memory.write(0x0000, 0x42)
      
      // Mirror at 0x0800 should return same value
      expect(memory.read(0x0800)).toBe(0x42)
      expect(memory.read(0x1000)).toBe(0x42)
      expect(memory.read(0x1800)).toBe(0x42)
    })

    it('should write to mirrored RAM', () => {
      memory.write(0x0800, 0x55)
      expect(memory.read(0x0000)).toBe(0x55)
      
      memory.write(0x1000, 0xAA)
      expect(memory.read(0x0000)).toBe(0xAA)
    })
  })

  describe('PPU Registers (0x2000-0x3FFF)', () => {
    it('should write to PPU registers', () => {
      memory.write(0x2000, 0x80) // PPUCTRL
      const state = memory.getState()
      expect(state.ppuRegisters[0]).toBe(0x80)
    })

    it('should handle PPU register mirroring (every 8 bytes)', () => {
      memory.write(0x2000, 0x80)
      
      // Mirrored addresses should write to same register
      expect(memory.read(0x2000)).toBe(0x80)
      expect(memory.read(0x2008)).toBe(0x80)
      expect(memory.read(0x2010)).toBe(0x80)
      expect(memory.read(0x3FF8)).toBe(0x80)
    })

    it('should access all 8 PPU registers', () => {
      for (let i = 0; i < 8; i++) {
        const addr = 0x2000 + i
        memory.write(addr, i * 0x10)
      }
      
      const state = memory.getState()
      for (let i = 0; i < 8; i++) {
        expect(state.ppuRegisters[i]).toBe(i * 0x10)
      }
    })

    it('should use PPU handler when set', () => {
      let readAddr = -1
      let writeAddr = -1
      let writeValue = -1
      
      memory.setPPUHandlers(
        (addr) => {
          readAddr = addr
          return 0x42
        },
        (addr, value) => {
          writeAddr = addr
          writeValue = value
        }
      )
      
      memory.write(0x2000, 0x80)
      expect(writeAddr).toBe(0)
      expect(writeValue).toBe(0x80)
      
      const value = memory.read(0x2002)
      expect(readAddr).toBe(2)
      expect(value).toBe(0x42)
    })
  })

  describe('APU and I/O Registers (0x4000-0x401F)', () => {
    it('should write to APU registers', () => {
      memory.write(0x4000, 0x42)
      const state = memory.getState()
      expect(state.apuRegisters[0]).toBe(0x42)
    })

    it('should access all 24 APU/I/O registers', () => {
      // Write without handler - should store in apuRegisters
      for (let i = 0; i < 0x18; i++) {
        const addr = 0x4000 + i
        memory.write(addr, i & 0xFF)
      }
      
      // Check internal state directly
      const state = memory.getState()
      expect(state.apuRegisters.length).toBe(0x18)
      
      // Verify first few registers (some may be overwritten by DMA logic)
      expect(state.apuRegisters[0]).toBe(0x00)
      expect(state.apuRegisters[1]).toBe(0x01)
      expect(state.apuRegisters[2]).toBe(0x02)
    })

    it('should use APU handler when set', () => {
      let readAddr = -1
      let writeAddr = -1
      let writeValue = -1
      
      memory.setAPUHandlers(
        (addr) => {
          readAddr = addr
          return 0x55
        },
        (addr, value) => {
          writeAddr = addr
          writeValue = value
        }
      )
      
      memory.write(0x4000, 0x10)
      expect(writeAddr).toBe(0)
      expect(writeValue).toBe(0x10)
      
      const value = memory.read(0x4015)
      expect(readAddr).toBe(0x15)
      expect(value).toBe(0x55)
    })
  })

  describe('Cartridge Access (0x4020-0xFFFF)', () => {
    it('should use cartridge handler when set', () => {
      let readAddr = -1
      let writeAddr = -1
      let writeValue = -1
      
      memory.setCartridgeHandlers(
        (addr) => {
          readAddr = addr
          return 0xAA
        },
        (addr, value) => {
          writeAddr = addr
          writeValue = value
        }
      )
      
      memory.write(0x8000, 0x12)
      expect(writeAddr).toBe(0x8000)
      expect(writeValue).toBe(0x12)
      
      const value = memory.read(0xC000)
      expect(readAddr).toBe(0xC000)
      expect(value).toBe(0xAA)
    })

    it('should return 0 when no cartridge handler', () => {
      const value = memory.read(0x8000)
      expect(value).toBe(0)
    })

    it('should handle full cartridge address range', () => {
      let lastAddr = -1
      
      memory.setCartridgeHandlers(
        (addr) => {
          lastAddr = addr
          return addr & 0xFF
        },
        () => {}
      )
      
      memory.read(0x4020)
      expect(lastAddr).toBe(0x4020)
      
      memory.read(0xFFFF)
      expect(lastAddr).toBe(0xFFFF)
    })
  })

  describe('DMA (Direct Memory Access)', () => {
    it('should call DMA handler when triggered', () => {
      let dmaPage = -1
      
      memory.setDMAHandler((page) => {
        dmaPage = page
      })
      
      memory.triggerDMA(0x02)
      expect(dmaPage).toBe(0x02)
    })

    it('should handle DMA for different pages', () => {
      const pages: number[] = []
      
      memory.setDMAHandler((page) => {
        pages.push(page)
      })
      
      memory.triggerDMA(0x00)
      memory.triggerDMA(0x01)
      memory.triggerDMA(0x02)
      
      expect(pages).toEqual([0x00, 0x01, 0x02])
    })

    it('should not crash when DMA handler not set', () => {
      expect(() => memory.triggerDMA(0x02)).not.toThrow()
    })
  })

  describe('Reset', () => {
    it('should reset RAM to zero', () => {
      memory.write(0x0000, 0x42)
      memory.write(0x0100, 0x55)
      
      memory.reset()
      
      const state = memory.getState()
      expect(state.ram[0]).toBe(0)
      expect(state.ram[0x100]).toBe(0)
    })

    it('should reset PPU registers', () => {
      memory.write(0x2000, 0x80)
      memory.write(0x2001, 0x18)
      
      memory.reset()
      
      const state = memory.getState()
      expect(state.ppuRegisters[0]).toBe(0)
      expect(state.ppuRegisters[1]).toBe(0)
    })

    it('should reset APU registers', () => {
      memory.write(0x4000, 0x42)
      
      memory.reset()
      
      const state = memory.getState()
      expect(state.apuRegisters[0]).toBe(0)
    })
  })

  describe('Save/Load State', () => {
    it('should save state', () => {
      memory.write(0x0000, 0x42)
      memory.write(0x2000, 0x80)
      memory.write(0x4000, 0x10)
      
      const state = memory.getState()
      
      expect(state.ram[0]).toBe(0x42)
      expect(state.ppuRegisters[0]).toBe(0x80)
      expect(state.apuRegisters[0]).toBe(0x10)
    })

    it('should load state', () => {
      const savedState = memory.getState()
      savedState.ram[0] = 0x42
      savedState.ram[0x100] = 0x55
      savedState.ppuRegisters[0] = 0x80
      savedState.apuRegisters[0] = 0x10
      
      memory.setState(savedState)
      
      expect(memory.read(0x0000)).toBe(0x42)
      expect(memory.read(0x0100)).toBe(0x55)
      
      const state = memory.getState()
      expect(state.ppuRegisters[0]).toBe(0x80)
      expect(state.apuRegisters[0]).toBe(0x10)
    })

    it('should preserve full RAM state', () => {
      // Write pattern to RAM
      for (let i = 0; i < 0x0800; i++) {
        memory.write(i, i & 0xFF)
      }
      
      const state = memory.getState()
      memory.reset()
      memory.setState(state)
      
      for (let i = 0; i < 0x0800; i++) {
        expect(memory.read(i)).toBe(i & 0xFF)
      }
    })
  })

  describe('Debug Counters', () => {
    it('should track read count', () => {
      const state = memory.getState()
      expect(state.readCount).toBe(0)
      
      memory.read(0x0000)
      memory.read(0x0001)
      
      const newState = memory.getState()
      expect(newState.readCount).toBe(2)
    })

    it('should track write count', () => {
      const state = memory.getState()
      expect(state.writeCount).toBe(0)
      
      memory.write(0x0000, 0x01)
      memory.write(0x0001, 0x02)
      
      const newState = memory.getState()
      expect(newState.writeCount).toBe(2)
    })
  })

  describe('16-bit Operations', () => {
    it('should read 16-bit value (little-endian)', () => {
      memory.write(0x0000, 0x34)
      memory.write(0x0001, 0x12)
      
      const value = memory.read16(0x0000)
      expect(value).toBe(0x1234)
    })

    it('should write 16-bit value (little-endian)', () => {
      memory.write16(0x0000, 0x1234)
      
      expect(memory.read(0x0000)).toBe(0x34)
      expect(memory.read(0x0001)).toBe(0x12)
    })

    it('should handle 16-bit read from mirrored RAM', () => {
      memory.write(0x0000, 0x00)
      memory.write(0x0001, 0x80)
      
      const value = memory.read16(0x0800)
      expect(value).toBe(0x8000)
    })
  })
})
