export function simpleMovingAverage(data: number[]): number[] {
  // apply the simple moving average algorithm to the data
  const result: number[] = []
  for (let i = 0; i < data.length; i++) {
    let sum = 0
    for (let j = i; j < data.length; j++)
      sum += data[j]
    result.push(sum / (data.length - i))
  }
  return result
}
