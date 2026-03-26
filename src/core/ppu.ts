/**
 * NES PPU (Picture Processing Unit)
 *
 * Разрешение: 256x240
 * Спрайты: 64, размер 8x8 или 8x16
 * Палитра: 64 цвета
 *
 * Memory map:
 * - 0x0000-0x0FFF: Pattern table 0
 * - 0x1000-0x1FFF: Pattern table 1
 * - 0x2000-0x23FF: Name tables (4x960 bytes)
 * - 0x23C0-0x23FF: Attribute tables
 * - 0x3F00-0x3F1F: Palette RAM
 * - 0x3F20-0x3FFF: Palette mirrors
 */

export class PPU {
  // Registers
  private ctrl: number = 0
  private mask: number = 0
  private status: number = 0
  private scrollX: number = 0
  private scrollY: number = 0
  private address: number = 0
  private dataBuffer: number = 0

  // Memory
  private vram: Uint8Array // 2KB
  private palette: Uint8Array // 32 bytes
  private spriteMemory: Uint8Array // 256 bytes (64 sprites * 4 bytes)

  // CHR ROM from cartridge
  private chrROM: Uint8Array = new Uint8Array(0)

  // Rendering state
  private scanline: number = 0
  private cycle: number = 0
  private frameComplete: boolean = false
  private nmiOccurred: boolean = false
  private nmiOutput: boolean = false
  private nmiPending: boolean = false

  // Screen buffer (256x240 RGBA)
  private screenBuffer: Uint32Array

  // NES palette (RGB) - улучшенная цветовая палитра
  private static readonly PALETTE = [
    0x525252, 0x1d0d00, 0x001200, 0x00100b,
    0x000016, 0x060020, 0x000000, 0x000000,
    0x676767, 0x331a00, 0x0d2b00, 0x062b17,
    0x001f39, 0x0f0044, 0x000000, 0x000000,
    0xadadad, 0x583300, 0x225100, 0x125934,
    0x003d67, 0x241f6b, 0x161616, 0x000000,
    0xadadad, 0x75480f, 0x3d7518, 0x2b7556,
    0x186796, 0x403d9e, 0x4d4d4d, 0x000000,
    0xadadad, 0x8c6329, 0x5c9633, 0x4d9e75,
    0x408cb6, 0x665cc7, 0x828282, 0x000000,
    0xadadad, 0xa07948, 0x85b64d, 0x75b69e,
    0x6ba7d6, 0x8c7dd6, 0xadadad, 0x242424,
    0xadadad, 0xb0906b, 0xa7d66b, 0x9ed6b6,
    0x96c7eb, 0xb09ceb, 0xd6d6d6, 0x424242,
    0xadadad, 0xc7a78c, 0xc7eb8c, 0xc7ebc7,
    0xc7e7f7, 0xd6c7f7, 0xf7f7f7, 0x6b6b6b,
  ]

  // Timing constants
  private static readonly CYCLES_PER_SCANLINE = 341
  private static readonly SCANLINES_PER_FRAME = 262
  private static readonly VBLANK_START_SCANLINE = 241

  // Callback for NMI
  private onNMI?: () => void
  private onCHRRead?: (addr: number) => number

  constructor() {
    this.vram = new Uint8Array(0x0800) // 2KB
    this.palette = new Uint8Array(0x20) // 32 bytes
    this.spriteMemory = new Uint8Array(0x100) // 256 bytes
    this.screenBuffer = new Uint32Array(256 * 240)
  }

  setNMIHandler(handler: () => void) {
    this.onNMI = handler
  }

  setCHRROM(chrROM: Uint8Array) {
    this.chrROM = chrROM
  }

  setCHRReadHandler(handler: (addr: number) => number) {
    this.onCHRRead = handler
  }

  // Register access
  writeCtrl(value: number) {
    this.ctrl = value
    this.nmiOutput = (value & 0x80) !== 0
  }

  writeMask(value: number) {
    const oldMask = this.mask
    this.mask = value
  }

  readStatus(): number {
    const result = this.status
    this.clearVBlankFlag()
    return result
  }

  writeScroll(value: number) {
    // First write is X, second is Y
    if (this.address === 0) {
      this.scrollX = value
    } else {
      this.scrollY = value
    }
    this.address = (this.address + 1) & 1
  }

  writeAddress(value: number) {
    if (this.address === 0) {
      this.address = ((this.address & 0xFF) | (value << 8)) & 0x3FFF
    } else {
      this.address = ((this.address & 0xFF00) | value) & 0x3FFF
    }
  }

  writeData(value: number) {
    const addr = this.address & 0x3FFF
    if (addr < 0x2000) {
      // Pattern table
      this.vram[addr & 0x0FFF] = value
    } else if (addr >= 0x2000 && addr < 0x3F00) {
      // Name tables (with mirroring)
      this.vram[0x1000 + (addr & 0x0FFF)] = value
    } else if (addr >= 0x3F00 && addr < 0x4000) {
      // Palette RAM (with mirrors)
      const paletteAddr = addr & 0x1F
      // Mirror 0x3F10, 0x3F14, 0x3F18, 0x3F1C to background
      if (paletteAddr === 0x10 || paletteAddr === 0x14 || paletteAddr === 0x18 || paletteAddr === 0x1C) {
        this.palette[paletteAddr & 0x0F] = value & 0x3F
      } else {
        this.palette[paletteAddr] = value & 0x3F
      }
    }
    this.address = (this.address + 1) & 0x3FFF
  }

  readData(): number {
    const addr = this.address & 0x3FFF
    let value: number
    
    if (addr < 0x2000) {
      value = this.vram[addr & 0x0FFF]
    } else if (addr >= 0x2000 && addr < 0x3F00) {
      value = this.vram[0x1000 + (addr & 0x0FFF)]
    } else if (addr >= 0x3F00 && addr < 0x4000) {
      const paletteAddr = addr & 0x1F
      if (paletteAddr === 0x10 || paletteAddr === 0x14 || paletteAddr === 0x18 || paletteAddr === 0x1C) {
        value = this.palette[paletteAddr & 0x0F]
      } else {
        value = this.palette[paletteAddr]
      }
    } else {
      value = 0
    }

    const result = this.dataBuffer
    this.dataBuffer = value
    this.address = (this.address + 1) & 0x3FFF

    return result
  }

  writeOAMAddr(value: number) {
    this.address = value
  }

  writeOAMData(value: number) {
    this.spriteMemory[this.address] = value
    this.address = (this.address + 1) & 0xFF
  }

  readOAMData(): number {
    return this.spriteMemory[this.address]
  }

  // Sprite DMA - transfer 256 bytes from CPU memory to OAM
  // page: the page number (0x00-0xFF), actual address is page * 256
  writeOAMDMA(page: number, cpuMemory: Uint8Array) {
    const addr = (page << 8) & 0xFFFF
    for (let i = 0; i < 256; i++) {
      this.spriteMemory[i] = cpuMemory[(addr + i) & 0xFFFF]
    }
  }

  // PPU step (called every CPU cycle)
  step(): boolean {
    this.cycle++

    // 341 cycles per scanline
    if (this.cycle >= PPU.CYCLES_PER_SCANLINE) {
      this.cycle = 0
      this.scanline++

      // 262 scanlines per frame
      if (this.scanline >= PPU.SCANLINES_PER_FRAME) {
        this.scanline = 0
        this.frameComplete = true
        this.nmiPending = false
        return true // Frame complete
      }

      // VBlank starts at scanline 241
      if (this.scanline === PPU.VBLANK_START_SCANLINE) {
        this.status |= 0x80 // Set VBlank flag
        this.nmiOccurred = true
        this.nmiPending = true

        // Trigger NMI immediately if enabled
        if (this.nmiOutput && this.onNMI) {
          this.nmiPending = false
          // Debug: log NMI
          if (this.scanline < 300) {
            console.log(`PPU: VBlank NMI triggered, ctrl=${this.ctrl.toString(16)}`)
          }
          this.onNMI()
        }
      }
    }

    return false
  }

  // Trigger pending NMI (called by CPU after instruction)
  triggerNMI(): boolean {
    if (this.nmiPending && this.nmiOutput) {
      this.nmiPending = false
      return true
    }
    return false
  }

  // Clear VBlank flag (on status read)
  clearVBlankFlag() {
    this.status &= ~0x80
    this.nmiOccurred = false
  }

  // Render current scanline
  renderScanline() {
    if (this.scanline >= 0 && this.scanline < 240) {
      // Render visible scanline
      const y = this.scanline
      const baseAddr = y * 256

      // Clear line with background color from palette
      const bgColor = this.getPaletteColor(0)
      for (let x = 0; x < 256; x++) {
        this.screenBuffer[baseAddr + x] = bgColor
      }

      // Render background (проверяем бит 3 mask)
      if (this.mask & 0x08) {
        this.renderBackground(baseAddr, y)
      }

      // Render sprites (проверяем бит 4 mask)
      if (this.mask & 0x10) {
        this.renderSprites(baseAddr, y)
      }
    }
  }

  private renderBackground(baseAddr: number, scanline: number) {
    const fineX = (this.scrollX & 0x07)
    const fineY = (this.scrollY & 0x07)

    for (let tileX = 0; tileX < 32; tileX++) {
      // Calculate tile Y position with scroll
      const effectiveY = (scanline + fineY) & 0xFF
      const tileY = effectiveY >> 3

      // Get tile index from name table
      const nameTableIndex = tileY * 32 + tileX
      const tileIndex = this.vram[nameTableIndex & 0x03FF]

      // Get pattern table data for this tile
      const patternAddr = (tileIndex * 16) + (effectiveY & 7)
      
      // Read from CHR ROM/VRAM using handler if available
      let lowByte: number, highByte: number
      if (this.onCHRRead) {
        lowByte = this.onCHRRead(patternAddr)
        highByte = this.onCHRRead(patternAddr + 8)
      } else {
        const patternTable = this.chrROM.length > 0 ? this.chrROM : this.vram
        lowByte = patternTable[patternAddr & 0x1FFF]
        highByte = patternTable[(patternAddr + 8) & 0x1FFF]
      }

      // Render 8 pixels for this tile
      for (let bit = 7; bit >= 0; bit--) {
        const pixelX = (tileX * 8) + (7 - bit) - fineX
        if (pixelX < 0 || pixelX >= 256) continue

        const low = (lowByte >> bit) & 1
        const high = (highByte >> bit) & 1
        const colorIndex = (high << 1) | low

        if (colorIndex !== 0) {
          const color = this.getPaletteColor(colorIndex)
          this.screenBuffer[baseAddr + pixelX] = color
        }
      }
    }
  }

  private renderSprites(baseAddr: number, scanline: number) {
    const spriteHeight = (this.ctrl & 0x20) ? 16 : 8

    // Render sprites in reverse order (priority)
    for (let i = 63; i >= 0; i--) {
      const spriteAddr = i * 4
      const tileY = this.spriteMemory[spriteAddr]
      let tileIndex = this.spriteMemory[spriteAddr + 1]
      const attrs = this.spriteMemory[spriteAddr + 2]
      const tileX = this.spriteMemory[spriteAddr + 3]

      // Check if sprite is on this scanline
      if (scanline < tileY || scanline >= tileY + spriteHeight) continue

      const flipH = (attrs & 0x40) !== 0
      const flipV = (attrs & 0x80) !== 0
      const priority = (attrs & 0x20) !== 0 // 1 = behind background
      const paletteOffset = (attrs & 0x03) * 4

      let row = scanline - tileY
      if (flipV) {
        row = spriteHeight - 1 - row
      }

      // For 8x16 sprites, bit 4 of tileIndex selects pattern table
      let spritePatternAddr = 0
      if (spriteHeight === 16) {
        if (row > 7) {
          tileIndex = (tileIndex & 0xFE) | 1 // Bottom half (odd tile)
          row -= 8
        } else {
          tileIndex = tileIndex & 0xFE // Top half (even tile)
        }
        spritePatternAddr = (tileIndex & 0x01) ? 0x1000 : 0x0000
      }

      const patternAddr = spritePatternAddr + (tileIndex * 16) + row
      
      // Read from CHR ROM/VRAM using handler if available
      let lowByte: number, highByte: number
      if (this.onCHRRead) {
        lowByte = this.onCHRRead(patternAddr)
        highByte = this.onCHRRead(patternAddr + 8)
      } else {
        const patternTable = this.chrROM.length > 0 ? this.chrROM : this.vram
        lowByte = patternTable[patternAddr & 0x1FFF]
        highByte = patternTable[(patternAddr + 8) & 0x1FFF]
      }

      for (let bit = 7; bit >= 0; bit--) {
        const pixelX = flipH ? (tileX + bit) : (tileX + (7 - bit))
        if (pixelX < 0 || pixelX >= 256) continue

        const low = (lowByte >> bit) & 1
        const high = (highByte >> bit) & 1
        const colorIndex = (high << 1) | low

        if (colorIndex !== 0) {
          const bgPixel = this.screenBuffer[baseAddr + pixelX]
          const isBgTransparent = (bgPixel & 0xFFFFFF) === 0

          // Priority check: if sprite has priority bit set, only show if background is transparent
          if (priority && !isBgTransparent) {
            continue
          }

          const color = this.getSpritePaletteColor(colorIndex + paletteOffset)
          this.screenBuffer[baseAddr + pixelX] = color
        }
      }
    }
  }

  private getPaletteColor(index: number): number {
    const paletteIndex = this.palette[index & 0x1F] & 0x3F
    const rgb = PPU.PALETTE[paletteIndex]
    // Конвертируем 0xRRGGBB в little-endian 0xAABBGGRR
    return 0xFF000000 | ((rgb & 0xFF) << 16) | (rgb & 0xFF00) | ((rgb & 0xFF0000) >> 16)
  }

  private getSpritePaletteColor(index: number): number {
    const paletteIndex = this.palette[0x10 + (index & 0x1F)] & 0x3F
    const rgb = PPU.PALETTE[paletteIndex]
    // Конвертируем 0xRRGGBB в little-endian 0xAABBGGRR
    return 0xFF000000 | ((rgb & 0xFF) << 16) | (rgb & 0xFF00) | ((rgb & 0xFF0000) >> 16)
  }

  // Get screen buffer
  getScreenBuffer(): Uint32Array {
    return this.screenBuffer
  }

  // Reset
  reset() {
    this.ctrl = 0
    this.mask = 0
    this.status = 0
    this.scrollX = 0
    this.scrollY = 0
    this.address = 0
    this.dataBuffer = 0
    this.scanline = 0
    this.cycle = 0
    this.frameComplete = false
    this.nmiOccurred = false
    this.nmiOutput = false
    this.nmiPending = false
    this.vram.fill(0)
    
    // Инициализируем палитру значениями по умолчанию
    // Background palette (индексы 0x00-0x0F)
    this.palette[0x00] = 0x00 // Чёрный (transparent)
    this.palette[0x01] = 0x0F // Белый
    this.palette[0x02] = 0x2A // Светло-серый
    this.palette[0x03] = 0x15 // Тёмно-серый
    // Sprite palette (индексы 0x10-0x1F)
    this.palette[0x10] = 0x00 // Чёрный (transparent)
    this.palette[0x11] = 0x30 // Красный
    this.palette[0x12] = 0x20 // Зелёный
    this.palette[0x13] = 0x10 // Синий
    
    this.spriteMemory.fill(0)
    // Заполняем экран цветом фона из палитры (индекс 0)
    const bgColor = this.getPaletteColor(0)
    this.screenBuffer.fill(bgColor)
  }

  getScanline(): number {
    return this.scanline
  }

  // State
  getState() {
    return {
      ctrl: this.ctrl,
      mask: this.mask,
      status: this.status,
      scrollX: this.scrollX,
      scrollY: this.scrollY,
      address: this.address,
      dataBuffer: this.dataBuffer,
      scanline: this.scanline,
      cycle: this.cycle,
      frameComplete: this.frameComplete,
      nmiOccurred: this.nmiOccurred,
      nmiOutput: this.nmiOutput,
      nmiPending: this.nmiPending,
      vram: new Uint8Array(this.vram),
      palette: new Uint8Array(this.palette),
      spriteMemory: new Uint8Array(this.spriteMemory),
      screenBuffer: new Uint32Array(this.screenBuffer),
    }
  }

  setState(state: ReturnType<typeof this.getState>) {
    this.ctrl = state.ctrl
    this.mask = state.mask
    this.status = state.status
    this.scrollX = state.scrollX
    this.scrollY = state.scrollY
    this.address = state.address
    this.dataBuffer = state.dataBuffer
    this.scanline = state.scanline
    this.cycle = state.cycle
    this.frameComplete = state.frameComplete
    this.nmiOccurred = state.nmiOccurred
    this.nmiOutput = state.nmiOutput
    this.nmiPending = state.nmiPending
    this.vram.set(state.vram)
    this.palette.set(state.palette)
    this.spriteMemory.set(state.spriteMemory)
    this.screenBuffer.set(state.screenBuffer)
  }
}
