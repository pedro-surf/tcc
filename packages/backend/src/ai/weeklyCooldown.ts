export const WEEKLY_DESCRIPTION_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

export class WeeklyDescriptionCooldownError extends Error {
  readonly nextAvailableAt: Date

  constructor(nextAvailableAt: Date) {
    super('Weekly AI description can only be generated once per week')
    this.name = 'WeeklyDescriptionCooldownError'
    this.nextAvailableAt = nextAvailableAt
  }
}

export function canGenerateWeeklyDescription(
  weeklyGeneratedAt: Date | null | undefined,
  now = new Date(),
): { allowed: boolean; nextAvailableAt: Date | null } {
  if (!weeklyGeneratedAt) {
    return { allowed: true, nextAvailableAt: null }
  }
  const elapsed = now.getTime() - weeklyGeneratedAt.getTime()
  if (elapsed >= WEEKLY_DESCRIPTION_COOLDOWN_MS) {
    return { allowed: true, nextAvailableAt: null }
  }
  return {
    allowed: false,
    nextAvailableAt: new Date(
      weeklyGeneratedAt.getTime() + WEEKLY_DESCRIPTION_COOLDOWN_MS,
    ),
  }
}
