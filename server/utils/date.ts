// pacific timezone is 7 hours behind UTC, it has 3 letter abbreviation PST
export function datePST() {
  const d = new Date()
  d.setHours(d.getHours() - 7)
  return d
}
