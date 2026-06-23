import React from 'react';
import AttendanceScreen from '@/components/AttendanceScreen';

export default function SalesAttendance({ isActive }: { isActive?: boolean }) {
  return <AttendanceScreen role="sales" isActive={isActive} />;
}
