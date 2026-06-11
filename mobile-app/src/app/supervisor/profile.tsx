import React from 'react';
import RoleProfile from '@/components/RoleProfile';

export default function SupervisorProfile() {
  return <RoleProfile backFallback="/supervisor/dashboard" roleFallback="SUPERVISOR" locationLabel="Visakhapatnam HQ" hideBackButton />;
}
