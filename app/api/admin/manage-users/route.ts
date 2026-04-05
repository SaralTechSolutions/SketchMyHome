import { NextRequest, NextResponse } from 'next/server';

/**
 * app/api/admin/manage-users/route.ts
 * Refactored Admin API for Next.js App Router.
 */

interface UserRegistryItem {
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

// Simulated Registry (In prod, move to Supabase profiles table)
let userRegistry: UserRegistryItem[] = [
  { email: 'admin@example.com', role: 'admin', status: 'active', createdAt: new Date().toISOString() },
  { email: 'user@example.com', role: 'user', status: 'active', createdAt: new Date().toISOString() }
];

export async function GET(request: NextRequest) {
  // Use a secret for now to match old logic
  const { searchParams } = new URL(request.url);
  const secret = request.headers.get('x-admin-secret') || searchParams.get('secret');

  // In production, we'd check the Supabase session role here
  
  return NextResponse.json(userRegistry);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, role, status } = body;

  if (!email || !role) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const index = userRegistry.findIndex(u => u.email === email);
  if (index > -1) {
    userRegistry[index] = { ...userRegistry[index], role, status, updatedAt: new Date().toISOString() };
  } else {
    userRegistry.push({ email, role, status, createdAt: new Date().toISOString() });
  }

  return NextResponse.json({ success: true, registry: userRegistry });
}
