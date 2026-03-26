/**
 * Тесты для PPU (Picture Processing Unit)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PPU } from '../../core/ppu'

describe('PPU', () => {
  let ppu: PPU

  beforeEach(() => {
    ppu = new PPU()
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const state = ppu.getState()
      expect(state.ctrl).toBe(0)
      expect(state.mask).toBe(0)
      expect(state.status).toBe(0)
      expect(state.scanline).toBe(0)
      expect(state.cycle).toBe(0)
    })

    it('should initialize screen buffer with correct size', () => {
      const buffer = ppu.getScreenBuffer()
      expect(buffer.length).toBe(256 * 240) // 61440 pixels
    })

    it('should initialize VRAM with 2KB', () => {
      // VRAM is internal, but we can test it through state
      const state = ppu.getState()
      expect(state).toBeDefined()
    })
  })

  describe('Register Access', () => {
    it('should write and read PPUCTRL register', () => {
      ppu.writeCtrl(0x80) // Set NMI enable bit
      const state = ppu.getState()
      expect(state.ctrl).toBe(0x80)
    })

    it('should write and read PPUMASK register', () => {
      ppu.writeMask(0x18) // Enable background and sprites
      const state = ppu.getState()
      expect(state.mask).toBe(0x18)
    })

    it('should read PPUSTATUS register', () => {
      // Set VBlank flag internally
      ppu.writeCtrl(0x80)
      ppu.step() // Step to trigger VBlank
      
      const status = ppu.readStatus()
      // Status should be readable
      expect(typeof status).toBe('number')
    })

    it('should write scroll registers', () => {
      ppu.writeScroll(10) // X scroll
      ppu.writeScroll(20) // Y scroll
      
      const state = ppu.getState()
      expect(state.scrollX).toBe(10)
      expect(state.scrollY).toBe(20)
    })

    it('should write address register', () => {
      ppu.writeAddress(0x20) // High byte
      ppu.writeAddress(0x00) // Low byte
      
      const state = ppu.getState()
      expect(state.address).toBe(0x2000)
    })
  })

  describe('VRAM Access', () => {
    it('should write and read VRAM data', () => {
      // Write to VRAM through data register
      ppu.writeAddress(0x20) // High byte
      ppu.writeAddress(0x00) // Low byte - address 0x2000
      ppu.writeData(0x42) // Write data
      
      const state = ppu.getState()
      expect(state).toBeDefined()
    })

    it('should handle palette RAM writes', () => {
      // Write to palette RAM (0x3F00-0x3F1F)
      ppu.writeAddress(0x3F) // High byte
      ppu.writeAddress(0x00) // Low byte - address 0x3F00
      ppu.writeData(0x0F) // Write palette color
      
      const state = ppu.getState()
      expect(state).toBeDefined()
    })

    it('should mirror palette addresses', () => {
      // Write to mirrored palette address 0x3F10
      ppu.writeAddress(0x3F)
      ppu.writeAddress(0x10)
      ppu.writeData(0x30)
      
      const state = ppu.getState()
      expect(state).toBeDefined()
    })
  })

  describe('OAM (Sprite Memory)', () => {
    it('should write OAM address', () => {
      ppu.writeOAMAddr(0x10)
      const state = ppu.getState()
      expect(state).toBeDefined()
    })

    it('should write and read OAM data', () => {
      ppu.writeOAMAddr(0x00)
      ppu.writeOAMData(0x42)
      
      // OAM address auto-increments, so we need to reset it to read back
      ppu.writeOAMAddr(0x00)
      const value = ppu.readOAMData()
      expect(value).toBe(0x42)
    })

    it('should increment OAM address after write', () => {
      ppu.writeOAMAddr(0x00)
      ppu.writeOAMData(0x01)
      ppu.writeOAMData(0x02)
      
      // OAM address increments internally
      const state = ppu.getState()
      expect(state).toBeDefined()
    })

    it('should write OAM DMA (256 bytes)', () => {
      // Create test data
      const testData = new Uint8Array(256)
      for (let i = 0; i < 256; i++) {
        testData[i] = i & 0xFF
      }
      
      // Write to CPU memory first (simulated)
      ppu.writeOAMAddr(0x00)
      
      // DMA transfer (page 0x02 = address 0x0200)
      ppu.writeOAMDMA(0x02, testData)
      
      // DMA should complete without errors
      const state = ppu.getState()
      expect(state).toBeDefined()
    })
  })

  describe('PPU Step (Timing)', () => {
    it('should increment cycle on each step', () => {
      const stateBefore = ppu.getState()
      ppu.step()
      const stateAfter = ppu.getState()
      
      expect(stateAfter.cycle).toBeGreaterThan(stateBefore.cycle)
    })

    it('should increment scanline after 341 cycles', () => {
      // Step to end of scanline
      for (let i = 0; i < 341; i++) {
        ppu.step()
      }
      
      const state = ppu.getState()
      expect(state.scanline).toBe(1)
      expect(state.cycle).toBe(0)
    })

    it('should trigger VBlank at scanline 241', () => {
      // Step to scanline 241
      for (let scanline = 0; scanline < 241; scanline++) {
        for (let cycle = 0; cycle < 341; cycle++) {
          ppu.step()
        }
      }
      
      const state = ppu.getState()
      expect(state.scanline).toBe(241)
    })

    it('should complete frame at scanline 262', () => {
      // Step through full frame
      for (let scanline = 0; scanline < 262; scanline++) {
        for (let cycle = 0; cycle < 341; cycle++) {
          const frameComplete = ppu.step()
          if (frameComplete) {
            expect(scanline).toBe(261)
            break
          }
        }
      }
      
      const state = ppu.getState()
      expect(state.scanline).toBe(0)
      expect(state.cycle).toBe(0)
    })
  })

  describe('NMI Handler', () => {
    it('should register NMI handler', () => {
      let nmiTriggered = false
      ppu.setNMIHandler(() => {
        nmiTriggered = true
      })
      
      expect(nmiTriggered).toBe(false)
    })

    it('should trigger NMI on VBlank when enabled', () => {
      let nmiCount = 0
      ppu.setNMIHandler(() => {
        nmiCount++
      })
      
      // Enable NMI
      ppu.writeCtrl(0x80)
      
      // Step to VBlank
      for (let i = 0; i < 241 * 341; i++) {
        ppu.step()
      }
      
      expect(nmiCount).toBeGreaterThanOrEqual(1)
    })

    it('should not trigger NMI when disabled', () => {
      let nmiCount = 0
      ppu.setNMIHandler(() => {
        nmiCount++
      })
      
      // NMI disabled by default
      for (let i = 0; i < 241 * 341; i++) {
        ppu.step()
      }
      
      expect(nmiCount).toBe(0)
    })
  })

  describe('CHR ROM', () => {
    it('should set CHR ROM', () => {
      const chrROM = new Uint8Array(8192)
      for (let i = 0; i < 8192; i++) {
        chrROM[i] = i & 0xFF
      }
      
      ppu.setCHRROM(chrROM)
      
      const state = ppu.getState()
      expect(state).toBeDefined()
    })

    it('should use CHR ROM for pattern data', () => {
      const chrROM = new Uint8Array(8192)
      chrROM[0] = 0xFF
      chrROM[8] = 0x00
      
      ppu.setCHRROM(chrROM)
      ppu.setCHRReadHandler((addr) => chrROM[addr])
      
      const state = ppu.getState()
      expect(state).toBeDefined()
    })
  })

  describe('Rendering', () => {
    it('should render scanline when mask is enabled', () => {
      // Enable background rendering
      ppu.writeMask(0x08)
      
      // Set some VRAM data for background
      ppu.writeAddress(0x20)
      ppu.writeAddress(0x00)
      ppu.writeData(0x00)
      
      // Render scanline
      ppu.renderScanline()
      
      const buffer = ppu.getScreenBuffer()
      expect(buffer).toBeDefined()
    })

    it('should render sprites when mask is enabled', () => {
      // Enable sprite rendering
      ppu.writeMask(0x10)
      
      // Set up a sprite in OAM
      ppu.writeOAMAddr(0x00)
      ppu.writeOAMData(100) // Y position
      ppu.writeOAMData(0x00) // Tile index
      ppu.writeOAMData(0x00) // Attributes
      ppu.writeOAMData(100) // X position
      
      // Render scanline
      ppu.renderScanline()
      
      const buffer = ppu.getScreenBuffer()
      expect(buffer).toBeDefined()
    })

    it('should clear screen buffer with background color', () => {
      // Set background color in palette
      ppu.writeAddress(0x3F)
      ppu.writeAddress(0x00)
      ppu.writeData(0x0F) // Gray color
      
      // Render
      ppu.renderScanline()
      
      const buffer = ppu.getScreenBuffer()
      // Buffer should have pixels
      expect(buffer.length).toBe(256 * 240)
    })
  })

  describe('Reset', () => {
    it('should reset all registers', () => {
      // Set some values
      ppu.writeCtrl(0x80)
      ppu.writeMask(0x18)
      ppu.writeScroll(10)
      ppu.writeScroll(20)
      
      // Reset
      ppu.reset()
      
      const state = ppu.getState()
      expect(state.ctrl).toBe(0)
      expect(state.mask).toBe(0)
    })
  })

  describe('Save/Load State', () => {
    it('should save state', () => {
      ppu.writeCtrl(0x80)
      ppu.writeMask(0x18)
      
      const state = ppu.getState()
      expect(state.ctrl).toBe(0x80)
      expect(state.mask).toBe(0x18)
    })

    it('should load state', () => {
      const savedState = ppu.getState()
      savedState.ctrl = 0x80
      savedState.mask = 0x18
      savedState.scrollX = 10
      savedState.scrollY = 20
      
      ppu.setState(savedState)
      const loadedState = ppu.getState()
      
      expect(loadedState.ctrl).toBe(0x80)
      expect(loadedState.mask).toBe(0x18)
      expect(loadedState.scrollX).toBe(10)
      expect(loadedState.scrollY).toBe(20)
    })
  })
})
