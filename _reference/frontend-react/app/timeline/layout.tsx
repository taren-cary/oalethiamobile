// Force dynamic rendering to prevent prerender errors
// This page relies on client-side state and browser APIs
export const dynamic = 'force-dynamic';

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

