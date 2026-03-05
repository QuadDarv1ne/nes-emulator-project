/**
 * NES Cartridge (ROM) Loader
 * Поддерживаемые форматы: iNES (.nes)
 */

export interface ROM {
  title: string
  prgROM: Uint8Array
  chrROM: Uint8Array
  mapperId: number
  mirrorMode: MirrorMode
  battery: boolean
}

export enum MirrorMode {
  Horizontal = 0,
  Vertical = 1,
  FourScreen = 2,
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

    const mapperId = ((flags6 >> 4) & 0x0F) | (flags7 & 0xF0)
    const mirrorMode = (flags6 & 0x01) ? MirrorMode.Vertical : MirrorMode.Horizontal
    const battery = (flags6 & 0x02) !== 0
    const trainer = (flags6 & 0x04) !== 0
    const fourScreen = (flags6 & 0x08) !== 0

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
    }

    // Определяем four-screen mirror
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
    }

    return this.rom
  }

  getROM(): ROM | null {
    return this.rom
  }

  hasROM(): boolean {
    return this.rom !== null
  }
}
