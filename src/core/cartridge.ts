/**
 * NES Cartridge (ROM) Loader
 * Поддерживаемые форматы: iNES (.nes) v1 и v2
 * Поддерживаемые мапперы: 0 (NROM), 4 (MMC3)
 */

export interface ROM {
  title: string
  prgROM: Uint8Array
  chrROM: Uint8Array
  mapperId: number
  mirrorMode: MirrorMode
  battery: boolean
  trainer: boolean
  consoleType: number
  // MMC3 bank switching state
  prgBank?: number[]
  chrBanks?: number[]
  prgBankMode?: number
  chrBankMode?: number
  irqEnable?: boolean
  irqCounter?: number
  irqLatch?: number
  irqReload?: boolean
  // PRG RAM (battery-backed, 8KB)
  prgRAM?: Uint8Array
}

export enum MirrorMode {
  Horizontal = 0,
  Vertical = 1,
  FourScreen = 2,
  SingleScreen0 = 3,
  SingleScreen1 = 4,
}

export class Cartridge {
  private rom: ROM | null = null
  private stepCount: number = 0 // For debug logging
  private readCount: number = 0 // For debug logging
  private ppuStatusMirror: number | undefined = undefined // For pirate mapper protection

  private readPRGInternal(addr: number): number {
    if (this.rom!.mapperId === 4) {
      // Mapper 4 (MMC3): banked mapping
      const prgBanks = this.rom!.prgBank || [0, 1, 0, 0]
      const lastBank = Math.floor(this.rom!.prgROM.length / 8192) - 1

      if (addr >= 0x8000 && addr < 0xA000) {
        const bankNum = prgBanks[0]
        const bankAddr = (addr & 0x1FFF) + (bankNum * 8192)
        return this.rom!.prgROM[bankAddr & (this.rom!.prgROM.length - 1)]
      } else if (addr >= 0xA000 && addr < 0xC000) {
        const bankNum = prgBanks[1]
        const bankAddr = (addr & 0x1FFF) + (bankNum * 8192)
        return this.rom!.prgROM[bankAddr & (this.rom!.prgROM.length - 1)]
      } else if (addr >= 0xC000 && addr < 0xE000) {
        const bankNum = prgBanks[2]
        const bankAddr = (addr & 0x1FFF) + (bankNum * 8192)
        return this.rom!.prgROM[bankAddr & (this.rom!.prgROM.length - 1)]
      } else {
        // 0xE000-0xFFFF: fixed to last bank
        const bankAddr = (addr & 0x1FFF) + (lastBank * 8192)
        return this.rom!.prgROM[bankAddr & (this.rom!.prgROM.length - 1)]
      }
    }
    return 0
  }

  load(data: Uint8Array): ROM {
    // Проверка заголовка iNES
    if (data[0] !== 0x4e || data[1] !== 0x45 || data[2] !== 0x53 || data[3] !== 0x1a) {
      throw new Error('Invalid iNES ROM format')
    }

    const prgROMSize = data[4] * 16384 // 16KB units
    const chrROMSize = data[5] * 8192  // 8KB units

    const flags6 = data[6]
    const flags7 = data[7]
    const flags9 = data[9]
    const flags10 = data[10]

    // Определяем версию iNES
    const isInes2 = (flags7 & 0x0C) === 0x08

    let mapperId: number
    let mirrorMode: MirrorMode
    let battery: boolean
    let trainer: boolean
    let fourScreen: boolean
    let consoleType = 0

    if (isInes2) {
      // iNES 2.0 format
      mapperId = ((flags6 >> 4) & 0x0F) | (flags7 & 0xF0) | ((flags10 >> 4) << 8)
      mirrorMode = this.parseMirrorMode(flags6, flags10)
      battery = (flags6 & 0x02) !== 0
      trainer = (flags6 & 0x04) !== 0
      fourScreen = (flags6 & 0x08) !== 0
      consoleType = (flags10 >> 2) & 0x03
    } else {
      // iNES 1.0 format
      mapperId = ((flags6 >> 4) & 0x0F) | (flags7 & 0xF0)
      mirrorMode = (flags6 & 0x01) ? MirrorMode.Vertical : MirrorMode.Horizontal
      battery = (flags6 & 0x02) !== 0
      trainer = (flags6 & 0x04) !== 0
      fourScreen = (flags6 & 0x08) !== 0

      // Проверка на iNES 2.0 (если flags7 биты 2-3 = 10)
      if ((flags7 & 0x0C) === 0x08) {
        // Это iNES 2.0, но мы уже обработали
      }
    }

    let offset = 16

    // Пропускаем trainer (512 bytes)
    if (trainer) {
      offset += 512
    }

    // Читаем PRG ROM
    const prgROM = new Uint8Array(data.slice(offset, offset + prgROMSize))
    offset += prgROMSize

    // Читаем CHR ROM
    let chrROM = new Uint8Array(0)
    if (chrROMSize > 0) {
      chrROM = new Uint8Array(data.slice(offset, offset + chrROMSize))
      offset += chrROMSize
    }

    // Определяем final mirror mode
    const finalMirrorMode = fourScreen ? MirrorMode.FourScreen : mirrorMode

    // Извлекаем название из ROM (если есть)
    const titleBytes = data.slice(0, 16).filter(b => b !== 0)
    const title = new TextDecoder().decode(new Uint8Array(titleBytes)) || 'Unknown'

    this.rom = {
      title,
      prgROM,
      chrROM,
      mapperId,
      mirrorMode: finalMirrorMode,
      battery,
      trainer,
      consoleType,
    }

    return this.rom
  }

  private parseMirrorMode(flags6: number, flags10: number): MirrorMode {
    const mirrorBits = (flags10 >> 0) & 0x03
    switch (mirrorBits) {
      case 0: return MirrorMode.Horizontal
      case 1: return MirrorMode.Vertical
      case 2: return MirrorMode.FourScreen
      case 3: return MirrorMode.SingleScreen0
      default: return MirrorMode.Horizontal
    }
  }

  getROM(): ROM | null {
    return this.rom
  }

  hasROM(): boolean {
    return this.rom !== null
  }

  // Инициализация состояния маппера после загрузки ROM
  initializeMapperState(): void {
    if (!this.rom) return

    if (this.rom.mapperId === 4) {
      // MMC3 initialization
      // PRG banks: first two are switchable, last two are fixed
      const numPrgBanks = this.rom.prgROM.length / 8192
      this.rom.prgBank = [
        0,                    // 0x8000-0x9FFF: switchable
        1,                    // 0xA000-0xBFFF: switchable
        numPrgBanks - 2,      // 0xC000-0xDFFF: fixed to second-to-last
        numPrgBanks - 1       // 0xE000-0xFFFF: fixed to last (contains reset vector)
      ]
      this.rom.chrBanks = [0, 1, 2, 3, 4, 5, 6, 7]
      this.rom.prgBankMode = 0
      this.rom.chrBankMode = 0
      this.rom.irqEnable = false
      this.rom.irqCounter = 0
      this.rom.irqLatch = 0
      this.rom.irqReload = false
      // Initialize 8KB PRG RAM (0x6000-0x7FFF)
      this.rom.prgRAM = new Uint8Array(0x2000)
    } else if (this.rom.mapperId === 1) {
      // MMC1 initialization
      this.rom.prgBank = [0]
      this.rom.chrBanks = [0, 1]
      this.rom.mirrorMode = MirrorMode.Vertical
      this.rom.prgRAM = new Uint8Array(0x2000)
    } else if (this.rom.mapperId === 2 || this.rom.mapperId === 3) {
      // UxROM/CNROM - no bank switching state needed
    }
  }

  // Обработка записи в регистры маппера
  write(addr: number, value: number): void {
    if (!this.rom) return

    // PRG RAM write (0x6000-0x7FFF)
    if (addr >= 0x6000 && addr < 0x8000 && this.rom.prgRAM) {
      this.rom.prgRAM[addr & 0x1FFF] = value
      return
    }

    // MMC3 registers are only in range $8000-$BFFF
    // Addresses $C000-$FFFF are PRG ROM, not registers!
    if (this.rom.mapperId === 4) {
      if (addr >= 0x8000 && addr < 0xC000) {
        this.writeMMC3(addr, value)
      }
      // Ignore writes to $C000-$FFFF - this is PRG ROM space
    } else if (this.rom.mapperId === 1) {
      this.writeMMC1(addr, value)
    } else if (this.rom.mapperId === 2) {
      this.writeUXROM(addr, value)
    } else if (this.rom.mapperId === 3) {
      this.writeCNROM(addr, value)
    }
  }

  private writeMMC1(addr: number, value: number): void {
    if (!this.rom) return

    // MMC1 uses serial shift register
    if (value & 0x80) {
      // Reset: write 1 to bit 7
      this.rom.prgBankMode = 0x10
      return
    }

    // Shift in the bit
    const shiftReg = ((this.rom.prgBankMode || 0) >> 1) | ((value & 1) << 4)
    this.rom.prgBankMode = shiftReg

    // When 5 bits are collected, write to register
    if ((this.rom.prgBankMode & 0x10) === 0) {
      const reg = (addr >> 13) & 0x03
      this.writeMMC1Register(reg, shiftReg)
      this.rom.prgBankMode = 0x10 // Reset shift register
    }
  }

  private writeMMC1Register(reg: number, value: number): void {
    if (!this.rom) return

    switch (reg) {
      case 0: // Control register
        this.rom.mirrorMode = (value & 0x03) === 0 ? MirrorMode.SingleScreen0 :
                              (value & 0x03) === 1 ? MirrorMode.SingleScreen1 :
                              (value & 0x03) === 2 ? MirrorMode.Vertical : MirrorMode.Horizontal
        break
      case 1: // CHR bank 0 (4KB or 8KB)
        if (this.rom.chrBanks) this.rom.chrBanks[0] = value & 0x1F
        break
      case 2: // CHR bank 1 (4KB)
        if (this.rom.chrBanks) this.rom.chrBanks[1] = value & 0x1F
        break
      case 3: // PRG bank (16KB)
        if (this.rom.prgBank) this.rom.prgBank[0] = value & 0x0F
        break
    }
  }

  private writeUXROM(addr: number, value: number): void {
    if (!this.rom) return
    // UxROM: simple PRG bank switching
    this.rom.prgBank = [value & 0x0F]
  }

  private writeCNROM(addr: number, value: number): void {
    if (!this.rom) return
    // CNROM: simple CHR bank switching
    this.rom.chrBanks = [value & 0x03]
  }

  private writeMMC3(addr: number, value: number): void {
    if (!this.rom || !this.rom.prgBank || !this.rom.chrBanks) return

    // MMC3 registers are selected by A12-A14 (bits 12-14 of address)
    // and A0 (bit 0) determines even/odd
    // $8000-$9FFF: A12=0, $A000-$BFFF: A12=1, etc.
    // Register select: bits 12-14 give us the register number
    const register = (addr >> 12) & 0x07

    // Debug logging for first 100 writes
    if (this.stepCount < 100) {
      console.log(`MMC3[${this.stepCount}] addr=${addr.toString(16).toUpperCase()} reg=${register} odd=${(addr & 1)} val=${value.toString(16).padStart(2, '0')}`)
      this.stepCount++
    }

    if ((addr & 0x0001) === 0) {
      // Even register: select bank data
      switch (register) {
        case 0: // Bank 0 (2KB CHR)
          this.rom.chrBanks[0] = value & 0xFE
          break
        case 1: // Bank 1 (2KB CHR)
          this.rom.chrBanks[1] = value & 0xFE
          break
        case 2: // Bank 2 (1KB CHR)
          this.rom.chrBanks[2] = value
          break
        case 3: // Bank 3 (1KB CHR)
          this.rom.chrBanks[3] = value
          break
        case 4: // Bank 4 (1KB CHR)
          this.rom.chrBanks[4] = value
          break
        case 5: // Bank 5 (1KB CHR)
          this.rom.chrBanks[5] = value
          break
        case 6: // PRG bank 0 (8KB)
          this.rom.prgBank[0] = value & (this.rom.prgROM.length / 8192 - 1)
          break
        case 7: // PRG bank 1 (8KB)
          this.rom.prgBank[1] = value & (this.rom.prgROM.length / 8192 - 1)
          break
      }
    } else {
      // Odd register: mirror/IRQ control
      switch (register) {
        case 0: // Mirror/CHR mode
          this.rom.mirrorMode = (value & 0x01) ? MirrorMode.Vertical : MirrorMode.Horizontal
          this.rom.chrBankMode = (value >> 7) & 0x01
          break
        case 1: // PRG bank mode
          this.rom.prgBankMode = (value >> 6) & 0x01
          break
        case 2: // IRQ latch
          this.rom.irqLatch = value
          break
        case 3: // IRQ reload
          this.rom.irqReload = true
          this.rom.irqCounter = 0
          break
        case 4: // IRQ disable
          this.rom.irqEnable = false
          break
        case 5: // IRQ enable
          this.rom.irqEnable = true
          break
        case 6: // IRQ clear
          this.rom.irqCounter = 0
          break
      }
    }
  }

  // Set PPU status mirror for pirate mapper protection
  setPPUStatusMirror(value: number) {
    this.ppuStatusMirror = value
  }

  // MMC3 IRQ counter step (called on each scanline during visible rendering)
  // MMC3 IRQ behavior is complex - it triggers on A12 transitions from PPU
  // For simplicity, we use scanline-based mode which works for most games
  stepIRQ(scanline: number): boolean {
    if (!this.rom || this.rom.mapperId !== 4) return false

    // Only decrement during pre-render and visible scanlines (0-239)
    // This is a simplification of the A12 toggle behavior
    if (scanline > 239) return false

    if (this.rom.irqReload) {
      // Reload counter from latch (happens on next A12 transition)
      this.rom.irqCounter = this.rom.irqLatch || 0
      this.rom.irqReload = false
      // Debug: log reload
      if (this.stepCount < 200) {
        console.log(`MMC3 IRQ: reload counter=${this.rom.irqCounter}, enable=${this.rom.irqEnable}`)
        this.stepCount++
      }
      return false
    }

    // Decrement counter
    this.rom.irqCounter = ((this.rom.irqCounter || 0) - 1) & 0xFF

    // Trigger IRQ when counter reaches 0
    if (this.rom.irqCounter === 0 && this.rom.irqEnable) {
      if (this.stepCount < 200) {
        console.log(`MMC3 IRQ: TRIGGERED at scanline=${scanline}`)
        this.stepCount++
      }
      return true
    }

    return false
  }

  // Чтение из PRG ROM с учетом bank switching
  readPRG(addr: number): number {
    if (!this.rom) return 0

    // PRG RAM read (0x6000-0x7FFF)
    if (addr >= 0x6000 && addr < 0x8000 && this.rom.prgRAM) {
      return this.rom.prgRAM[addr & 0x1FFF]
    }

    // Pirate mapper protection: mirror PPU status at $E000-$FFFF
    // Some pirate ROMs (like Aladdin Russia) expect VBlank flag here
    if (addr >= 0xE000 && this.ppuStatusMirror !== undefined) {
      return this.ppuStatusMirror
    }

    // Debug: log reads from $E000-$FFFF
    if (addr >= 0xE000 && this.readCount < 50) {
      const value = this.readPRGInternal(addr)
      console.log(`PRG READ[${this.readCount}] addr=${addr.toString(16).toUpperCase()} val=${value.toString(16).padStart(2, '0')}`)
      this.readCount++
      return value
    }

    if (this.rom.mapperId === 0) {
      // Mapper 0 (NROM): simple mapping
      // PRG ROM mapped to 0x8000-0xFFFF
      // 16KB: 0x8000-0xBFFF (mirrored to 0xC000-0xFFFF)
      // 32KB: 0x8000-0xFFFF (full range)
      if (addr < 0x8000) {
        // Mirror for addresses below 0x8000
        return this.readPRG(addr + 0x8000)
      }
      const offset = addr - 0x8000
      if (this.rom.prgROM.length === 16384) {
        // 16KB: mirror to fit
        return this.rom.prgROM[offset & 0x3FFF]
      } else {
        // 32KB: direct mapping
        return this.rom.prgROM[offset & 0x7FFF]
      }
    } else if (this.rom.mapperId === 1) {
      // Mapper 1 (MMC1): 16KB PRG bank
      const bank = this.rom.prgBank ? this.rom.prgBank[0] : 0
      const bankAddr = (addr & 0x3FFF) + (bank * 16384)
      return this.rom.prgROM[bankAddr & (this.rom.prgROM.length - 1)]
    } else if (this.rom.mapperId === 2) {
      // Mapper 2 (UxROM): 16KB PRG bank at 0x8000-0xBFFF, fixed at 0xC000-0xFFFF
      if (addr < 0xC000) {
        const bank = this.rom.prgBank ? this.rom.prgBank[0] : 0
        const bankAddr = (addr & 0x3FFF) + (bank * 16384)
        return this.rom.prgROM[bankAddr & (this.rom.prgROM.length - 1)]
      } else {
        // Last 16KB fixed
        const bankAddr = (addr & 0x3FFF) + (this.rom.prgROM.length - 16384)
        return this.rom.prgROM[bankAddr & (this.rom.prgROM.length - 1)]
      }
    } else if (this.rom.mapperId === 3) {
      // Mapper 3 (CNROM): no PRG banking, same as NROM
      if (this.rom.prgROM.length === 16384) {
        return this.rom.prgROM[addr & 0x3FFF]
      } else {
        return this.rom.prgROM[addr - 0x8000]
      }
    } else if (this.rom.mapperId === 4) {
      // Mapper 4 (MMC3): banked mapping
      // PRG banks: [0]=0x8000-0x9FFF, [1]=0xA000-0xBFFF, [2]=0xC000-0xDFFF, [3]=0xE000-0xFFFF (fixed)
      const prgBanks = this.rom.prgBank || [0, 1, 0, 0]
      const lastBank = Math.floor(this.rom.prgROM.length / 8192) - 1

      if (addr >= 0x8000 && addr < 0xA000) {
        const bankNum = prgBanks[0]
        const bankAddr = (addr & 0x1FFF) + (bankNum * 8192)
        return this.rom.prgROM[bankAddr & (this.rom.prgROM.length - 1)]
      } else if (addr >= 0xA000 && addr < 0xC000) {
        const bankNum = prgBanks[1]
        const bankAddr = (addr & 0x1FFF) + (bankNum * 8192)
        return this.rom.prgROM[bankAddr & (this.rom.prgROM.length - 1)]
      } else if (addr >= 0xC000 && addr < 0xE000) {
        const bankNum = prgBanks[2]
        const bankAddr = (addr & 0x1FFF) + (bankNum * 8192)
        return this.rom.prgROM[bankAddr & (this.rom.prgROM.length - 1)]
      } else {
        // 0xE000-0xFFFF: fixed to last bank
        const bankAddr = (addr & 0x1FFF) + (lastBank * 8192)
        return this.rom.prgROM[bankAddr & (this.rom.prgROM.length - 1)]
      }
    }

    // Default fallback
    return this.rom.prgROM[addr & 0x7FFF]
  }

  // Чтение из CHR ROM с учетом bank switching
  readCHR(addr: number): number {
    if (!this.rom) return 0

    if (this.rom.mapperId === 0 || this.rom.mapperId === 2) {
      // Mapper 0/2: direct access (no CHR banking)
      if (this.rom.chrROM.length === 0) return 0
      return this.rom.chrROM[addr & 0x1FFF]
    } else if (this.rom.mapperId === 1) {
      // Mapper 1 (MMC1): 4KB or 8KB CHR banks
      if (this.rom.chrROM.length === 0) return 0
      const chrBanks = this.rom.chrBanks || [0, 1]
      if (addr < 0x1000) {
        return this.rom.chrROM[(chrBanks[0] * 4096 + addr) & (this.rom.chrROM.length - 1)]
      } else {
        return this.rom.chrROM[(chrBanks[1] * 4096 + addr - 0x1000) & (this.rom.chrROM.length - 1)]
      }
    } else if (this.rom.mapperId === 3) {
      // Mapper 3 (CNROM): simple 8KB CHR bank
      if (this.rom.chrROM.length === 0) return 0
      const chrBank = this.rom.chrBanks ? this.rom.chrBanks[0] : 0
      return this.rom.chrROM[(chrBank * 8192 + addr) & (this.rom.chrROM.length - 1)]
    } else if (this.rom.mapperId === 4) {
      // Mapper 4 (MMC3): complex CHR banking
      if (this.rom.chrROM.length === 0) return 0
      const chrBanks = this.rom.chrBanks || [0, 1, 2, 3, 4, 5, 6, 7]

      if (addr < 0x0400) {
        return this.rom.chrROM[(chrBanks[0] * 2048 + addr) & (this.rom.chrROM.length - 1)]
      } else if (addr < 0x0800) {
        return this.rom.chrROM[(chrBanks[1] * 2048 + addr - 0x0400) & (this.rom.chrROM.length - 1)]
      } else if (addr < 0x0C00) {
        return this.rom.chrROM[(chrBanks[2] * 1024 + addr - 0x0800) & (this.rom.chrROM.length - 1)]
      } else if (addr < 0x1000) {
        return this.rom.chrROM[(chrBanks[3] * 1024 + addr - 0x0C00) & (this.rom.chrROM.length - 1)]
      } else if (addr < 0x1400) {
        return this.rom.chrROM[(chrBanks[4] * 1024 + addr - 0x1000) & (this.rom.chrROM.length - 1)]
      } else if (addr < 0x1800) {
        return this.rom.chrROM[(chrBanks[5] * 1024 + addr - 0x1400) & (this.rom.chrROM.length - 1)]
      } else if (addr < 0x1C00) {
        return this.rom.chrROM[(chrBanks[6] * 1024 + addr - 0x1800) & (this.rom.chrROM.length - 1)]
      } else {
        return this.rom.chrROM[(chrBanks[7] * 1024 + addr - 0x1C00) & (this.rom.chrROM.length - 1)]
      }
    }

    return 0
  }
}
