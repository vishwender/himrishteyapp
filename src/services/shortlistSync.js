
const listeners = new Set();

/**
 * Subscribe to shortlist changes.
 *
 * Returns an unsubscribe function.
 */
export function subscribeShortlistChanges(callback) {
  listeners.add(callback);

  return () => {
    listeners.delete(callback);
  };
}

/**
 * Notify screens after a successful shortlist
 * API operation.
 *
 * memberId must be members.id, not profile_id.
 */
export function notifyShortlistChanged(
  memberId,
  isShortlisted,
) {
  if (
    memberId === null ||
    memberId === undefined ||
    typeof isShortlisted !== 'boolean'
  ) {
    return;
  }

  const event = {
    memberId: String(memberId),
    isShortlisted,
  };

  listeners.forEach(listener => {
    listener(event);
  });
}
