export function haptic(pattern: number | number[] = 12) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern)
    }
  } catch (e) {
    // ignore
  }
}
