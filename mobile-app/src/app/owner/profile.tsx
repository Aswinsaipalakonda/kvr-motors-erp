import React from 'react';
import RoleProfile from '@/components/RoleProfile';

export default function OwnerProfile() {
  return (
    <RoleProfile
      backFallback="/owner/dashboard"
      roleFallback="OWNER"
      locationLabel="Visakhapatnam HQ"
    />
  );
}
