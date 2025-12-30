'use client';

import { useDataInit } from '@/hooks/useDataInit';

export function DataInitializer() {
  // This hook initializes the data stores when the user is authenticated
  useDataInit();

  // This component doesn't render anything
  return null;
}
