/**
 * NES Emulator
 * Объединяет все компоненты: CPU, PPU, APU, Memory, Controller
 */

import { CPU } from './cpu'
import { PPU } from './ppu'
import { APU } from './apu'
import { Memory } from './memory'
import { Cartridge, ROM } from './cartridge'
import { Controller, Button } from './controller'

export interface EmulatorState {
  running: boolean
  paused: boolean
  fps: number
  frameCount: number
}

export interface SaveState {
  cpu: ReturnType<typeof CPU.prototype.getState>
  ppu: ReturnType<typeof PPU.prototype.getState>
  apu: ReturnType<typeof APU.prototype.getState>
  memory: ReturnType<typeof Memory.prototype.getState>
  controller1: ReturnType<typeof Controller.prototype.getState>
  controller2: ReturnType<typeof Controller.prototype.getState>
  frameCount: number
  paused: boolean
}

export class NES {
  private cpu: CPU
  private ppu: PPU
  private apu: APU
  private memory: Memory
  private cartridge: Cartridge
  private controller1: Controller
  private controller2: Controller

  private running: boolean = false
  private paused: boolean = false
  private frameCount: number = 0
  private lastTime: number = 0

  // 60 FPS target
  private readonly FPS = 60
  private readonly CYCLES_PER_FRAME = 29780 // ~1.79 MHz / 60

  constructor() {
    this.cpu = new CPU()
    this.ppu = new PPU()
    this.apu = new APU()
    this.memory = new Memory()
    this.cartridge = new Cartridge()
    this.controller1 = new Controller()
    this.controller2 = new Controller()

    this.setupMemoryHandlers()
  }

  private setupMemoryHandlers() {
    // PPU handlers
    this.memory.setPPUHandlers(
      (addr) => {
        switch (addr) {
          case 0x02: return this.ppu.readStatus()
          case 0x07: return this.ppu.readData()
          default: return 0
        }
      },
      (addr, value) => {
        switch (addr) {
          case 0x00: this.ppu.writeCtrl(value); break
          case 0x01: this.ppu.writeMask(value); break
          case 0x03: this.ppu.writeOAMAddr(value); break
          case 0x04: this.ppu.writeOAMData(value); break
          case 0x05: this.ppu.writeScroll(value); break
          case 0x06: this.ppu.writeAddress(value); break
          case 0x07: this.ppu.writeData(value); break
        }
      }
    )

    // Setup NMI handler
    this.ppu.setNMIHandler(() => {
      this.cpu.triggerNMI()
    })

    // APU handlers
    this.memory.setAPUHandlers(
      (addr) => {
        // APU register reads
        return 0
      },
      (addr, value) => {
        // APU register writes
        switch (addr) {
          case 0x00: this.apu.writePulseControl(0, value); break
          case 0x01: this.apu.writePulseControl(1, value); break
          case 0x02: this.apu.writePulseSweep(0, value); break
          case 0x03: this.apu.writePulseSweep(1, value); break
          case 0x08: this.apu.writeTriangleControl(value); break
          case 0x0C: this.apu.writeNoiseControl(value); break
          case 0x0F: this.apu.writeDMCControl(value); break
          case 0x17: this.apu.writeFrameCounter(value); break
        }
      }
    )

    // Cartridge handlers
    this.memory.setCartridgeHandlers(
      (addr) => {
        const rom = this.cartridge.getROM()
        if (!rom) return 0

        // PRG ROM mapping - support mapper 0 (NROM) and simple mappers
        if (addr >= 0x8000 && addr <= 0xFFFF) {
          const prgSize = rom.prgROM.length
          // For 16KB PRG ROM, mirror to both banks
          if (prgSize === 0x4000) {
            return rom.prgROM[addr & 0x3FFF]
          }
          // For 32KB PRG ROM, use full address space
          return rom.prgROM[addr - 0x8000]
        }
        return 0
      },
      (addr, value) => {
        // Cartridge writes (for mappers) - basic mapper 0 support
        const rom = this.cartridge.getROM()
        if (!rom || rom.mapperId !== 0) return
        
        // Mapper 0 (NROM) doesn't have bank switching
      }
    )

    // DMA handler - transfer sprite data from CPU memory to PPU
    this.memory.setDMAHandler((page) => {
      const cpuMemory = this.cpu.getMemory()
      this.ppu.writeOAMDMA(page, cpuMemory)
    })
  }

  loadROM(data: Uint8Array): ROM {
    const rom = this.cartridge.load(data)
    
    // Устанавливаем CHR ROM в PPU
    this.ppu.setCHRROM(rom.chrROM)
    
    this.cpu.reset()
    this.ppu.reset()
    this.apu.reset()
    this.memory.reset()
    this.frameCount = 0
    return rom
  }

  start() {
    this.running = true
    this.paused = false
    this.lastTime = performance.now()
    this.run()
  }

  stop() {
    this.running = false
    this.paused = false
  }

  pause() {
    this.paused = !this.paused
  }

  reset() {
    this.cpu.reset()
    this.ppu.reset()
    this.apu.reset()
    this.memory.reset()
    this.frameCount = 0
  }

  private run() {
    if (!this.running) return

    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime

    if (!this.paused) {
      // Execute one frame
      this.stepFrame()
    }

    this.lastTime = currentTime
    requestAnimationFrame(() => this.run())
  }

  private stepFrame() {
    // Execute CPU cycles for one frame
    let cyclesExecuted = 0
    while (cyclesExecuted < this.CYCLES_PER_FRAME) {
      const cycles = this.cpu.step()
      cyclesExecuted += cycles

      // Step PPU (3 cycles per CPU cycle)
      for (let i = 0; i < 3; i++) {
        const frameComplete = this.ppu.step()
        if (frameComplete) {
          this.frameCount++
        }
      }

      // Render scanline after PPU step
      this.ppu.renderScanline()

      // Step APU
      this.apu.step()
    }
  }

  // Controller input
  pressButton(button: Button, player: number = 0) {
    const controller = player === 0 ? this.controller1 : this.controller2
    controller.press(button)
  }

  releaseButton(button: Button, player: number = 0) {
    const controller = player === 0 ? this.controller1 : this.controller2
    controller.release(button)
  }

  // Get screen buffer
  getScreenBuffer(): Uint32Array {
    return this.ppu.getScreenBuffer()
  }

  // Get audio buffer
  getAudioBuffer(): Float32Array {
    return this.apu.getAudioBuffer()
  }

  // Get state
  getState(): EmulatorState {
    return {
      running: this.running,
      paused: this.paused,
      fps: this.frameCount,
      frameCount: this.frameCount,
    }
  }

  // Save state
  saveState(): SaveState {
    return {
      cpu: this.cpu.getState(),
      ppu: this.ppu.getState(),
      apu: this.apu.getState(),
      memory: this.memory.getState(),
      controller1: this.controller1.getState(),
      controller2: this.controller2.getState(),
      frameCount: this.frameCount,
      paused: this.paused,
    }
  }

  // Load state
  loadState(state: SaveState) {
    this.cpu.setState(state.cpu)
    this.ppu.setState(state.ppu)
    this.apu.setState(state.apu)
    this.memory.setState(state.memory)
    this.controller1.setState(state.controller1)
    this.controller2.setState(state.controller2)
    this.frameCount = state.frameCount
    this.paused = state.paused
  }
}
