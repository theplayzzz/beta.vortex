import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const authResult = auth()
    
    const debugData = {
      timestamp: new Date().toISOString(),
      userId: authResult.userId,
      sessionId: authResult.sessionId,
      hasSessionClaims: !!authResult.sessionClaims,
      sessionClaims: authResult.sessionClaims,
      publicMetadata: authResult.sessionClaims?.publicMetadata,
      approvalStatus: (authResult.sessionClaims?.publicMetadata as any)?.approvalStatus,
      role: (authResult.sessionClaims?.publicMetadata as any)?.role,
      dbUserId: (authResult.sessionClaims?.publicMetadata as any)?.dbUserId,
    }
    
    console.log('[DEBUG API] Session data:', JSON.stringify(debugData, null, 2))
    
    return NextResponse.json(debugData)
  } catch (error) {
    console.error('[DEBUG API] Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const authResult = auth()
    
    console.log('[DEBUG API] POST Request:', {
      body,
      userId: authResult.userId,
      sessionClaims: authResult.sessionClaims
    })
    
    return NextResponse.json({
      message: 'Debug data logged',
      timestamp: new Date().toISOString(),
      receivedData: body
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}