import { ConnectionsClient } from './ConnectionsClient';

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';

export default function ConnectionsPage() {
  return <ConnectionsClient />;
}
