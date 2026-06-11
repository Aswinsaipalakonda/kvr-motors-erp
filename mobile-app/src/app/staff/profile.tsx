import React from 'react';
import RoleProfile from '@/components/RoleProfile';

export default function StaffProfile() {
  return <RoleProfile backFallback="/staff/dashboard" roleFallback="OPERATIONS STAFF" locationLabel="Godown Yard" hideBackButton />;
}
