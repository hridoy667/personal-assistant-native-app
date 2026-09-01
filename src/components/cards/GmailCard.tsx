import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Mail, CheckCircle, PlusCircle } from 'lucide-react-native';
import { gmailApiService } from '@/services/gmailService';
import { SyncedEmailItem, TaskPriority, EnergyRequirement } from '@/types/gmail';

export const GmailCard = () => {
  const [emails, setEmails] = useState<SyncedEmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await gmailApiService.getSyncedEmails({ limit: 4 });
      setEmails(res.data);
    } catch (err: any) {
      console.error('Error fetching synced emails:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleConvertToTask = async (emailId: string) => {
    try {
      setConvertingId(emailId);
      await gmailApiService.convertToTask(emailId, {
        priority: TaskPriority.P2_HIGH,
        energyRequired: EnergyRequirement.HIGH,
      });
      fetchEmails();
    } catch (err: any) {
      console.error('Failed to convert email to task:', err.message);
    } finally {
      setConvertingId(null);
    }
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Mail size={18} color="#60a5fa" />
          <Text style={styles.headerTitle}>Synced Inbound Emails</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#60a5fa" style={{ paddingVertical: 20 }} />
      ) : emails.length === 0 ? (
        <Text style={styles.emptyText}>No synced emails found.</Text>
      ) : (
        emails.map((email) => (
          <View key={email.id} style={styles.emailItem}>
            <View style={styles.emailInfo}>
              <Text style={styles.subjectText} numberOfLines={1}>
                {email.subject}
              </Text>
              <Text style={styles.senderText} numberOfLines={1}>
                {email.sender}
              </Text>
              {email.snippet && (
                <Text style={styles.snippetText} numberOfLines={1}>
                  {email.snippet}
                </Text>
              )}
            </View>

            {email.task ? (
              <View style={styles.linkedBadge}>
                <CheckCircle size={14} color="#10b981" />
                <Text style={styles.linkedText}>Tasked</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.convertButton}
                disabled={convertingId === email.id}
                onPress={() => handleConvertToTask(email.id)}
              >
                {convertingId === email.id ? (
                  <ActivityIndicator size="small" color="#f8fafc" />
                ) : (
                  <>
                    <PlusCircle size={14} color="#f8fafc" />
                    <Text style={styles.convertButtonText}>Task</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#111729',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    paddingVertical: 10,
    textAlign: 'center',
  },
  emailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  emailInfo: {
    flex: 1,
    gap: 2,
  },
  subjectText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  senderText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  snippetText: {
    color: '#64748b',
    fontSize: 11,
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563eb',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  convertButtonText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  linkedText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
});