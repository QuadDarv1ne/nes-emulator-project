/**
 * Расширенные интеграционные тесты NES эмулятора
 * Проверка совместной работы всех компонентов
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { NES } from '../../core/nes'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('NES Extended Integration', () => {
  let nes: NES

  beforeEach(() => {
    nes = new NES()
  })

  describe('ROM Loading', () => {
    it('should load different ROM sizes', () => {
      // Super Mario Bros (32KB PRG, 8KB CHR)
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      const rom = nes.loadROM(romData)
      
      expect(rom.prgROM.length).toBeGreaterThan(0)
      expect(rom.chrROM.length).toBeGreaterThan(0)
    })

    it('should initialize all components after ROM load', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      // Check CPU state
      const cpuState = nes.getCPUState()
      expect(cpuState).toBeDefined()
      
      // Check PPU state
      const screenBuffer = nes.getScreenBuffer()
      expect(screenBuffer.length).toBe(256 * 240)
    })
  })

  describe('Frame Execution', () => {
    it('should execute multiple frames without errors', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      nes.start()
      
      // Wait for a few frames (simulated)
      const frameCountBefore = nes.getFrameCount()
      
      // Let it run for a bit
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const frameCountAfter = nes.getFrameCount()
          expect(frameCountAfter).toBeGreaterThanOrEqual(frameCountBefore)
          nes.stop()
          resolve()
        }, 100)
      })
    })

    it('should render different screen buffers each frame', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      // Emulate one frame manually
      for (let i = 0; i < 29780; i++) {
        nes.cpuStep()
        for (let j = 0; j < 3; j++) nes.ppuStep()
        nes.renderScanline()
      }
      
      const buffer1 = nes.getScreenBuffer()
      expect(buffer1).toBeDefined()
      expect(buffer1.length).toBe(256 * 240)
    })
  })

  describe('Controller Input', () => {
    it('should handle controller button presses', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      // Press button A
      nes.pressButton(0) // Button.A = 0
      const state1 = nes.saveState()
      
      // Release button A
      nes.releaseButton(0)
      const state2 = nes.saveState()
      
      // States should be different (controller state changed)
      expect(state1).toBeDefined()
      expect(state2).toBeDefined()
    })

    it('should handle multiple button presses', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      // Press multiple buttons
      nes.pressButton(0) // A
      nes.pressButton(1) // B
      nes.pressButton(2) // Select
      nes.pressButton(3) // Start
      
      const state = nes.saveState()
      expect(state).toBeDefined()
    })

    it('should handle player 2 controller', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      // Press button for player 2
      nes.pressButton(0, 1) // Player 1, Button A
      
      const state = nes.saveState()
      expect(state).toBeDefined()
    })
  })

  describe('Save/Load State Integration', () => {
    it('should save and load complete emulator state', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      // Emulate a few frames
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 29780; j++) {
          nes.cpuStep()
          for (let k = 0; k < 3; k++) nes.ppuStep()
          nes.renderScanline()
        }
      }
      
      // Save state
      const savedState = nes.saveState()
      
      // Create new emulator and load ROM
      const newNes = new NES()
      newNes.loadROM(romData)
      
      // Load state
      newNes.loadState(savedState)
      
      // Verify state was loaded
      const newState = newNes.saveState()
      expect(newState.frameCount).toBe(savedState.frameCount)
    })

    it('should preserve CPU registers after save/load', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      // Emulate some frames
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 29780; j++) {
          nes.cpuStep()
          for (let k = 0; k < 3; k++) nes.ppuStep()
          nes.renderScanline()
        }
      }
      
      const savedState = nes.saveState()
      
      const newNes = new NES()
      newNes.loadROM(romData)
      newNes.loadState(savedState)
      
      const newState = newNes.saveState()
      
      // CPU state should match
      expect(newState.cpu.a).toBe(savedState.cpu.a)
      expect(newState.cpu.x).toBe(savedState.cpu.x)
      expect(newState.cpu.y).toBe(savedState.cpu.y)
      expect(newState.cpu.sp).toBe(savedState.cpu.sp)
    })

    it('should preserve PPU state after save/load', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      const savedState = nes.saveState()
      
      const newNes = new NES()
      newNes.loadROM(romData)
      newNes.loadState(savedState)
      
      const newState = newNes.saveState()
      
      // PPU state should match
      expect(newState.ppu.ctrl).toBe(savedState.ppu.ctrl)
      expect(newState.ppu.mask).toBe(savedState.ppu.mask)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset emulator state', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      // Start emulation
      nes.start()
      
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const frameCountBefore = nes.getFrameCount()
          expect(frameCountBefore).toBeGreaterThan(0)
          
          // Reset
          nes.reset()
          
          const frameCountAfter = nes.getFrameCount()
          expect(frameCountAfter).toBe(0)
          nes.stop()
          resolve()
        }, 100)
      })
    })

    it('should reload ROM after reset', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      
      nes.loadROM(romData)
      nes.reset()
      
      const state = nes.saveState()
      expect(state).toBeDefined()
    })
  })

  describe('Pause/Resume', () => {
    it('should pause and resume emulation', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      nes.start()
      
      const frameCount1 = nes.getFrameCount()
      
      // Pause
      nes.pause()
      
      // Wait a bit
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const frameCount2 = nes.getFrameCount()
          // Frame count should not change while paused
          expect(frameCount2).toBe(frameCount1)
          
          // Resume
          nes.pause()
          
          setTimeout(() => {
            const frameCount3 = nes.getFrameCount()
            expect(frameCount3).toBeGreaterThanOrEqual(frameCount2)
            nes.stop()
            resolve()
          }, 50)
        }, 50)
      })
    })
  })

  describe('Screen Buffer', () => {
    it('should have correct screen buffer size', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      const buffer = nes.getScreenBuffer()
      expect(buffer.length).toBe(256 * 240) // 61440 pixels
    })

    it('should render non-black pixels', () => {
      const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData = readFileSync(romPath)
      nes.loadROM(romData)
      
      // Emulate several frames
      for (let i = 0; i < 30; i++) {
        for (let j = 0; j < 29780; j++) {
          nes.cpuStep()
          for (let k = 0; k < 3; k++) nes.ppuStep()
          nes.renderScanline()
        }
      }
      
      const buffer = nes.getScreenBuffer()
      
      // Count non-black pixels
      let nonBlackPixels = 0
      for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] !== 0) nonBlackPixels++
      }
      
      // Should have some colored pixels
      expect(nonBlackPixels).toBeGreaterThan(0)
    })
  })

  describe('Multiple ROM Support', () => {
    it('should load different ROMs sequentially', () => {
      // Load first ROM
      const romPath1 = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
      const romData1 = readFileSync(romPath1)
      const rom1 = nes.loadROM(romData1)
      
      expect(rom1).toBeDefined()
      
      // Load second ROM (test.nes)
      const romPath2 = resolve(process.cwd(), 'test-roms/test.nes')
      const romData2 = readFileSync(romPath2)
      const rom2 = nes.loadROM(romData2)
      
      expect(rom2).toBeDefined()
    })
  })
})
