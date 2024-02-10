export type NonNullable<T> = Exclude<T, null | undefined>

export type RequiredNonNullable<T> = Required<Exclude<T, null | undefined>>
