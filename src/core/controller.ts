/**
 * NES Controller
 * 
 * Кнопки: A, B, Select, Start, Up, Down, Left, Right
 */

export enum Button {
  A = 0,
  B = 1,
  Select = 2,
  Start = 3,
  Up = 4,
  Down = 5,
  Left = 6,
  Right = 7,
}

export class Controller {
  private buttons: number = 0
  private shiftRegister: number = 0
  private strobe: boolean = false

  press(button: Button) {
    this.buttons |= (1 << button)
  }

  release(button: Button) {
    this.buttons &= ~(1 << button)
  }

  isPressed(button: Button): boolean {
    return (this.buttons & (1 << button)) !== 0
  }

  write(value: number) {
    this.strobe = (value & 0x01) !== 0
    if (this.strobe) {
      this.shiftRegister = this.buttons
    }
  }

  read(): number {
    if (this.strobe) {
      return this.buttons & 0x01
    }
    
    const result = this.shiftRegister & 0x01
    this.shiftRegister >>= 1
    return result
  }

  getState() {
    return {
      buttons: this.buttons,
      shiftRegister: this.shiftRegister,
      strobe: this.strobe,
    }
  }

  setState(state: ReturnType<typeof this.getState>) {
    this.buttons = state.buttons
    this.shiftRegister = state.shiftRegister
    this.strobe = state.strobe
  }
}
