// Minimal NES ROM (Mapper 0, NROM)
// 16KB PRG ROM, 8KB CHR ROM
// Simple program that displays colored square

const fs = require('fs');

// iNES header (16 bytes)
const header = Buffer.alloc(16);
header.write('NES\x1a', 0); // Magic
header[4] = 1; // PRG ROM size (16KB units)
header[5] = 1; // CHR ROM size (8KB units)
header[6] = 0x00; // Mapper 0, mirroring
header[7] = 0x00; // iNES 1.0

// PRG ROM (16KB) - simple 6502 program
const prgROM = Buffer.alloc(16384);

// Reset vector points to start of code at 0xC000
// Code starts at offset 0x4000 in PRG ROM (0xC000 - 0x8000)
const codeStart = 0x4000;

// Simple infinite loop with NOP
prgROM[codeStart] = 0xEA; // NOP
prgROM[codeStart + 1] = 0xEA; // NOP
prgROM[codeStart + 2] = 0x4C; // JMP
prgROM[codeStart + 3] = 0x00; // low byte of address
prgROM[codeStart + 4] = 0xC0; // high byte of address

// Reset vector at 0xFFFC-0xFFFD (offset 0x3FFC in 16KB PRG)
prgROM.writeUInt16LE(codeStart + 0x8000, 0x3FFC);

// CHR ROM (8KB) - simple pattern data
const chrROM = Buffer.alloc(8192);

// Fill first pattern with color data
for (let i = 0; i < 16; i++) {
  chrROM[i] = 0xFF; // All pixels on
  chrROM[i + 8] = 0xFF;
}

// Create full ROM
const rom = Buffer.concat([header, prgROM, chrROM]);
fs.writeFileSync('test-roms/test.nes', rom);

console.log('Created test-roms/test.nes');
console.log('Header:', rom.slice(0, 16).toString('hex'));
console.log('Reset vector:', rom.readUInt16LE(16 + 0x3FFC).toString(16));
