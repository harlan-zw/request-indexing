export function formatDateGsc(d?: Date | string = new Date()) {
  if (!d)
    return d
  if (typeof d === 'string')
    return d
  // TODO
  // d.setHours(d.getHours() - 7)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

export function percentDifference(a?: number, b?: number) {
  if (!b || !a)
    return 0
  return ((a - b) / ((a + b) / 2)) * 100
}

// pacific timezone is 7 hours behind UTC, it has 3 letter abbreviation PST
export function datePST() {
  const d = new Date()
  d.setHours(d.getHours() - 7)
  // format it as yyyy:mm:dd
  return d.toISOString().split('T')[0].replace(/-/g, ':')
}
