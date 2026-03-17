"use client";

import { useState } from "react";
import { addRecipient, removeRecipient, toggleRecipient, saveGlobalFiscalConfig, testFocusConnection } from "./actions";
import { useNotification } from "../NotificationContext";
import { 
    ShieldCheck, Upload, Lock, Key, Globe, Building, 
    FileText, CheckCircle, Bell, Trash2, Power, PowerOff
} from 'lucide-react';

export default function SettingsClient({ 
    initialRecipients, 
    initialFiscalConfig 
}: { 
    initialRecipients: any[],
    initialFiscalConfig?: any
}) {
    const { showToast } = useNotification();
    
    // Notificações State
    const [recipients, setRecipients] = useState(initialRecipients);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [isSavingRecipient, setIsSavingRecipient] = useState(false);

    // Fiscal Global State
    const [fiscalData, setFiscalData] = useState({
        companyName: initialFiscalConfig?.companyName || 'PEIXARIA ONO',
        cnpj: initialFiscalConfig?.cnpj || '',
        focusToken: initialFiscalConfig?.focusToken || '',
        environment: initialFiscalConfig?.environment || 'homologacao',
        password: initialFiscalConfig?.certPassword || '',
        validUntil: initialFiscalConfig?.certValidUntil ? new Date(initialFiscalConfig.certValidUntil).toISOString().split('T')[0] : '',
        base64: initialFiscalConfig?.certBase64 || ''
    });
    const [isSavingFiscal, setIsSavingFiscal] = useState(false);
    const [isTestingConnection, setIsTestingConnection] = useState(false);

    const handleAddRecipient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone) return;

        setIsSavingRecipient(true);
        try {
            const formData = new FormData();
            formData.append("name", name);
            formData.append("phone", phone);
            
            const result: any = await addRecipient(formData);
            if (result && result.error) {
                showToast(result.error, "error");
            } else if (result) {
                setRecipients([...recipients, result]);
                setName("");
                setPhone("");
                showToast("Número cadastrado para notificações!", "success");
            }
        } catch (error) {
            showToast("Erro ao cadastrar.", "error");
        } finally {
            setIsSavingRecipient(false);
        }
    };

    const handleToggleRecipient = async (id: string) => {
        try {
            await toggleRecipient(id);
            setRecipients(recipients.map(r => r.id === id ? { ...r, active: !r.active } : r));
        } catch (error) {
            showToast("Erro ao alterar status.", "error");
        }
    };

    const handleRemoveRecipient = async (id: string) => {
        if (!confirm("Remover este número das notificações?")) return;
        try {
            await removeRecipient(id);
            setRecipients(recipients.filter(r => r.id !== id));
            showToast("Removido com sucesso.", "info");
        } catch (error) {
            showToast("Erro ao remover.", "error");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setFiscalData({ ...fiscalData, base64: result });
        };
        reader.readAsDataURL(file);
    };

    const handleTestFocus = async () => {
        if (!fiscalData.focusToken) {
            showToast("Insira o token para testar.", "warning");
            return;
        }
        setIsTestingConnection(true);
        try {
            const result = await testFocusConnection(fiscalData.focusToken, fiscalData.environment);
            if (result.success) {
                showToast(result.message, "success");
            } else {
                showToast(result.message, "error");
            }
        } catch (error) {
            showToast("Erro ao testar conexão.", "error");
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleSaveFiscal = async () => {
        if (!fiscalData.companyName || !fiscalData.cnpj) {
            showToast("Razão Social e CNPJ são obrigatórios.", "warning");
            return;
        }

        setIsSavingFiscal(true);
        try {
            await saveGlobalFiscalConfig({
                companyName: fiscalData.companyName,
                cnpj: fiscalData.cnpj,
                focusToken: fiscalData.focusToken,
                environment: fiscalData.environment,
                certBase64: fiscalData.base64,
                certPassword: fiscalData.password,
                certValidUntil: fiscalData.validUntil
            });
            showToast("Configurações fiscais atualizadas!", "success");
        } catch (error) {
            showToast("Erro ao salvar dados fiscais.", "error");
        } finally {
            setIsSavingFiscal(false);
        }
    };

    return (
        <div className="space-y-8 pb-32">
            
            {/* SEÇÃO FISCAL GLOBAL */}
            <div className="bg-[#121214] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 bg-gradient-to-r from-emerald-500/10 to-transparent flex items-center gap-4">
                    <ShieldCheck className="text-emerald-500" size={28} />
                    <div>
                        <h2 className="text-xl font-black uppercase italic italic leading-tight">Configurações Fiscais (Peixaria Ono)</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Certificado Digital e Integração FocusNFe</p>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                <Building size={12} /> Razão Social
                            </label>
                            <input 
                                type="text" 
                                value={fiscalData.companyName}
                                onChange={(e) => setFiscalData({ ...fiscalData, companyName: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm outline-none focus:border-emerald-500/50"
                                placeholder="PEIXARIA ONO LTDA"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                <FileText size={12} /> CNPJ da Peixaria
                            </label>
                            <input 
                                type="text" 
                                value={fiscalData.cnpj}
                                onChange={(e) => setFiscalData({ ...fiscalData, cnpj: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm outline-none focus:border-emerald-500/50"
                                placeholder="00.000.000/0001-00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                <Key size={12} /> Token FocusNFe
                            </label>
                            <div className="flex gap-2">
                                <input 
                                    type="password" 
                                    value={fiscalData.focusToken}
                                    onChange={(e) => setFiscalData({ ...fiscalData, focusToken: e.target.value })}
                                    className="flex-1 bg-black/40 border border-white/5 rounded-xl p-4 text-sm outline-none focus:border-emerald-500/50 font-mono"
                                    placeholder="Token da API FocusNFe"
                                />
                                <button 
                                    onClick={handleTestFocus}
                                    disabled={isTestingConnection}
                                    className="px-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/5"
                                >
                                    {isTestingConnection ? '...' : 'Testar'}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                <Globe size={12} /> Ambiente Sefaz
                            </label>
                            <select 
                                value={fiscalData.environment}
                                onChange={(e) => setFiscalData({ ...fiscalData, environment: e.target.value })}
                                className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm outline-none focus:border-emerald-500/50"
                            >
                                <option value="homologacao">Homologação (Testes)</option>
                                <option value="producao">Produção (Real)</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-6 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Upload size={80} />
                        </div>
                        
                        <h3 className="text-xs font-black uppercase tracking-widest text-emerald-500 mb-4 flex items-center gap-2">
                            <Lock size={14} /> Certificado Digital A1 (.pfx)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-black text-slate-600">Arquivo</label>
                                <input 
                                    type="file" 
                                    accept=".pfx,.p12"
                                    onChange={handleFileChange}
                                    className="w-full text-xs text-slate-400 file:bg-emerald-500 file:text-black file:rounded-lg file:border-0 file:px-4 file:py-2 file:mr-4 file:font-black file:uppercase file:text-[10px] cursor-pointer"
                                />
                                {fiscalData.base64 && <span className="text-[9px] text-emerald-500 font-bold">CERTIFICADO CARREGADO</span>}
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-black text-slate-600">Senha</label>
                                <input 
                                    type="password" 
                                    value={fiscalData.password}
                                    onChange={(e) => setFiscalData({ ...fiscalData, password: e.target.value })}
                                    className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-emerald-500/50"
                                    placeholder="Senha do arquivo PFX"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase font-black text-slate-600">Validade</label>
                                <input 
                                    type="date" 
                                    value={fiscalData.validUntil}
                                    onChange={(e) => setFiscalData({ ...fiscalData, validUntil: e.target.value })}
                                    className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-emerald-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleSaveFiscal}
                        disabled={isSavingFiscal}
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase italic py-5 rounded-2xl transition-all shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-2"
                    >
                        {isSavingFiscal ? (
                            <>Sincronizando...</>
                        ) : (
                            <>SALVAR CONFIGURAÇÕES FISCAIS</>
                        )}
                    </button>
                </div>
            </div>

            {/* SEÇÃO NOTIFICAÇÕES */}
            <div className="bg-[#121214] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 flex items-center gap-4">
                    <Bell className="text-blue-500" size={28} />
                    <div>
                        <h2 className="text-xl font-black uppercase italic italic leading-tight">Notificações WhatsApp</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Resumo Automático de Pescarias e Despesas</p>
                    </div>
                </div>

                <div className="p-8">
                    <form onSubmit={handleAddRecipient} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <input 
                            type="text" 
                            placeholder="Nome" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="bg-black/40 border border-white/5 rounded-xl p-4 text-sm outline-none focus:border-blue-500/50"
                        />
                        <input 
                            type="text" 
                            placeholder="WhatsApp (ex: 5512...)" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)} 
                            className="bg-black/40 border border-white/5 rounded-xl p-4 text-sm outline-none focus:border-blue-500/50"
                        />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-black uppercase italic rounded-xl px-8" disabled={isSavingRecipient}>
                            Adicionar
                        </button>
                    </form>

                    <div className="space-y-3">
                        {recipients.map(r => (
                            <div key={r.id} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${
                                r.active ? 'bg-white/[0.02] border-white/5' : 'bg-black/20 border-white/5 opacity-50'
                            }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                        r.active ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-500'
                                    }`}>
                                        {r.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold">{r.name}</div>
                                        <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest">{r.phone}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleToggleRecipient(r.id)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            r.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                        }`}
                                        title={r.active ? 'Desativar' : 'Ativar'}
                                    >
                                        {r.active ? <Power size={18} /> : <PowerOff size={18} />}
                                    </button>
                                    <button 
                                        onClick={() => handleRemoveRecipient(r.id)}
                                        className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500/20"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
