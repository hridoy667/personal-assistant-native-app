import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Calendar,
  BookOpen,
  Save,
  Clock,
  Edit3,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { format, subDays, isSameDay } from 'date-fns';
import { journalService } from '@/services/journalService';
import { JournalEntry } from '@/types/journal';

export function JournalScreen() {
  const today = new Date();
  const dateOptions = [
    { label: 'Today', date: today },
    { label: 'Yesterday', date: subDays(today, 1) },
    { label: format(subDays(today, 2), 'EEEE'), date: subDays(today, 2) },
  ];

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);

  // Mode & Form State
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRecentEntries = useCallback(async () => {
    try {
      setLoading(true);
      const res = await journalService.findAll({ limit: 20 });
      setEntries(res.data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch journal entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecentEntries();
  }, [fetchRecentEntries]);

  // Sync active entry form & view state on tab/date change
  useEffect(() => {
    const existingEntry = entries.find((e) =>
      isSameDay(new Date(e.createdAt), selectedDate)
    );

    if (existingEntry) {
      setActiveEntry(existingEntry);
      setTitle(existingEntry.title || '');
      setContent(existingEntry.content || '');
      setIsEditing(false); // Default to Read-Only view for existing entries
    } else {
      setActiveEntry(null);
      setTitle('');
      setContent('');
      setIsEditing(true); // Default to Edit Mode for new entries
    }
  }, [selectedDate, entries]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Empty Journal', 'Please write a title or content before saving.');
      return;
    }

    try {
      setSaving(true);
      if (activeEntry) {
        const updated = await journalService.update(activeEntry.id, {
          title,
          content,
        });
        setEntries((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        setIsEditing(false);
        Alert.alert('Saved', 'Journal entry updated successfully!');
      } else {
        const created = await journalService.create({
          title,
          content,
        });
        setEntries((prev) => [created, ...prev]);
        setIsEditing(false);
        Alert.alert('Created', 'Journal entry created!');
      }
    } catch (error: any) {
      Alert.alert('Save Failed', error.message || 'Could not save journal entry.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (activeEntry) {
      setTitle(activeEntry.title || '');
      setContent(activeEntry.content || '');
      setIsEditing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Date Selector Tabs */}
      <View style={styles.tabContainer}>
        {dateOptions.map((opt, idx) => {
          const isSelected = isSameDay(opt.date, selectedDate);
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.tab, isSelected && styles.activeTab]}
              onPress={() => setSelectedDate(opt.date)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabSubText, isSelected && styles.activeTabSubText]}>
                {format(opt.date, 'MMM d')}
              </Text>
              <Text style={[styles.tabText, isSelected && styles.activeTabText]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Editor / Read-Only View Card */}
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerTitleRow}>
            <BookOpen size={16} color="#34D399" />
            <Text style={styles.cardTitle}>
              {format(selectedDate, 'EEEE, MMMM d')}
            </Text>
          </View>

          {activeEntry ? (
            <View style={styles.headerActions}>
              {!isEditing ? (
                <TouchableOpacity
                  style={styles.editIconButton}
                  onPress={() => setIsEditing(true)}
                  hitSlop={8}
                >
                  <Edit3 size={15} color="#F59E0B" />
                  <Text style={styles.editIconText}>Edit</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.cancelIconButton}
                  onPress={handleCancelEdit}
                  hitSlop={8}
                >
                  <XCircle size={15} color="#94A3B8" />
                  <Text style={styles.cancelIconText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.newBadge]}>
              <Edit3 size={12} color="#F59E0B" />
              <Text style={[styles.statusText, styles.newText]}>New Entry</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#10B981" size="small" />
          </View>
        ) : activeEntry && !isEditing ? (
          /* Read-Only Card View */
          <View style={styles.readOnlyContainer}>
            <Text style={styles.readOnlyTitle}>
              {activeEntry.title || 'Untitled Entry'}
            </Text>
            <Text style={styles.readOnlyContent}>
              {activeEntry.content || 'No text content available.'}
            </Text>
            <View style={styles.savedFooter}>
              <CheckCircle2 size={12} color="#10B981" />
              <Text style={styles.savedFooterText}>
                Logged at {format(new Date(activeEntry.createdAt), 'h:mm a')}
              </Text>
            </View>
          </View>
        ) : (
          /* Editable Form */
          <View style={styles.formContainer}>
            <TextInput
              style={styles.titleInput}
              placeholder="Entry Title..."
              placeholderTextColor="#64748B"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={styles.contentInput}
              placeholder="What's on your mind today?"
              placeholderTextColor="#64748B"
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.savingButton]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <>
                  <Save size={16} color="#0F172A" />
                  <Text style={styles.saveButtonText}>
                    {activeEntry ? 'Update Entry' : 'Save Entry'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Previous Entries Quick View */}
      <View style={styles.historySection}>
        <View style={styles.sectionHeader}>
          <Clock size={14} color="#94A3B8" />
          <Text style={styles.sectionTitle}>Recent Days Overview</Text>
        </View>

        {dateOptions.map((opt, idx) => {
          const entryForDate = entries.find((e) =>
            isSameDay(new Date(e.createdAt), opt.date)
          );

          return (
            <TouchableOpacity
              key={idx}
              style={styles.historyCard}
              onPress={() => setSelectedDate(opt.date)}
            >
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>
                  {opt.label} • {format(opt.date, 'MMM d')}
                </Text>
                <Calendar size={14} color="#64748B" />
              </View>
              <Text style={styles.historySnippet} numberOfLines={2}>
                {entryForDate
                  ? entryForDate.title || entryForDate.content || 'No text content'
                  : 'No entry logged for this day.'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090D16' },
  contentContainer: { padding: 14, gap: 12 },

  // Tabs
  tabContainer: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  tab: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  activeTab: { backgroundColor: '#151C2C', borderColor: '#10B981' },
  tabSubText: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  activeTabSubText: { color: '#34D399' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginTop: 2 },
  activeTabText: { color: '#F8FAFC' },

  // Card Header
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: '#F8FAFC' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  editIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#451A03',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editIconText: { fontSize: 11, fontWeight: '700', color: '#F59E0B' },
  cancelIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cancelIconText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  newBadge: { backgroundColor: '#451A03' },
  statusText: { fontSize: 10, fontWeight: '700', color: '#34D399' },
  newText: { color: '#F59E0B' },

  loadingContainer: { paddingVertical: 40, alignItems: 'center' },

  // Read-Only Display
  readOnlyContainer: {
    backgroundColor: '#151C2C',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 8,
  },
  readOnlyTitle: { fontSize: 15, fontWeight: '700', color: '#F8FAFC' },
  readOnlyContent: { fontSize: 13, color: '#CBD5E1', lineHeight: 20 },
  savedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  savedFooterText: { fontSize: 10, color: '#10B981', fontWeight: '600' },

  // Form Container
  formContainer: { gap: 10 },
  titleInput: {
    backgroundColor: '#151C2C',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  contentInput: {
    backgroundColor: '#151C2C',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#CBD5E1',
    borderWidth: 1,
    borderColor: '#1E293B',
    minHeight: 140,
    lineHeight: 18,
  },

  // Save Button
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  savingButton: { opacity: 0.7 },
  saveButtonText: { fontSize: 13, fontWeight: '800', color: '#0F172A' },

  // History Section
  historySection: { marginTop: 8, gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  historyCard: {
    backgroundColor: '#151C2C',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 4,
  },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyDate: { fontSize: 11, fontWeight: '700', color: '#34D399' },
  historySnippet: { fontSize: 12, color: '#94A3B8', lineHeight: 16 },
});