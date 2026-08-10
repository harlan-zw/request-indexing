export type NonNullable<T> = Exclude<T, null | undefined>
export type RequiredNonNullable<T> = Required<Exclude<T, null | undefined>>
export type WithRequired<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> }
