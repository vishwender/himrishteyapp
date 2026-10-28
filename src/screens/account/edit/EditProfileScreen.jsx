import AppIcon from '../../../components/AppIcon';
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import colors from '../../../theme/colors';

const SECTIONS = [
    {
        id: 'basic',
        title: 'Basic Details',
        description: 'Name and contact information',
        icon: 'user',
        screen: 'EditBasic',
    },
    {
        id: 'personal',
        title: 'Personal Details',
        description: 'Birth details, height and marital status',
        icon: 'calendar',
        screen: 'EditPersonal',
    },
    {
        id: 'religion',
        title: 'Religion & Community',
        description: 'Religion, caste and mother tongue',
        icon: 'sparkles',
        screen: 'EditReligion',
    },
    {
        id: 'career',
        title: 'Education & Career',
        description: 'Qualifications, occupation and income',
        icon: 'education',
        screen: 'EditEducationCareer',
    },
    {
        id: 'location',
        title: 'Location',
        description: 'Country, state, city and native place',
        icon: 'location',
        screen: 'EditLocation',
    },
    {
        id: 'family',
        title: 'Family Details',
        description: 'Parents and family background',
        icon: 'family',
        screen: 'EditFamily',
    },
    {
        id: 'lifestyle',
        title: 'Lifestyle & About Me',
        description: 'Diet, habits and introduction',
        icon: 'leaf',
        screen: 'EditLifestyle',
    },
    {
        id: 'partner',
        title: 'Partner Preferences',
        description: 'Your preferences for a partner',
        icon: 'heart',
        screen: 'EditPartnerPreferences',
    },
];

export default function EditProfileScreen() {
    const navigation = useNavigation();
    const { user } = useAuth();

    const member = user?.data?.member || user?.member || user;

    const completion = Math.min(
        100,
        Math.max(0, Number(member?.profile_completed) || 0),
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>

            <View style={styles.header}>
                <Text style={styles.title}>Edit My Profile</Text>
                <Text style={styles.subtitle}>
                    Keep your matrimonial profile complete and up to date.
                </Text>
            </View>

            <View style={styles.progressCard}>
                <View style={styles.progressHeading}>
                    <Text style={styles.progressTitle}>
                        Profile Completion
                    </Text>
                    <Text style={styles.progressValue}>
                        {completion}%
                    </Text>
                </View>

                <View style={styles.progressTrack}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${completion}%` },
                        ]}
                    />
                </View>
            </View>

            <Text style={styles.sectionHeading}>
                Profile Sections
            </Text>

            <View style={styles.listCard}>
                {SECTIONS.map((item, index) => {
                    const available = Boolean(item.screen);

                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.item,
                                index > 0 && styles.itemBorder,
                            ]}
                            disabled={!available}
                            activeOpacity={0.75}
                            onPress={() => navigation.navigate(item.screen)}>

                            <View style={styles.iconBox}>
                                <AppIcon name={item.icon} style={styles.iconText} />
                            </View>

                            <View style={styles.itemContent}>
                                <Text style={styles.itemTitle}>
                                    {item.title}
                                </Text>

                                <Text style={styles.itemDescription}>
                                    {item.description}
                                </Text>

                                {!available ? (
                                    <Text style={styles.comingSoon}>
                                        Coming soon
                                    </Text>
                                ) : null}
                            </View>

                            {available ? (
                                <AppIcon name="next" style={styles.chevron} />
                            ) : null}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text style={styles.footer}>
                Changes to each section are saved separately.
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAF9FF',
    },
    content: {
        padding: 16,
        paddingBottom: 35,
    },
    header: {
        marginBottom: 18,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.title,
    },
    subtitle: {
        fontSize: 13,
        lineHeight: 20,
        color: colors.textSecondary,
        marginTop: 7,
    },
    progressCard: {
        padding: 17,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#EEEAF7',
        marginBottom: 24,
    },
    progressHeading: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    progressTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.title,
    },
    progressValue: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.primary,
    },
    progressTrack: {
        height: 9,
        borderRadius: 6,
        backgroundColor: '#EEEAF7',
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 6,
        backgroundColor: colors.primary,
    },
    sectionHeading: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.title,
        marginBottom: 13,
    },
    listCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 17,
        borderWidth: 1,
        borderColor: '#EEEAF7',
        paddingHorizontal: 14,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
    },
    itemBorder: {
        borderTopWidth: 1,
        borderTopColor: '#F2EFF6',
    },
    iconBox: {
        width: 45,
        height: 45,
        backgroundColor: '#F3EDFF',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconText: {
        fontSize: 21,
    },
    itemContent: {
        flex: 1,
        paddingHorizontal: 13,
    },
    itemTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.title,
    },
    itemDescription: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 5,
        lineHeight: 16,
    },
    comingSoon: {
        color: '#A07D45',
        fontSize: 11,
        marginTop: 5,
    },
    chevron: {
        fontSize: 25,
        color: '#AAA3B5',
    },
    footer: {
        textAlign: 'center',
        marginTop: 22,
        color: colors.textSecondary,
        fontSize: 12,
    },
});
