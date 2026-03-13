"use client";

import { useState } from "react";
import { addRecipient, removeRecipient, toggleRecipient } from "./actions";
import { useNotification } from "../NotificationContext";

export default function SettingsClient({ initialRecipients }: { initialRecipients: any[] }) {
    const { showToast } = useNotification();
    const [recipients, setRecipients] = useState(initialRecipients);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !phone) return;

        setIsSaving(true);
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
            setIsSaving(false);
        }
    };

    const handleToggle = async (id: string) => {
        try {
            await toggleRecipient(id);
            setRecipients(recipients.map(r => r.id === id ? { ...r, active: !r.active } : r));
        } catch (error) {
            showToast("Erro ao alterar status.", "error");
        }
    };

    const handleRemove = async (id: string) => {
        if (!confirm("Remover este número das notificações?")) return;
        try {
            await removeRecipient(id);
            setRecipients(recipients.filter(r => r.id !== id));
            showToast("Removido com sucesso.", "info");
        } catch (error) {
            showToast("Erro ao remover.", "error");
        }
    };

    return (
        <div className="card">
            <h2>Notificações Automáticas</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
                Os números abaixo receberão um resumo via sistema sempre que uma nova pescaria ou despesa for registrada.
            </p>

            <form onSubmit={handleAdd} style={{ marginBottom: '30px', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px' }}>Nome</label>
                        <input 
                            type="text" 
                            placeholder="Ex: Hideo" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            style={{ width: '100%', height: '40px' }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '12px' }}>WhatsApp (DDI+DDD+Num)</label>
                        <input 
                            type="text" 
                            placeholder="Ex: 551299999999" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)} 
                            style={{ width: '100%', height: '40px' }}
                        />
                    </div>
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isSaving}>
                    {isSaving ? "Cadastrando..." : "Adicionar Número"}
                </button>
            </form>

            <div style={{ marginTop: '20px' }}>
                <h3>Números Ativos</h3>
                {recipients.length === 0 ? (
                    <p style={{ fontSize: '14px', fontStyle: 'italic', opacity: 0.7 }}>Nenhum número cadastrado ainda.</p>
                ) : (
                    recipients.map(r => (
                        <div key={r.id} style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '12px', 
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            background: r.active ? 'transparent' : 'rgba(255,255,255,0.02)',
                            opacity: r.active ? 1 : 0.6
                        }}>
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{r.name}</div>
                                <div style={{ fontSize: '13px', color: 'var(--accent-blue)' }}>{r.phone}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button 
                                    onClick={() => handleToggle(r.id)}
                                    style={{ background: 'transparent', color: r.active ? 'var(--success)' : 'var(--text-secondary)', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                                >
                                    {r.active ? "Ativado" : "Desativado"}
                                </button>
                                <button 
                                    onClick={() => handleRemove(r.id)}
                                    style={{ background: 'transparent', color: 'var(--danger)', border: 'none', cursor: 'pointer', fontSize: '12px' }}
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
