import { NextRequest, NextResponse } from 'next/server';

const APP_TOKEN = process.env.APP_TOKEN;

export function isAuthenticated(request: NextRequest): boolean {
  if (!APP_TOKEN) {
    // No token configured, allow access (development mode)
    console.warn('WARNING: APP_TOKEN not set. Authentication is disabled.');
    return true;
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
  return token === APP_TOKEN;
}

export function requireAuth(handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) {
  return async (req: NextRequest) => {
    if (!isAuthenticated(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req);
  };
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem('auth_token', token);
}

export function clearAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem('auth_token');
}
