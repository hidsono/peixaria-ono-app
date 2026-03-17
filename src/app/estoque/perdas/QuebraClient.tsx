'use client'

import React, { useState } from 'react'
import { AlertTriangle, History, CheckCircle2, ChevronLeft, Search, Zap } from 'lucide-react'
import Link from 'next/link'
import { registrarQuebra } from '@/app/actions/inventory-actions'

export default function QuebraClient({ initialBatches }: { initialBatches: any[] }) {
  const [selectedBatch, setSelectedBatch] = useState<any>(null)
  const [weight, setWeight] = useState('')
  const [reason, setReason] = useState('Desidratação')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredBatches = initialBatches.filter(b => 
    b.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.fisherman?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBatch) return
    
    setLoading(true)
    try {
      // Usando 'user_dev' temporariamente, idealmente viria do auth
      await registrarQuebra(selectedBatch.id, parseFloat(weight.replace(',', '.')), reason, 'admin')
      setSuccess(true)
      setSelectedBatch(null)
      setWeight('')
      setTimeout(() => setSuccess(false), 5000)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 p-4 md:p-8">
      
      <Link href="/pdv" className="text-emerald-400 flex items-center gap-2 mb-8 hover:underline text-sm font-bold uppercase tracking-widest">
        <ChevronLeft size={16} /> Voltar ao PDV
      </Link>

      <header className="mb-12">
        <h1 className="text-4xl font-black text-white mb-2 italic uppercase tracking-tighter">Gestão de Quebra & Perda</h1>
        <p className="text-slate-500 font-medium">Controle de desidratação, limpeza e ajuste fiscal de estoque.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* SELEÇÃO DE LOTE */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <History size={20} className="text-emerald-400" /> Lotes em Estoque
            </h2>
            <div className="relative">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
               <input 
                 type="text" 
                 placeholder="Buscar lote..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="bg-slate-900/50 border border-slate-800 rounded-full py-2 pl-9 pr-4 text-xs focus:border-emerald-500 outline-none transition-all"
               />
            </div>
          </div>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredBatches.map((b) => (
              <div 
                key={b.id} 
                onClick={() => setSelectedBatch(b)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all group ${
                  selectedBatch?.id === b.id 
                  ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50' 
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-black text-white group-hover:text-emerald-400 transition-colors">{b.species}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                      Saldo: <span className="text-emerald-400 font-mono text-sm">{b.currentWeight_kg.toFixed(3)} kg</span>
                    </p>
                    {b.fisherman && (
                      <p className="text-[10px] text-slate-600 font-black uppercase mt-2">Pescador: {b.fisherman.name}</p>
                    )}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                    b.propertyType === 'PROPRIO' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {b.propertyType}
                  </span>
                </div>
              </div>
            ))}
            {filteredBatches.length === 0 && (
              <div className="p-10 text-center border border-dashed border-slate-800 rounded-2xl text-slate-600 italic">
                Nenhum lote compatível encontrado.
              </div>
            )}
          </div>
        </div>

        {/* FORMULÁRIO DE BAIXA */}
        <div className={`transition-all duration-500 ${!selectedBatch ? 'opacity-30 grayscale pointer-events-none translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <div className="bg-[#121214] border border-white/5 rounded-3xl p-8 sticky top-8 shadow-2xl">
            <h2 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" /> Registro de Baixa
            </h2>

            <form onSubmit={handleSubit} className="space-y-8">
              <div className="bg-black/40 p-6 rounded-2xl border border-white/5">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Peso a ser baixado (kg)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    required
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="0,000"
                    className="w-full bg-transparent border-b-2 border-slate-800 focus:border-emerald-500 text-4xl font-black text-white outline-none transition-all pb-2"
                  />
                  <span className="absolute right-0 bottom-2 text-slate-500 font-black italic">KG</span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Motivo Principal</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Desidratação', 'Limpeza', 'Evisceração', 'Dano/Avaria'].map((r) => (
                    <button 
                      key={r}
                      type="button"
                      onClick={() => setReason(r)}
                      className={`p-4 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
                        reason === r ? 'bg-emerald-500 border-emerald-500 text-black' : 'bg-white/5 border-white/5 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {selectedBatch?.propertyType === 'TERCEIROS' && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-5 rounded-2xl text-xs flex gap-4 animate-pulse">
                  <Zap size={24} className="shrink-0 text-amber-500" />
                  <div>
                    <strong className="block mb-1 uppercase tracking-widest text-[10px]">Ajuste Fiscal Automático</strong>
                    <p className="opacity-80">
                      Como este lote é de terceiros, o sistema agendará um <strong>Retorno Simbólico (CFOP 5.906)</strong> para abater esta quantidade na SEFAZ.
                    </p>
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading || !weight}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 text-black font-black uppercase italic py-5 rounded-2xl transition-all flex justify-center items-center gap-3 shadow-lg shadow-emerald-500/20"
              >
                {loading ? 'Sincronizando...' : 'Confirmar Ajuste de Estoque'}
              </button>
            </form>

            {success && (
              <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
                <CheckCircle2 size={18} /> Estoque atualizado e fila fiscal agendada!
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
