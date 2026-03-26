/**
 * Тесты для реальных ROM
 */

import { describe, it, expect } from 'vitest'
import { NES } from '../../core/nes'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('Real ROM Tests', () => {
  let nes: NES

  beforeEach(() => {
    nes = new NES()
  })

  describe('Super Mario Bros (Mapper 0)', () => {
    it('should load Super Mario Bros ROM', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      const rom = nes.loadROM(romData)
      
      expect(rom.mapperId).toBe(0)
      expect(rom.prgROM.length).toBe(32768) // 32KB
      expect(rom.chrROM.length).toBe(8192)  // 8KB
      expect(rom.title).toBeDefined()
    })

    it('should initialize with Super Mario Bros', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      const state = nes.getState()
      expect(state).toBeDefined()
    })
  })

  describe('Contra (Mapper 2 - UxROM)', () => {
    it('should load Contra ROM', () => {
      const romPath = resolve(process.cwd(), 'test-roms/contra.nes')
      const romData = readFileSync(romPath)
      const rom = nes.loadROM(romData)
      
      expect(rom.mapperId).toBe(2) // UxROM
      expect(rom.prgROM.length).toBeGreaterThan(0)
    })

    it('should initialize with Contra', () => {
      const romPath = resolve(process.cwd(), 'test-roms/contra.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      const state = nes.getState()
      expect(state).toBeDefined()
    })
  })

  describe('Duck Tales (Mapper 2 - UxROM)', () => {
    it('should load Duck Tales ROM', () => {
      const romPath = resolve(process.cwd(), 'test-roms/ducktales.nes')
      const romData = readFileSync(romPath)
      const rom = nes.loadROM(romData)
      
      expect(rom.mapperId).toBe(2) // UxROM
      expect(rom.prgROM.length).toBeGreaterThan(0)
    })

    it('should initialize with Duck Tales', () => {
      const romPath = resolve(process.cwd(), 'test-roms/ducktales.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      const state = nes.getState()
      expect(state).toBeDefined()
    })
  })

  describe('Battle City (Mapper 0)', () => {
    it('should load Battle City ROM', () => {
      const romPath = resolve(process.cwd(), 'test-roms/battle-city.nes')
      const romData = readFileSync(romPath)
      const rom = nes.loadROM(romData)
      
      expect(rom.mapperId).toBe(0) // NROM
      expect(rom.prgROM.length).toBeGreaterThan(0)
      expect(rom.chrROM.length).toBeGreaterThan(0)
    })

    it('should initialize with Battle City', () => {
      const romPath = resolve(process.cwd(), 'test-roms/battle-city.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      const state = nes.getState()
      expect(state).toBeDefined()
    })
  })

  describe('Multiple ROM Switching', () => {
    it('should load different ROMs sequentially', () => {
      const roms = [
        'test-roms/super-mario-bros.nes',
        'test-roms/battle-city.nes',
        'test-roms/contra.nes'
      ]
      
      for (const romPath of roms) {
        const romData = readFileSync(resolve(process.cwd(), romPath))
        const rom = nes.loadROM(romData)
        expect(rom).toBeDefined()
      }
    })
  })
})
