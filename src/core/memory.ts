/**
 * NES Memory Map
 * 
 * 0x0000-0x07FF - Internal RAM (2KB, mirrored every 2KB to 0x1FFF)
 * 0x2000-0x2007 - PPU registers (mirrored every 8 bytes to 0x3FFF)
 * 0x4000-0x4017 - APU and I/O registers
 * 0x4020-0xFFFF - Cartridge space
 */

export class Memory {
  private ram: Uint8Array
  private ppuRegisters: Uint8Array
  private apuRegisters: Uint8Array
  private readCount = 0
  private writeCount = 0 // For debug logging

  // Callbacks for hardware access
  private onPPURead?: (addr: number) => number
  private onPPUWrite?: (addr: number, value: number) => void
  private onAPURead?: (addr: number) => number
  private onAPUWrite?: (addr: number, value: number) => void
  private onCartridgeRead?: (addr: number) => number
  private onCartridgeWrite?: (addr: number, value: number) => void
  private onDMA?: (page: number) => void

  constructor() {
    this.ram = new Uint8Array(0x0800) // 2KB
    this.ppuRegisters = new Uint8Array(0x08)
    this.apuRegisters = new Uint8Array(0x18)
  }

  setPPUHandlers(
    onRead: (addr: number) => number,
    onWrite: (addr: number, value: number) => void
  ) {
    this.onPPURead = onRead
    this.onPPUWrite = onWrite
  }

  setAPUHandlers(
    onRead: (addr: number) => number,
    onWrite: (addr: number, value: number) => void
  ) {
    this.onAPURead = onRead
    this.onAPUWrite = onWrite
  }

  setCartridgeHandlers(
    onRead: (addr: number) => number,
    onWrite: (addr: number, value: number) => void
  ) {
    this.onCartridgeRead = onRead
    this.onCartridgeWrite = onWrite
  }

  setDMAHandler(handler: (page: number) => void) {
    this.onDMA = handler
  }

  triggerDMA(page: number) {
    if (this.onDMA) {
      this.onDMA(page)
    }
  }

  read(addr: number): number {
    addr &= 0xFFFF
    this.readCount++

    // Mirror RAM (0x0000-0x1FFF)
    if (addr < 0x2000) {
      return this.ram[addr & 0x07FF]
    }

    // PPU registers (0x2000-0x3FFF, mirrored every 8 bytes)
    if (addr >= 0x2000 && addr < 0x4000) {
      const reg = (addr - 0x2000) & 0x07
      if (this.onPPURead) {
        return this.onPPURead(reg)
      }
      return this.ppuRegisters[reg]
    }

    // APU and I/O (0x4000-0x401F)
    if (addr >= 0x4000 && addr < 0x4020) {
      const reg = addr - 0x4000
      if (this.onAPURead) {
        return this.onAPURead(reg)
      }
      return this.apuRegisters[reg]
    }

    // Cartridge (0x4020-0xFFFF)
    if (addr >= 0x4020) {
      if (this.onCartridgeRead) {
        return this.onCartridgeRead(addr)
      }
      return 0
    }

    return 0
  }

  write(addr: number, value: number) {
    addr &= 0xFFFF
    value &= 0xFF
    this.writeCount++

    // Mirror RAM
    if (addr < 0x2000) {
      this.ram[addr & 0x07FF] = value
      return
    }

    // PPU registers (debug logging)
    if (addr >= 0x2000 && addr < 0x4000) {
      const reg = (addr - 0x2000) & 0x07
      if (this.writeCount < 50) {
        console.log(`PPU WRITE[${this.writeCount}] addr=${addr.toString(16).toUpperCase()} reg=${reg} val=${value.toString(16).padStart(2, '0')}`)
        this.writeCount++
      }
      if (this.onPPUWrite) {
        this.onPPUWrite(reg, value)
        return
      }
      this.ppuRegisters[reg] = value
      return
    }

    // APU and I/O
    if (addr >= 0x4000 && addr < 0x4020) {
      const reg = addr - 0x4000

      // OAM DMA register ($4014)
      if (reg === 0x14) {
        if (this.onDMA) {
          this.onDMA(value)
        }
        return
      }

      if (this.onAPUWrite) {
        this.onAPUWrite(reg, value)
        return
      }
      this.apuRegisters[reg] = value
      return
    }

    // Cartridge
    if (addr >= 0x4020) {
      if (this.onCartridgeWrite) {
        this.onCartridgeWrite(addr, value)
      }
    }
  }

  read16(addr: number): number {
    return this.read(addr) | (this.read(addr + 1) << 8)
  }

  write16(addr: number, value: number) {
    this.write(addr, value & 0xFF)
    this.write(addr + 1, (value >> 8) & 0xFF)
  }

  reset() {
    this.ram.fill(0)
    this.ppuRegisters.fill(0)
    this.apuRegisters.fill(0)
  }

  getState() {
    return {
      ram: new Uint8Array(this.ram),
      ppuRegisters: new Uint8Array(this.ppuRegisters),
      apuRegisters: new Uint8Array(this.apuRegisters),
      readCount: this.readCount,
      writeCount: this.writeCount,
    }
  }

  setState(state: ReturnType<typeof this.getState>) {
    this.ram.set(state.ram)
    this.ppuRegisters.set(state.ppuRegisters)
    this.apuRegisters.set(state.apuRegisters)
    this.readCount = state.readCount
    this.writeCount = state.writeCount
  }
}
