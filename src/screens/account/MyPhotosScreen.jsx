import AppIcon from '../../components/AppIcon';

import React, { useState } from 'react';

import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    StyleSheet,
} from 'react-native';

import {
    launchCamera,
    launchImageLibrary,
} from 'react-native-image-picker';

import { useAuth } from '../../context/AuthContext';
import {
    uploadPrimaryPhoto,
    uploadGalleryPhoto,
} from '../../api/profilePhotoApi';

import { getProfileImage } from '../../config/images';
import colors from '../../theme/colors';

const PICKER_OPTIONS = {
    mediaType: 'photo',
    selectionLimit: 1,
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.8,
    assetRepresentationMode: 'compatible',
    includeBase64: false,
};

function getErrorMessage(error) {
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
        'Unable to upload photo.'
    );
}

export default function MyPhotosScreen() {
    const { user, refreshUser } = useAuth();

    const member = user?.data?.member || user?.member || user;

    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [uploadType, setUploadType] = useState('primary');
    const [uploading, setUploading] = useState(false);

    const [latestGalleryPhoto, setLatestGalleryPhoto] =
        useState(null);

    const [refreshKey, setRefreshKey] = useState(0);

    const currentPhoto = member?.photo
        ? getProfileImage(member.photo)
        : null;

    const primaryPhotoUrl = currentPhoto
        ? `${currentPhoto}${currentPhoto.includes('?') ? '&' : '?'}v=${refreshKey}`
        : null;

    const choosePhoto = type => {
        if (uploading) {
            return;
        }

        setUploadType(type);

        Alert.alert(
            'Select Photo',
            'How would you like to add your photo?',
            [
                {
                    text: 'Take Photo',
                    onPress: () => openPicker('camera', type),
                },
                {
                    text: 'Choose from Gallery',
                    onPress: () => openPicker('gallery', type),
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ],
        );
    };

    const openPicker = async (source, type) => {
        try {
            const result =
                source === 'camera'
                    ? await launchCamera({
                        ...PICKER_OPTIONS,
                        cameraType: 'front',
                        saveToPhotos: false,
                    })
                    : await launchImageLibrary(PICKER_OPTIONS);

            if (result.didCancel) {
                return;
            }

            if (result.errorCode) {
                throw new Error(
                    result.errorMessage ||
                    'Unable to open camera or gallery.',
                );
            }

            const asset = result.assets?.[0];

            if (!asset?.uri) {
                throw new Error('No photo was selected.');
            }

            if (
                asset.fileSize &&
                asset.fileSize > 5 * 1024 * 1024
            ) {
                throw new Error(
                    'Photo exceeds 5 MB. Please choose a smaller image.',
                );
            }

            if (!['image/jpeg', 'image/png', 'image/webp'].includes(asset.type)) {
                throw new Error(
                    'Please select a JPEG, PNG or WebP image.',
                );
            }

            setUploadType(type);
            setSelectedPhoto(asset);
        } catch (error) {
            Alert.alert(
                'Photo Selection Failed',
                getErrorMessage(error),
            );
        }
    };

    const handleUpload = async () => {
        if (!selectedPhoto || uploading) {
            return;
        }

        setUploading(true);

        let saved = false;

        try {
            if (uploadType === 'primary') {
                await uploadPrimaryPhoto(selectedPhoto);
                saved = true;
                await refreshUser();
                setRefreshKey(Date.now());

                Alert.alert(
                    'Success',
                    'Your main profile photo has been updated.',
                );
            } else {
                const result = await uploadGalleryPhoto(selectedPhoto);
                saved = true;

                setLatestGalleryPhoto(result?.photo || null);

                Alert.alert(
                    'Photo Submitted',
                    'Your gallery photo has been uploaded and is awaiting approval.',
                );
            }

            setSelectedPhoto(null);
        } catch (error) {
            Alert.alert(
                saved ? 'Photo Uploaded' : 'Upload Failed',
                saved
                    ? 'Your photo was uploaded, but profile refresh failed.'
                    : getErrorMessage(error),
            );

            if (saved) {
                setSelectedPhoto(null);
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}>

            <Text style={styles.title}>My Photos</Text>

            <Text style={styles.subtitle}>
                Manage your primary profile photo and additional photos.
            </Text>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                    Primary Profile Photo
                </Text>

                <View style={styles.primaryPhotoBox}>
                    {primaryPhotoUrl ? (
                        <Image
                            source={{ uri: primaryPhotoUrl }}
                            style={styles.primaryPhoto}
                            resizeMode="cover"
                        />
                    ) : (
                        <AppIcon name="user" style={styles.placeholder} />
                    )}
                </View>

                <TouchableOpacity
                    style={styles.primaryButton}
                    disabled={uploading}
                    onPress={() => choosePhoto('primary')}>
                    <Text style={styles.primaryButtonText}>
                        Change Profile Photo
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                    Additional Photos
                </Text>

                <Text style={styles.helper}>
                    Add photos to your profile gallery.
                    New photos require approval.
                </Text>

                {latestGalleryPhoto ? (
                    <View style={styles.galleryResult}>
                        <Text style={styles.galleryResultText}>
                            Latest uploaded photo: {latestGalleryPhoto.photo}
                        </Text>
                        <Text style={styles.galleryResultText}>
                            Approval: {latestGalleryPhoto.photo_approved}
                        </Text>
                    </View>
                ) : null}

                <TouchableOpacity
                    style={styles.secondaryButton}
                    disabled={uploading}
                    onPress={() => choosePhoto('gallery')}>
                    <Text style={styles.secondaryButtonText}>
                        Add Gallery Photo
                    </Text>
                </TouchableOpacity>
            </View>

            {selectedPhoto ? (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        Photo Preview
                    </Text>

                    <Image
                        source={{ uri: selectedPhoto.uri }}
                        style={styles.previewPhoto}
                        resizeMode="contain"
                    />

                    <Text style={styles.previewDescription}>
                        {uploadType === 'primary'
                            ? 'Update your main profile picture?'
                            : 'Submit this photo to your gallery?'}
                    </Text>

                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            uploading && styles.disabledButton,
                        ]}
                        disabled={uploading}
                        onPress={handleUpload}>

                        {uploading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.primaryButtonText}>
                                Upload Photo
                            </Text>
                        )}
                    </TouchableOpacity>

                    {!uploading ? (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setSelectedPhoto(null)}>
                            <Text style={styles.cancelText}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            ) : null}
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
        paddingBottom: 45,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.title,
    },
    subtitle: {
        marginTop: 6,
        marginBottom: 20,
        fontSize: 13,
        lineHeight: 20,
        color: colors.textSecondary,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EEEAF7',
        padding: 18,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.title,
        marginBottom: 14,
    },
    primaryPhotoBox: {
        height: 250,
        width: 200,
        backgroundColor: '#F0EAFE',
        borderRadius: 14,
        overflow: 'hidden',
        alignSelf: 'center',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    primaryPhoto: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        fontSize: 60,
    },
    primaryButton: {
        backgroundColor: colors.primary,
        borderRadius: 11,
        paddingVertical: 15,
        paddingHorizontal: 12,
        alignItems: 'center',
    },
    primaryButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    secondaryButton: {
        borderWidth: 1,
        borderColor: colors.primary,
        borderRadius: 11,
        paddingVertical: 14,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: colors.primary,
        fontWeight: '800',
        fontSize: 14,
    },
    helper: {
        color: colors.textSecondary,
        fontSize: 12,
        lineHeight: 19,
        marginBottom: 17,
    },
    previewPhoto: {
        height: 260,
        width: '100%',
        backgroundColor: '#F7F5FA',
        borderRadius: 12,
        marginBottom: 14,
    },
    previewDescription: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 15,
    },
    cancelButton: {
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 7,
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    galleryResult: {
        padding: 12,
        backgroundColor: '#F5F1FF',
        borderRadius: 10,
        marginBottom: 14,
    },
    galleryResultText: {
        fontSize: 12,
        color: colors.text,
        marginBottom: 5,
    },
    disabledButton: {
        opacity: 0.6,
    },
});
