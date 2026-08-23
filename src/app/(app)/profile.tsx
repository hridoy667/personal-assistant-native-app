import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import {
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  ChevronDown,
  Clock,
  Lock,
  MapPin,
  Pencil,
  Ruler,
  User as UserIcon,
  Weight as WeightIcon,
  X,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

import { authApi } from '@/services/authapi';
import { AuthUser, UpdateAuthPayload } from '@/types/auth';

export type PersonalityType =
  | 'INTJ_ARCHITECT'
  | 'INTP_LOGICIAN'
  | 'ENTJ_COMMANDER'
  | 'ENTP_DEBATER'
  | 'INFJ_ADVOCATE'
  | 'INFP_MEDIATOR'
  | 'ENFJ_PROTAGONIST'
  | 'ENFP_CAMPAIGNER'
  | 'ISTJ_LOGISTICIAN'
  | 'ISFJ_DEFENDER'
  | 'ESTJ_EXECUTIVE'
  | 'ESFJ_CONSUL'
  | 'ISTP_VIRTUSO'
  | 'ISFP_ADVENTURER'
  | 'ESTP_ENTREPRENEUR'
  | 'ESFP_ENTERTAINER';

const PERSONALITY_TYPES: PersonalityType[] = [
  'INTJ_ARCHITECT',
  'INTP_LOGICIAN',
  'ENTJ_COMMANDER',
  'ENTP_DEBATER',
  'INFJ_ADVOCATE',
  'INFP_MEDIATOR',
  'ENFJ_PROTAGONIST',
  'ENFP_CAMPAIGNER',
  'ISTJ_LOGISTICIAN',
  'ISFJ_DEFENDER',
  'ESTJ_EXECUTIVE',
  'ESFJ_CONSUL',
  'ISTP_VIRTUSO',
  'ISFP_ADVENTURER',
  'ESTP_ENTREPRENEUR',
  'ESFP_ENTERTAINER',
];

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Edit mode
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Basic Information
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');

  // Schedule & Personality
  const [defaultWakeTime, setDefaultWakeTime] = useState('');
  const [defaultSleepTime, setDefaultSleepTime] = useState('');
  const [wakeTimeDate, setWakeTimeDate] = useState<Date>(new Date(2024, 0, 1, 6, 0));
  const [sleepTimeDate, setSleepTimeDate] = useState<Date>(new Date(2024, 0, 1, 23, 0));
  const [showWakePicker, setShowWakePicker] = useState(false);
  const [showSleepPicker, setShowSleepPicker] = useState(false);

  const [personalityType, setPersonalityType] = useState<PersonalityType | null>(null);
  const [showPersonalityDropdown, setShowPersonalityDropdown] = useState(false);

  // DOB States
  const [dobDate, setDobDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Location Information
  const [district, setDistrict] = useState('');
  const [upazila, setUpazila] = useState('');
  const [location, setLocation] = useState('');
  const [timezone, setTimezone] = useState('');

  // Physical & Target Metrics
  const [heightFeet, setHeightFeet] = useState<number>(5);
  const [heightInches, setHeightInches] = useState<number>(10);
  const [weight, setWeight] = useState('');
  const [dailyTargetFocus, setDailyTargetFocus] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | ''>('');
  const [activityLevel, setActivityLevel] = useState<
    'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE' | ''
  >('');

  // Feature Toggles
  const [enableIslamicFeatures, setEnableIslamicFeatures] = useState(false);
  const [enableMailAssistance, setEnableMailAssistance] = useState(false);
  const [enableFinanceTracker, setEnableFinanceTracker] = useState(true);
  const [enableHealthTracking, setEnableHealthTracking] = useState(true);
  const [enableScreenTimeTracking, setEnableScreenTimeTracking] = useState(false);
  const [enableAiBriefings, setEnableAiBriefings] = useState(true);

  // Avatar Image Picker
  const [selectedImage, setSelectedImage] = useState<{
    uri: string;
    name?: string;
    type?: string;
  } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Convert Date object to 24-hour format string (HH:mm) for database storage
  const formatTime24Hour = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Format 24-hour time string ("14:30") or Date to 12-hour AM/PM string ("2:30 PM") for UI display
  const formatTimeAMPM = (timeInput: string | Date) => {
    let dateObj: Date;
    if (timeInput instanceof Date) {
      dateObj = timeInput;
    } else if (typeof timeInput === 'string' && timeInput.includes(':')) {
      const parts = timeInput.split(':');
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      dateObj = new Date(2024, 0, 1, isNaN(h) ? 0 : h, isNaN(m) ? 0 : m);
    } else {
      return '';
    }

    let hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // '0' hours becomes '12'
    const strMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${strMinutes} ${ampm}`;
  };

  const parseTimeStringToDate = (timeStr?: string) => {
    if (!timeStr) return new Date(2024, 0, 1, 8, 0);
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        return new Date(2024, 0, 1, h, m);
      }
    }
    return new Date(2024, 0, 1, 8, 0);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await authApi.getMe();
      const data: AuthUser = (response as any)?.data || response;

      setUser(data);

      setName(data.name || '');
      setPhone(data.phone || '');
      setBio(data.bio || '');

      // Schedule & Personality Sync
      setDefaultWakeTime(data.defaultWakeTime || '');
      setDefaultSleepTime(data.defaultSleepTime || '');
      setWakeTimeDate(parseTimeStringToDate(data.defaultWakeTime));
      setSleepTimeDate(parseTimeStringToDate(data.defaultSleepTime));
      setPersonalityType(data.personalityType || null);

      if (data.dateOfBirth) {
        const [y, m, d] = String(data.dateOfBirth).split('T')[0].split('-').map(Number);
        if (y && m && d) {
          setDobDate(new Date(y, m - 1, d));
        } else {
          const parsedDate = new Date(data.dateOfBirth);
          if (!isNaN(parsedDate.getTime())) {
            setDobDate(parsedDate);
          }
        }
      }

      setDistrict(data.district || '');
      setUpazila(data.upazila || '');
      setLocation(data.location || '');
      setTimezone(data.timezone || 'Asia/Dhaka');

      if (data.height && !isNaN(Number(data.height))) {
        const heightMeters = Number(data.height);
        const totalInches = Math.round(heightMeters / 0.0254);
        const feet = Math.floor(totalInches / 12);
        const inches = totalInches % 12;

        setHeightFeet(feet);
        setHeightInches(inches);
      }

      setWeight(data.weight != null ? String(data.weight) : '');
      setDailyTargetFocus(data.dailyTargetFocus || '');
      setGender((data.gender as 'MALE' | 'FEMALE') || '');
      setActivityLevel(
        (data.activityLevel as
          | 'SEDENTARY'
          | 'LIGHTLY_ACTIVE'
          | 'MODERATELY_ACTIVE'
          | 'VERY_ACTIVE') || 'SEDENTARY'
      );

      setEnableIslamicFeatures(!!data.enableIslamicFeatures);
      setEnableMailAssistance(!!data.enableMailAssistance);
      setEnableFinanceTracker(data.enableFinanceTracker ?? true);
      setEnableHealthTracking(data.enableHealthTracking ?? true);
      setEnableScreenTimeTracking(!!data.enableScreenTimeTracking);
      setEnableAiBriefings(data.enableAiBriefings ?? true);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to fetch user profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) setDobDate(selectedDate);
  };

  const handleWakeTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowWakePicker(false);
    if (selectedDate) {
      setWakeTimeDate(selectedDate);
      setDefaultWakeTime(formatTime24Hour(selectedDate));
    }
  };

  const handleSleepTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowSleepPicker(false);
    if (selectedDate) {
      setSleepTimeDate(selectedDate);
      setDefaultSleepTime(formatTime24Hour(selectedDate));
    }
  };

  const handlePickImage = async () => {
    if (!isEditing) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Permission to access media library is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileName = asset.uri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(fileName);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      setSelectedImage({ uri: asset.uri, name: fileName, type });
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Name is required.');
      return;
    }

    setUpdating(true);
    try {
      const formattedDob = dobDate ? formatLocalDate(dobDate) : undefined;
      const totalInches = heightFeet * 12 + heightInches;
      const heightInMeters = parseFloat((totalInches * 0.0254).toFixed(2));

      const payload: UpdateAuthPayload = {
        name,
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        defaultWakeTime: defaultWakeTime || formatTime24Hour(wakeTimeDate),
        defaultSleepTime: defaultSleepTime || formatTime24Hour(sleepTimeDate),
        personalityType: personalityType || null,
        dateOfBirth: formattedDob,
        district: district.trim() || undefined,
        upazila: upazila.trim() || undefined,
        location: location.trim() || undefined,
        timezone: timezone.trim() || undefined,
        height: heightInMeters,
        weight: weight ? parseFloat(weight) : undefined,
        dailyTargetFocus: dailyTargetFocus.trim() || undefined,
        gender: gender ? (gender as 'MALE' | 'FEMALE') : null,
        activityLevel: activityLevel
          ? (activityLevel as 'SEDENTARY' | 'LIGHTLY_ACTIVE' | 'MODERATELY_ACTIVE' | 'VERY_ACTIVE')
          : undefined,
        enableIslamicFeatures,
        enableMailAssistance,
        enableFinanceTracker,
        enableHealthTracking,
        enableScreenTimeTracking,
        enableAiBriefings,
      };

      const res = await authApi.updateProfile(payload, selectedImage || undefined);
      const updatedUser: AuthUser = (res as any)?.data || res;

      setUser(updatedUser);
      setSelectedImage(null);
      setIsEditing(false);
      setShowPersonalityDropdown(false);
      Alert.alert('Success', 'Profile updated successfully!');

      // Sync state back with updated profile values from server
      await fetchProfile();
    } catch (error: any) {
      Alert.alert('Update Failed', error?.message || 'Could not update profile.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setSelectedImage(null);
    setIsEditing(false);
    setShowPersonalityDropdown(false);
    fetchProfile();
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  const avatarUri =
    selectedImage?.uri ||
    user?.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user?.name || 'User'
    )}&background=3b82f6&color=fff&bold=true`;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
          activeOpacity={0.7}
        >
          {isEditing ? <X size={18} color="#f8fafc" /> : <Pencil size={16} color="#f8fafc" />}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            {isEditing && (
              <TouchableOpacity style={styles.cameraBadge} onPress={handlePickImage} activeOpacity={0.8}>
                <Camera size={16} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
          {isEditing && <Text style={styles.changePhotoText}>Tap camera icon to change photo</Text>}
        </View>

        <Text style={styles.sectionTitle}>Basic Details</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email Address (Read-Only)</Text>
          <View style={[styles.inputContainer, styles.disabledInput]}>
            <TextInput style={[styles.input, { color: '#64748b' }]} value={user?.email || ''} editable={false} />
            <Lock size={16} color="#64748b" />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full Name</Text>
          <View style={[styles.inputContainer, !isEditing && styles.disabledInput]}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter full name"
              placeholderTextColor="#475569"
              editable={isEditing}
            />
            <UserIcon size={16} color="#64748b" />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={[styles.inputContainer, !isEditing && styles.disabledInput]}>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+8801700000000"
              placeholderTextColor="#475569"
              keyboardType="phone-pad"
              editable={isEditing}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            onPress={() => isEditing && setShowDatePicker(true)}
            activeOpacity={0.7}
            style={[styles.inputContainer, !isEditing && styles.disabledInput]}
            disabled={!isEditing}
          >
            <Calendar size={16} color="#64748b" style={{ marginRight: 8 }} />
            <Text style={[styles.dateText, !dobDate && styles.placeholderText]}>
              {dobDate ? formatLocalDate(dobDate) : 'YYYY-MM-DD'}
            </Text>
          </TouchableOpacity>

          {isEditing && showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={dobDate || new Date(2000, 0, 1)}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
              {Platform.OS === 'ios' && (
                <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.datePickerDoneButton}>
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Bio</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer, !isEditing && styles.disabledInput]}>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
              editable={isEditing}
            />
          </View>
        </View>

        {/* Section: Routine & Personality */}
        <Text style={styles.sectionTitle}>Routine & Personality</Text>

        <View style={styles.rowFields}>
          {/* Wake Time Picker */}
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Wake Time</Text>
            <TouchableOpacity
              onPress={() => isEditing && setShowWakePicker(true)}
              activeOpacity={0.7}
              style={[styles.inputContainer, !isEditing && styles.disabledInput]}
              disabled={!isEditing}
            >
              <Clock size={16} color="#64748b" style={{ marginRight: 6 }} />
              <Text style={styles.input}>
                {formatTimeAMPM(defaultWakeTime || wakeTimeDate)}
              </Text>
            </TouchableOpacity>

            {isEditing && showWakePicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={wakeTimeDate}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleWakeTimeChange}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity onPress={() => setShowWakePicker(false)} style={styles.datePickerDoneButton}>
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Sleep Time Picker */}
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Sleep Time</Text>
            <TouchableOpacity
              onPress={() => isEditing && setShowSleepPicker(true)}
              activeOpacity={0.7}
              style={[styles.inputContainer, !isEditing && styles.disabledInput]}
              disabled={!isEditing}
            >
              <Clock size={16} color="#64748b" style={{ marginRight: 6 }} />
              <Text style={styles.input}>
                {formatTimeAMPM(defaultSleepTime || sleepTimeDate)}
              </Text>
            </TouchableOpacity>

            {isEditing && showSleepPicker && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={sleepTimeDate}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleSleepTimeChange}
                />
                {Platform.OS === 'ios' && (
                  <TouchableOpacity onPress={() => setShowSleepPicker(false)} style={styles.datePickerDoneButton}>
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Personality Dropdown */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Personality Type</Text>
          <TouchableOpacity
            style={[styles.dropdownContainer, !isEditing && styles.disabledInput]}
            onPress={() => isEditing && setShowPersonalityDropdown(!showPersonalityDropdown)}
            activeOpacity={0.8}
            disabled={!isEditing}
          >
            <Text style={styles.dropdownText}>
              {personalityType ? personalityType.replace('_', ' ') : 'Select Personality Type'}
            </Text>
            <ChevronDown size={18} color="#64748b" />
          </TouchableOpacity>

          {isEditing && showPersonalityDropdown && (
            <View style={styles.dropdownMenu}>
              <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
                {PERSONALITY_TYPES.map((type) => {
                  const isSelected = personalityType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                      onPress={() => {
                        setPersonalityType(isSelected ? null : type);
                        setShowPersonalityDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                        {type.replace('_', ' ')}
                      </Text>
                      {isSelected && <Check size={16} color="#3b82f6" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Section: Location Details */}
        <Text style={styles.sectionTitle}>Location Information</Text>

        <View style={styles.rowFields}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>District</Text>
            <View style={[styles.inputContainer, !isEditing && styles.disabledInput]}>
              <MapPin size={16} color="#64748b" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.input}
                value={district}
                onChangeText={setDistrict}
                placeholder="District"
                placeholderTextColor="#475569"
                editable={isEditing}
              />
            </View>
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Upazila</Text>
            <View style={[styles.inputContainer, !isEditing && styles.disabledInput]}>
              <MapPin size={16} color="#64748b" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.input}
                value={upazila}
                onChangeText={setUpazila}
                placeholder="Upazila"
                placeholderTextColor="#475569"
                editable={isEditing}
              />
            </View>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Detailed Address</Text>
          <View style={[styles.inputContainer, !isEditing && styles.disabledInput]}>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Detailed location address"
              placeholderTextColor="#475569"
              editable={isEditing}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Timezone</Text>
          <View style={[styles.inputContainer, !isEditing && styles.disabledInput]}>
            <TextInput
              style={styles.input}
              value={timezone}
              onChangeText={setTimezone}
              placeholder="Asia/Dhaka"
              placeholderTextColor="#475569"
              editable={isEditing}
            />
          </View>
        </View>

        {/* Section: Health & Focus Metrics */}
        <Text style={styles.sectionTitle}>Health & Daily Focus</Text>

        <View style={styles.rowFields}>
          <View style={[styles.fieldGroup, { flex: 1.6 }]}>
            <Text style={styles.label}>Height</Text>
            {isEditing ? (
              <View style={styles.heightPickerRow}>
                <View style={styles.heightSegment}>
                  <Ruler color="#64748b" size={14} />
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
            ) : (
              <View style={[styles.inputContainer, styles.disabledInput]}>
                <Ruler color="#64748b" size={14} style={{ marginRight: 8 }} />
                <Text style={styles.input}>{`${heightFeet}'${heightInches}''`}</Text>
              </View>
            )}
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Weight</Text>
            <View style={[styles.weightInputContainer, !isEditing && styles.disabledInput]}>
              <WeightIcon color="#64748b" size={14} />
              <TextInput
                value={weight}
                onChangeText={setWeight}
                placeholder="70.5"
                placeholderTextColor="#475569"
                keyboardType="decimal-pad"
                style={styles.weightInput}
                editable={isEditing}
              />
              <Text style={styles.unitSuffix}>kg</Text>
            </View>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Daily Target Focus</Text>
          <View style={[styles.inputContainer, !isEditing && styles.disabledInput]}>
            <TextInput
              style={styles.input}
              value={dailyTargetFocus}
              onChangeText={setDailyTargetFocus}
              placeholder="e.g. Fitness, Coding, Productivity"
              placeholderTextColor="#475569"
              editable={isEditing}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.pillRow}>
            {(['MALE', 'FEMALE'] as const).map((g) => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.pillButton,
                  gender === g && styles.pillButtonActive,
                  !isEditing && styles.disabledPill,
                ]}
                onPress={() => isEditing && setGender(g)}
                disabled={!isEditing}
              >
                <Text style={[styles.pillText, gender === g && styles.pillTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Activity Level</Text>
          <View style={styles.pillWrap}>
            {(['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE'] as const).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.pillButton,
                  activityLevel === level && styles.pillButtonActive,
                  !isEditing && styles.disabledPill,
                ]}
                onPress={() => isEditing && setActivityLevel(level)}
                disabled={!isEditing}
              >
                <Text style={[styles.pillText, activityLevel === level && styles.pillTextActive]}>
                  {level.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Application Features</Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Islamic Features</Text>
          <Switch
            value={enableIslamicFeatures}
            onValueChange={setEnableIslamicFeatures}
            trackColor={{ false: '#334155', true: '#3b82f6' }}
            thumbColor="#ffffff"
            disabled={!isEditing}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Mail Assistance</Text>
          <Switch
            value={enableMailAssistance}
            onValueChange={setEnableMailAssistance}
            trackColor={{ false: '#334155', true: '#3b82f6' }}
            thumbColor="#ffffff"
            disabled={!isEditing}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Finance Tracker</Text>
          <Switch
            value={enableFinanceTracker}
            onValueChange={setEnableFinanceTracker}
            trackColor={{ false: '#334155', true: '#3b82f6' }}
            thumbColor="#ffffff"
            disabled={!isEditing}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Health Tracking</Text>
          <Switch
            value={enableHealthTracking}
            onValueChange={setEnableHealthTracking}
            trackColor={{ false: '#334155', true: '#3b82f6' }}
            thumbColor="#ffffff"
            disabled={!isEditing}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Screen Time Tracking</Text>
          <Switch
            value={enableScreenTimeTracking}
            onValueChange={setEnableScreenTimeTracking}
            trackColor={{ false: '#334155', true: '#3b82f6' }}
            thumbColor="#ffffff"
            disabled={!isEditing}
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>AI Briefings</Text>
          <Switch
            value={enableAiBriefings}
            onValueChange={setEnableAiBriefings}
            trackColor={{ false: '#334155', true: '#3b82f6' }}
            thumbColor="#ffffff"
            disabled={!isEditing}
          />
        </View>

        {isEditing && (
          <TouchableOpacity
            style={[styles.saveButton, updating && styles.disabledButton]}
            onPress={handleUpdateProfile}
            disabled={updating}
            activeOpacity={0.8}
          >
            {updating ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Check size={18} color="#ffffff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    gap: 14,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3b82f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0b0f19',
  },
  changePhotoText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#38bdf8',
    marginTop: 10,
  },
  fieldGroup: {
    gap: 6,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111729',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 14,
    height: 48,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: '#f8fafc',
  },
  placeholderText: {
    color: '#475569',
  },
  datePickerContainer: {
    backgroundColor: '#111729',
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  datePickerDoneButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    marginTop: 6,
  },
  datePickerDoneText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  heightPickerRow: {
    flexDirection: 'row',
    gap: 6,
  },
  heightSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111729',
    borderRadius: 12,
    paddingHorizontal: 8,
    height: 48,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  scrollSelector: {
    flexDirection: 'row',
  },
  unitChip: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'transparent',
    marginRight: 2,
  },
  unitChipActive: {
    backgroundColor: '#3b82f6',
  },
  unitChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  unitChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  weightInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111729',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  weightInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    paddingHorizontal: 6,
  },
  unitSuffix: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  textAreaContainer: {
    height: 80,
    paddingVertical: 10,
    alignItems: 'flex-start',
  },
  disabledInput: {
    backgroundColor: '#0f172a',
  },
  disabledPill: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#f8fafc',
  },
  textArea: {
    textAlignVertical: 'top',
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pillButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#111729',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  pillButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  pillText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111729',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  switchLabel: {
    fontSize: 14,
    color: '#f8fafc',
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    height: 50,
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 48,
  },
  dropdownText: {
    color: '#f8fafc',
    fontSize: 14,
  },
  dropdownMenu: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  dropdownItemText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  dropdownItemTextActive: {
    color: '#3b82f6',
    fontWeight: 'bold',
  },
});