import { NextRequest, NextResponse } from 'next/server';

interface CreateTokenRequest {
  roomName: string;
  userName?: string;
  enableTranscription?: boolean;
  permissions?: {
    canAdmin?: boolean;
    canSend?: boolean;
    canScreenshare?: boolean;
  };
}

interface DailyTokenResponse {
  token: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateTokenRequest = await request.json();
    
    if (!body.roomName) {
      return NextResponse.json(
        { error: 'Nome da sala é obrigatório' },
        { status: 400 }
      );
    }
    
    const dailyApiKey = process.env.DAILY_API_KEY;
    
    if (!dailyApiKey) {
      return NextResponse.json(
        { error: 'Daily API Key não configurada' },
        { status: 500 }
      );
    }

    // Configurações do token
    const tokenConfig = {
      properties: {
        room_name: body.roomName,
        user_name: body.userName || `user-${Date.now()}`,
        // Configurações básicas
        is_owner: false,
        start_audio_off: false,
        start_video_off: true,
        enable_screenshare: body.permissions?.canScreenshare !== false,
        // Tempo de expiração (4 horas)
        exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60),
        // Permissões do participante (formato correto Daily.co)
        permissions: {
          hasPresence: true,
          canSend: ['audio', 'screenAudio', 'screenVideo'],
          canAdmin: ['transcription'] // SEMPRE permitir admin de transcrição
        }
      }
    };

    // Chamada para API Daily.co para criar token
    const response = await fetch('https://api.daily.co/v1/meeting-tokens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dailyApiKey}`
      },
      body: JSON.stringify(tokenConfig)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro ao criar token Daily:', response.status, errorData);
      
      return NextResponse.json(
        { 
          error: 'Erro ao criar token de acesso Daily.co',
          details: errorData,
          status: response.status
        },
        { status: response.status }
      );
    }

    const tokenData: DailyTokenResponse = await response.json();
    
    // Log do token criado para debugging (sem revelar o token completo)
    console.log('✅ Token Daily.co criado para sala:', {
      roomName: body.roomName,
      userName: body.userName || `user-${Date.now()}`,
      tokenPrefix: tokenData.token.substring(0, 10) + '...',
      transcriptionEnabled: body.enableTranscription !== false
    });

    // Retornar token de acesso
    return NextResponse.json({
      success: true,
      token: tokenData.token,
      roomName: body.roomName,
      userName: body.userName || `user-${Date.now()}`,
      config: {
        transcription_enabled: body.enableTranscription !== false,
        audio_only: true,
        screen_share_enabled: body.permissions?.canScreenshare !== false
      }
    });

  } catch (error) {
    console.error('❌ Erro interno ao criar token Daily:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// DELETE: Revogar tokens (opcional para segurança)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const roomName = searchParams.get('roomName');
    
    if (!roomName) {
      return NextResponse.json(
        { error: 'Nome da sala é obrigatório para revogar tokens' },
        { status: 400 }
      );
    }
    
    const dailyApiKey = process.env.DAILY_API_KEY;
    
    if (!dailyApiKey) {
      return NextResponse.json(
        { error: 'Daily API Key não configurada' },
        { status: 500 }
      );
    }

    // Revogar todos os tokens da sala
    const response = await fetch(`https://api.daily.co/v1/meeting-tokens`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dailyApiKey}`
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro ao revogar tokens Daily:', response.status, errorData);
      
      return NextResponse.json(
        { error: 'Erro ao revogar tokens', details: errorData },
        { status: response.status }
      );
    }

    console.log('✅ Tokens revogados para sala:', roomName);

    return NextResponse.json({
      success: true,
      message: `Tokens revogados para a sala ${roomName}`
    });

  } catch (error) {
    console.error('❌ Erro interno ao revogar tokens Daily:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 