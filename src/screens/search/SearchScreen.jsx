
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Keyboard,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';

import {
  quickSearch,
  advancedSearch,
  findByProfileId,
} from '../../api/searchApi';

import { getProfileImage } from '../../config/images';
import colors from '../../theme/colors';

const MODES = [
  { key: 'quick', label: 'Quick' },
  { key: 'advanced', label: 'Advanced' },
  { key: 'profile', label: 'Profile ID' },
];

const INITIAL_FILTERS = {
  age_from: '',
  age_to: '',
  religion: '',
  cast: '',
  marital_status: '',
  mother_tongue: '',
  state_living_in: '',
  city_living_in: '',
  education: '',
  occupation: '',
  employed_in: '',
  annual_income: '',
  manglik: '',
  diet: '',
};

function errorMessage(error) {
  const errors = error?.response?.data?.errors;

  if (errors && typeof errors === 'object') {
    const first = Object.values(errors)[0];
    if (Array.isArray(first) && first.length) {
      return String(first[0]);
    }
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.'
  );
}

function SearchInput({
  label,
  value,
  onChangeText,
  placeholder,
  numeric = false,
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor="#96909F"
        keyboardType={numeric ? 'number-pad' : 'default'}
        autoCapitalize={numeric ? 'none' : 'words'}
        autoCorrect={false}
        returnKeyType="done"
      />
    </View>
  );
}

function ProfileCard({ member, onPress }) {
  const photo = member?.photo
    ? getProfileImage(member.photo)
    : null;

  const initials = String(member?.full_name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();

  const location = [
    member?.city_living_in,
    member?.state_living_in,
  ]
    .filter(Boolean)
    .join(', ');

  const details = [
    member?.age != null
      ? `${member.age} yrs`
      : null,
    member?.height,
    member?.religion,
  ]
    .filter(Boolean)
    .join('  •  ');

  return (
    <TouchableOpacity
      style={styles.memberCard}
      activeOpacity={0.8}
      onPress={onPress}>

      <View style={styles.imageWrapper}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={styles.memberImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.initials}>
            {initials}
          </Text>
        )}
      </View>

      <View style={styles.memberInfo}>
        <Text
          style={styles.memberName}
          numberOfLines={1}>
          {member.full_name || 'Member'}
        </Text>

        <Text style={styles.profileId}>
          {member.profile_id}
        </Text>

        {details ? (
          <Text
            style={styles.memberDetails}
            numberOfLines={2}>
            {details}
          </Text>
        ) : null}

        <Text
          style={styles.location}
          numberOfLines={2}>
          {location || 'Location not specified'}
        </Text>

        {member?.occupation ? (
          <Text
            style={styles.occupation}
            numberOfLines={1}>
            {member.occupation}
          </Text>
        ) : null}

        <Text style={styles.viewProfile}>
          View Profile →
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const navigation = useNavigation();

  const [mode, setMode] = useState('quick');
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [profileId, setProfileId] = useState('');

  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const requestIdRef = useRef(0);
  const pageLoadingRef = useRef(false);
  const lastSearchRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const updateFilter = useCallback((key, value) => {
    setFilters(previous => ({
      ...previous,
      [key]: value,
    }));
  }, []);

  const openProfile = useCallback(
    id => {
      if (!id) {
        return;
      }

      navigation.getParent()?.navigate(
        'MemberProfile',
        { profileId: id },
      );
    },
    [navigation],
  );

  const runSearchPage = useCallback(
    async (modeToSearch, searchFilters, page, type) => {
      if (pageLoadingRef.current && type === 'more') {
        return;
      }

      const requestId =
        type === 'more'
          ? requestIdRef.current
          : ++requestIdRef.current;

      pageLoadingRef.current = true;

      if (type === 'more') {
        setLoadingMore(true);
      } else if (type === 'refresh') {
        setRefreshing(true);
      } else {
        setLoading(true);
        setMembers([]);
        setPagination(null);
      }

      setError('');

      try {
        const result = modeToSearch === 'quick'
          ? await quickSearch(searchFilters, page)
          : await advancedSearch(searchFilters, page);

        if (
          !mountedRef.current ||
          requestId !== requestIdRef.current
        ) {
          return;
        }

        const incoming = Array.isArray(result.members)
          ? result.members
          : [];

        if (page === 1) {
          setMembers(incoming);
        } else {
          setMembers(previous => {
            const existing = new Set(
              previous.map(member => String(member.id)),
            );

            return [
              ...previous,
              ...incoming.filter(
                member => !existing.has(String(member.id)),
              ),
            ];
          });
        }

        setPagination(result.pagination);
        setSearched(true);
      } catch (err) {
        if (
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          setError(errorMessage(err));
        }
      } finally {
        if (
          mountedRef.current &&
          requestId === requestIdRef.current
        ) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
          pageLoadingRef.current = false;
        }
      }
    },
    [],
  );

  const handleSearch = useCallback(async () => {
    Keyboard.dismiss();
    setError('');

    if (mode === 'profile') {
      const id = profileId.trim();

      if (!id) {
        setError('Please enter a Profile ID.');
        return;
      }

      setLoading(true);

      try {
        const result = await findByProfileId(id);

        if (!mountedRef.current) {
          return;
        }

        // The profile endpoint already exists and is also
        // used by MemberProfileScreen.
        if (!result) {
          throw new Error('Profile not found.');
        }

        openProfile(id);
        return;
      } catch (err) {
        if (mountedRef.current) {
          setError(errorMessage(err));
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }

      return;
    }

    const allowedQuick = [
      'age_from',
      'age_to',
      'religion',
      'cast',
      'marital_status',
    ];

    const preparedFilters = Object.fromEntries(
      Object.entries(filters)
        .filter(
          ([key, value]) =>
            (mode === 'advanced' ||
              allowedQuick.includes(key)) &&
            String(value).trim() !== '',
        )
        .map(([key, value]) => [key, value.trim()]),
    );

    if (
      mode === 'quick' &&
      Object.keys(preparedFilters).length === 0
    ) {
      setError('Select at least one search filter.');
      return;
    }

    const from = preparedFilters.age_from;
    const to = preparedFilters.age_to;

    if (
      (from && (+from < 18 || +from > 100)) ||
      (to && (+to < 18 || +to > 100))
    ) {
      setError('Age must be between 18 and 100.');
      return;
    }

    if (from && to && Number(from) > Number(to)) {
      setError('Minimum age cannot exceed maximum age.');
      return;
    }

    lastSearchRef.current = {
      mode,
      filters: preparedFilters,
    };

    setSearched(true);

    await runSearchPage(
      mode,
      preparedFilters,
      1,
      'new',
    );
  }, [
    mode,
    filters,
    profileId,
    openProfile,
    runSearchPage,
  ]);

  const loadMore = useCallback(() => {
    const search = lastSearchRef.current;

    if (
      !search ||
      !pagination ||
      loading ||
      loadingMore ||
      refreshing ||
      pageLoadingRef.current ||
      error
    ) {
      return;
    }

    const currentPage = Number(
      pagination.current_page || 1,
    );

    const lastPage = Number(
      pagination.last_page || 1,
    );

    if (currentPage >= lastPage) {
      return;
    }

    runSearchPage(
      search.mode,
      search.filters,
      currentPage + 1,
      'more',
    );
  }, [
    pagination,
    loading,
    loadingMore,
    refreshing,
    error,
    runSearchPage,
  ]);

  const refreshResults = useCallback(() => {
    const search = lastSearchRef.current;

    if (
      !search ||
      pageLoadingRef.current
    ) {
      return;
    }

    runSearchPage(
      search.mode,
      search.filters,
      1,
      'refresh',
    );
  }, [runSearchPage]);

  const changeMode = useCallback(nextMode => {
    requestIdRef.current += 1;
    pageLoadingRef.current = false;

    setMode(nextMode);
    setMembers([]);
    setPagination(null);
    setSearched(false);
    setLoading(false);
    setLoadingMore(false);
    setRefreshing(false);
    setError('');

    lastSearchRef.current = null;
  }, []);

  const renderMember = useCallback(
    ({ item }) => (
      <ProfileCard
        member={item}
        onPress={() => openProfile(item.profile_id)}
      />
    ),
    [openProfile],
  );

  const renderFilters = () => (
    <View style={styles.form}>
      {mode !== 'profile' ? (
        <>
          <View style={styles.ageRow}>
            <View style={styles.halfField}>
              <SearchInput
                label="Age From"
                value={filters.age_from}
                numeric
                placeholder="18"
                onChangeText={value =>
                  updateFilter('age_from', value)
                }
              />
            </View>

            <View style={styles.halfField}>
              <SearchInput
                label="Age To"
                value={filters.age_to}
                numeric
                placeholder="35"
                onChangeText={value =>
                  updateFilter('age_to', value)
                }
              />
            </View>
          </View>

          <SearchInput
            label="Religion"
            value={filters.religion}
            onChangeText={value =>
              updateFilter('religion', value)
            }
            placeholder="e.g. Hindu"
          />

          <SearchInput
            label="Caste"
            value={filters.cast}
            onChangeText={value =>
              updateFilter('cast', value)
            }
            placeholder="Enter caste"
          />

          <SearchInput
            label="Marital Status"
            value={filters.marital_status}
            onChangeText={value =>
              updateFilter('marital_status', value)
            }
            placeholder="e.g. Never Married"
          />

          {mode === 'advanced' ? (
            <>
              <Text style={styles.sectionHeading}>
                Community
              </Text>

              <SearchInput
                label="Mother Tongue"
                value={filters.mother_tongue}
                onChangeText={value =>
                  updateFilter('mother_tongue', value)
                }
              />

              <SearchInput
                label="Manglik"
                value={filters.manglik}
                onChangeText={value =>
                  updateFilter('manglik', value)
                }
              />

              <Text style={styles.sectionHeading}>
                Location
              </Text>

              <SearchInput
                label="State"
                value={filters.state_living_in}
                onChangeText={value =>
                  updateFilter('state_living_in', value)
                }
              />

              <SearchInput
                label="City"
                value={filters.city_living_in}
                onChangeText={value =>
                  updateFilter('city_living_in', value)
                }
              />

              <Text style={styles.sectionHeading}>
                Education & Career
              </Text>

              <SearchInput
                label="Education"
                value={filters.education}
                onChangeText={value =>
                  updateFilter('education', value)
                }
              />

              <SearchInput
                label="Occupation"
                value={filters.occupation}
                onChangeText={value =>
                  updateFilter('occupation', value)
                }
              />

              <SearchInput
                label="Employed In"
                value={filters.employed_in}
                onChangeText={value =>
                  updateFilter('employed_in', value)
                }
              />

              <SearchInput
                label="Annual Income"
                value={filters.annual_income}
                onChangeText={value =>
                  updateFilter('annual_income', value)
                }
              />

              <Text style={styles.sectionHeading}>
                Lifestyle
              </Text>

              <SearchInput
                label="Diet"
                value={filters.diet}
                onChangeText={value =>
                  updateFilter('diet', value)
                }
              />
            </>
          ) : null}
        </>
      ) : (
        <SearchInput
          label="Profile ID"
          value={profileId}
          placeholder="e.g. HIM12345"
          onChangeText={setProfileId}
        />
      )}

      <TouchableOpacity
        style={[
          styles.searchButton,
          loading && styles.disabledButton,
        ]}
        disabled={loading}
        onPress={handleSearch}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.searchButtonText}>
            {mode === 'profile'
              ? 'Find Profile'
              : 'Search Profiles'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const showResults = mode !== 'profile' && searched;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search Profiles</Text>
        <Text style={styles.subtitle}>
          Find your perfect match
        </Text>
      </View>

      <View style={styles.modeRow}>
        {MODES.map(item => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.modeButton,
              mode === item.key && styles.activeMode,
            ]}
            onPress={() => changeMode(item.key)}>
            <Text
              style={[
                styles.modeText,
                mode === item.key &&
                styles.activeModeText,
              ]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={showResults ? members : []}
        keyExtractor={item => String(item.id)}
        renderItem={renderMember}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshResults}
            colors={[colors.primary]}
            enabled={showResults}
          />
        }
        ListHeaderComponent={
          <>
            {renderFilters()}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {error}
                </Text>

                {showResults &&
                  lastSearchRef.current ? (
                  <TouchableOpacity
                    onPress={() => {
                      if (members.length) {
                        loadMore();
                      } else {
                        refreshResults();
                      }
                    }}>
                    <Text style={styles.retryText}>
                      Retry
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            {showResults && !loading ? (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>
                  Search Results
                </Text>

                <Text style={styles.resultsCount}>
                  {pagination?.total ?? members.length}
                  {' '}matches
                </Text>
              </View>
            ) : null}

            {loading && mode !== 'profile' ? (
              <ActivityIndicator
                style={styles.loader}
                size="large"
                color={colors.primary}
              />
            ) : null}
          </>
        }
        ListEmptyComponent={
          showResults &&
            !loading &&
            !error ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>
                No matching profiles
              </Text>
              <Text style={styles.emptyMessage}>
                Try changing your search filters.
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              style={styles.footerLoader}
              size="small"
              color={colors.primary}
            />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9FF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 15,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 5,
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 7,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#F3EFFA',
    borderRadius: 10,
  },
  activeMode: {
    backgroundColor: colors.primary,
  },
  modeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  activeModeText: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 15,
    paddingBottom: 45,
    flexGrow: 1,
  },
  form: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 16,
    marginBottom: 17,
    borderWidth: 1,
    borderColor: '#EEEAF7',
  },
  field: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E1EC',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 14,
  },
  ageRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginTop: 7,
    marginBottom: 15,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: 11,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  searchButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  resultsCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  memberCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEAF7',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  imageWrapper: {
    width: 107,
    height: 135,
    borderRadius: 12,
    backgroundColor: '#EDE8FF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberImage: {
    width: '100%',
    height: '100%',
  },
  initials: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
  },
  memberInfo: {
    flex: 1,
    paddingLeft: 13,
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  profileId: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
    fontWeight: '600',
  },
  memberDetails: {
    fontSize: 12,
    color: colors.text,
    marginTop: 7,
  },
  location: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 5,
  },
  occupation: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  viewProfile: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
  },
  loader: {
    paddingVertical: 25,
  },
  footerLoader: {
    paddingVertical: 22,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 45,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  emptyMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
  },
  errorText: {
    color: '#B42318',
    fontSize: 13,
  },
  retryText: {
    color: colors.primary,
    fontWeight: '700',
    marginTop: 9,
  },
});
