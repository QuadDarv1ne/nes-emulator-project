/**
 * Тест Save/Load состояний NES эмулятора
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { NES } from '../../core/nes'
import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('NES Save/Load State', () => {
  let nes: NES
  let romData: Uint8Array

  beforeEach(() => {
    nes = new NES()
    const romPath = resolve(process.cwd(), 'test-roms/super-mario-bros.nes')
    romData = readFileSync(romPath)
    nes.loadROM(romData)
  })

  it('should save state', () => {
    const state = nes.saveState()
    
    expect(state).toBeDefined()
    expect(state.cpu).toBeDefined()
    expect(state.ppu).toBeDefined()
    expect(state.apu).toBeDefined()
    expect(state.memory).toBeDefined()
    expect(state.controller1).toBeDefined()
    expect(state.controller2).toBeDefined()
    expect(state.frameCount).toBeGreaterThanOrEqual(0)
    expect(state.paused).toBe(false)
  })

  it('should load state', () => {
    // Сохраняем состояние
    const state = nes.saveState()
    
    // Создаём новый эмулятор и загружаем ROM
    const newNes = new NES()
    newNes.loadROM(romData)
    
    // Загружаем сохранённое состояние
    newNes.loadState(state)
    
    // Проверяем что состояние восстановлено
    const newState = newNes.saveState()
    expect(newState.cpu.pc).toBe(state.cpu.pc)
    expect(newState.cpu.a).toBe(state.cpu.a)
    expect(newState.cpu.x).toBe(state.cpu.x)
    expect(newState.cpu.y).toBe(state.cpu.y)
  })

  it('should preserve CPU state after save/load', () => {
    // Эмулируем несколько кадров
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 29780; j++) {
        nes.cpuStep()
        for (let k = 0; k < 3; k++) nes.ppuStep()
        nes.renderScanline()
      }
    }
    
    const stateBefore = nes.saveState()
    
    // Создаём новый эмулятор
    const newNes = new NES()
    newNes.loadROM(romData)
    newNes.loadState(stateBefore)
    
    const stateAfter = newNes.saveState()
    
    // Проверяем что CPU состояние совпадает
    expect(stateAfter.cpu.pc).toBe(stateBefore.cpu.pc)
    expect(stateAfter.cpu.a).toBe(stateBefore.cpu.a)
    expect(stateAfter.cpu.sp).toBe(stateBefore.cpu.sp)
    expect(stateAfter.cpu.status).toBe(stateBefore.cpu.status)
  })

  it('should preserve PPU state after save/load', () => {
    // Эмулируем несколько кадров
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 29780; j++) {
        nes.cpuStep()
        for (let k = 0; k < 3; k++) nes.ppuStep()
        nes.renderScanline()
      }
    }
    
    const stateBefore = nes.saveState()
    
    const newNes = new NES()
    newNes.loadROM(romData)
    newNes.loadState(stateBefore)
    
    const stateAfter = newNes.saveState()
    
    // Проверяем что PPU состояние совпадает
    expect(stateAfter.ppu.ctrl).toBe(stateBefore.ppu.ctrl)
    expect(stateAfter.ppu.mask).toBe(stateBefore.ppu.mask)
    expect(stateAfter.ppu.scanline).toBe(stateBefore.ppu.scanline)
    expect(stateAfter.ppu.cycle).toBe(stateBefore.ppu.cycle)
  })
})
