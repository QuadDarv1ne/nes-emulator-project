/**
 * NES APU (Audio Processing Unit)
 * 
 * 5 звуковых каналов:
 * - 2x Pulse wave
 * - 1x Triangle wave
 * - 1x Noise
 * - 1x DMC (Delta Modulation Channel)
 */

export class APU {
  // Pulse channel 1
  private pulse1Duty: number = 0
  private pulse1Period: number = 0
  private pulse1Volume: number = 0
  private pulse1Enabled: boolean = false

  // Pulse channel 2
  private pulse2Duty: number = 0
  private pulse2Period: number = 0
  private pulse2Volume: number = 0
  private pulse2Enabled: boolean = false

  // Triangle channel
  private trianglePeriod: number = 0
  private triangleEnabled: boolean = false

  // Noise channel
  private noisePeriod: number = 0
  private noiseEnabled: boolean = false

  // DMC channel
  private dmcEnabled: boolean = false

  // Audio output
  private sampleRate: number = 44100
  private buffer: Float32Array
  private bufferIndex: number = 0

  // Clock
  private clock: number = 0
  private frameMode: number = 0

  constructor() {
    this.buffer = new Float32Array(this.sampleRate / 60) // 1 frame of audio
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

  // Step APU
  step(): void {
    this.clock++
    
    // Frame counter (240 Hz or 120 Hz)
    const framePeriod = this.frameMode ? 1 : 2
    
    if (this.clock % framePeriod === 0) {
      this.clockFrame()
    }
    
    // Generate audio sample
    this.generateSample()
  }

  private clockFrame() {
    // Frame sequencer (not fully implemented)
  }

  private generateSample() {
    let sample = 0.0
    
    // Pulse waves
    if (this.pulse1Enabled) {
      sample += this.pulse1Volume / 15.0 * 0.5
    }
    if (this.pulse2Enabled) {
      sample += this.pulse2Volume / 15.0 * 0.5
    }
    
    // Triangle wave
    if (this.triangleEnabled) {
      sample += 0.3
    }
    
    // Noise
    if (this.noiseEnabled) {
      sample += 0.2
    }
    
    // DMC
    if (this.dmcEnabled) {
      sample += 0.1
    }
    
    // Normalize and add to buffer
    sample = Math.max(-1, Math.min(1, sample))
    
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
    this.pulse2Duty = 0
    this.pulse2Period = 0
    this.pulse2Volume = 0
    this.pulse2Enabled = false
    this.trianglePeriod = 0
    this.triangleEnabled = false
    this.noisePeriod = 0
    this.noiseEnabled = false
    this.dmcEnabled = false
    this.clock = 0
    this.frameMode = 0
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
      pulse2Duty: this.pulse2Duty,
      pulse2Period: this.pulse2Period,
      pulse2Volume: this.pulse2Volume,
      pulse2Enabled: this.pulse2Enabled,
      trianglePeriod: this.trianglePeriod,
      triangleEnabled: this.triangleEnabled,
      noisePeriod: this.noisePeriod,
      noiseEnabled: this.noiseEnabled,
      dmcEnabled: this.dmcEnabled,
      clock: this.clock,
      frameMode: this.frameMode,
      buffer: new Float32Array(this.buffer),
      bufferIndex: this.bufferIndex,
    }
  }

  setState(state: ReturnType<typeof this.getState>) {
    this.pulse1Duty = state.pulse1Duty
    this.pulse1Period = state.pulse1Period
    this.pulse1Volume = state.pulse1Volume
    this.pulse1Enabled = state.pulse1Enabled
    this.pulse2Duty = state.pulse2Duty
    this.pulse2Period = state.pulse2Period
    this.pulse2Volume = state.pulse2Volume
    this.pulse2Enabled = state.pulse2Enabled
    this.trianglePeriod = state.trianglePeriod
    this.triangleEnabled = state.triangleEnabled
    this.noisePeriod = state.noisePeriod
    this.noiseEnabled = state.noiseEnabled
    this.dmcEnabled = state.dmcEnabled
    this.clock = state.clock
    this.frameMode = state.frameMode
    this.buffer.set(state.buffer)
    this.bufferIndex = state.bufferIndex
  }
}
