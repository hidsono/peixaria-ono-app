"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, CheckCircle, Clock, AlertCircle, Search, 
  ArrowLeft, RefreshCw, Filter, Printer,
  Eye, Zap, Trash2, Send
} from 'lucide-react';
import { clearPendingFiscalEvents, transmitFiscalEvent } from '../configuracoes/actions';

export default function FiscalPanelClient({ initialEvents }: { initialEvents: any[] }) {
  const [events, setEvents] = useState(initialEvents);
  const [isCleaning, setIsCleaning] = useState(false);

  const stats = {
    pendente: events.filter(e => e.status === 'PENDENTE').length,
    autorizada: events.filter(e => e.status === 'AUTORIZADA').length,
    rejeitada: events.filter(e => e.status === 'REJEITADA').length,
    processando: events.filter(e => e.status === 'PROCESSANDO').length
  };

  const handleClearPending = async () => {
    if (!confirm("Deseja realmente apagar todos os eventos fiscais PENDENTES? Esta ação não pode ser desfeita.")) return;
    
    setIsCleaning(true);
    try {
      await clearPendingFiscalEvents();
      setEvents(events.filter(e => e.status !== 'PENDENTE'));
    } catch (error) {
      alert("Erro ao limpar eventos.");
    } finally {
      setIsCleaning(false);
    }
  };

  const handleTransmit = async (eventId: string) => {
    try {
      const result = await transmitFiscalEvent(eventId);
      if (result.success) {
        setEvents(events.map(e => e.id === eventId ? { ...e, status: 'PROCESSANDO' } : e));
      } else {
        alert(result.message);
      }
    } catch (error) {
      alert("Erro ao transmitir nota.");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 bg-[#0a0a0b] min-h-screen text-white font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400">
               <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-tight">Painel Fiscal</h1>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
            <Zap size={10} className="text-emerald-500" /> Orquestração de Documentos Auxiliares (NF-e / NFC-e)
          </p>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleClearPending}
            disabled={isCleaning || stats.pendente === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-black px-6 py-3 rounded-xl font-black uppercase italic text-xs transition-all border border-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} /> {isCleaning ? 'Limpando...' : 'Limpar Pendentes'}
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-3 rounded-xl font-black uppercase italic text-xs transition-all shadow-lg shadow-emerald-500/10">
            <RefreshCw size={16} /> Sincronizar Sefaz
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Pendente', count: stats.pendente, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
          { label: 'Autorizada', count: stats.autorizada, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
          { label: 'Rejeitada', count: stats.rejeitada, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
          { label: 'Processando', count: stats.processando, icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} ${stat.border} border p-5 rounded-2xl transition-all hover:scale-[1.02]`}>
             <div className="flex justify-between items-start mb-2">
                <stat.icon className={stat.color} size={20} />
                <span className={`text-2xl font-black ${stat.color}`}>{stat.count}</span>
             </div>
             <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 block">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* FILTROS E BUSCA */}
      <div className="bg-[#121214] border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por Chave NFe, CPF, Nome do Pescador..." 
            className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-12 pr-4 text-sm outline-none focus:border-emerald-500/50 transition-all font-medium placeholder:text-slate-600"
          />
        </div>
        <button className="flex items-center gap-2 p-3.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-colors border border-white/5">
           <Filter size={18} /> <span className="md:hidden text-[10px] uppercase font-black">Filtrar</span>
        </button>
      </div>

      {/* TABELA DE EVENTOS */}
      <div className="bg-[#121214] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-5 text-[10px] uppercase font-black text-slate-500 tracking-widest">Data / Hora</th>
                <th className="p-5 text-[10px] uppercase font-black text-slate-500 tracking-widest">Evento</th>
                <th className="p-5 text-[10px] uppercase font-black text-slate-500 tracking-widest">Entidade</th>
                <th className="p-5 text-[10px] uppercase font-black text-slate-500 tracking-widest text-center">CFOP</th>
                <th className="p-5 text-[10px] uppercase font-black text-slate-500 tracking-widest">Status</th>
                <th className="p-5 text-[10px] uppercase font-black text-slate-500 tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-5">
                    <div className="text-sm font-bold text-slate-300">
                      {new Date(event.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-[10px] text-slate-600 font-mono">
                      {new Date(event.createdAt).toLocaleTimeString('pt-BR')}
                    </div>
                  </td>
                  <td className="p-5">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${
                      event.eventType.includes('VENDA') ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                    }`}>
                      {event.eventType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="text-sm font-bold truncate max-w-[180px]">
                      {event.fisherman?.name || event.inventoryBatch?.fisherman?.name || 'Venda Consumidor'}
                    </div>
                    <div className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">
                      {event.fisherman?.cpf || event.inventoryBatch?.fisherman?.cpf || event.sale?.customerCpf || 'Sem Identificação'}
                    </div>
                  </td>
                  <td className="p-5 text-center">
                    <span className="bg-black/40 border border-white/5 font-mono text-xs px-2 py-1 rounded text-slate-500">
                      {event.cfop}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit ${
                      event.status === 'AUTORIZADA' ? 'bg-emerald-500/10 text-emerald-400' :
                      event.status === 'REJEITADA' ? 'bg-rose-500/10 text-rose-400' :
                      event.status === 'PROCESSANDO' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                         event.status === 'AUTORIZADA' ? 'bg-emerald-400' :
                         event.status === 'REJEITADA' ? 'bg-rose-400' :
                         event.status === 'PROCESSANDO' ? 'bg-blue-400' :
                         'bg-amber-400'
                      }`} />
                      {event.status}
                    </span>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex justify-end gap-2">
                       {event.status === 'PENDENTE' && (
                         <button 
                           onClick={() => handleTransmit(event.id)}
                           className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-500 rounded-xl transition-all border border-emerald-500/20 flex items-center gap-2 text-[10px] font-black uppercase"
                           title="Transmitir para SEFAZ"
                         >
                            <Send size={14} /> Transmitir
                         </button>
                       )}
                       <button className="p-2.5 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 rounded-xl transition-all border border-white/5" title="Ver XML/DANFE">
                          <Eye size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-slate-600 italic font-medium">
                    Nenhum evento fiscal registrado até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
