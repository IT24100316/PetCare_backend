import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  primary: '#006850', surface: '#faf9f8', surfaceHigh: '#e9e8e7',
  surfaceLowest: '#ffffff', onSurface: '#1a1c1c', onSurfaceVariant: '#3e4944',
  outline: '#6e7a74', outlineVariant: '#bdc9c3', emeraldDark: '#052E25',
  primaryFixedDim: '#78d8b8',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n) => String(n).padStart(2, '0');

const DatePickerModal = ({ visible, value, onConfirm, onCancel, label = 'Select Date' }) => {
  const initial = value ? new Date(value) : new Date();
  const [viewDate, setViewDate] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const [selected, setSelected] = useState(value ? new Date(value) : null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const isSelected = (d) => {
    if (!d || !selected) return false;
    return selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === d;
  };

  const handleConfirm = () => {
    if (!selected) return;
    const iso = `${selected.getFullYear()}-${pad(selected.getMonth() + 1)}-${pad(selected.getDate())}`;
    onConfirm(iso);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerLabel}>{label}</Text>
          </View>

          {/* Month Navigator */}
          <View style={styles.navRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color={C.primary} />
            </TouchableOpacity>
            <Text style={styles.monthYear}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color={C.primary} />
            </TouchableOpacity>
          </View>

          {/* Day Labels */}
          <View style={styles.dayLabels}>
            {DAYS.map(d => (
              <Text key={d} style={styles.dayLabel}>{d}</Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.grid}>
            {cells.map((d, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.cell, d && isSelected(d) && styles.cellSelected]}
                onPress={() => d && setSelected(new Date(year, month, d))}
                disabled={!d}
                activeOpacity={0.7}
              >
                {d ? (
                  <Text style={[styles.cellText, isSelected(d) && styles.cellTextSelected]}>
                    {d}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected display */}
          {selected && (
            <View style={styles.selectedRow}>
              <Ionicons name="calendar" size={14} color={C.primary} />
              <Text style={styles.selectedText}>
                {MONTHS[selected.getMonth()]} {selected.getDate()}, {selected.getFullYear()}
              </Text>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !selected && { opacity: 0.5 }]}
              onPress={handleConfirm}
              disabled={!selected}
            >
              <Text style={styles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  container: {
    backgroundColor: C.surfaceLowest, borderRadius: 24,
    width: '90%', maxWidth: 380, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2, shadowRadius: 30, elevation: 12,
  },
  header: { alignItems: 'center', marginBottom: 16 },
  headerLabel: { fontSize: 16, fontWeight: '800', color: C.onSurface },
  navRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  navBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: C.surfaceHigh, justifyContent: 'center', alignItems: 'center',
  },
  monthYear: { fontSize: 15, fontWeight: '700', color: C.primary },
  dayLabels: { flexDirection: 'row', marginBottom: 8 },
  dayLabel: {
    flex: 1, textAlign: 'center', fontSize: 11,
    fontWeight: '700', color: C.outline, textTransform: 'uppercase',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`, aspectRatio: 1,
    justifyContent: 'center', alignItems: 'center', borderRadius: 8,
  },
  cellSelected: { backgroundColor: C.primary, borderRadius: 99 },
  cellText: { fontSize: 14, fontWeight: '600', color: C.onSurface },
  cellTextSelected: { color: '#fff', fontWeight: '800' },
  selectedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14, justifyContent: 'center',
  },
  selectedText: { fontSize: 13, color: C.primary, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 24, borderWidth: 2,
    borderColor: C.outlineVariant, justifyContent: 'center', alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: C.outline },
  confirmBtn: {
    flex: 1, height: 48, borderRadius: 24,
    backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center',
  },
  confirmBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

export default DatePickerModal;
