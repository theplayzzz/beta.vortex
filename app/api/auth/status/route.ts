
// app/api/auth/status/route.ts
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const user = await clerkClient.users.getUser(userId);
    const approvalStatus = user.publicMetadata?.approvalStatus || 'PENDING';

    return NextResponse.json({ approvalStatus });
  } catch (error) {
    console.error('[AUTH_STATUS_API_ERROR]', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
