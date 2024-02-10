module '#auth-utils' {
  export interface UserSession {
    user?: {
      userId: string
      picture: string
      indexingTokenId?: string
    }
  }
}

export {}
