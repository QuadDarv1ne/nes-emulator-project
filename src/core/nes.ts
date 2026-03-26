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

    // Устанавливаем memory interface в CPU для доступа к cartridge
    this.cpu.setMemoryInterface({
      read: (addr) => this.memory.read(addr),
      write: (addr, value) => this.memory.write(addr, value),
      read16: (addr) => this.memory.read16(addr),
      write16: (addr, value) => this.memory.write16(addr, value),
    })

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

    // PPU CHR read handler (для MMC3 bank switching)
    this.ppu.setCHRReadHandler((addr) => {
      return this.cartridge.readCHR(addr)
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
        // Чтение из PRG ROM через cartridge
        return this.cartridge.readPRG(addr)
      },
      (addr, value) => {
        // Запись в регистры маппера (для MMC3 bank switching)
        this.cartridge.write(addr, value)
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

    // Инициализируем состояние маппера (для MMC3)
    this.cartridge.initializeMapperState()

    // Устанавливаем CHR ROM в PPU
    this.ppu.setCHRROM(rom.chrROM)

    // Сбрасываем memory и CPU
    this.memory.reset()
    this.cpu.reset()
    this.ppu.reset()
    this.apu.reset()
    this.frameCount = 0

    // Debug: проверяем reset vector и первые байты кода
    // Читаем reset vector из PRG ROM (адреса 0xFFFC-0xFFFF в CPU memory map)
    const resetLow = this.cartridge.readPRG(0xFFFC)
    const resetHigh = this.cartridge.readPRG(0xFFFD)
    const resetAddr = (resetLow | (resetHigh << 8)) & 0xFFFF

    // Читаем первые 8 байт кода по адресу reset
    const codeBytes: number[] = []
    for (let i = 0; i < 8; i++) {
      codeBytes.push(this.cartridge.readPRG((resetAddr + i) & 0x7FFF))
    }

    console.log(`Mapper ${rom.mapperId}: Reset=${resetAddr.toString(16).toUpperCase()}, Code=${codeBytes.map(b => b.toString(16).padStart(2, '0')).join(' ')}`)
    console.log(`PRG: ${rom.prgROM.length}, CHR: ${rom.chrROM.length}, Banks: ${rom.prgROM.length / 8192}`)
    console.log(`Battery: ${rom.battery}, Mirror: ${rom.mirrorMode}, PRG RAM: ${rom.prgRAM ? 'yes' : 'no'}`)

    return rom
  }

  start() {
    if (typeof window === 'undefined') return
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
    if (!this.running || typeof window === 'undefined') return

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

      // Render scanline once per CPU cycle
      this.ppu.renderScanline()

      // MMC3 IRQ step on each scanline (after rendering)
      // Pass current scanline for proper timing
      const irqTriggered = this.cartridge.stepIRQ(this.ppu.getScanline())
      if (irqTriggered) {
        this.cpu.triggerIRQ()
        // Debug: log IRQ
        if (this.frameCount < 5) {
          console.log(`MMC3 IRQ triggered at scanline=${this.ppu.getScanline()}`)
        }
      }

      // Step APU
      this.apu.step()
    }
    
    // Debug: каждые 60 кадров выводим состояние PPU
    if (this.frameCount > 0 && this.frameCount % 60 === 0) {
      const ppuState = this.ppu.getState()
      console.log(`PPU: scanline=${ppuState.scanline}, cycle=${ppuState.cycle}, mask=${ppuState.mask.toString(16)}, ctrl=${ppuState.ctrl.toString(16)}`)
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

  // Get CPU state (for tests)
  getCPUState() {
    return this.cpu.getState()
  }

  // Get frame count (for tests)
  getFrameCount() {
    return this.frameCount
  }

  // Step CPU (for tests)
  cpuStep() {
    return this.cpu.step()
  }

  // Step PPU (for tests)
  ppuStep() {
    return this.ppu.step()
  }

  // Render scanline (for tests)
  renderScanline() {
    this.ppu.renderScanline()
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
