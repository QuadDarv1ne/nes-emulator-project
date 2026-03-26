/**
 * Тесты для валидации ROM
 */

import { describe, it, expect } from 'vitest'
import { Cartridge } from '../../core/cartridge'

describe('Cartridge ROM Validation', () => {
  let cartridge: Cartridge

  beforeEach(() => {
    cartridge = new Cartridge()
  })

  describe('Format Validation', () => {
    it('should reject invalid iNES header', () => {
      const invalidROM = new Uint8Array([0x00, 0x00, 0x00, 0x00])
      expect(() => cartridge.load(invalidROM)).toThrow('Invalid iNES ROM format')
    })

    it('should reject ROM file smaller than 16 bytes', () => {
      const smallROM = new Uint8Array([0x4e, 0x45, 0x53, 0x1a]) // Just header
      expect(() => cartridge.load(smallROM)).toThrow('ROM file too small')
    })

    it('should accept valid iNES header', () => {
      const validROM = createMinimalROM(1, 1) // 16KB PRG, 8KB CHR
      expect(() => cartridge.load(validROM)).not.toThrow()
    })
  })

  describe('PRG ROM Size Validation', () => {
    it('should reject PRG ROM smaller than 16KB', () => {
      const rom = createMinimalROM(0, 1) // 0 * 16KB = 0 bytes
      expect(() => cartridge.load(rom)).toThrow('Invalid PRG ROM size')
    })

    it('should accept minimum PRG ROM size (16KB)', () => {
      const rom = createMinimalROM(1, 0) // 1 * 16KB
      expect(() => cartridge.load(rom)).not.toThrow()
    })

    it('should accept larger PRG ROM size (512KB)', () => {
      const rom = createMinimalROM(32, 0) // 32 * 16KB = 512KB
      expect(() => cartridge.load(rom)).not.toThrow()
    })
  })

  describe('CHR ROM Size Validation', () => {
    it('should accept ROM without CHR ROM (CHR RAM)', () => {
      const rom = createMinimalROM(1, 0) // 0 * 8KB = 0 bytes
      const loaded = cartridge.load(rom)
      expect(loaded.chrROM.length).toBe(0)
    })

    it('should accept CHR ROM up to 256KB', () => {
      const rom = createMinimalROM(1, 32) // 32 * 8KB = 256KB
      expect(() => cartridge.load(rom)).not.toThrow()
    })
  })

  describe('Truncated ROM Validation', () => {
    it('should reject truncated ROM file', () => {
      // Create ROM header claiming 32KB PRG but only provide 16KB
      const rom = createMinimalROM(1, 1) // Header says 16KB PRG
      // Truncate the ROM
      const truncated = rom.slice(0, 16 + 8000) // Cut in middle of PRG
      expect(() => cartridge.load(truncated)).toThrow('ROM file truncated')
    })
  })

  describe('Mapper Validation', () => {
    it('should accept supported mapper 0 (NROM)', () => {
      const rom = createROMWithMapper(1, 1, 0)
      const loaded = cartridge.load(rom)
      expect(loaded.mapperId).toBe(0)
    })

    it('should accept supported mapper 1 (MMC1)', () => {
      const rom = createROMWithMapper(1, 1, 1)
      const loaded = cartridge.load(rom)
      expect(loaded.mapperId).toBe(1)
    })

    it('should accept supported mapper 2 (UxROM)', () => {
      const rom = createROMWithMapper(1, 1, 2)
      const loaded = cartridge.load(rom)
      expect(loaded.mapperId).toBe(2)
    })

    it('should accept supported mapper 3 (CNROM)', () => {
      const rom = createROMWithMapper(1, 1, 3)
      const loaded = cartridge.load(rom)
      expect(loaded.mapperId).toBe(3)
    })

    it('should accept supported mapper 4 (MMC3)', () => {
      const rom = createROMWithMapper(1, 1, 4)
      const loaded = cartridge.load(rom)
      expect(loaded.mapperId).toBe(4)
    })

    it('should reject unsupported mapper', () => {
      const rom = createROMWithMapper(1, 1, 5) // Mapper 5 (MMC5) not supported
      expect(() => cartridge.load(rom)).toThrow('Unsupported mapper: 5')
    })

    it('should reject unsupported mapper 64', () => {
      const rom = createROMWithMapper(1, 1, 64)
      expect(() => cartridge.load(rom)).toThrow('Unsupported mapper: 64')
    })
  })

  describe('Trainer Validation', () => {
    it('should handle ROM with trainer (512 bytes)', () => {
      // Create ROM with trainer flag set
      const rom = createMinimalROM(1, 1)
      rom[6] |= 0x04 // Set trainer flag
      
      // Add 512 bytes trainer after header
      const romWithTrainer = new Uint8Array(16 + 512 + 16384 + 8192)
      romWithTrainer.set(rom, 0)
      // Fill trainer with dummy data
      for (let i = 0; i < 512; i++) {
        romWithTrainer[16 + i] = 0xFF
      }
      // Fill PRG and CHR
      for (let i = 0; i < 16384 + 8192; i++) {
        romWithTrainer[16 + 512 + i] = i & 0xFF
      }
      
      expect(() => cartridge.load(romWithTrainer)).not.toThrow()
    })
  })
})

// Helper function to create minimal valid ROM
function createMinimalROM(prgSize: number, chrSize: number): Uint8Array {
  const prgBytes = prgSize * 16384
  const chrBytes = chrSize * 8192
  const rom = new Uint8Array(16 + prgBytes + chrBytes)
  
  // iNES header
  rom[0] = 0x4e // 'N'
  rom[1] = 0x45 // 'E'
  rom[2] = 0x53 // 'S'
  rom[3] = 0x1a // EOF
  
  rom[4] = prgSize // PRG ROM size in 16KB units
  rom[5] = chrSize // CHR ROM size in 8KB units
  rom[6] = 0x00 // Mapper 0, vertical mirroring
  rom[7] = 0x00 // iNES 1.0
  
  // Fill PRG and CHR with pattern
  for (let i = 0; i < prgBytes + chrBytes; i++) {
    rom[16 + i] = i & 0xFF
  }
  
  return rom
}

// Helper function to create ROM with specific mapper
function createROMWithMapper(prgSize: number, chrSize: number, mapperId: number): Uint8Array {
  const rom = createMinimalROM(prgSize, chrSize)
  
  // Set mapper ID in header
  rom[6] = (mapperId << 4) & 0xF0 // Lower 4 bits of mapper
  rom[7] = mapperId & 0xF0 // Upper 4 bits of mapper
  
  return rom
}
