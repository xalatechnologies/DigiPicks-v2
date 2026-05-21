import type { Id } from '../../../../convex/_generated/dataModel';

/** True when the signed-in user owns this creator profile. */
export function isOwnCreator(
  creatorId: string | undefined,
  myCreatorId: Id<'creators'> | null | undefined,
): boolean {
  return Boolean(creatorId && myCreatorId && creatorId === myCreatorId);
}
