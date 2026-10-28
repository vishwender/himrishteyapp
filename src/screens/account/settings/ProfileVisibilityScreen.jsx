import AppIcon from '../../../components/AppIcon';

import React, { useCallback, useState } from 'react';

import {
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StyleSheet,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import {
    getProfileVisibility,
    updateProfileVisibility,
} from '../../../api/accountSettingsApi';

import { useAuth } from '../../../context/AuthContext';
import colors from '../../../theme/colors';

function getErrorMessage(error) {
    return (
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong.'
    );
}

export default function ProfileVisibilityScreen() {
    const { refreshUser } = useAuth();

    const [isHidden, setIsHidden] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            let active = true;

            const load = async () => {
                setLoading(true);

                try {
                    const result = await getProfileVisibility();

                    if (active) {
                        setIsHidden(Boolean(result.is_hidden));
                    }
                } catch (error) {
                    if (active) {
                        Alert.alert(
                            'Unable to Load Settings',
                            getErrorMessage(error),
                        );
                    }
                } finally {
                    if (active) {
                        setLoading(false);
                    }
                }
            };

            load();

            return () => {
                active = false;
            };
        }, []),
    );

    const saveVisibility = async nextHidden => {
        if (saving || loading || nextHidden === isHidden) {
            return;
        }

        setSaving(true);

        let saved = false;

        try {
            const result = await updateProfileVisibility(nextHidden);
            saved = true;

            setIsHidden(Boolean(result.is_hidden));

            try {
                await refreshUser();
            } catch {
                // The visibility API response is authoritative.
            }

            Alert.alert(
                'Profile Visibility Updated',
                nextHidden
                    ? 'Your profile is now hidden from discovery.'
                    : 'Your profile is now visible again.',
            );
        } catch (error) {
            Alert.alert(
                saved ? 'Setting Updated' : 'Unable to Update',
                saved
                    ? 'Visibility changed, but your profile could not be refreshed.'
                    : getErrorMessage(error),
            );
        } finally {
            setSaving(false);
        }
    };

    const confirmVisibility = nextHidden => {
        Alert.alert(
            nextHidden ? 'Hide Profile?' : 'Show Profile?',
            nextHidden
                ? 'Your profile will be hidden from search and matching results until you make it visible again.'
                : 'Your profile will become visible to other members again, subject to normal account approval rules.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: nextHidden ? 'Hide Profile' : 'Show Profile',
                    onPress: () => saveVisibility(nextHidden),
                },
            ],
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                    Loading visibility settings...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                Profile Visibility
            </Text>

            <Text style={styles.subtitle}>
                Control whether other members can discover your profile.
            </Text>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                    Visibility Status
                </Text>

                <View style={styles.statusRow}>
                    <Text style={styles.statusLabel}>
                        Current Status
                    </Text>

                    <Text
                        style={[
                            styles.statusValue,
                            isHidden ? styles.hiddenText : styles.visibleText,
                        ]}>
                        {isHidden ? 'Hidden' : 'Visible'}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[
                        styles.option,
                        !isHidden && styles.selectedOption,
                    ]}
                    disabled={saving}
                    onPress={() => confirmVisibility(false)}>

                    <AppIcon name="eye" style={styles.optionIcon} />

                    <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>
                            Profile Visible
                        </Text>
                        <Text style={styles.optionDescription}>
                            Other members can find your profile in searches
                            and recommendations.
                        </Text>
                    </View>

                    <AppIcon name={!isHidden ? 'selected' : 'circle'} style={styles.check} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.option,
                        isHidden && styles.selectedOption,
                    ]}
                    disabled={saving}
                    onPress={() => confirmVisibility(true)}>

                    <AppIcon name="hidden" style={styles.optionIcon} />

                    <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>
                            Hide My Profile
                        </Text>
                        <Text style={styles.optionDescription}>
                            Pause profile discovery until you choose
                            to show it again.
                        </Text>
                    </View>

                    <AppIcon name={isHidden ? 'selected' : 'circle'} style={styles.check} />
                </TouchableOpacity>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>
                    Important Information
                </Text>

                <Text style={styles.infoText}>
                    Hiding your profile does not delete your account
                    or existing interests. You can restore visibility
                    whenever you want.
                </Text>
            </View>

            {saving ? (
                <ActivityIndicator
                    color={colors.primary}
                    style={styles.savingIndicator}
                />
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF9FF',
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAF9FF',
    },
    loadingText: {
        marginTop: 12,
        color: colors.textSecondary,
    },
    title: {
        fontSize: 25,
        fontWeight: '800',
        color: colors.title,
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 20,
        color: colors.textSecondary,
        marginTop: 7,
        marginBottom: 20,
    },
    card: {
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEEAF7',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.title,
        marginBottom: 18,
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statusLabel: {
        color: colors.textSecondary,
        fontSize: 13,
    },
    statusValue: {
        fontWeight: '800',
        fontSize: 13,
    },
    visibleText: {
        color: '#20834A',
    },
    hiddenText: {
        color: '#C45B36',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderWidth: 1,
        borderColor: '#E5E0EC',
        borderRadius: 12,
        marginBottom: 12,
    },
    selectedOption: {
        borderColor: colors.primary,
        backgroundColor: '#F3EFFF',
    },
    optionIcon: {
        fontSize: 25,
        marginRight: 12,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.title,
    },
    optionDescription: {
        marginTop: 5,
        fontSize: 12,
        lineHeight: 18,
        color: colors.textSecondary,
    },
    check: {
        fontSize: 20,
        color: colors.primary,
        marginLeft: 8,
    },
    infoCard: {
        marginTop: 18,
        borderRadius: 12,
        backgroundColor: '#F0EAFE',
        padding: 16,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.title,
        marginBottom: 7,
    },
    infoText: {
        color: colors.textSecondary,
        fontSize: 12,
        lineHeight: 19,
    },
    savingIndicator: {
        marginTop: 20,
    },
});
