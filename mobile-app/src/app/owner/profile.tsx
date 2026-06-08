import React from 'react';
import RoleProfile from '@/components/RoleProfile';

export default function OwnerProfile() {
  return (
    <RoleProfile
      backFallback="/owner"
      roleFallback="OWNER"
      locationLabel="Visakhapatnam HQ"
    />
  );
}
