
import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import { getMemberProfile } from '../../api/memberApi';

import {
  checkShortlist,
  addToShortlist,
  removeFromShortlist,
} from '../../api/shortlistApi';

import {
  checkSentInterest,
  sendInterest,
  cancelInterest,
} from '../../api/interestApi';

import { getProfileImage } from '../../config/images';
import colors from '../../theme/colors';

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function calculateAge(birthDate) {
  if (!birthDate) {
    return null;
  }

  const date = new Date(
    String(birthDate).replace(' ', 'T'),
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();

  let age =
    today.getFullYear() - date.getFullYear();

  if (
    today.getMonth() < date.getMonth() ||
    (
      today.getMonth() === date.getMonth() &&
      today.getDate() < date.getDate()
    )
  ) {
    age--;
  }

  return age;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong.'
  );
}

function getInterestLabel(interest) {
  if (!interest?.sent) {
    return '♡ Send Interest';
  }

  switch (String(interest.interest?.status)) {
    case '0':
      return '✕ Cancel Interest';
    case '1':
      return '✓ Accepted';
    case '2':
      return 'Interest Rejected';
    default:
      return 'Interest Unavailable';
  }
}

/*
|--------------------------------------------------------------------------
| Reusable details row
|--------------------------------------------------------------------------
*/

function DetailRow({ label, value }) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text style={styles.detailValue}>
        {String(value)}
      </Text>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| Member Profile Screen
|--------------------------------------------------------------------------
*/

export default function MemberProfileScreen({ route }) {
  const { profileId } = route.params;

  /*
  |--------------------------------------------------------------------------
  | Profile state
  |--------------------------------------------------------------------------
  */

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /*
  |--------------------------------------------------------------------------
  | Shortlist state
  |--------------------------------------------------------------------------
  */

  const [isShortlisted, setIsShortlisted] = useState(false);
  const [shortlistLoading, setShortlistLoading] = useState(true);
  const [shortlistSaving, setShortlistSaving] = useState(false);
  const [shortlistError, setShortlistError] = useState('');

  /*
  |--------------------------------------------------------------------------
  | Interest state
  |--------------------------------------------------------------------------
  */

  const [interest, setInterest] = useState(null);
  const [interestLoading, setInterestLoading] = useState(true);
  const [interestSaving, setInterestSaving] = useState(false);
  const [interestError, setInterestError] = useState('');

  /*
  |--------------------------------------------------------------------------
  | Load profile and action statuses
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError('');
      setMember(null);

      setIsShortlisted(false);
      setShortlistLoading(true);
      setShortlistError('');

      setInterest(null);
      setInterestLoading(true);
      setInterestError('');

      try {
        /*
        | Fetch member details
        */
        const profile = await getMemberProfile(profileId);

        if (!active) {
          return;
        }

        setMember(profile);
        setLoading(false);

        /*
        | Fetch both statuses concurrently
        */
        const [shortlistResult, interestResult] =
          await Promise.allSettled([
            Promise.resolve().then(() => checkShortlist(profile.id)),
            Promise.resolve().then(() => checkSentInterest(profile.id)),
          ]);

        if (!active) {
          return;
        }

        /*
        | Shortlist status
        */
        if (shortlistResult.status === 'fulfilled') {
          setIsShortlisted(shortlistResult.value);
        } else {
          setShortlistError(
            getErrorMessage(shortlistResult.reason),
          );
        }

        /*
        | Interest status
        */
        if (interestResult.status === 'fulfilled') {
          setInterest(interestResult.value);
        } else {
          setInterestError(
            getErrorMessage(interestResult.reason),
          );
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
          setShortlistLoading(false);
          setInterestLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [profileId]);

  /*
  |--------------------------------------------------------------------------
  | Toggle shortlist
  |--------------------------------------------------------------------------
  */

  const toggleShortlist = useCallback(async () => {
    if (
      !member?.id ||
      shortlistLoading ||
      shortlistSaving ||
      shortlistError
    ) {
      return;
    }

    setShortlistSaving(true);

    try {
      const nextStatus = isShortlisted
        ? await removeFromShortlist(member.id)
        : await addToShortlist(member.id);

      setIsShortlisted(nextStatus);
    } catch (err) {
      Alert.alert(
        'Shortlist',
        getErrorMessage(err),
      );
    } finally {
      setShortlistSaving(false);
    }
  }, [
    member?.id,
    isShortlisted,
    shortlistLoading,
    shortlistSaving,
    shortlistError,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Retry shortlist status
  |--------------------------------------------------------------------------
  */

  const retryShortlistStatus = useCallback(async () => {
    if (
      !member?.id ||
      shortlistLoading ||
      shortlistSaving
    ) {
      return;
    }

    setShortlistLoading(true);
    setShortlistError('');

    try {
      const status = await checkShortlist(member.id);
      setIsShortlisted(status);
    } catch (err) {
      setShortlistError(getErrorMessage(err));
    } finally {
      setShortlistLoading(false);
    }
  }, [
    member?.id,
    shortlistLoading,
    shortlistSaving,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Send interest
  |--------------------------------------------------------------------------
  */

  const handleSendInterest = useCallback(async () => {
    if (
      !member?.id ||
      interestLoading ||
      interestSaving ||
      interestError ||
      interest?.sent
    ) {
      return;
    }

    setInterestSaving(true);

    try {
      const result = await sendInterest(member.id);

      setInterest({
        sent: result.sent === true,
        interest: {
          id: result.id,
          status: result.status,
        },
      });

      Alert.alert(
        'Interest',
        'Your interest has been sent successfully.',
      );
    } catch (err) {
      Alert.alert(
        'Unable to send interest',
        getErrorMessage(err),
      );

      // If the network timed out after the server created
      // the interest, verify its status before another send.
      setInterestError(
        'Please check interest status before retrying.',
      );
    } finally {
      setInterestSaving(false);
    }
  }, [
    member?.id,
    interestLoading,
    interestSaving,
    interestError,
    interest?.sent,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Retry interest status
  |--------------------------------------------------------------------------
  */

  const retryInterestStatus = useCallback(async () => {
    if (
      !member?.id ||
      interestLoading ||
      interestSaving
    ) {
      return;
    }

    setInterestLoading(true);
    setInterestError('');

    try {
      const result = await checkSentInterest(member.id);
      setInterest(result);
    } catch (err) {
      setInterestError(getErrorMessage(err));
    } finally {
      setInterestLoading(false);
    }
  }, [
    member?.id,
    interestLoading,
    interestSaving,
  ]);

  const handleCancelInterest = useCallback(() => {
    const interestId = interest?.interest?.id;

    if (
      !interestId ||
      interestLoading ||
      interestSaving ||
      interestError ||
      String(interest?.interest?.status) !== '0'
    ) {
      return;
    }

    Alert.alert(
      'Cancel Interest',
      'Are you sure you want to cancel this interest?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setInterestSaving(true);

            const result = await cancelInterest(interestId);

            if (result?.cancelled !== true) {
              throw new Error('Interest cancellation was not confirmed.');
            }

            setInterest({
              sent: false,
              interest: null,
            });

            Alert.alert(
              'Success',
              'Interest cancelled successfully.',
            );
          },
        },
      ],
    );
  }, [
    member?.id,
    interest?.interest?.id,
    interest?.interest?.status,
    interestLoading,
    interestSaving,
    interestError,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Loading state
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
        />

        <Text style={styles.muted}>
          Loading profile...
        </Text>
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Profile error
  |--------------------------------------------------------------------------
  */

  if (error || !member) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error || 'Profile unavailable.'}
        </Text>
      </View>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Display values
  |--------------------------------------------------------------------------
  */

  const imageURL = getProfileImage(member.photo);

  const age = calculateAge(
    member.birth_date_time,
  );

  const location = [
    member.city_living_in,
    member.state_living_in,
    member.country_living_in,
  ]
    .filter(Boolean)
    .join(', ');

  const shortlistDisabled =
    shortlistLoading ||
    shortlistSaving ||
    Boolean(shortlistError);

  const canCancelInterest =
    interest?.sent === true &&
    String(interest?.interest?.status) === '0';

  const interestDisabled =
    interestLoading ||
    interestSaving ||
    Boolean(interestError) ||
    (interest?.sent === true && !canCancelInterest);

  const interestLabel =
    getInterestLabel(interest);

  /*
  |--------------------------------------------------------------------------
  | Profile UI
  |--------------------------------------------------------------------------
  */

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}>

      {/*
      |--------------------------------------------------------------------------
      | Profile Photo
      |--------------------------------------------------------------------------
      */}

      <View style={styles.photoContainer}>
        {imageURL ? (
          <Image
            source={{ uri: imageURL }}
            style={styles.photo}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              No Photo
            </Text>
          </View>
        )}
      </View>

      <View style={styles.body}>

        {/*
        |--------------------------------------------------------------------------
        | Profile header
        |--------------------------------------------------------------------------
        */}

        <Text style={styles.name}>
          {member.full_name || 'Member'}
          {age !== null ? `, ${age}` : ''}
        </Text>

        <Text style={styles.profileId}>
          {member.profile_id}
        </Text>

        <Text style={styles.location}>
          {location || 'Location not specified'}
        </Text>

        {/*
        |--------------------------------------------------------------------------
        | Profile actions
        |--------------------------------------------------------------------------
        */}

        <View style={styles.actions}>

          {/*
          | Send Interest
          */}

          <TouchableOpacity
            style={[
              styles.action,
              interest?.sent && styles.activeAction,
              interestDisabled && styles.disabledAction,
            ]}
            activeOpacity={0.8}
            disabled={interestDisabled}
            onPress={
              canCancelInterest
                ? handleCancelInterest
                : handleSendInterest
            }>

            {interestLoading || interestSaving ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />
            ) : (
              <Text
                style={[
                  styles.actionText,
                  interest?.sent && styles.activeActionText,
                ]}>
                {interestError
                  ? 'Interest Unavailable'
                  : interestLabel}
              </Text>
            )}

          </TouchableOpacity>

          {/*
          | Shortlist
          */}

          <TouchableOpacity
            style={[
              styles.action,
              isShortlisted && styles.activeAction,
              shortlistDisabled && styles.disabledAction,
            ]}
            activeOpacity={0.8}
            disabled={shortlistDisabled}
            onPress={toggleShortlist}>

            {shortlistLoading || shortlistSaving ? (
              <ActivityIndicator
                size="small"
                color={colors.primary}
              />
            ) : (
              <Text
                style={[
                  styles.actionText,
                  isShortlisted && styles.activeActionText,
                ]}>
                {isShortlisted
                  ? '★ Shortlisted'
                  : '☆ Shortlist'}
              </Text>
            )}

          </TouchableOpacity>

        </View>

        {/*
        |--------------------------------------------------------------------------
        | Interest error
        |--------------------------------------------------------------------------
        */}

        {interestError ? (
          <View style={styles.actionErrorBox}>
            <Text style={styles.actionErrorText}>
              {interestError}
            </Text>

            <TouchableOpacity
              onPress={retryInterestStatus}
              disabled={interestLoading}>
              <Text style={styles.retryText}>
                Retry Interest Status
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/*
        |--------------------------------------------------------------------------
        | Shortlist error
        |--------------------------------------------------------------------------
        */}

        {shortlistError ? (
          <View style={styles.actionErrorBox}>
            <Text style={styles.actionErrorText}>
              {shortlistError}
            </Text>

            <TouchableOpacity
              onPress={retryShortlistStatus}
              disabled={shortlistLoading}>
              <Text style={styles.retryText}>
                Retry Shortlist Status
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/*
        |--------------------------------------------------------------------------
        | Personal Details
        |--------------------------------------------------------------------------
        */}

        <Text style={styles.sectionTitle}>
          Personal Details
        </Text>

        <DetailRow
          label="Age"
          value={
            age !== null ? `${age} years` : null
          }
        />

        <DetailRow
          label="Height"
          value={member.height}
        />

        <DetailRow
          label="Religion"
          value={member.religion}
        />

        <DetailRow
          label="Caste"
          value={member.cast}
        />

        <DetailRow
          label="Sub Caste"
          value={member.sub_cast}
        />

        <DetailRow
          label="Mother Tongue"
          value={member.mother_tongue}
        />

        <DetailRow
          label="Marital Status"
          value={member.marital_status}
        />

        {/*
        |--------------------------------------------------------------------------
        | Education and Career
        |--------------------------------------------------------------------------
        */}

        <Text style={styles.sectionTitle}>
          Education & Career
        </Text>

        <DetailRow
          label="Education"
          value={member.education}
        />

        <DetailRow
          label="Occupation"
          value={member.occupation}
        />

        {/*
        |--------------------------------------------------------------------------
        | Location
        |--------------------------------------------------------------------------
        */}

        <Text style={styles.sectionTitle}>
          Location
        </Text>

        <DetailRow
          label="City"
          value={member.city_living_in}
        />

        <DetailRow
          label="State"
          value={member.state_living_in}
        />

        <DetailRow
          label="Country"
          value={member.country_living_in}
        />

        {/*
        |--------------------------------------------------------------------------
        | Profile Completion
        |--------------------------------------------------------------------------
        */}

        <Text style={styles.sectionTitle}>
          Profile Completion
        </Text>

        <Text style={styles.completion}>
          {member.profile_completed ?? 0}% Complete
        </Text>

      </View>
    </ScrollView>
  );
}

/*
|--------------------------------------------------------------------------
| Styles
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FF',
  },

  scrollContent: {
    paddingBottom: 20,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF9FF',
    padding: 24,
  },

  muted: {
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },

  errorText: {
    color: '#B42318',
    textAlign: 'center',
    fontSize: 14,
  },

  photoContainer: {
    height: 360,
    backgroundColor: '#EDE9FF',
  },

  photo: {
    width: '100%',
    height: '100%',
  },

  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  placeholderText: {
    color: colors.primary,
  },

  body: {
    padding: 20,
  },

  name: {
    fontSize: 27,
    fontWeight: '800',
    color: colors.text,
  },

  profileId: {
    color: colors.primary,
    fontWeight: '600',
    marginTop: 5,
  },

  location: {
    color: colors.textSecondary,
    marginTop: 8,
  },

  /*
  |--------------------------------------------------------------------------
  | Action Buttons
  |--------------------------------------------------------------------------
  */

  actions: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 24,
  },

  action: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EDE9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  activeAction: {
    backgroundColor: '#E7F7ED',
  },

  activeActionText: {
    color: '#16834B',
  },

  disabledAction: {
    opacity: 0.65,
  },

  /*
  |--------------------------------------------------------------------------
  | Error Messages
  |--------------------------------------------------------------------------
  */

  actionErrorBox: {
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },

  actionErrorText: {
    color: '#B42318',
    fontSize: 13,
  },

  retryText: {
    marginTop: 8,
    color: colors.primary,
    fontWeight: '700',
  },

  /*
  |--------------------------------------------------------------------------
  | Member Details
  |--------------------------------------------------------------------------
  */

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.text,
    marginTop: 26,
    marginBottom: 10,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEAF7',
  },

  detailLabel: {
    color: colors.textSecondary,
    flex: 1,
  },

  detailValue: {
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },

  completion: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: 35,
  },
});
