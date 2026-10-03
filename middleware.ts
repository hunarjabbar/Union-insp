// FILE: middleware.ts
// STAGE: 5
// UPDATED: 2026-10-01
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secretString = process.env.JWT_SECRET || '8b8d4cf56a73c1d94f2953288f6be4e37f694e4da20188efac37bdc51b9e2810';
const JWT_SECRET = new TextEncoder().encode(secretString);

const PUBLIC_PATHS = [
  '/login',
  '/login/mfa',
  '/login/cashier',
  '/unauthorized',
  '/verify',
  '/api/auth',
  '/api/health',
  '/api/verify',
  '/api/payments/webhooks',
  '/api/payments/fastpay',
  '/api/payments/zaincash',
  '/api/payments/fib',
];

const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/users':             ['SUPER_ADMIN'],
  '/stations':          ['SUPER_ADMIN','STATION_MANAGER','COMPLIANCE_AUDITOR','SYNDICATE_REPRESENTATIVE'],
  '/lanes':             ['SUPER_ADMIN','STATION_MANAGER','LEAD_INSPECTOR','COMPLIANCE_AUDITOR'],
  '/equipment':         ['SUPER_ADMIN','STATION_MANAGER','LEAD_INSPECTOR','COMPLIANCE_AUDITOR'],
  '/inspection':        ['SUPER_ADMIN','STATION_MANAGER','LEAD_INSPECTOR','INSPECTION_TECHNICIAN','COMPLIANCE_AUDITOR','CASHIER'],
  '/vehicles':          ['SUPER_ADMIN','STATION_MANAGER','LEAD_INSPECTOR','INSPECTION_TECHNICIAN','COMPLIANCE_AUDITOR'],
  '/financial':         ['SUPER_ADMIN','STATION_MANAGER','CASHIER','SYNDICATE_REPRESENTATIVE','COMPLIANCE_AUDITOR'],
  '/settings/printers': ['SUPER_ADMIN','STATION_MANAGER','LEAD_INSPECTOR','CASHIER'],
  '/audit':             ['SUPER_ADMIN','COMPLIANCE_AUDITOR'],
  '/syndicate':         ['SUPER_ADMIN','SYNDICATE_REPRESENTATIVE'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Public paths: pass through
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/')) || pathname.endsWith('/verify')) {
    return NextResponse.next();
  }

  // 2. Read token cookie
  const token = request.cookies.get('union_inspection_token')?.value;
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  try {
    // 3. Verify JWT
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    const role = payload.role as string;

    // 4. Route permission check (longest prefix wins)
    const matchKey = Object.keys(ROUTE_PERMISSIONS)
      .filter(p => pathname.startsWith(p))
      .sort((a, b) => b.length - a.length)[0];

    if (matchKey) {
      const allowed = ROUTE_PERMISSIONS[matchKey];
      if (!allowed.includes(role)) {
        return NextResponse.rewrite(new URL('/unauthorized', request.url));
      }
    }

    // 5. Inject context headers
    const res = NextResponse.next();
    res.headers.set('x-user-id', payload.sub as string);
    res.headers.set('x-user-role', role);
    res.headers.set('x-user-station', (payload.stationId as string) ?? '');
    res.headers.set('x-request-id', crypto.randomUUID());
    return res;
  } catch {
    const url = new URL('/login', request.url);
    const res = NextResponse.redirect(url);
    res.cookies.delete('union_inspection_token');
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
