import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

const LOG_FILE = path.join(process.cwd(), 'emulator.log')

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, level = 'info' } = body
    
    const timestamp = new Date().toISOString()
    const logLine = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`
    
    // Append to log file
    fs.appendFileSync(LOG_FILE, logLine)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Log API error:', error)
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 })
  }
}

export async function GET() {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return NextResponse.json({ logs: [] })
    }
    
    const content = fs.readFileSync(LOG_FILE, 'utf-8')
    const lines = content.trim().split('\n').filter(Boolean)
    
    return NextResponse.json({ logs: lines })
  } catch (error) {
    console.error('Log API error:', error)
    return NextResponse.json({ error: 'Failed to read logs' }, { status: 500 })
  }
}
