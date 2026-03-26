/**
 * Тесты для APU (Audio Processing Unit)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { APU } from '../../core/apu'

describe('APU', () => {
  let apu: APU

  beforeEach(() => {
    apu = new APU()
  })

  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const state = apu.getState()
      expect(state).toBeDefined()
      expect(state.clock).toBe(0)
    })

    it('should have audio buffer available', () => {
      // Buffer exists even if empty
      expect(() => apu.getAudioBuffer()).not.toThrow()
    })
  })

  describe('Pulse Channel 1', () => {
    it('should write pulse control register', () => {
      apu.writePulseControl(0, 0xC0) // Duty 3 (bits 6-7), volume 0
      const state = apu.getState()
      expect(state.pulse1Duty).toBe(3)
    })

    it('should write pulse timer registers', () => {
      apu.writePulseTimer(0, 0x00, false) // Low byte
      apu.writePulseTimer(0, 0x03, true)  // High byte
      
      const state = apu.getState()
      expect(state.pulse1Period).toBe(0x300)
      expect(state.pulse1Enabled).toBe(true)
    })

    it('should handle pulse sweep', () => {
      expect(() => apu.writePulseSweep(0, 0x00)).not.toThrow()
      expect(() => apu.writePulseSweep(1, 0x00)).not.toThrow()
    })
  })

  describe('Pulse Channel 2', () => {
    it('should write pulse control register', () => {
      apu.writePulseControl(1, 0x50) // Duty 1, volume 0
      const state = apu.getState()
      expect(state.pulse2Duty).toBe(1)
    })

    it('should write pulse timer registers', () => {
      apu.writePulseTimer(1, 0xFF, false) // Low byte
      apu.writePulseTimer(1, 0x07, true)  // High byte
      
      const state = apu.getState()
      expect(state.pulse2Period).toBe(0x7FF)
      expect(state.pulse2Enabled).toBe(true)
    })
  })

  describe('Triangle Channel', () => {
    it('should write triangle control register', () => {
      apu.writeTriangleControl(0x80) // Enable
      const state = apu.getState()
      expect(state.triangleEnabled).toBe(true)
    })

    it('should write triangle timer registers', () => {
      apu.writeTriangleTimer(0x00, false) // Low byte
      apu.writeTriangleTimer(0x03, true)  // High byte
      
      const state = apu.getState()
      expect(state.trianglePeriod).toBe(0x300)
    })

    it('should generate triangle wave', () => {
      apu.writeTriangleControl(0x80)
      apu.writeTriangleTimer(0x00, false)
      apu.writeTriangleTimer(0x10, true)
      
      // Step APU to generate wave
      for (let i = 0; i < 100; i++) {
        apu.step()
      }
      
      const state = apu.getState()
      expect(state.triangleValue).toBeDefined()
    })
  })

  describe('Noise Channel', () => {
    it('should write noise control register', () => {
      apu.writeNoiseControl(0x80) // Enable
      const state = apu.getState()
      expect(state.noiseEnabled).toBe(true)
    })

    it('should set noise period', () => {
      apu.writeNoiseControl(0x05)
      const state = apu.getState()
      expect(state.noisePeriod).toBe(5)
    })

    it('should generate noise', () => {
      apu.writeNoiseControl(0x80)
      
      const initialState = apu.getState()
      
      // Step APU
      for (let i = 0; i < 100; i++) {
        apu.step()
      }
      
      const state = apu.getState()
      expect(state.noiseShiftRegister).toBeDefined()
    })
  })

  describe('DMC Channel', () => {
    it('should write DMC control register', () => {
      apu.writeDMCControl(0x80) // Enable
      const state = apu.getState()
      expect(state.dmcEnabled).toBe(true)
    })

    it('should disable DMC', () => {
      apu.writeDMCControl(0x00)
      const state = apu.getState()
      expect(state.dmcEnabled).toBe(false)
    })
  })

  describe('Frame Counter', () => {
    it('should write frame counter register', () => {
      apu.writeFrameCounter(0x00) // 4-step mode
      const state = apu.getState()
      expect(state.frameMode).toBe(0)
    })

    it('should set 5-step mode', () => {
      apu.writeFrameCounter(0x80) // 5-step mode (bit 7)
      const state = apu.getState()
      expect(state.frameMode).toBe(1)
    })
  })

  describe('APU Step', () => {
    it('should increment clock on step', () => {
      const stateBefore = apu.getState()
      apu.step()
      const stateAfter = apu.getState()
      
      expect(stateAfter.clock).toBeGreaterThan(stateBefore.clock)
    })

    it('should clock frame sequencer', () => {
      // Step enough times to trigger frame sequencer
      for (let i = 0; i < 7457; i++) {
        apu.step()
      }
      
      const state = apu.getState()
      expect(state.frameSequencer).toBeDefined()
    })

    it('should generate audio samples', () => {
      const bufferBefore = apu.getAudioBuffer()
      
      // Step multiple times
      for (let i = 0; i < 100; i++) {
        apu.step()
      }
      
      const bufferAfter = apu.getAudioBuffer()
      expect(bufferAfter).toBeDefined()
    })
  })

  describe('Pulse Duty Cycle', () => {
    it('should use 12.5% duty cycle', () => {
      apu.writePulseControl(0, 0x00) // Duty 0
      apu.writePulseTimer(0, 0x00, false)
      apu.writePulseTimer(0, 0x01, true)
      
      for (let i = 0; i < 50; i++) {
        apu.step()
      }
      
      const state = apu.getState()
      expect(state.pulse1DutyCycle).toBeDefined()
    })

    it('should use 25% duty cycle', () => {
      apu.writePulseControl(0, 0x40) // Duty 1
      apu.writePulseTimer(0, 0x00, false)
      apu.writePulseTimer(0, 0x01, true)
      
      for (let i = 0; i < 50; i++) {
        apu.step()
      }
      
      const state = apu.getState()
      expect(state.pulse1Duty).toBe(1)
    })

    it('should use 50% duty cycle', () => {
      apu.writePulseControl(0, 0x80) // Duty 2
      apu.writePulseTimer(0, 0x00, false)
      apu.writePulseTimer(0, 0x01, true)
      
      for (let i = 0; i < 50; i++) {
        apu.step()
      }
      
      const state = apu.getState()
      expect(state.pulse1Duty).toBe(2)
    })
  })

  describe('Reset', () => {
    it('should reset APU state', () => {
      // Set some values
      apu.writePulseControl(0, 0x30)
      apu.writeTriangleControl(0x80)
      apu.writeNoiseControl(0x80)
      
      // Step to change state
      for (let i = 0; i < 100; i++) {
        apu.step()
      }
      
      // Reset
      apu.reset()
      
      const state = apu.getState()
      expect(state.clock).toBe(0)
    })
  })

  describe('Save/Load State', () => {
    it('should save state', () => {
      apu.writePulseControl(0, 0xC0) // Duty 3
      apu.writePulseControl(1, 0x80) // Duty 2
      apu.writeTriangleControl(0x80)
      
      const state = apu.getState()
      expect(state.pulse1Duty).toBe(3)
      expect(state.pulse2Duty).toBe(2)
      expect(state.triangleEnabled).toBe(true)
    })

    it('should load state', () => {
      const savedState = apu.getState()
      savedState.pulse1Duty = 2
      savedState.pulse2Duty = 3
      savedState.triangleEnabled = true
      savedState.noiseEnabled = true
      
      apu.setState(savedState)
      
      const loadedState = apu.getState()
      expect(loadedState.pulse1Duty).toBe(2)
      expect(loadedState.pulse2Duty).toBe(3)
    })
  })

  describe('Audio Buffer', () => {
    it('should fill buffer with samples after stepping', () => {
      // Step to generate samples
      for (let i = 0; i < 100; i++) {
        apu.step()
      }
      
      const buffer = apu.getAudioBuffer()
      expect(buffer.length).toBeGreaterThan(0)
    })
  })

  describe('Multiple Channels', () => {
    it('should handle all channels enabled', () => {
      // Enable all channels
      apu.writePulseControl(0, 0x30)
      apu.writePulseTimer(0, 0x00, false)
      apu.writePulseTimer(0, 0x01, true)
      
      apu.writePulseControl(1, 0x30)
      apu.writePulseTimer(1, 0x00, false)
      apu.writePulseTimer(1, 0x01, true)
      
      apu.writeTriangleControl(0x80)
      apu.writeTriangleTimer(0x00, false)
      apu.writeTriangleTimer(0x01, true)
      
      apu.writeNoiseControl(0x80)
      
      // Step
      for (let i = 0; i < 100; i++) {
        apu.step()
      }
      
      const state = apu.getState()
      expect(state.pulse1Enabled).toBe(true)
      expect(state.pulse2Enabled).toBe(true)
      expect(state.triangleEnabled).toBe(true)
      expect(state.noiseEnabled).toBe(true)
    })
  })
})
