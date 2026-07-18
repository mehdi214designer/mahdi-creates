import { serve404Response } from '@/lib/nav-fix';

export const dynamic = 'force-dynamic';

export function GET() {
  return serve404Response();
}
