import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface CustomConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CustomConfirmModal({
  visible,
  title,
  message,
  icon = '🔔',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: CustomConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              {/* Icon Bubble */}
              <View
                style={[
                  styles.iconBubble,
                  {
                    backgroundColor: isDestructive ? '#FEE2E2' : '#E0F2FE',
                  },
                ]}
              >
                <Text style={styles.icon}>{icon}</Text>
              </View>

              {/* Title & Message */}
              <Text style={styles.title}>{title}</Text>
              {Boolean(message) && (
                <Text style={styles.message}>{message}</Text>
              )}

              {/* Buttons */}
              <View style={styles.buttonRow}>
                {Boolean(cancelText) && (
                  <Pressable
                    onPress={onCancel}
                    style={[styles.btn, styles.cancelBtn]}
                  >
                    <Text style={styles.cancelText}>{cancelText}</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={onConfirm}
                  style={[
                    styles.btn,
                    isDestructive ? styles.destructiveBtn : styles.confirmBtn,
                    !cancelText && { flex: 1 },
                  ]}
                >
                  <Text style={styles.confirmText}>{confirmText}</Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  iconBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F1F5F9',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtn: {
    backgroundColor: '#FF385C',
    shadowColor: '#FF385C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  destructiveBtn: {
    backgroundColor: '#EF4444',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

