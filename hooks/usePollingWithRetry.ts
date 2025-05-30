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
  }, [clearAllTimers]);

  const reset = useCallback(() => {
    stop();
    setData(null);
    setError(null);
    setRetryCount(0);
  }, [stop]);

  const executePoll = useCallback(async (): Promise<boolean> => {
    try {
      const result = await pollFn();
      setData(result);
      setError(null);
      setRetryCount(0);
      return true; // Sucesso
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido no polling');
      setError(error);
      console.error('❌ Erro no polling:', error);
      return false; // Falha
    }
  }, [pollFn]);

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
      if (!isPollingRef.current) return;
      
      const success = await executePoll();
      if (!success && isPollingRef.current) {
        handleRetry();
      }
    }, delay);
  }, [retryCount, config.maxRetries, config.retryDelay, stop, executePoll]);

  const start = useCallback(() => {
    if (isPollingRef.current) return;
    
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
    executePoll().then(success => {
      if (!success && isPollingRef.current) {
        handleRetry();
        return;
      }
      
      // Se sucesso, continuar polling normal
      if (success && isPollingRef.current) {
        intervalRef.current = setInterval(async () => {
          if (!isPollingRef.current) return;
          
          const success = await executePoll();
          if (!success && isPollingRef.current) {
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            handleRetry();
          }
        }, config.interval);
      }
    });
  }, [config, executePoll, handleRetry, stop]);

  // Iniciar/parar polling baseado em shouldPoll
  useEffect(() => {
    if (shouldPoll && !isPolling) {
      start();
    } else if (!shouldPoll && isPolling) {
      stop();
    }
  }, [shouldPoll, isPolling, start, stop]);

  // Cleanup em unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      isPollingRef.current = false;
    };
  }, [clearAllTimers]);

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