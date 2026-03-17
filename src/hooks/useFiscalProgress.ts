'use client'
import { useState, useEffect } from 'react'

export function useFiscalProgress(trackingSaleId: string | null) {
  const [events, setEvents] = useState<any[]>([])
  const [isFinished, setIsFinished] = useState(false)

  // Polling a cada 2.5s para checar o avanço dos eventos 
  useEffect(() => {
    if (!trackingSaleId) return;

    // Função de fetch immediata + setInterval
    const fetchStatus = async () => {
      try {
        const resp = await fetch(`/api/fiscal/status?saleId=${trackingSaleId}`);
        const data = await resp.json();
        
        if (data.fiscalEvents) {
           setEvents(data.fiscalEvents);
           
           // Se não há mais eventos "PENDENTE" nem "PROCESSANDO", significa finalizado ou erro drástico
           const stillWorking = data.fiscalEvents.some(
             (e: any) => e.status === 'PENDENTE' || e.status === 'PROCESSANDO'
           );
           
           if (!stillWorking && data.fiscalEvents.length > 0) {
             setIsFinished(true);
           }
        }
      } catch (err) {
        console.error("Erro no polling fiscal", err);
      }
    };

    fetchStatus(); // chama imediatamente a primeira vez
    const interval = setInterval(fetchStatus, 2500);

    // Se finalizou, limpa o interval (se capturarmos na mesma renderização)
    if (isFinished) {
       clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [trackingSaleId, isFinished]);

  const total = events.length;
  const authorized = events.filter(e => e.status === 'AUTORIZADA').length;
  const progress = total > 0 ? (authorized / total) * 100 : 0;

  return { events, isFinished, progress }
}
