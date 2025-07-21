import { useState, useEffect, useCallback, useRef } from 'react';

interface PollingConfig {
  interval: number;
  maxRetries: number;
  timeout: number;
  retryDelay: number;
}

interface PollingResult<T> {
  data: T | null;
  error: Error | null;
  isPolling: boolean;
  retryCount: number;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function usePollingWithRetry<T>(
  pollFn: () => Promise<T>,
  shouldPoll: boolean,
  config: PollingConfig
): PollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);
  const shouldPollRef = useRef(shouldPoll);
  
  useEffect(() => {
    shouldPollRef.current = shouldPoll;
  }, [shouldPoll]);
  
  const clearAllTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearAllTimers();
    setIsPolling(false);
    isPollingRef.current = false;
    console.log('🛑 Polling parado');
  }, []);

  const reset = useCallback(() => {
    stop();
    setData(null);
    setError(null);
    setRetryCount(0);
  }, []);

  const executePoll = useCallback(async (): Promise<{ success: boolean; shouldStop?: boolean }> => {
    try {
      console.log('🔍 executePoll: Chamando pollFn...');
      const result = await pollFn();
      setData(result);
      setError(null);
      setRetryCount(0);
      
      if (result && typeof result === 'object' && 'shouldStop' in result) {
        return { success: true, shouldStop: (result as any).shouldStop };
      }
      
      return { success: true, shouldStop: false };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido no polling');
      setError(error);
      console.error('❌ Erro no polling:', error);
      return { success: false, shouldStop: false };
    }
  }, [pollFn]); // ✅ CORREÇÃO: Adicionar pollFn às dependências

  const handleRetry = useCallback(async () => {
    if (retryCount >= config.maxRetries) {
      console.error('❌ Máximo de tentativas excedido. Parando polling.');
      stop();
      return;
    }

    const delay = config.retryDelay * Math.pow(2, retryCount); // Exponential backoff
    console.log(`🔄 Tentativa ${retryCount + 1}/${config.maxRetries} em ${delay}ms...`);
    
    setRetryCount(prev => prev + 1);

    retryTimeoutRef.current = setTimeout(async () => {
      if (!isPollingRef.current || !shouldPollRef.current) return;
      
      const result = await executePoll();
      
      if (result.shouldStop) {
        console.log('🎯 Polling deve parar - dados encontrados!');
        stop();
        return;
      }
      
      if (!result.success && isPollingRef.current && shouldPollRef.current) {
        handleRetry();
      }
    }, delay);
  }, [retryCount, config.maxRetries, config.retryDelay, executePoll, stop]);

  const start = useCallback(() => {
    if (isPollingRef.current) {
      console.log('⚠️ Polling já está ativo, ignorando start()');
      return;
    }
    
    console.log('🔄 Iniciando polling otimizado...', {
      interval: config.interval,
      maxRetries: config.maxRetries,
      timeout: config.timeout
    });
    
    setIsPolling(true);
    isPollingRef.current = true;
    setRetryCount(0);
    
    // Timeout geral para parar polling após tempo limite
    timeoutRef.current = setTimeout(() => {
      console.log('⏰ Timeout do polling atingido');
      stop();
    }, config.timeout);
    
    // Primeira execução imediata
    executePoll().then(result => {
      if (result.shouldStop) {
        console.log('🎯 Polling deve parar - dados encontrados na primeira tentativa!');
        stop();
        return;
      }
      
      if (!result.success && isPollingRef.current && shouldPollRef.current) {
        handleRetry();
        return;
      }
      
      // Se sucesso, continuar polling normal
      if (result.success && isPollingRef.current && shouldPollRef.current) {
        intervalRef.current = setInterval(async () => {
          if (!isPollingRef.current || !shouldPollRef.current) return;
          
          const result = await executePoll();
          
          if (result.shouldStop) {
            console.log('🎯 Polling deve parar - dados encontrados durante interval!');
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            stop();
            return;
          }
          
          if (!result.success && isPollingRef.current && shouldPollRef.current) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            handleRetry();
          }
        }, config.interval);
      }
    });
  }, [config, executePoll, stop, handleRetry]);

  useEffect(() => {
    if (shouldPoll && !isPolling && !isPollingRef.current) {
      console.log('🚀 Auto-start polling triggered');
      start();
    } else if (!shouldPoll && isPolling) {
      console.log('🛑 Auto-stop polling triggered');
      stop();
    }
  }, [shouldPoll, isPolling]);

  useEffect(() => {
    return () => {
      clearAllTimers();
      isPollingRef.current = false;
      shouldPollRef.current = false;
    };
  }, []);

  return {
    data,
    error,
    isPolling,
    retryCount,
    start,
    stop,
    reset
  };
} 