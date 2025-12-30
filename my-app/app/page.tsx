import { Dashboard } from '@/components/dashboard/Dashboard';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';

export default function Page() {
  return <Dashboard />;
}
