import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Modal, FlatList, Platform } from 'react-native';
import { ThemedText } from './themed-text';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react-native';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
}

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DatePicker({ value, onChange, placeholder = 'Select date' }: DatePickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
        setCurrentDate(parsed);
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get number of days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Get day of week for 1st of month
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const newSel = new Date(year, month, day);
    setSelectedDate(newSel);
    
    // Format YYYY-MM-DD using local time
    const yyyy = newSel.getFullYear();
    const mm = String(newSel.getMonth() + 1).padStart(2, '0');
    const dd = String(newSel.getDate()).padStart(2, '0');
    
    onChange(`${yyyy}-${mm}-${dd}`);
    setModalVisible(false);
  };

  const handleSelectToday = () => {
    const today = new Date();
    setSelectedDate(today);
    
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    onChange(`${yyyy}-${mm}-${dd}`);
    setModalVisible(false);
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange('');
    setModalVisible(false);
  };

  // Generate calendar grid array
  const calendarCells: { day: number | null; key: string }[] = [];
  
  // Empty slots for padding before the 1st of the month
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push({ day: null, key: `empty-${i}` });
  }
  
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, key: `day-${d}` });
  }

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === month &&
      selectedDate.getFullYear() === year
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  return (
    <View style={styles.container}>
      <Pressable 
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [styles.trigger, pressed && { opacity: 0.8 }]}
      >
        <ThemedText style={[styles.triggerText, !value && styles.placeholderText]}>
          {value || placeholder}
        </ThemedText>
        <Calendar size={18} color="#04a700" style={styles.icon} />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent}>
            {/* Header: Month and Year Navigation */}
            <View style={styles.header}>
              <Pressable onPress={handlePrevMonth} style={styles.navBtn} hitSlop={8}>
                <ArrowLeft size={20} color="#0f172a" strokeWidth={2.5} />
              </Pressable>
              <ThemedText style={styles.headerTitle}>
                {MONTHS[month]} {year}
              </ThemedText>
              <Pressable onPress={handleNextMonth} style={styles.navBtn} hitSlop={8}>
                <ArrowRight size={20} color="#0f172a" strokeWidth={2.5} />
              </Pressable>
            </View>

            {/* Weekday Labels */}
            <View style={styles.weekLabelsRow}>
              {DAYS_OF_WEEK.map((day, idx) => (
                <View key={idx} style={styles.weekLabelCell}>
                  <ThemedText style={styles.weekLabelText}>{day}</ThemedText>
                </View>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.gridContainer}>
              <View style={styles.daysGrid}>
                {calendarCells.map((cell) => {
                  if (cell.day === null) {
                    return <View key={cell.key} style={styles.dayCellEmpty} />;
                  }
                  
                  const active = isSelected(cell.day);
                  const today = isToday(cell.day);
                  
                  return (
                    <Pressable
                      key={cell.key}
                      onPress={() => handleSelectDay(cell.day!)}
                      style={[
                        styles.dayCell,
                        active && styles.dayCellActive,
                        !active && today && styles.dayCellToday,
                      ]}
                    >
                      <ThemedText 
                        style={[
                          styles.dayCellText,
                          active && styles.dayCellTextActive,
                          !active && today && styles.dayCellTextToday,
                        ]}
                      >
                        {cell.day}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Footer buttons */}
            <View style={styles.footer}>
              <Pressable onPress={handleClear} style={[styles.footerBtn, styles.clearBtn]}>
                <ThemedText style={styles.clearBtnText}>Clear</ThemedText>
              </Pressable>
              <View style={{ flex: 1 }} />
              <Pressable onPress={handleSelectToday} style={[styles.footerBtn, styles.todayBtn]}>
                <ThemedText style={styles.todayBtnText}>Today</ThemedText>
              </Pressable>
              <Pressable onPress={() => setModalVisible(false)} style={[styles.footerBtn, styles.cancelBtn]}>
                <ThemedText style={styles.cancelBtnText}>Cancel</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  placeholderText: {
    color: '#94a3b8',
    fontWeight: '500',
  },
  icon: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(9, 13, 22, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabelsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekLabelCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
  },
  gridContainer: {
    marginBottom: 16,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    marginVertical: 2,
  },
  dayCellEmpty: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
  },
  dayCellText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  dayCellActive: {
    backgroundColor: '#04a700',
  },
  dayCellTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  dayCellToday: {
    backgroundColor: '#e8fdf0',
    borderWidth: 1,
    borderColor: '#04a700',
  },
  dayCellTextToday: {
    color: '#04a700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
    gap: 8,
  },
  footerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  clearBtn: {
    backgroundColor: '#f1f5f9',
  },
  clearBtnText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  todayBtn: {
    backgroundColor: '#e8fdf0',
  },
  todayBtnText: {
    color: '#04a700',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
});
