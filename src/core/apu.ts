/**
 * NES APU (Audio Processing Unit)
 *
 * 5 звуковых каналов:
 * - 2x Pulse wave (square wave)
 * - 1x Triangle wave
 * - 1x Noise
 * - 1x DMC (Delta Modulation Channel)
 *
 * CPU: 1.789796 MHz
 * Sample rate: 44100 Hz
 */

export class APU {
  // Pulse channel 1
  private pulse1Duty: number = 0
  private pulse1Period: number = 0
  private pulse1Volume: number = 0
  private pulse1Enabled: boolean = false
  private pulse1DutyCycle: number = 0
  private pulse1Timer: number = 0
  private pulse1Envelope: number = 0
  private pulse1EnvelopeVolume: number = 15

  // Pulse channel 2
  private pulse2Duty: number = 0
  private pulse2Period: number = 0
  private pulse2Volume: number = 0
  private pulse2Enabled: boolean = false
  private pulse2DutyCycle: number = 0
  private pulse2Timer: number = 0
  private pulse2Envelope: number = 0
  private pulse2EnvelopeVolume: number = 15

  // Triangle channel
  private trianglePeriod: number = 0
  private triangleEnabled: boolean = false
  private triangleCounter: number = 0
  private triangleValue: number = 0
  private triangleLinearCounter: number = 0

  // Noise channel
  private noisePeriod: number = 0
  private noiseEnabled: boolean = false
  private noiseShiftRegister: number = 1
  private noiseTimer: number = 0
  private noiseEnvelope: number = 0
  private noiseEnvelopeVolume: number = 15

  // DMC channel
  private dmcEnabled: boolean = false

  // Audio output
  private sampleRate: number = 44100
  private buffer: Float32Array
  private bufferIndex: number = 0

  // Clock (CPU cycles)
  private clock: number = 0
  private frameMode: number = 0
  private frameSequencer: number = 0

  // Duty tables
  private static readonly DUTY_TABLE = [
    [0, 1, 0, 0, 0, 0, 0, 0], // 12.5%
    [0, 1, 1, 0, 0, 0, 0, 0], // 25%
    [0, 1, 1, 1, 1, 0, 0, 0], // 50%
    [1, 0, 0, 1, 1, 1, 1, 1], // 75% inverted
  ]

  // Triangle wave table
  private static readonly TRIANGLE_TABLE = [
    15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
  ]

  // Noise period table
  private static readonly NOISE_PERIODS = [
    4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072
  ]

  constructor() {
    this.buffer = new Float32Array(this.sampleRate / 60)
  }

  // Register writes
  writePulseControl(channel: number, value: number) {
    const duty = (value >> 6) & 0x03
    if (channel === 0) {
      this.pulse1Duty = duty
      this.pulse1Volume = value & 0x0F
    } else {
      this.pulse2Duty = duty
      this.pulse2Volume = value & 0x0F
    }
  }

  writePulseSweep(channel: number, value: number) {
    // Sweep unit (not fully implemented)
  }

  writePulseTimer(channel: number, value: number, isHigh: boolean) {
    if (channel === 0) {
      if (isHigh) {
        this.pulse1Period = ((value & 0x07) << 8) | (this.pulse1Period & 0xFF)
        this.pulse1Enabled = true
      } else {
        this.pulse1Period = (this.pulse1Period & 0x700) | value
      }
    } else {
      if (isHigh) {
        this.pulse2Period = ((value & 0x07) << 8) | (this.pulse2Period & 0xFF)
        this.pulse2Enabled = true
      } else {
        this.pulse2Period = (this.pulse2Period & 0x700) | value
      }
    }
  }

  writeTriangleControl(value: number) {
    this.triangleEnabled = (value & 0x80) !== 0
  }

  writeTriangleTimer(value: number, isHigh: boolean) {
    if (isHigh) {
      this.trianglePeriod = ((value & 0x07) << 8) | (this.trianglePeriod & 0xFF)
    } else {
      this.trianglePeriod = (this.trianglePeriod & 0x700) | value
    }
  }

  writeNoiseControl(value: number) {
    this.noiseEnabled = (value & 0x80) !== 0
    this.noisePeriod = value & 0x0F
  }

  writeNoiseTimer(value: number) {
    // Noise timer (not fully implemented)
  }

  writeDMCControl(value: number) {
    this.dmcEnabled = (value & 0x80) !== 0
  }

  writeFrameCounter(value: number) {
    this.frameMode = (value >> 7) & 0x01
  }

  // Step APU (called every CPU cycle)
  step(): void {
    this.clock++

    // Frame sequencer (every 7457 CPU cycles)
    if (this.clock % 7457 === 0) {
      this.clockFrame()
    }

    // Clock pulse channel timers
    if (this.pulse1Enabled && this.pulse1Period > 0) {
      this.pulse1Timer++
      if (this.pulse1Timer >= (this.pulse1Period + 1) * 2) {
        this.pulse1Timer = 0
        this.pulse1DutyCycle = (this.pulse1DutyCycle + 1) & 7
      }
    }

    if (this.pulse2Enabled && this.pulse2Period > 0) {
      this.pulse2Timer++
      if (this.pulse2Timer >= (this.pulse2Period + 1) * 2) {
        this.pulse2Timer = 0
        this.pulse2DutyCycle = (this.pulse2DutyCycle + 1) & 7
      }
    }

    // Clock triangle timer
    if (this.triangleEnabled && this.trianglePeriod > 0) {
      this.triangleCounter++
      if (this.triangleCounter >= this.trianglePeriod + 1) {
        this.triangleCounter = 0
        this.triangleValue = (this.triangleValue + 1) & 31
      }
    }

    // Clock noise timer
    if (this.noiseEnabled) {
      this.noiseTimer++
      const noisePeriod = APU.NOISE_PERIODS[this.noisePeriod & 0x0F]
      if (this.noiseTimer >= noisePeriod) {
        this.noiseTimer = 0
        // Shift register
        const b1 = this.noiseShiftRegister & 1
        const b6 = (this.noiseShiftRegister >> 6) & 1
        this.noiseShiftRegister >>= 1
        this.noiseShiftRegister |= (b1 ^ b6) << 14
      }
    }

    // Generate audio sample
    this.generateSample()
  }

  private clockFrame() {
    this.frameSequencer++
    this.frameSequencer &= 7

    // Clock envelopes and linear counter based on frame sequencer step
    switch (this.frameSequencer) {
      case 0:
      case 2:
      case 4:
      case 6:
        this.clockEnvelope(0)
        this.clockEnvelope(1)
        this.clockEnvelope(3)
        break
      case 3:
        this.clockEnvelope(0)
        this.clockEnvelope(1)
        this.clockEnvelope(3)
        this.clockLinearCounter()
        break
      case 7:
        this.clockEnvelope(0)
        this.clockEnvelope(1)
        this.clockEnvelope(3)
        this.clockLinearCounter()
        if (this.frameMode === 0) {
          // 4-step mode: trigger IRQ
        }
        break
    }
  }

  private clockEnvelope(channel: number) {
    // Simplified envelope clocking
    switch (channel) {
      case 0:
        if (this.pulse1Envelope > 0) {
          this.pulse1Envelope--
        } else {
          this.pulse1Envelope = 15
        }
        break
      case 1:
        if (this.pulse2Envelope > 0) {
          this.pulse2Envelope--
        } else {
          this.pulse2Envelope = 15
        }
        break
      case 3:
        if (this.noiseEnvelope > 0) {
          this.noiseEnvelope--
        } else {
          this.noiseEnvelope = 15
        }
        break
    }
  }

  private clockLinearCounter() {
    if (this.triangleLinearCounter > 0) {
      this.triangleLinearCounter--
    }
  }

  private generateSample() {
    let pulseOut = 0
    let tndOut = 0

    // Pulse waves
    if (this.pulse1Enabled) {
      const duty = APU.DUTY_TABLE[this.pulse1Duty][this.pulse1DutyCycle]
      if (duty) {
        pulseOut += this.pulse1EnvelopeVolume
      }
    }

    if (this.pulse2Enabled) {
      const duty = APU.DUTY_TABLE[this.pulse2Duty][this.pulse2DutyCycle]
      if (duty) {
        pulseOut += this.pulse2EnvelopeVolume
      }
    }

    // Triangle
    if (this.triangleEnabled && this.triangleLinearCounter > 0) {
      tndOut += APU.TRIANGLE_TABLE[this.triangleValue] * 3
    }

    // Noise
    if (this.noiseEnabled) {
      const noiseBit = this.noiseShiftRegister & 1
      if (noiseBit) {
        tndOut += this.noiseEnvelopeVolume * 2
      }
    }

    // DMC (simplified)
    if (this.dmcEnabled) {
      tndOut += 24
    }

    // TND mixer (non-linear)
    const tndSample = 163.67 / (8128 / tndOut + 100)

    // Pulse mixer (non-linear)
    const pulseSample = 95.52 / (8128 / pulseOut + 100)

    // Combined sample
    let sample = (pulseSample + tndSample) / 95.0

    // Normalize to [-1, 1]
    sample = Math.max(-1, Math.min(1, sample))

    // Add to buffer
    if (this.bufferIndex < this.buffer.length) {
      this.buffer[this.bufferIndex++] = sample
    }
  }

  // Get audio buffer
  getAudioBuffer(): Float32Array {
    const buffer = this.buffer.slice(0, this.bufferIndex)
    this.bufferIndex = 0
    return buffer
  }

  // Reset
  reset() {
    this.pulse1Duty = 0
    this.pulse1Period = 0
    this.pulse1Volume = 0
    this.pulse1Enabled = false
    this.pulse1DutyCycle = 0
    this.pulse1Timer = 0
    this.pulse1Envelope = 0
    this.pulse1EnvelopeVolume = 15
    this.pulse2Duty = 0
    this.pulse2Period = 0
    this.pulse2Volume = 0
    this.pulse2Enabled = false
    this.pulse2DutyCycle = 0
    this.pulse2Timer = 0
    this.pulse2Envelope = 0
    this.pulse2EnvelopeVolume = 15
    this.trianglePeriod = 0
    this.triangleEnabled = false
    this.triangleCounter = 0
    this.triangleValue = 0
    this.triangleLinearCounter = 0
    this.noisePeriod = 0
    this.noiseEnabled = false
    this.noiseShiftRegister = 1
    this.noiseTimer = 0
    this.noiseEnvelope = 0
    this.noiseEnvelopeVolume = 15
    this.dmcEnabled = false
    this.clock = 0
    this.frameMode = 0
    this.frameSequencer = 0
    this.buffer.fill(0)
    this.bufferIndex = 0
  }

  // State
  getState() {
    return {
      pulse1Duty: this.pulse1Duty,
      pulse1Period: this.pulse1Period,
      pulse1Volume: this.pulse1Volume,
      pulse1Enabled: this.pulse1Enabled,
      pulse1DutyCycle: this.pulse1DutyCycle,
      pulse1Timer: this.pulse1Timer,
      pulse1Envelope: this.pulse1Envelope,
      pulse1EnvelopeVolume: this.pulse1EnvelopeVolume,
      pulse2Duty: this.pulse2Duty,
      pulse2Period: this.pulse2Period,
      pulse2Volume: this.pulse2Volume,
      pulse2Enabled: this.pulse2Enabled,
      pulse2DutyCycle: this.pulse2DutyCycle,
      pulse2Timer: this.pulse2Timer,
      pulse2Envelope: this.pulse2Envelope,
      pulse2EnvelopeVolume: this.pulse2EnvelopeVolume,
      trianglePeriod: this.trianglePeriod,
      triangleEnabled: this.triangleEnabled,
      triangleCounter: this.triangleCounter,
      triangleValue: this.triangleValue,
      triangleLinearCounter: this.triangleLinearCounter,
      noisePeriod: this.noisePeriod,
      noiseEnabled: this.noiseEnabled,
      noiseShiftRegister: this.noiseShiftRegister,
      noiseTimer: this.noiseTimer,
      noiseEnvelope: this.noiseEnvelope,
      noiseEnvelopeVolume: this.noiseEnvelopeVolume,
      dmcEnabled: this.dmcEnabled,
      clock: this.clock,
      frameMode: this.frameMode,
      frameSequencer: this.frameSequencer,
      buffer: new Float32Array(this.buffer),
      bufferIndex: this.bufferIndex,
    }
  }

  setState(state: ReturnType<typeof this.getState>) {
    this.pulse1Duty = state.pulse1Duty
    this.pulse1Period = state.pulse1Period
    this.pulse1Volume = state.pulse1Volume
    this.pulse1Enabled = state.pulse1Enabled
    this.pulse1DutyCycle = state.pulse1DutyCycle
    this.pulse1Timer = state.pulse1Timer
    this.pulse1Envelope = state.pulse1Envelope
    this.pulse1EnvelopeVolume = state.pulse1EnvelopeVolume
    this.pulse2Duty = state.pulse2Duty
    this.pulse2Period = state.pulse2Period
    this.pulse2Volume = state.pulse2Volume
    this.pulse2Enabled = state.pulse2Enabled
    this.pulse2DutyCycle = state.pulse2DutyCycle
    this.pulse2Timer = state.pulse2Timer
    this.pulse2Envelope = state.pulse2Envelope
    this.pulse2EnvelopeVolume = state.pulse2EnvelopeVolume
    this.trianglePeriod = state.trianglePeriod
    this.triangleEnabled = state.triangleEnabled
    this.triangleCounter = state.triangleCounter
    this.triangleValue = state.triangleValue
    this.triangleLinearCounter = state.triangleLinearCounter
    this.noisePeriod = state.noisePeriod
    this.noiseEnabled = state.noiseEnabled
    this.noiseShiftRegister = state.noiseShiftRegister
    this.noiseTimer = state.noiseTimer
    this.noiseEnvelope = state.noiseEnvelope
    this.noiseEnvelopeVolume = state.noiseEnvelopeVolume
    this.dmcEnabled = state.dmcEnabled
    this.clock = state.clock
    this.frameMode = state.frameMode
    this.frameSequencer = state.frameSequencer
    this.buffer.set(state.buffer)
    this.bufferIndex = state.bufferIndex
  }
}
