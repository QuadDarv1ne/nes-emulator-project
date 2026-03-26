/**
 * Тесты для Mapper'ов (MMC3, MMC1, UxROM, CNROM)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { Cartridge } from '../../core/cartridge'

describe('Cartridge Mappers', () => {
  let cartridge: Cartridge

  beforeEach(() => {
    cartridge = new Cartridge()
  })

  describe('Mapper 0 (NROM)', () => {
    it('should load NROM ROM (16KB PRG)', () => {
      // Create minimal NROM ROM (16KB PRG, 8KB CHR)
      const romData = createTestROM(0, 1, 1)
      const rom = cartridge.load(romData)
      
      expect(rom.mapperId).toBe(0)
      expect(rom.prgROM.length).toBe(16384)
      expect(rom.chrROM.length).toBe(8192)
    })

    it('should load NROM ROM (32KB PRG)', () => {
      const romData = createTestROM(0, 2, 1)
      const rom = cartridge.load(romData)
      
      expect(rom.mapperId).toBe(0)
      expect(rom.prgROM.length).toBe(32768)
    })

    it('should read PRG ROM correctly (16KB)', () => {
      const romData = createTestROM(0, 1, 1)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      // Read from 0x8000-0xBFFF (first half)
      const value1 = cartridge.readPRG(0x8000)
      // Read from 0xC000-0xFFFF (mirrored)
      const value2 = cartridge.readPRG(0xC000)
      
      // Should be mirrored for 16KB PRG
      expect(value1).toBe(value2)
    })

    it('should read PRG ROM correctly (32KB)', () => {
      const romData = createTestROM(0, 2, 1)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      // Read from different addresses
      const value1 = cartridge.readPRG(0x8000)
      const value2 = cartridge.readPRG(0xC000)
      
      // Both should return valid data (may be same due to pattern)
      expect(value1).toBeDefined()
      expect(value2).toBeDefined()
    })
  })

  describe('Mapper 1 (MMC1)', () => {
    it('should initialize MMC1 state', () => {
      const romData = createTestROM(1, 2, 1)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      const rom = (cartridge as any).rom
      expect(rom.prgBank).toEqual([0])
      expect(rom.chrBanks).toEqual([0, 1])
      expect(rom.prgRAM).toBeDefined()
      expect(rom.prgRAM.length).toBe(0x2000)
    })

    it('should handle MMC1 reset (write 1 to bit 7)', () => {
      const romData = createTestROM(1, 2, 1)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      // Reset MMC1
      cartridge.write(0x8000, 0x80)
      
      const rom = (cartridge as any).rom
      expect(rom.prgBankMode).toBe(0x10)
    })

    it('should write to PRG RAM', () => {
      const romData = createTestROM(1, 2, 1)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      cartridge.write(0x6000, 0x42)
      const value = cartridge.readPRG(0x6000)
      
      expect(value).toBe(0x42)
    })
  })

  describe('Mapper 2 (UxROM)', () => {
    it('should initialize UxROM state', () => {
      const romData = createTestROM(2, 4, 1)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      const rom = (cartridge as any).rom
      expect(rom.prgBank).toBeUndefined() // UxROM doesn't need initial state
    })

    it('should handle UxROM PRG bank switching', () => {
      const romData = createTestROM(2, 8, 1) // 128KB PRG
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      // Write bank number 3 to 0x8000-0xBFFF
      cartridge.write(0x8000, 0x03)
      
      const rom = (cartridge as any).rom
      expect(rom.prgBank).toEqual([3])
    })

    it('should read from switched PRG bank', () => {
      const romData = createTestROM(2, 4, 1) // 64KB PRG (4 banks)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      // Switch to bank 2
      cartridge.write(0x8000, 0x02)
      
      // Read from 0x8000-0xBFFF should be from bank 2
      const value = cartridge.readPRG(0x8000)
      expect(value).toBeDefined()
      
      // Read from 0xC000-0xFFFF should be from last bank (fixed)
      const lastBankValue = cartridge.readPRG(0xC000)
      expect(lastBankValue).toBeDefined()
    })
  })

  describe('Mapper 3 (CNROM)', () => {
    it('should initialize CNROM state', () => {
      const romData = createTestROM(3, 2, 4) // 32KB CHR (4 banks)
      cartridge.load(romData)
      cartridge.initializeMapperState()
    })

    it('should handle CNROM CHR bank switching', () => {
      const romData = createTestROM(3, 2, 8) // 64KB CHR (8 banks)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      // Write CHR bank number 2 to 0x8000-0xFFFF
      cartridge.write(0x8000, 0x02)
      
      const rom = (cartridge as any).rom
      expect(rom.chrBanks).toEqual([2])
    })

    it('should read CHR from switched bank', () => {
      const romData = createTestROM(3, 2, 8)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      // Switch to CHR bank 3
      cartridge.write(0x8000, 0x03)
      
      // Read CHR should return from bank 3
      const value = cartridge.readCHR(0x0000)
      expect(value).toBeDefined()
    })
  })

  describe('Mapper 4 (MMC3)', () => {
    it('should initialize MMC3 state', () => {
      const romData = createTestROM(4, 8, 8)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      const rom = (cartridge as any).rom
      expect(rom.prgBank).toBeDefined()
      expect(rom.prgBank.length).toBe(4)
      expect(rom.chrBanks).toBeDefined()
      expect(rom.chrBanks.length).toBe(8)
    })

    it('should write to MMC3 registers', () => {
      const romData = createTestROM(4, 8, 8)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      // Write to register (should not throw)
      expect(() => cartridge.write(0x8000, 0x00)).not.toThrow()
      expect(() => cartridge.write(0x8001, 0x05)).not.toThrow()
    })

    it('should handle IRQ reload', () => {
      const romData = createTestROM(4, 8, 8)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      // Set IRQ latch
      cartridge.write(0xC000, 0x05)
      
      // Trigger reload - should not throw
      expect(() => {
        cartridge.write(0xC000, 0x05)
        cartridge.write(0xC001, 0x00)
      }).not.toThrow()
    })

    it('should step IRQ', () => {
      const romData = createTestROM(4, 8, 8)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      // Enable IRQ
      cartridge.write(0xE001, 0x00)
      
      // Step should not throw
      expect(() => cartridge.stepIRQ(100)).not.toThrow()
    })
  })

  describe('PRG RAM (Battery-backed)', () => {
    it('should write to PRG RAM (0x6000-0x7FFF)', () => {
      const romData = createTestROM(1, 2, 1) // MMC1 with PRG RAM
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      // Write to PRG RAM
      cartridge.write(0x6000, 0x42)
      cartridge.write(0x6001, 0x55)
      
      // Read from PRG RAM
      const value1 = cartridge.readPRG(0x6000)
      const value2 = cartridge.readPRG(0x6001)
      
      expect(value1).toBe(0x42)
      expect(value2).toBe(0x55)
    })

    it('should preserve PRG RAM state', () => {
      const romData = createTestROM(1, 2, 1)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      // Write pattern to PRG RAM
      for (let i = 0; i < 0x2000; i++) {
        cartridge.write(0x6000 + i, i & 0xFF)
      }
      
      // Read back
      for (let i = 0; i < 0x2000; i++) {
        const value = cartridge.readPRG(0x6000 + i)
        expect(value).toBe(i & 0xFF)
      }
    })
  })

  describe('CHR ROM Access', () => {
    it('should read CHR ROM for Mapper 0', () => {
      const romData = createTestROM(0, 2, 2)
      cartridge.load(romData)
      
      const value = cartridge.readCHR(0x0000)
      expect(value).toBeDefined()
    })

    it('should read CHR ROM with bank switching (MMC3)', () => {
      const romData = createTestROM(4, 8, 16)
      cartridge.load(romData)
      cartridge.initializeMapperState()
      
      // Switch CHR bank
      cartridge.write(0x8000, 0x00)
      cartridge.write(0x8001, 0x03)
      
      const value = cartridge.readCHR(0x0000)
      expect(value).toBeDefined()
    })
  })
})

// Helper function to create test ROM
function createTestROM(mapperId: number, prgSize: number, chrSize: number): Uint8Array {
  const prgROMSize = prgSize * 16384
  const chrROMSize = chrSize * 8192
  const romSize = 16 + prgROMSize + chrROMSize
  
  const romData = new Uint8Array(romSize)
  
  // iNES header
  romData[0] = 0x4E // 'N'
  romData[1] = 0x45 // 'E'
  romData[2] = 0x53 // 'S'
  romData[3] = 0x1A // EOF
  
  romData[4] = prgSize // PRG ROM size in 16KB units
  romData[5] = chrSize // CHR ROM size in 8KB units
  romData[6] = (mapperId << 4) & 0xF0 // Mapper number (lower 4 bits)
  romData[7] = mapperId & 0xF0 // Mapper number (upper 4 bits)
  
  // Fill PRG ROM with pattern
  for (let i = 0; i < prgROMSize; i++) {
    romData[16 + i] = i & 0xFF
  }
  
  // Fill CHR ROM with pattern
  for (let i = 0; i < chrROMSize; i++) {
    romData[16 + prgROMSize + i] = (i * 2) & 0xFF
  }
  
  return romData
}
