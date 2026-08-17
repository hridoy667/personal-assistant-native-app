import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Image,
    Switch,
    Keyboard,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    ArrowLeft,
    Camera,
    Phone,
    MapPin,
    Calendar,
    Ruler,
    Weight as WeightIcon,
    FileText,
    CheckSquare,
    Square,
    Sparkles,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';

export enum Gender {
    MALE = 'MALE',
    FEMALE = 'FEMALE',
}

export enum ActivityLevel {
    SEDENTARY = 'SEDENTARY',
    LIGHTLY_ACTIVE = 'LIGHTLY_ACTIVE',
    MODERATELY_ACTIVE = 'MODERATELY_ACTIVE',
    VERY_ACTIVE = 'VERY_ACTIVE',
}

// Helper to safely format local date as YYYY-MM-DD
const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Waits for the keyboard to actually finish closing (not just fire the
// dismiss command) before we show the full-screen loader, so the loader
// never mounts while the viewport is still shrunk by the keyboard.
const dismissKeyboardAndWait = (): Promise<void> => {
    return new Promise((resolve) => {
        let resolved = false;
        const finish = () => {
            if (resolved) return;
            resolved = true;
            sub.remove();
            resolve();
        };
        const sub = Keyboard.addListener('keyboardDidHide', finish);
        Keyboard.dismiss();
        // Fallback: keyboard may already have been closed (e.g. user tapped
        // a switch, not a text field), in which case keyboardDidHide never
        // fires — don't hang forever waiting for it.
        setTimeout(finish, 250);
    });
};

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RegisterScreen() {
    const router = useRouter();
    const { register, isLoading } = useAuth();

    // Multi-step form state (1: Account Setup, 2: Preferences & Details)
    const [step, setStep] = useState<1 | 2>(1);
    const scrollViewRef = React.useRef<ScrollView>(null);
    // STEP 1 FIELDS (Primary Account Info)
    const [profileImage, setProfileImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Date Picker States
    const [dob, setDob] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [gender, setGender] = useState<Gender | undefined>(undefined);
    const [isAgreed, setIsAgreed] = useState(false);

    // STEP 2 FIELDS (Additional Details & Feature Preferences)
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    const [district, setDistrict] = useState('');
    const [upazila, setUpazila] = useState('');
    const [timezone] = useState('Asia/Dhaka');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [activityLevel, setActivityLevel] = useState<ActivityLevel>(ActivityLevel.SEDENTARY);

    const [heightFeet, setHeightFeet] = useState<number>(5);
    const [heightInches, setHeightInches] = useState<number>(7);
    // Feature Toggles
    const [enableIslamicFeatures, setEnableIslamicFeatures] = useState(false);
    const [enableMailAssistance, setEnableMailAssistance] = useState(false);
    const [enableFinanceTracker, setEnableFinanceTracker] = useState(true);
    const [enableHealthTracking, setEnableHealthTracking] = useState(true);
    const [enableScreenTimeTracking, setEnableScreenTimeTracking] = useState(false);
    const [enableAiBriefings, setEnableAiBriefings] = useState(true);

    // Local Loading State safeguard
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Feedback State
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const calculatedHeightInMeters = (heightFeet * 0.3048) + (heightInches * 0.0254);

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            setErrorMessage('Permission to access media library is required.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setProfileImage(result.assets[0]);
        }
    };

    const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDob(selectedDate);
        }
    };

    const handleNextStep = () => {
        if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
            setErrorMessage('Please fill in all required account fields.');
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }
        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }

        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters long.');
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }

        if (!isAgreed) {
            setErrorMessage('You must accept the terms and privacy policy to proceed.');
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }

        setErrorMessage(null);
        setStep(2);
    };

    const handleRegisterSubmit = async (isSkippingAdditional = false) => {
        // Wait for the keyboard to fully close before the loader mounts —
        // this is what fixes the "loader stuck at top" issue. If the loader
        // mounts while the keyboard is still animating shut, the screen's
        // visible height is temporarily shorter, so "centered" ends up
        // centered in that shrunk area instead of the full screen.
        await dismissKeyboardAndWait();

        setErrorMessage(null);
        setIsSubmitting(true);

        const userEmail = email.trim();

        try {
            await register({
                name: name.trim(),
                email: userEmail,
                password: password.trim(),
                phone: !isSkippingAdditional && phone.trim() ? phone.trim() : undefined,
                bio: !isSkippingAdditional && bio.trim() ? bio.trim() : undefined,
                district: !isSkippingAdditional && district.trim() ? district.trim() : undefined,
                upazila: !isSkippingAdditional && upazila.trim() ? upazila.trim() : undefined,
                timezone,
                dateOfBirth: dob ? formatLocalDate(dob) : undefined,
                gender,
                height: !isSkippingAdditional ? parseFloat(calculatedHeightInMeters.toFixed(2)) : undefined,
                weight: !isSkippingAdditional && weight ? parseFloat(weight) : undefined,
                activityLevel: !isSkippingAdditional ? activityLevel : ActivityLevel.SEDENTARY,
                enableIslamicFeatures: !isSkippingAdditional ? enableIslamicFeatures : false,
                enableMailAssistance: !isSkippingAdditional ? enableMailAssistance : false,
                enableFinanceTracker: !isSkippingAdditional ? enableFinanceTracker : true,
                enableHealthTracking: !isSkippingAdditional ? enableHealthTracking : true,
                enableScreenTimeTracking: !isSkippingAdditional ? enableScreenTimeTracking : false,
                enableAiBriefings: !isSkippingAdditional ? enableAiBriefings : true,
                is_agreed_to_terms_and_policy: isAgreed,
                image: profileImage
                    ? {
                        uri: Platform.OS === 'ios' ? profileImage.uri.replace('file://', '') : profileImage.uri,
                        name: profileImage.uri.split('/').pop() || 'profile.jpg',
                        type: profileImage.mimeType || 'image/jpeg',
                    }
                    : undefined,
            } as any);

            // Navigate to OTP page
            router.replace({
                pathname: '/(auth)/verify-otp',
                params: { email: userEmail },
            });
        } catch (error: any) {
            // IMPORTANT: this is console.log, not console.error.
            // console.error triggers Expo/RN's full-screen LogBox redbox in
            // dev builds — which is what looked like "the app breaking."
            // This is a normal, expected, already-handled error (shown to
            // the user via errorMessage below), so it shouldn't alarm-log.
            console.log('Registration Error:', error?.message);
            setErrorMessage(
                error?.response?.data?.message || error?.message || 'Failed to create account. Please try again.'
            );
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        } finally {
            setIsSubmitting(false);
        }
    };

    const showOverlay = isLoading || isSubmitting;

    return (
        <SafeAreaView style={styles.container}>
            {/* Full-screen loader overlay — uses fixed SCREEN_WIDTH/SCREEN_HEIGHT
                instead of percentage-based absoluteFill, so it stays anchored to
                the true physical screen size even if a parent view temporarily
                shrinks (e.g. Android's adjustResize keyboard behavior). */}
            {showOverlay && (
                <View style={styles.loadingModalOverlay} pointerEvents="auto">
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color="#6366F1" />
                        <Text style={styles.loadingText}>Creating Account...</Text>
                    </View>
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header Navigation Bar */}
                    {step === 2 && (
                        <View style={styles.headerBar}>
                            <TouchableOpacity
                                onPress={() => setStep(1)}
                                style={styles.backButton}
                                activeOpacity={0.7}
                            >
                                <ArrowLeft color="#CBD5E1" size={20} />
                                <Text style={styles.backButtonText}>Back</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Screen Title & Step Indicator */}
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.title}>
                            {step === 1 ? 'Create Account' : 'Personalize Profile'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {step === 1
                                ? 'Step 1 of 2 — Primary details'
                                : 'Step 2 of 2 — Custom preferences (Optional)'}
                        </Text>
                    </View>

                    {/* Error Message Box */}
                    {errorMessage && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{errorMessage}</Text>
                        </View>
                    )}

                    {/* ================= STEP 1: Core Fields ================= */}
                    {step === 1 && (
                        <View>
                            {/* Profile Avatar Picker */}
                            <View style={styles.avatarContainer}>
                                <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} style={styles.avatarWrapper}>
                                    {profileImage ? (
                                        <Image source={{ uri: profileImage.uri }} style={styles.avatarImage} />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <Camera color="#94a3b8" size={30} />
                                        </View>
                                    )}
                                    <View style={styles.cameraBadge}>
                                        <Camera color="#FFFFFF" size={12} />
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.avatarHint}>Upload profile photo</Text>
                            </View>

                            {/* Full Name */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Full Name *</Text>
                                <View style={styles.inputContainer}>
                                    <User color="#94a3b8" size={20} />
                                    <TextInput
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="John Doe"
                                        placeholderTextColor="#64748b"
                                        autoCapitalize="words"
                                        style={styles.input}
                                    />
                                </View>
                            </View>

                            {/* Email Address */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Email Address *</Text>
                                <View style={styles.inputContainer}>
                                    <Mail color="#94a3b8" size={20} />
                                    <TextInput
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="name@example.com"
                                        placeholderTextColor="#64748b"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        style={styles.input}
                                    />
                                </View>
                            </View>

                            {/* Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Password *</Text>
                                <View style={styles.inputContainer}>
                                    <Lock color="#94a3b8" size={20} />
                                    <TextInput
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="••••••••"
                                        placeholderTextColor="#64748b"
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        style={styles.input}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        activeOpacity={0.7}
                                        style={{ padding: 4 }}
                                    >
                                        {showPassword ? <EyeOff color="#94a3b8" size={20} /> : <Eye color="#94a3b8" size={20} />}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Confirm Password */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Confirm Password *</Text>
                                <View style={styles.inputContainer}>
                                    <Lock color="#94a3b8" size={20} />
                                    <TextInput
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        placeholder="••••••••"
                                        placeholderTextColor="#64748b"
                                        secureTextEntry={!showConfirmPassword}
                                        autoCapitalize="none"
                                        style={styles.input}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        activeOpacity={0.7}
                                        style={{ padding: 4 }}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff color="#94a3b8" size={20} />
                                        ) : (
                                            <Eye color="#94a3b8" size={20} />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Date of Birth Picker Field */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Date of Birth</Text>
                                <TouchableOpacity
                                    onPress={() => setShowDatePicker(true)}
                                    activeOpacity={0.7}
                                    style={styles.inputContainer}
                                >
                                    <Calendar color="#94a3b8" size={18} />
                                    <Text style={[styles.dateText, !dob && styles.placeholderText]}>
                                        {dob ? formatLocalDate(dob) : 'YYYY-MM-DD'}
                                    </Text>
                                </TouchableOpacity>

                                {/* DateTimePicker Modal/Sheet */}
                                {showDatePicker && (
                                    <View>
                                        <DateTimePicker
                                            value={dob || new Date(2000, 0, 1)}
                                            mode="date"
                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                            maximumDate={new Date()}
                                            onChange={handleDateChange}
                                        />
                                        {Platform.OS === 'ios' && (
                                            <TouchableOpacity
                                                onPress={() => setShowDatePicker(false)}
                                                style={styles.datePickerDoneButton}
                                            >
                                                <Text style={styles.datePickerDoneText}>Done</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}
                            </View>

                            {/* Gender Selector Chips */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Gender</Text>
                                <View style={styles.genderOptions}>
                                    {[Gender.MALE, Gender.FEMALE].map((item) => (
                                        <TouchableOpacity
                                            key={item}
                                            style={[styles.chip, gender === item && styles.chipActive]}
                                            onPress={() => setGender(item)}
                                        >
                                            <Text style={[styles.chipText, gender === item && styles.chipTextActive]}>
                                                {item}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Terms and Privacy Policy Checkbox */}
                            <TouchableOpacity
                                style={styles.termsRow}
                                onPress={() => setIsAgreed(!isAgreed)}
                                activeOpacity={0.8}
                            >
                                {isAgreed ? (
                                    <CheckSquare color="#6366F1" size={20} />
                                ) : (
                                    <Square color="#94A3B8" size={20} />
                                )}
                                <Text style={styles.termsText}>
                                    I agree to the <Text style={styles.termsHighlight}>Terms & Privacy Policy *</Text>
                                </Text>
                            </TouchableOpacity>

                            {/* Next Step Button */}
                            <TouchableOpacity
                                onPress={handleNextStep}
                                activeOpacity={0.8}
                                style={styles.button}
                            >
                                <View style={styles.buttonInner}>
                                    <Text style={styles.buttonText}>Next Step</Text>
                                    <ArrowRight color="#ffffff" size={18} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* ================= STEP 2: Optional Details & Features ================= */}
                    {step === 2 && (
                        <View>
                            {/* Phone Number */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Phone Number</Text>
                                <View style={styles.inputContainer}>
                                    <Phone color="#94a3b8" size={20} />
                                    <TextInput
                                        value={phone}
                                        onChangeText={setPhone}
                                        placeholder="+8801700000000"
                                        placeholderTextColor="#64748b"
                                        keyboardType="phone-pad"
                                        style={styles.input}
                                    />
                                </View>
                            </View>

                            {/* Bio */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Bio</Text>
                                <View style={styles.inputContainer}>
                                    <FileText color="#94a3b8" size={20} />
                                    <TextInput
                                        value={bio}
                                        onChangeText={setBio}
                                        placeholder="A brief bit about yourself"
                                        placeholderTextColor="#64748b"
                                        style={styles.input}
                                    />
                                </View>
                            </View>

                            {/* District & Upazila */}
                            <View style={styles.rowGroup}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={styles.label}>District</Text>
                                    <View style={styles.inputContainer}>
                                        <MapPin color="#94a3b8" size={18} />
                                        <TextInput
                                            value={district}
                                            onChangeText={setDistrict}
                                            placeholder="Dhaka"
                                            placeholderTextColor="#64748b"
                                            style={styles.input}
                                        />
                                    </View>
                                </View>
                                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                    <Text style={styles.label}>Upazila</Text>
                                    <View style={styles.inputContainer}>
                                        <MapPin color="#94a3b8" size={18} />
                                        <TextInput
                                            value={upazila}
                                            onChangeText={setUpazila}
                                            placeholder="Dhanmondi"
                                            placeholderTextColor="#64748b"
                                            style={styles.input}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Height & Weight Row */}
                            <View style={styles.rowGroup}>
                                {/* Height Selection */}
                                <View style={styles.heightInputGroup}>
                                    <Text style={styles.label}>Height</Text>
                                    <View style={styles.heightPickerRow}>
                                        {/* Feet Selector */}
                                        <View style={styles.heightSegment}>
                                            <Ruler color="#94a3b8" size={16} />
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSelector}>
                                                {[3, 4, 5, 6, 7].map((ft) => (
                                                    <TouchableOpacity
                                                        key={ft}
                                                        style={[styles.unitChip, heightFeet === ft && styles.unitChipActive]}
                                                        onPress={() => setHeightFeet(ft)}
                                                    >
                                                        <Text style={[styles.unitChipText, heightFeet === ft && styles.unitChipTextActive]}>
                                                            {ft}'
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>

                                        {/* Inches Selector */}
                                        <View style={styles.heightSegment}>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSelector}>
                                                {Array.from({ length: 12 }, (_, i) => i).map((inch) => (
                                                    <TouchableOpacity
                                                        key={inch}
                                                        style={[styles.unitChip, heightInches === inch && styles.unitChipActive]}
                                                        onPress={() => setHeightInches(inch)}
                                                    >
                                                        <Text style={[styles.unitChipText, heightInches === inch && styles.unitChipTextActive]}>
                                                            {inch}"
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    </View>
                                </View>

                                {/* Weight Input */}
                                <View style={styles.weightInputGroup}>
                                    <Text style={styles.label}>Weight</Text>
                                    <View style={styles.weightInputContainer}>
                                        <WeightIcon color="#94a3b8" size={16} />
                                        <TextInput
                                            value={weight}
                                            onChangeText={setWeight}
                                            placeholder="70.5"
                                            placeholderTextColor="#64748b"
                                            keyboardType="decimal-pad"
                                            style={styles.weightInput}
                                        />
                                        <Text style={styles.unitSuffix}>kg</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Activity Level */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Activity Level</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.genderOptions}>
                                        {Object.values(ActivityLevel).map((item) => (
                                            <TouchableOpacity
                                                key={item}
                                                style={[styles.chip, activityLevel === item && styles.chipActive]}
                                                onPress={() => setActivityLevel(item)}
                                            >
                                                <Text style={[styles.chipText, activityLevel === item && styles.chipTextActive]}>
                                                    {item.replace('_', ' ')}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>

                            {/* App Preferences & Feature Toggles */}
                            <Text style={styles.subSectionTitle}>Preferences & Features</Text>

                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Enable Islamic Features</Text>
                                <Switch
                                    value={enableIslamicFeatures}
                                    onValueChange={setEnableIslamicFeatures}
                                    trackColor={{ false: '#334155', true: '#6366F1' }}
                                />
                            </View>

                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Enable Finance Tracker</Text>
                                <Switch
                                    value={enableFinanceTracker}
                                    onValueChange={setEnableFinanceTracker}
                                    trackColor={{ false: '#334155', true: '#6366F1' }}
                                />
                            </View>

                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Enable Health Tracking</Text>
                                <Switch
                                    value={enableHealthTracking}
                                    onValueChange={setEnableHealthTracking}
                                    trackColor={{ false: '#334155', true: '#6366F1' }}
                                />
                            </View>

                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Enable AI Briefings</Text>
                                <Switch
                                    value={enableAiBriefings}
                                    onValueChange={setEnableAiBriefings}
                                    trackColor={{ false: '#334155', true: '#6366F1' }}
                                />
                            </View>

                            {/* Complete Registration Button */}
                            <TouchableOpacity
                                onPress={() => handleRegisterSubmit(false)}
                                disabled={showOverlay}
                                activeOpacity={0.8}
                                style={[styles.button, { marginTop: 20 }]}
                            >
                                <View style={styles.buttonInner}>
                                    <Sparkles color="#ffffff" size={18} style={{ marginRight: 8 }} />
                                    <Text style={styles.buttonText}>Complete Registration</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Footer Link */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <Link href={'/(auth)/login' as any} asChild>
                            <TouchableOpacity activeOpacity={0.7}>
                                <Text style={styles.loginText}>Sign in</Text>
                            </TouchableOpacity>
                        </Link>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    loadingModalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        zIndex: 999,
        elevation: 999,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
    },
    loadingCard: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 28,
        paddingVertical: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#334155',
        minWidth: 180,
    },
    loadingText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '500',
        marginTop: 12,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        height: 40,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    backButtonText: {
        color: '#CBD5E1',
        fontSize: 15,
        fontWeight: '500',
    },
    headerTitleContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    subtitle: {
        color: '#94A3B8',
        fontSize: 14,
        marginTop: 4,
    },
    errorBox: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    errorText: {
        color: '#F87171',
        fontSize: 14,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1E293B',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#6366F1',
        padding: 6,
        borderRadius: 12,
    },
    avatarHint: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 6,
    },
    inputGroup: {
        marginBottom: 16,
    },
    rowGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    label: {
        color: '#CBD5E1',
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 10,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: '#334155',
    },
    input: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 15,
        marginLeft: 10,
    },
    dateText: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 15,
        marginLeft: 10,
    },
    placeholderText: {
        color: '#64748b',
    },
    genderOptions: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: '#334155',
    },
    chipActive: {
        backgroundColor: '#6366F1',
        borderColor: '#6366F1',
    },
    chipText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '500',
    },
    chipTextActive: {
        color: '#FFFFFF',
    },
    termsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginVertical: 12,
    },
    termsText: {
        color: '#94A3B8',
        fontSize: 14,
    },
    termsHighlight: {
        color: '#818CF8',
        fontWeight: '600',
    },
    subSectionTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 12,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    switchLabel: {
        color: '#CBD5E1',
        fontSize: 15,
    },
    button: {
        backgroundColor: '#6366F1',
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    buttonInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginRight: 6,
    },
    datePickerDoneButton: {
        alignSelf: 'flex-end',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#6366F1',
        borderRadius: 8,
        marginTop: 8,
    },
    datePickerDoneText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    footerText: {
        color: '#94A3B8',
        fontSize: 14,
    },
    loginText: {
        color: '#818CF8',
        fontSize: 14,
        fontWeight: '600',
    },

    /* --- Modified & Added Height/Weight Styles --- */
    heightInputGroup: {
        flex: 1.6,
    },
    weightInputGroup: {
        flex: 1,
    },
    heightPickerRow: {
        flexDirection: 'row',
        gap: 4,
    },
    heightSegment: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 8,
        paddingHorizontal: 4,
        height: 48,
        borderWidth: 1,
        borderColor: '#334155',
    },
    scrollSelector: {
        flexDirection: 'row',
    },
    unitChip: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: 'transparent',
        marginRight: 2,
    },
    unitChipActive: {
        backgroundColor: '#6366F1',
    },
    unitChipText: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '500',
    },
    unitChipTextActive: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    weightInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 8,
        paddingHorizontal: 8,
        height: 48,
        borderWidth: 1,
        borderColor: '#334155',
    },
    weightInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 14,
        paddingHorizontal: 4,
    },
    unitSuffix: {
        color: '#64748B',
        fontSize: 12,
        fontWeight: '600',
    },
});