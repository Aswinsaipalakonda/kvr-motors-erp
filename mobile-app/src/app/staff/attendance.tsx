import React from 'react';
import AttendanceScreen from '@/components/AttendanceScreen';

export default function StaffAttendance({ isActive }: { isActive?: boolean }) {
  return <AttendanceScreen role="staff" isActive={isActive} />;
}
