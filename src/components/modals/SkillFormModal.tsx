import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Sparkles, Target, Layers, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Skill, GenerateSkillRoadmapDto, UpdateSkillDto } from '@/types/skills';

interface SkillFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: GenerateSkillRoadmapDto | UpdateSkillDto) => void;
  initialSkill?: Skill | null;
}

const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];

export function SkillFormModal({
  visible,
  onClose,
  onSubmit,
  initialSkill,
}: SkillFormModalProps) {
  const [title, setTitle] = useState('');
  const [targetHours, setTargetHours] = useState('20');
  const [level, setLevel] = useState('Beginner');
  const [resources, setResources] = useState('');

  const isEditing = Boolean(initialSkill);

  useEffect(() => {
    if (initialSkill) {
      setTitle(initialSkill.title);
      setTargetHours(initialSkill.targetHours ? String(initialSkill.targetHours) : '20');
      setLevel(initialSkill.level || 'Beginner');
      setResources('');
    } else {
      setTitle('');
      setTargetHours('20');
      setLevel('Beginner');
      setResources('');
    }
  }, [initialSkill, visible]);

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a skill title.');
      return;
    }

    const hours = parseInt(targetHours, 10);
    if (isNaN(hours) || hours <= 0) {
      Alert.alert('Validation Error', 'Target hours must be a valid positive number.');
      return;
    }

    if (isEditing) {
      onSubmit({
        title: title.trim(),
        targetHours: hours,
        level,
      } as UpdateSkillDto);
    } else {
      onSubmit({
        title: title.trim(),
        targetHours: hours,
        level,
        resources: resources.trim() || undefined,
      } as GenerateSkillRoadmapDto);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconContainer}>
                <Sparkles size={18} color="#34D399" />
              </View>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Skill Details' : 'Generate AI Skill Roadmap'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.formContainer}
          >
            {/* Skill Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>SKILL TITLE *</Text>
              <View style={styles.inputWrapper}>
                <BookOpen size={16} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. React Native, System Design, Python"
                  placeholderTextColor="#64748B"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>
            </View>

            {/* Target Hours */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>TARGET HOURS *</Text>
              <View style={styles.inputWrapper}>
                <Target size={16} color="#64748B" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 20"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={targetHours}
                  onChangeText={setTargetHours}
                />
              </View>
            </View>

            {/* Target Level */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CURRENT / TARGET LEVEL</Text>
              <View style={styles.levelSelector}>
                {LEVEL_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.levelOption,
                      level === opt && styles.activeLevelOption,
                    ]}
                    onPress={() => setLevel(opt)}
                  >
                    <Text
                      style={[
                        styles.levelOptionText,
                        level === opt && styles.activeLevelOptionText,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Optional Context/Resources (Only for creation) */}
            {!isEditing && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PREFERRED RESOURCES OR CONTEXT (OPTIONAL)</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <Layers size={16} color="#64748B" style={styles.textAreaIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="e.g. Focus on Expo, include official docs & crash courses"
                    placeholderTextColor="#64748B"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    value={resources}
                    onChangeText={setResources}
                  />
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.submitBtnContainer}
              onPress={handleSubmit}
            >
              <LinearGradient
                colors={['#10B981', '#047857']}
                style={styles.submitBtnGradient}
              >
                <Sparkles size={16} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>
                  {isEditing ? 'Save Changes' : 'Generate AI Roadmap'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 23, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#151C2C',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#064E3B40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  closeBtn: {
    padding: 4,
  },
  formContainer: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0B0F17',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  input: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    marginLeft: 8,
  },
  textAreaWrapper: {
    height: 80,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  textAreaIcon: {
    marginTop: 2,
  },
  textArea: {
    height: '100%',
  },
  levelSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  levelOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#0B0F17',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  activeLevelOption: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  levelOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  activeLevelOptionText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  submitBtnContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  submitBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});