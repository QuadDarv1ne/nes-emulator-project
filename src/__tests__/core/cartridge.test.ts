import { describe, it, expect, beforeEach } from 'vitest'
import { Cartridge, MirrorMode } from '@/core/cartridge'

describe('Cartridge', () => {
  let cartridge: Cartridge

  beforeEach(() => {
    cartridge = new Cartridge()
  })

  describe('iNES format', () => {
    it('should reject invalid ROM', () => {
      const invalidROM = new Uint8Array([0x00, 0x00, 0x00, 0x00])
      expect(() => cartridge.load(invalidROM)).toThrow('Invalid iNES ROM format')
    })

    it('should load valid iNES ROM', () => {
      // Minimal valid iNES header
      const romData = new Uint8Array([
        0x4E, 0x45, 0x53, 0x1A, // iNES header
        0x02, // 2 x 16KB PRG ROM
        0x01, // 1 x 8KB CHR ROM
        0x00, // Mapper 0, horizontal mirror
        0x00, // No flags
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // Padding
        // PRG ROM data
        ...new Array(32768).fill(0),
        // CHR ROM data
        ...new Array(8192).fill(0),
      ])

      const rom = cartridge.load(romData)
      
      expect(rom.prgROM.length).toBe(32768)
      expect(rom.chrROM.length).toBe(8192)
      expect(rom.mapperId).toBe(0)
      expect(rom.mirrorMode).toBe(MirrorMode.Horizontal)
    })

    it('should detect vertical mirroring', () => {
      const romData = new Uint8Array([
        0x4E, 0x45, 0x53, 0x1A,
        0x01, 0x01,
        0x01, // Vertical mirror
        0x00,
        ...new Array(12).fill(0),
        ...new Array(16384).fill(0),
        ...new Array(8192).fill(0),
      ])

      const rom = cartridge.load(romData)
      expect(rom.mirrorMode).toBe(MirrorMode.Vertical)
    })

    it('should detect mapper number', () => {
      const romData = new Uint8Array([
        0x4E, 0x45, 0x53, 0x1A,
        0x01, 0x01,
        0x10, // Mapper 1 (upper nibble)
        0x00,
        ...new Array(12).fill(0),
        ...new Array(16384).fill(0),
        ...new Array(8192).fill(0),
      ])

      const rom = cartridge.load(romData)
      expect(rom.mapperId).toBe(1)
    })

    it('should detect battery-backed ROM', () => {
      const romData = new Uint8Array([
        0x4E, 0x45, 0x53, 0x1A,
        0x01, 0x01,
        0x02, // Battery
        0x00,
        ...new Array(12).fill(0),
        ...new Array(16384).fill(0),
        ...new Array(8192).fill(0),
      ])

      const rom = cartridge.load(romData)
      expect(rom.battery).toBe(true)
    })
  })

  describe('hasROM', () => {
    it('should return false when no ROM loaded', () => {
      expect(cartridge.hasROM()).toBe(false)
    })

    it('should return true when ROM loaded', () => {
      const romData = new Uint8Array([
        0x4E, 0x45, 0x53, 0x1A,
        0x01, 0x00,
        0x00, 0x00,
        ...new Array(12).fill(0),
        ...new Array(16384).fill(0),
      ])
      cartridge.load(romData)
      expect(cartridge.hasROM()).toBe(true)
    })
  })
})
