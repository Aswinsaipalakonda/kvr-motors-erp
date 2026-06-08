import React from 'react';
import RoleProfile from '@/components/RoleProfile';

export default function SupervisorProfile() {
  return <RoleProfile backFallback="/supervisor" roleFallback="SUPERVISOR" locationLabel="Visakhapatnam HQ" hideBackButton />;
}
