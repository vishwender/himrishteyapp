
const listeners = new Set();

export function subscribeInterestChanges(callback) {
  listeners.add(callback);

  return () => {
    listeners.delete(callback);
  };
}

export function notifyInterestChanged(
  memberId,
  interestStatus,
  interestId = null,
) {
  if (
    memberId === null ||
    memberId === undefined ||
    memberId === ''
  ) {
    return;
  }

  const status =
    interestStatus === null || interestStatus === undefined
      ? null
      : String(interestStatus);

  const event = {
    memberId: String(memberId),
    interestStatus: status,
    interestId,
  };

  listeners.forEach(listener => {
    listener(event);
  });
}
