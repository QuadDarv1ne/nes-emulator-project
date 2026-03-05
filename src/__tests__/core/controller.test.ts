import { describe, it, expect, beforeEach } from 'vitest'
import { Controller, Button } from '@/core/controller'

describe('Controller', () => {
  let controller: Controller

  beforeEach(() => {
    controller = new Controller()
  })

  describe('Button press/release', () => {
    it('should detect button press', () => {
      expect(controller.isPressed(Button.A)).toBe(false)
      controller.press(Button.A)
      expect(controller.isPressed(Button.A)).toBe(true)
    })

    it('should detect button release', () => {
      controller.press(Button.A)
      controller.release(Button.A)
      expect(controller.isPressed(Button.A)).toBe(false)
    })

    it('should handle multiple buttons', () => {
      controller.press(Button.A)
      controller.press(Button.B)
      expect(controller.isPressed(Button.A)).toBe(true)
      expect(controller.isPressed(Button.B)).toBe(true)
      expect(controller.isPressed(Button.Start)).toBe(false)
    })
  })

  describe('Shift register read', () => {
    it('should read buttons in order', () => {
      controller.press(Button.A)
      controller.press(Button.Start)
      
      // Strobe
      controller.write(0x01)
      controller.write(0x00)
      
      // Read all 8 buttons
      const reads = []
      for (let i = 0; i < 8; i++) {
        reads.push(controller.read())
      }
      
      expect(reads[Button.A]).toBe(1)
      expect(reads[Button.Start]).toBe(1)
    })

    it('should reload on strobe', () => {
      controller.press(Button.A)
      controller.write(0x01) // Strobe on
      controller.write(0x00) // Strobe off
      
      controller.read() // Read A
      controller.read() // Read B
      
      controller.write(0x01) // Strobe again
      controller.write(0x00)
      
      expect(controller.read()).toBe(1) // Should read A again
    })
  })

  describe('State save/load', () => {
    it('should save and restore state', () => {
      controller.press(Button.A)
      controller.press(Button.B)
      
      const state = controller.getState()
      const newController = new Controller()
      newController.setState(state)
      
      expect(newController.isPressed(Button.A)).toBe(true)
      expect(newController.isPressed(Button.B)).toBe(true)
    })
  })
})
