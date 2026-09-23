// IST time and clock maths.
// All time is in milliseconds since UTC epoch.

export const IST_OFFSET_MIN = 330

export interface IstParts {
  y: number
  m: number // 1-12
  d: number
  weekday: number // 0 = Sunday
  hour: number
  minute: number
  minuteOfDay: number
  date: string // 'YYYY-MM-DD'
}

export function istParts(t: number): IstParts {
  const d = new Date(t + IST_OFFSET_MIN * 60_000)
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + 1
  const day = d.getUTCDate()
  const weekday = d.getUTCDay()
  const hour = d.getUTCHours()
  const minute = d.getUTCMinutes()
  const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return {
    y,
    m,
    d: day,
    weekday,
    hour,
    minute,
    minuteOfDay: hour * 60 + minute,
    date: dateStr,
  }
}

export function istInstant(date: string, minuteOfDay: number): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d) - IST_OFFSET_MIN * 60_000 + minuteOfDay * 60_000
}

export function parseIstLocal(iso: string): number {
  const [date, time] = iso.split('T')
  return istInstant(date, hhmmToMin(time))
}

export function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function fmtHHMM(t: number): string {
  const p = istParts(t)
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
}

export function addMin(t: number, m: number): number {
  return t + m * 60_000
}

export function diffMin(a: number, b: number): number {
  return Math.round((a - b) / 60_000)
}

export function istDayStart(t: number, dayOffset = 0): number {
  const p = istParts(t)
  return istInstant(p.date, 0) + dayOffset * 24 * 60 * 60_000
}

export function roundUpTo(t: number, stepMin: number): number {
  const p = istParts(t)
  const rem = p.minuteOfDay % stepMin
  if (rem === 0) return t
  return addMin(t, stepMin - rem)
}
