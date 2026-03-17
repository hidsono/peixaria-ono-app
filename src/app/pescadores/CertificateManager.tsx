'use client';

import { useState } from 'react';
import { saveFishermanCertificate } from '../actions';
import { Key, ShieldCheck, Calendar, X, Upload, Lock } from 'lucide-react';

export default function CertificateManager({ fishermanId, fishermanName, existingCert }: { 
    fishermanId: string, 
    fishermanName: string,
    existingCert?: any 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [validUntil, setValidUntil] = useState('');
    const [base64, setBase64] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setBase64(result);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!base64 || !password || !validUntil) {
            alert("Preencha todos os campos do certificado.");
            return;
        }

        setLoading(true);
        try {
            await saveFishermanCertificate({
                fishermanId,
                certBase64: base64,
                password,
                validUntil
            });
            setIsOpen(false);
            alert("Certificado salvo com sucesso!");
        } catch (error) {
            alert("Erro ao salvar certificado.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button 
                onClick={() => setIsOpen(true)}
                className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded mt-2 transition-all ${
                    existingCert ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500 italic'
                }`}
            >
                <Key size={12} />
                {existingCert ? 'Certificado Ativo' : 'Cadastrar Certificado'}
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-[#121214] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-6 relative">
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-xl">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h3 className="font-black italic uppercase text-lg leading-tight">Certificado Digital</h3>
                                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{fishermanName}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                    <Upload size={10} /> Arquivo Certificado (A1 .pfx)
                                </label>
                                <input 
                                    type="file" 
                                    accept=".pfx,.p12"
                                    onChange={handleFileChange}
                                    className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-xs outline-none focus:border-emerald-500/50"
                                />
                                {base64 && <p className="text-[10px] text-emerald-500 font-bold">✓ Arquivo carregado</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                    <Lock size={10} /> Senha do Certificado
                                </label>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Senha definida na exportação"
                                    className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-xs outline-none focus:border-emerald-500/50"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2">
                                    <Calendar size={10} /> Data de Validade
                                </label>
                                <input 
                                    type="date" 
                                    value={validUntil}
                                    onChange={(e) => setValidUntil(e.target.value)}
                                    className="w-full bg-black/40 border border-white/5 rounded-lg p-3 text-xs outline-none focus:border-emerald-500/50"
                                />
                            </div>

                            <button 
                                onClick={handleSave}
                                disabled={loading}
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase italic py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 mt-4"
                            >
                                {loading ? 'SALVANDO...' : 'CONFIRMAR CERTIFICADO'}
                            </button>
                            
                            <p className="text-[9px] text-slate-600 text-center leading-relaxed mt-4">
                                Os dados do certificado são utilizados exclusivamente para assinatura das Notas Fiscais eletrônicas em nome do parceiro pescador.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
