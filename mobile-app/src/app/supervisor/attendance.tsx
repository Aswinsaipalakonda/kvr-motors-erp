import React from 'react';
import AttendanceScreen from '@/components/AttendanceScreen';

export default function SupervisorAttendance({ isActive }: { isActive?: boolean }) {
  return <AttendanceScreen role="supervisor" isActive={isActive} />;
}
