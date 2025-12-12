export interface UserScopeOptions {
  userId: string
  targetUserId?: string
  resource?: string
}

const isValidUserId = (userId: string) => /^[A-Za-z0-9_-]+$/.test(userId)

export const assertUserScope = ({ userId, targetUserId, resource }: UserScopeOptions) => {
  if (!userId) {
    throw new Error("Firestore access requires a user id")
  }

  if (!isValidUserId(userId)) {
    throw new Error("Firestore access rejected: invalid user id format")
  }

  if (targetUserId && targetUserId !== userId) {
    throw new Error(`Access to another user's data is not allowed${resource ? ` for ${resource}` : ""}`)
  }
}

export const validateUserDocumentPath = (userId: string, path: string) => {
  const userPrefix = `users/${userId}`
  // Path must be exactly "users/{userId}" or start with "users/{userId}/"
  // This prevents prefix attacks like "users/user123evil" when userId is "user123"
  const isExactMatch = path === userPrefix
  const isSubpath = path.startsWith(`${userPrefix}/`)

  if (!isExactMatch && !isSubpath) {
    throw new Error("Firestore access is limited to the signed-in user's document")
  }
}
