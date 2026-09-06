import { useEffect } from 'react';

export default function VisitorTracker() {
  useEffect(() => {
    fetch('/api/visitor', { method: 'POST', keepalive: true }).catch(() => {});
  }, []);

  return null;
}
