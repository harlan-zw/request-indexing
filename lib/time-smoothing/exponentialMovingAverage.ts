export function exponentialMovingAverage(data: number[]): number[] {
  // we need to return the data with the values of the exponential moving average
  // for the given data
  const alpha = 2 / (data.length + 1)
  let prev = data[0]
  const result = [prev]
  for (let i = 1; i < data.length; i++) {
    prev = alpha * data[i] + (1 - alpha) * prev
    result.push(prev)
  }
  return result
}
