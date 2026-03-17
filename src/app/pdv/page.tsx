'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { 
  Plus, Trash2, ShoppingBag, Store, User, Loader2, CheckCircle2, 
  ChevronRight, AlertTriangle, Search, Tag, CreditCard, 
  Banknote, X, Minus, History, Package, UserPlus, Menu, ChevronLeft,
  LayoutGrid, List, Filter, ShoppingCart, Percent, ArrowRight, RefreshCw
} from 'lucide-react'
import { checkoutMistoPDV } from '@/app/actions/fiscal-actions'
import { simularAprovaçãoSefaz } from '@/app/actions/inventory-actions'
import { useFiscalProgress } from '@/hooks/useFiscalProgress'

export default function PDVProfessionalPage() {
  const [catalog, setCatalog] = useState<any[]>([])
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [cart, setCart] = useState<any[]>([])
  const [customerCpf, setCustomerCpf] = useState('')
  const [discount, setDiscount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saleId, setSaleId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'catalog' | 'cart'>('catalog')

  const { events, isFinished, progress = 0 } = useFiscalProgress(saleId)

  // Carrega o catálogo real do banco de dados
  const fetchCatalog = async () => {
    setIsLoadingCatalog(true)
    try {
      const resp = await fetch('/api/inventory')
      const data = await resp.json()
      if (data.batches) {
        setCatalog(data.batches)
      }
    } catch (err) {
      console.error("Erro ao carregar catálogo:", err)
    } finally {
      setIsLoadingCatalog(false)
    }
  }

  useEffect(() => {
    fetchCatalog()
  }, [])

  const categories = useMemo(() => {
    const cats = new Set(['Todos'])
    catalog.forEach(item => {
      if (item.category) cats.add(item.category)
    })
    return Array.from(cats)
  }, [catalog])

  const filteredCatalog = useMemo(() => {
    return catalog.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCategory = selectedCategory === 'Todos' || item.category === selectedCategory
      return matchSearch && matchCategory
    })
  }, [catalog, searchTerm, selectedCategory])

  const addToCart = (product: any, weight: number = 1.0) => {
    const existing = cart.find(item => item.batchId === product.id)
    if (existing) {
      const newWeight = Math.max(0, existing.weight + weight);
      if (newWeight === 0) {
        setCart(cart.filter(item => item.batchId !== product.id));
      } else {
        setCart(cart.map(item => 
          item.batchId === product.id ? { ...item, weight: parseFloat(newWeight.toFixed(3)) } : item
        ))
      }
    } else if (weight > 0) {
      setCart([...cart, {
        batchId: product.id,
        name: product.name,
        price: product.price,
        weight: weight,
        propertyType: product.propertyType,
        fishermanId: product.fishermanId,
        owner: product.owner,
        color: product.color
      }])
    }
  }

  const totalOno = cart.filter(it => it.propertyType === 'PROPRIO').reduce((acc, it) => acc + (it.price * it.weight), 0)
  const totalParceiros = cart.filter(it => it.propertyType === 'TERCEIROS').reduce((acc, it) => acc + (it.price * it.weight), 0)
  const subtotal = totalOno + totalParceiros
  const totalFinal = Math.max(0, subtotal - discount)

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setLoading(true)
    try {
      const formattedItems = cart.map(item => ({
        batchId: item.batchId,
        weight_kg: item.weight,
        pricePerKg: item.price,
        propertyType: item.propertyType,
        fishermanId: item.fishermanId
      }))
      const result = await checkoutMistoPDV(formattedItems, totalFinal, customerCpf || "")
      if (result.success) setSaleId(result.trackingSaleId)
    } catch (err: any) {
      alert("Erro: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetPDV = () => {
    setCart([])
    setCustomerCpf('')
    setDiscount(0)
    setSaleId(null)
    setActiveTab('catalog')
    fetchCatalog() // Atualiza o estoque pós venda
  }

  return (
    <div className="fixed inset-0 bg-[#070708] text-white flex flex-col overflow-hidden font-sans select-none">
      
      {/* HEADER DINÂMICO */}
      <header className="h-20 shrink-0 flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center">
            <Store size={22} className="text-black" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase leading-tight">Peixaria Ono</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Live POS • Real-time Inventory</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#121214] p-1.5 rounded-2xl border border-white/5">
            <button 
              onClick={() => setActiveTab('catalog')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'catalog' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-500'}`}
            >
              Catálogo
            </button>
            <button 
              onClick={() => setActiveTab('cart')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'cart' ? 'bg-white text-black shadow-lg shadow-white/10' : 'text-slate-500'}`}
            >
              Carrinho {cart.length > 0 && <span className="w-4 h-4 bg-rose-500 text-white text-[9px] flex items-center justify-center rounded-full">{cart.length}</span>}
            </button>
          </div>

          <button 
            onClick={fetchCatalog} 
            className="p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors"
            title="Atualizar Estoque"
          >
            <RefreshCw size={20} className={isLoadingCatalog ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO */}
      <div className="flex-1 relative flex flex-col overflow-hidden">
        
        {/* VIEW: CATÁLOGO */}
        <div className={`absolute inset-0 transition-all duration-500 ease-out flex flex-col p-6 space-y-6 ${activeTab === 'catalog' ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}>
          
          <div className="shrink-0 flex items-center gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Pesquisar lotes ou espécies..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-14 bg-[#121214] border border-white/5 rounded-2xl pl-14 pr-6 text-sm font-bold focus:border-white/20 transition-all"
                />
            </div>
          </div>

          {/* CATEGORIAS HORIZONTAL */}
          <div className="shrink-0 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${selectedCategory === cat ? 'bg-emerald-500 border-emerald-400 text-black' : 'bg-[#121214] border-white/5 text-slate-500'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* GRID DE PRODUTOS */}
          <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {isLoadingCatalog ? (
              <div className="col-span-full h-64 flex flex-col items-center justify-center opacity-20">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs">Acessando Banco de Dados...</p>
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="col-span-full h-64 flex flex-col items-center justify-center opacity-20">
                <AlertTriangle size={40} className="mb-4" />
                <p className="font-bold uppercase tracking-widest text-xs">Nenhum lote com estoque disponível</p>
              </div>
            ) : filteredCatalog.map(product => (
              <div 
                key={product.id}
                onClick={() => addToCart(product, 1.0)}
                className="group relative bg-[#121214] border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col aspect-[4/5] active:scale-95 transition-all shadow-xl shadow-black/20"
              >
                <div className={`h-2/5 bg-gradient-to-br ${product.color || 'from-slate-700 to-slate-900'} relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-20 flex items-center justify-center scale-150 rotate-12">
                    <Package size={80} strokeWidth={1} />
                  </div>
                  {product.ncm && (
                    <div className="absolute top-4 left-4">
                      <span className="text-[8px] bg-black/40 px-2 py-1 rounded font-mono font-bold tracking-tighter">NCM: {product.ncm}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${product.propertyType === 'PROPRIO' ? 'bg-emerald-500 text-black' : 'bg-amber-400 text-black'}`}>
                        {product.propertyType === 'PROPRIO' ? 'Proprio' : 'Parceiro'}
                      </span>
                      <span className="text-[9px] text-slate-600 font-bold">{product.stock.toFixed(2)}kg</span>
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight leading-none mb-1 truncate">{product.name}</h3>
                    <p className="text-[10px] text-slate-500 font-bold">{product.owner}</p>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-black tracking-widest leading-none">Preço/kg</span>
                      <span className="text-lg font-black italic">R$ {product.price.toFixed(2)}</span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-lg shadow-white/10 group-active:translate-y-1 transition-transform">
                      <Plus size={20} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VIEW: CARRINHO */}
        <div className={`absolute inset-0 transition-all duration-500 ease-out flex flex-col ${activeTab === 'cart' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-700">
                <ShoppingCart size={80} strokeWidth={0.5} className="mb-6 opacity-20" />
                <p className="text-lg font-bold uppercase italic tracking-tighter opacity-40">Carrinho Vazio</p>
                <button onClick={() => setActiveTab('catalog')} className="mt-8 px-8 py-4 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-widest">Voltar ao Catálogo</button>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.batchId} className="bg-[#121214] border border-white/5 rounded-[3rem] p-6 flex items-center gap-6 shadow-2xl shadow-black/40 animate-in slide-in-from-right duration-500">
                  <div className={`w-16 h-16 rounded-[1.5rem] bg-gradient-to-br ${item.color || 'from-slate-700 to-slate-900'} shrink-0`} />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black uppercase tracking-tight truncate">{item.name}</h4>
                    <p className="text-xs text-slate-500 font-black italic opacity-60">R$ {item.price.toFixed(2)}/kg • {item.owner}</p>
                  </div>

                  <div className="flex items-center gap-4 bg-black/40 p-2 rounded-3xl border border-white/5">
                    <button onClick={() => addToCart(item, -0.5)} className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white hover:text-black flex items-center justify-center transition-all">
                      <Minus size={18} strokeWidth={3} />
                    </button>
                    <div className="flex flex-col items-center min-w-[60px]">
                      <span className="text-[9px] text-slate-500 uppercase font-black">Qtd (kg)</span>
                      <span className="text-sm font-black text-emerald-400">{item.weight.toFixed(3)}</span>
                    </div>
                    <button onClick={() => addToCart(item, 0.5)} className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white hover:text-black flex items-center justify-center transition-all">
                      <Plus size={18} strokeWidth={3} />
                    </button>
                  </div>

                  <div className="text-right min-w-[100px]">
                    <span className="text-[10px] text-slate-600 uppercase font-black block leading-none">Subtotal</span>
                    <span className="text-lg font-black text-white italic">R$ {(item.price * item.weight).toFixed(2)}</span>
                  </div>

                  <button onClick={() => addToCart(item, -item.weight)} className="p-3 text-slate-700 hover:text-rose-500 transition-colors">
                    <X size={24} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="shrink-0 bg-[#121214] border-t border-white/5 p-8 pb-12 space-y-6 rounded-t-[4rem]">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest block">Resumo Pagamento</span>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-black text-slate-600">Peixaria</span>
                      <span className="text-sm font-bold">R$ {totalOno.toFixed(2)}</span>
                    </div>
                    <div className="w-[1px] h-6 bg-white/10" />
                    <div className="flex flex-col">
                      <span className="text-[8px] uppercase font-black text-slate-600">Terceiros</span>
                      <span className="text-sm font-bold">R$ {totalParceiros.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em] block leading-none mb-1">Total Final</span>
                  <span className="text-5xl font-black italic tracking-tighter text-white">R$ {totalFinal.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  disabled={cart.length === 0}
                  onClick={() => setCustomerCpf(prompt('Identificar Cliente (CPF):') || '')}
                  className="flex-1 h-16 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  <UserPlus size={18} /> {customerCpf ? 'CPF OK' : 'Identificar'}
                </button>
                <button 
                  disabled={cart.length === 0}
                  onClick={() => setDiscount(parseFloat(prompt('Valor do Desconto:') || '0'))}
                  className="flex-1 h-16 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  <Percent size={18} /> {discount > 0 ? `R$ ${discount} OFF` : 'Desconto'}
                </button>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || loading}
                className="w-full h-20 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-20 text-black rounded-3xl flex items-center justify-center gap-4 text-xl font-black italic uppercase tracking-tighter transition-all active:scale-[0.98] shadow-2xl shadow-emerald-500/30"
              >
                {loading ? <Loader2 className="animate-spin" size={32} /> : (<>Finalizar Venda <ArrowRight size={28} strokeWidth={4} /></>)}
              </button>
          </div>
        </div>
      </div>

      {/* MODAL FISCAL (HIGH-END) */}
      {saleId && (
        <div className="fixed inset-0 z-[100] bg-black backdrop-blur-3xl flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#121214] border border-white/5 rounded-[4rem] p-12 flex flex-col items-center text-center shadow-2xl shadow-emerald-500/10">
            
            <div className="relative mb-12">
               {!isFinished ? (
                 <div className="w-32 h-32 rounded-full border-4 border-white/5 border-t-emerald-500 animate-spin" />
               ) : (
                 <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={64} className="text-black" />
                 </div>
               )}
               <div className="absolute inset-0 flex items-center justify-center font-black text-xl italic tracking-tighter">
                {isFinished ? 'OK' : `${Math.round(progress)}%`}
               </div>
            </div>

            <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">
              {isFinished ? 'Autorizado!' : 'Transmitindo'}
            </h2>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-10">Comunicando Focus NFe & Sefaz</p>

            <div className="w-full space-y-3 mb-12">
               {events.map((ev: any) => (
                 <div key={ev.id} className="bg-black/40 border border-white/5 rounded-3xl p-5 flex items-center justify-between">
                    <div className="text-left">
                       <span className="text-[9px] font-black uppercase text-slate-700 block mb-1">Event Type: {ev.eventType}</span>
                       <span className="text-xs font-black font-mono tracking-tighter text-emerald-400/60 truncate w-48 block">{ev.nfeKey || 'Aguardando Sincro...'}</span>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${ev.status === 'AUTORIZADA' ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-white/10 text-slate-700'}`}>
                      {ev.status}
                    </div>
                  </div>
               ))}
            </div>

            {!isFinished && (
               <button 
                 onClick={() => simularAprovaçãoSefaz(saleId)}
                 className="mb-10 text-[10px] font-black text-white/20 hover:text-emerald-500 tracking-[0.4em] transition-all uppercase"
               >
                 [ Forçar Autorização Sefaz ]
               </button>
            )}

            <button 
              onClick={resetPDV}
              disabled={!isFinished}
              className="w-full h-20 bg-white disabled:opacity-20 text-black rounded-3xl font-black text-xl italic uppercase tracking-tighter shadow-2xl active:scale-95 transition-all"
            >
              Imprimir & Novo Pedido
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        ::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        body { background-color: #070708; overflow: hidden; overscroll-behavior: none; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
