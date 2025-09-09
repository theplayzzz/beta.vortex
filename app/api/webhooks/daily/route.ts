import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // 1. Validar assinatura HMAC (CRÍTICO para segurança)
    const signature = request.headers.get('x-webhook-signature') || 
                      request.headers.get('X-Daily-Signature') || 
                      request.headers.get('x-daily-signature') || 
                      request.headers.get('X-Webhook-Signature') || '';
    const body = await request.text();
    
    // Permitir requests de verificação do Daily.co sem assinatura
    if (!signature && body.length < 50) {
      console.log('📋 Daily.co webhook verification request');
      return new NextResponse('OK', { status: 200 });
    }
    
    if (!validateDailySignature(signature, body)) {
      console.error('❌ Webhook signature validation failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('📨 Daily Webhook:', { 
      type: event.type, 
      eventId: event.id,
      timestamp: new Date().toISOString()
    });

    // Registrar evento para auditoria
    const eventLog = {
      id: event.id,
      type: event.type,
      timestamp: new Date().toISOString(),
      payload: event.payload
    };

    // 2. Processar participant.joined
    if (event.type === 'participant.joined') {
      const { user_id, joined_at, session_id } = event.payload;
      
      if (user_id && user_id.startsWith('session_')) {
        const transcriptionSessionId = user_id.replace('session_', '');
        
        try {
          // Para sessões de teste, apenas loggar (não tentar atualizar banco)
          if (transcriptionSessionId.startsWith('test_')) {
            console.log('✅ Teste - Participante conectado:', { sessionId: transcriptionSessionId, participantId: session_id });
          } else {
            await prisma.transcriptionSession.update({
              where: { id: transcriptionSessionId },
              data: {
                connectTime: new Date(joined_at * 1000),
                isActive: true,
                activeParticipantId: session_id,
                connectionCount: { increment: 1 },
                webhookEvents: { push: eventLog }
              }
            });
            console.log('✅ Participante conectado:', { sessionId: transcriptionSessionId, participantId: session_id });
          }
        } catch (error) {
          console.error('❌ Erro ao processar participant.joined:', error);
          // Não falhar o webhook por erro de banco
        }
      }
    }

    // 3. Processar participant.left - SOMATÓRIO CUMULATIVO CRÍTICO
    if (event.type === 'participant.left') {
      const { user_id, duration } = event.payload;
      
      if (user_id && user_id.startsWith('session_')) {
        const transcriptionSessionId = user_id.replace('session_', '');
        const durationSeconds = Math.max(duration || 0, 0);
        
        try {
          // Para sessões de teste, apenas loggar (não tentar atualizar banco)
          if (transcriptionSessionId.startsWith('test_')) {
            console.log('✅ Teste - Tempo registrado:', { 
              sessionId: transcriptionSessionId, 
              tempoSessao: durationSeconds,
              timestamp: new Date().toISOString()
            });
          } else {
            // IMPORTANTE: increment adiciona à duração existente (somatório)
            // Se usuário reconectar, o tempo será somado, não substituído
            await prisma.transcriptionSession.update({
              where: { id: transcriptionSessionId },
              data: {
                totalDuration: { increment: durationSeconds }, // SOMATÓRIO CUMULATIVO
                isActive: false,
                activeParticipantId: null,
                lastDisconnectAt: new Date(),
                webhookEvents: { push: eventLog }
              }
            });
            
            console.log('✅ Tempo adicionado ao banco:', { 
              sessionId: transcriptionSessionId, 
              tempoAdicional: durationSeconds,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('❌ Erro ao processar participant.left:', error);
          // Não falhar o webhook por erro de banco
        }
      }
    }

    // 4. Retorno 200 obrigatório
    return NextResponse.json({ 
      received: true, 
      eventType: event.type 
    });

  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

function validateDailySignature(signature: string, body: string): boolean {
  const secret = process.env.DAILY_WEBHOOK_SECRET;
  if (!secret || !signature) {
    console.error('❌ Missing webhook secret or signature');
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('❌ HMAC validation error:', error);
    return false;
  }
}