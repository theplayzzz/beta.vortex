import { NextRequest, NextResponse } from 'next/server';

interface CreateRoomRequest {
  roomName?: string;
  privacy?: 'public' | 'private';
  enableTranscription?: boolean;
  language?: string;
  transcriptionModel?: string;
}

interface DailyRoomResponse {
  id: string;
  name: string;
  api_created: boolean;
  privacy: string;
  url: string;
  created_at: string;
  config: {
    transcription?: {
      language: string;
      tier: string;
      model: string;
      profanity_filter: boolean;
      redact_pii: boolean;
      includeRawResponse: boolean;
      extra: {
        interim_results: boolean;
      };
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateRoomRequest = await request.json();
    
    const dailyApiKey = process.env.DAILY_API_KEY;
    const dailyDomain = process.env.NEXT_PUBLIC_DAILY_DOMAIN;
    
    if (!dailyApiKey) {
      return NextResponse.json(
        { error: 'Daily API Key não configurada' },
        { status: 500 }
      );
    }

    if (!dailyDomain) {
      return NextResponse.json(
        { error: 'Daily Domain não configurado' },
        { status: 500 }
      );
    }

    // Configuração simplificada da sala Daily (transcrição será iniciada separadamente)
    const roomConfig = {
      name: body.roomName || `transcription-room-${Date.now()}`,
      privacy: body.privacy || 'private',
      properties: {
        // Configurações básicas de áudio/vídeo
        enable_screenshare: true,
        start_audio_off: false,
        start_video_off: true, // Foco no áudio para transcrição
        max_participants: 10,
        // Tempo de expiração (4 horas)
        exp: Math.floor(Date.now() / 1000) + (4 * 60 * 60)
      }
    };

    // Chamada para API Daily.co
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dailyApiKey}`
      },
      body: JSON.stringify(roomConfig)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro ao criar sala Daily:', response.status, errorData);
      
      return NextResponse.json(
        { 
          error: 'Erro ao criar sala Daily.co',
          details: errorData,
          status: response.status
        },
        { status: response.status }
      );
    }

    const roomData: DailyRoomResponse = await response.json();
    
    // Log da sala criada para debugging
    console.log('✅ Sala Daily.co criada:', {
      id: roomData.id,
      name: roomData.name,
      url: roomData.url,
      transcription: roomData.config?.transcription ? 'Habilitada' : 'Desabilitada'
    });

    // Retornar dados da sala criada
    return NextResponse.json({
      success: true,
      room: {
        id: roomData.id,
        name: roomData.name,
        url: roomData.url,
        domain: dailyDomain,
        created_at: roomData.created_at,
        privacy: roomData.privacy,
        config: roomData.config
      }
    });

  } catch (error) {
    console.error('❌ Erro interno ao criar sala Daily:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

// GET: Listar salas ativas (opcional para debugging)
export async function GET() {
  try {
    const dailyApiKey = process.env.DAILY_API_KEY;
    
    if (!dailyApiKey) {
      return NextResponse.json(
        { error: 'Daily API Key não configurada' },
        { status: 500 }
      );
    }

    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${dailyApiKey}`
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      return NextResponse.json(
        { error: 'Erro ao listar salas', details: errorData },
        { status: response.status }
      );
    }

    const roomsData = await response.json();
    
    return NextResponse.json({
      success: true,
      rooms: roomsData.data || [],
      total: roomsData.total_count || 0
    });

  } catch (error) {
    console.error('❌ Erro ao listar salas Daily:', error);
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 