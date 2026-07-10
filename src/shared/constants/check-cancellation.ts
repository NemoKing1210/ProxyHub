export const CHECK_CANCELLED_MESSAGE = 'Check cancelled'

export function isCheckCancelledMessage(message: string): boolean {
  return message === CHECK_CANCELLED_MESSAGE
}
