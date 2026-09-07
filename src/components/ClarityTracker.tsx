import { useEffect } from 'react';

// Vercel can override this with VITE_CLARITY_PROJECT_ID when configured.
// The Clarity project ID is intentionally public because it is part of the client-side tracker URL.
const CLARITY_PROJECT_ID = import.meta.env.VITE_CLARITY_PROJECT_ID?.trim() || 'yefp5shpej';

declare global {
  interface Window {
    clarity?: (...args: unknown[]) => void;
  }
}

function trackEvent(name: string) {
  if (typeof window !== 'undefined' && typeof window.clarity === 'function') {
    window.clarity('event', name);
  }
}

function getElementLabel(element: Element) {
  const el = element.closest<HTMLElement>('[data-clarity-event], button, a, [role="button"]');
  if (!el) return null;

  const explicit = el.getAttribute('data-clarity-event')?.trim();
  if (explicit) return explicit.slice(0, 80);

  const href = el.getAttribute('href');
  if (href?.startsWith('tel:')) return 'phone_click';
  if (href?.startsWith('https://wa.me/') || href?.includes('whatsapp')) return 'whatsapp_click';

  const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!text) return null;
  if (/(^|\s)(call|call now|contact|enquire|enquiry|callback|submit|book|visit|send)(\s|$)/.test(text)) {
    return `cta_${text.slice(0, 45).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
  }

  return null;
}

export default function ClarityTracker() {
  useEffect(() => {
    if (!CLARITY_PROJECT_ID) return;

    const existing = document.querySelector('script[data-clarity="true"]');
    if (!existing) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.clarity.ms/tag/${encodeURIComponent(CLARITY_PROJECT_ID)}`;
      script.dataset.clarity = 'true';
      document.head.appendChild(script);
    }

    const scrollMarks = new Set<number>();
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const depth = Math.min(100, Math.round((window.scrollY / max) * 100));
      [25, 50, 75, 90, 100].forEach((mark) => {
        if (depth >= mark && !scrollMarks.has(mark)) {
          scrollMarks.add(mark);
          trackEvent(`scroll_${mark}`);
        }
      });
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target) return;
      const label = getElementLabel(target);
      if (label) trackEvent(label);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('click', onClick, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('click', onClick);
    };
  }, []);

  return null;
}
