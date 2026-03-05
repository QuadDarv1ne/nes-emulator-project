/**
 * NES Cartridge (ROM) Loader
 * Поддерживаемые форматы: iNES (.nes) v1 и v2
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
}
