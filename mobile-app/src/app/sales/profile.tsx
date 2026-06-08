import React from 'react';
import RoleProfile from '@/components/RoleProfile';

export default function SalesProfile() {
  return <RoleProfile backFallback="/sales" roleFallback="SALES EXECUTIVE" locationLabel="Visakhapatnam Showroom" hideBackButton />;
}
