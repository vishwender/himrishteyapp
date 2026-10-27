import React, { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import HomeMemberCard from './HomeMemberCard';
import { useAuth } from '../../context/AuthContext';
import { checkSentInterest, sendInterest } from '../../api/interestApi';
import {
  checkShortlist,
  addToShortlist,
  removeFromShortlist,
} from '../../api/shortlistApi';
import {
  notifyInterestChanged,
  subscribeInterestChanges,
} from '../../services/interestSync';
import {
  notifyShortlistChanged,
  subscribeShortlistChanges,
} from '../../services/shortlistSync';

export default function SearchMemberCard({
  member,
  onViewProfile,
  cardHeight,
}) {
  const { canSendInterest } = useAuth();
  const [interestStatus, setInterestStatus] = useState(
    member.interest_status ?? null,
  );
  const [shortlisted, setShortlisted] = useState(
    member.is_shortlisted === true || member.is_shortlisted === 1,
  );
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    const interestSubscription = subscribeInterestChanges(event => {
      if (event.memberId === String(member.id)) {
        setInterestStatus(event.interestStatus);
      }
    });
    const shortlistSubscription = subscribeShortlistChanges(event => {
      if (event.memberId === String(member.id)) {
        setShortlisted(event.isShortlisted);
      }
    });
    return () => {
      mounted.current = false;
      interestSubscription();
      shortlistSubscription();
    };
  }, [member.id]);

  const perform = async action => {
    if (locked.current) {
      return;
    }
    locked.current = true;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      if (mounted.current) {
        Alert.alert(
          'Unable to complete action',
          error?.response?.data?.message ||
            error?.message ||
            'Please try again.',
        );
      }
    } finally {
      locked.current = false;
      if (mounted.current) {
        setBusy(false);
      }
    }
  };

  const onInterest = () =>
    perform(async () => {
      // Search responses may omit action status. Read it before any mutation.
      const existing = await checkSentInterest(member.id);
      if (!mounted.current) {
        return;
      }
      if (existing.sent) {
        notifyInterestChanged(
          member.id,
          existing.interest?.status ?? '0',
          existing.interest?.id ?? null,
        );
        onViewProfile();
        return;
      }
      const result = await sendInterest(member.id);
      if (result?.sent !== true) {
        throw new Error(
          'Interest creation was not confirmed. Open the profile to check its status before retrying.',
        );
      }
      notifyInterestChanged(member.id, result.status ?? '0', result.id ?? null);
    });

  const onShortlist = () =>
    perform(async () => {
      const saved = await checkShortlist(member.id);
      if (!mounted.current) {
        return;
      }
      const updated = saved
        ? await removeFromShortlist(member.id)
        : await addToShortlist(member.id);
      if (updated !== !saved) {
        throw new Error('The shortlist change was not confirmed.');
      }
      notifyShortlistChanged(member.id, updated);
    });

  return (
    <HomeMemberCard
      member={member}
      cardHeight={cardHeight}
      onViewProfile={onViewProfile}
      interestStatus={interestStatus}
      isShortlisted={shortlisted}
      canSendInterest={canSendInterest}
      busy={busy}
      onInterest={onInterest}
      onShortlist={onShortlist}
      onInactiveInterest={() =>
        Alert.alert(
          'Activate Profile',
          'Your profile must be active to send interests.',
        )
      }
    />
  );
}
