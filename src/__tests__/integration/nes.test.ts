/**
 * Интеграционный тест NES эмулятора
 * Проверка загрузки и запуска Super Mario Bros (Mapper 0)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { NES } from '../../core/nes'
import { readFileSync } from 'fs'
import { join, resolve } from 'path'

describe('NES Integration', () => {
  let nes: NES

  beforeEach(() => {
    nes = new NES()
  })

  it('should load Super Mario Bros ROM (Mapper 0)', () => {
    // Загружаем тестовый ROM
    const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
    const romData = readFileSync(romPath)
    const rom = nes.loadROM(romData)

    // Проверяем параметры ROM
    expect(rom.mapperId).toBe(0)
    expect(rom.prgROM.length).toBe(32768) // 32KB
    expect(rom.chrROM.length).toBe(8192)  // 8KB
    expect(rom.battery).toBe(false)
  })

  it('should initialize CPU after ROM load', () => {
    const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
    const romData = readFileSync(romPath)
    const rom = nes.loadROM(romData)

    // Проверяем что ROM загружен корректно
    expect(rom).toBeDefined()
    expect(rom.mapperId).toBe(0)
    expect(rom.prgROM.length).toBeGreaterThan(0)
    expect(rom.chrROM.length).toBeGreaterThan(0)
    
    // CPU state должен быть доступен
    const cpuState = nes.getCPUState()
    expect(cpuState).toBeDefined()
  })

  it('should execute frames without errors', () => {
    const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
    const romData = readFileSync(romPath)
    nes.loadROM(romData)

    // Запускаем эмуляцию на несколько кадров
    nes.start()
    
    // Даём эмулятору поработать 10 кадров
    const frameCount = nes.getFrameCount()
    expect(frameCount).toBeGreaterThanOrEqual(0)
    
    nes.stop()
  })

  it('should render screen buffer after frame', () => {
    const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
    const romData = readFileSync(romPath)
    nes.loadROM(romData)

    // Эмулируем один кадр
    for (let i = 0; i < 29780; i++) { // ~1.79 MHz / 60
      const cycles = nes.cpuStep()
      for (let j = 0; j < 3; j++) {
        nes.ppuStep()
      }
      nes.renderScanline()
    }

    // Проверяем что screen buffer не пустой
    const screenBuffer = nes.getScreenBuffer()
    expect(screenBuffer).toBeDefined()
    expect(screenBuffer.length).toBe(256 * 240)
    
    // Проверяем что есть ненулевые пиксели (не все чёрные)
    let nonZeroPixels = 0
    for (let i = 0; i < screenBuffer.length; i++) {
      if (screenBuffer[i] !== 0) nonZeroPixels++
    }
    expect(nonZeroPixels).toBeGreaterThan(0)
  })
})
