import React from 'react';
import AttendanceScreen from '@/components/AttendanceScreen';

export default function TelecallerAttendance({ isActive }: { isActive?: boolean }) {
  return <AttendanceScreen role="telecaller" isActive={isActive} />;
}
