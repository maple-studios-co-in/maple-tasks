'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'maple' | 'ivory';
  /**
   * When true, the logo points at /app from authenticated surfaces
   * (/app, /account, /admin) and at / otherwise.
   */
  contextAware?: boolean;
}

const SIZES = {
  sm: 'text-[20px]',
  md: 'text-[26px]',
  lg: 'text-[36px]'
} as const;

export function Logo({ size = 'md', tone = 'maple', contextAware = false }: Props) {
  const pathname = usePathname();
  const isAppSurface =
    contextAware &&
    pathname !== null &&
    (pathname.startsWith('/app') ||
      pathname.startsWith('/account') ||
      pathname.startsWith('/admin'));
  const href = isAppSurface ? '/app' : '/';

  const color = tone === 'ivory' ? 'text-ivory' : 'text-maple-500';

  return (
    <Link
      href={href}
      className={`font-display font-normal tracking-tighter inline-flex items-baseline gap-[0.18em] ${SIZES[size]} ${color} leading-none`}
      aria-label="Maple Lens"
    >
      <span>Maple</span>
      <span className="italic font-light">Lens</span>
    </Link>
  );
}
