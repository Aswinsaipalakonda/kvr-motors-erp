import React from 'react';
import RoleProfile from '@/components/RoleProfile';

export default function TelecallerProfile() {
  return <RoleProfile backFallback="/telecaller/dashboard" roleFallback="TELECALLER" locationLabel="Telecalling Desk" hideBackButton />;
}
