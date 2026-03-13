"use client";

import { useState, useRef } from "react";
import { createExpense } from "../actions";
import { useNotification } from "../NotificationContext";

export default function ExpenseForm({ fishermen }: { fishermen: any[] }) {
    const { showToast } = useNotification();
    const [lastEntry, setLastEntry] = useState<any>(null);
    const [fishermanId, setFishermanId] = useState("");
    const [fishermanSearch, setFishermanSearch] = useState("");
    const [showFishermanList, setShowFishermanList] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    async function handleSubmit(formData: FormData) {
        if (!fishermanId) {
            showToast("Selecione um pescador.", "error");
            return;
        }
        setIsSaving(true);
        const fisherman = fishermen.find(f => f.id === fishermanId);
        const category = formData.get("category") as string;
        const amountRaw = formData.get("amount") as string;
        const amount = amountRaw ? parseFloat(amountRaw.replace(',', '.')) : 0;
        const date = formData.get("date") as string;
        const notes = formData.get("notes") as string;

        // Atualiza a formData para enviar o valor processado
        const cleanedData = new FormData();
        cleanedData.append("fishermanId", fishermanId);
        cleanedData.append("category", category);
        cleanedData.append("amount", amount.toString());
        cleanedData.append("quantity", (formData.get("quantity") as string) || "");
        cleanedData.append("date", date);
        cleanedData.append("notes", notes);

        await createExpense(cleanedData);
        showToast("Despesa salva com sucesso!", "success");

        setLastEntry({
            fishermanName: fisherman?.name,
            boatName: fisherman?.boat_name,
            category,
            amount,
            quantity: formData.get("quantity") as string,
            date,
            notes
        });

        formRef.current?.reset();
        setIsSaving(false);
    }

    const handlePrint = () => {
        window.print();
    };

    const TicketContent = ({ title }: { title: string }) => (
        <div className="print-receipt" style={{ padding: '10px 0', borderBottom: '2px solid #000', fontFamily: 'monospace' }}>
            <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0 }}>PEIXARIA ONO</h3>
                <p style={{ fontSize: '10px', margin: 0 }}>Recibo de Despesa - {title}</p>
            </div>
            <div style={{ margin: '10px 0', fontSize: '12px' }}>
                <p style={{ margin: '2px 0' }}><strong>Pescador:</strong> {lastEntry.fishermanName}</p>
                <p style={{ margin: '2px 0' }}><strong>Barco:</strong> {lastEntry.boatName || "-"}</p>
                <p style={{ margin: '2px 0' }}><strong>Data:</strong> {new Date(lastEntry.date).toLocaleDateString()}</p>
            </div>
            <div style={{ borderTop: '2px solid #000', padding: '10px 0' }}>
                <p style={{ fontSize: '14px', margin: '5px 0' }}><strong>Categoria:</strong> {lastEntry.category}</p>
                <p style={{ fontSize: '16px', margin: '5px 0' }}><strong>Valor:</strong> R$ {parseFloat(lastEntry.amount).toFixed(2)}</p>
                {lastEntry.quantity && <p style={{ fontSize: '16px', margin: '5px 0' }}><strong>Quantidade:</strong> {lastEntry.quantity} kg</p>}
                {lastEntry.notes && <p style={{ fontSize: '12px', fontStyle: 'italic' }}>Obs: {lastEntry.notes}</p>}
            </div>
            <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '10px' }}>
                <p>Assinatura: _________________________________</p>
                <p>Emitido em {new Date().toLocaleString()}</p>
            </div>
        </div>
    );

    return (
        <>
            <form ref={formRef} action={handleSubmit} className="card no-print">
                {lastEntry && (
                    <div style={{ background: 'rgba(255, 77, 77, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid var(--danger)' }}>
                        <div style={{ color: '#ff4d4d', fontSize: '13px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>✓ Despesa de R$ {parseFloat(lastEntry.amount).toFixed(2)} salva!</span>
                            <button type="button" onClick={handlePrint} style={{ background: '--danger', backgroundColor: '#ff4d4d', color: '#fff', padding: '5px 10px', fontSize: '11px', borderRadius: '4px' }}>
                                🖨️ Imprimir Ticket
                            </button>
                        </div>
                    </div>
                )}

                <div className="form-group" style={{ position: 'relative' }}>
                    <label>Pescador / Barco</label>
                    <input type="hidden" name="fishermanId" value={fishermanId} />
                    <input 
                        type="text" 
                        placeholder="Pesquisar pescador ou barco..."
                        value={fishermen.find(f => f.id === fishermanId)?.name || fishermanSearch}
                        onChange={(e) => {
                            setFishermanSearch(e.target.value);
                            if (fishermanId) setFishermanId("");
                        }}
                        onFocus={() => setShowFishermanList(true)}
                        style={{ width: '100%', height: '45px' }}
                    />
                    {showFishermanList && (
                        <div style={{ 
                            position: 'absolute', 
                            top: '100%', 
                            left: 0, 
                            right: 0, 
                            backgroundColor: '#112240', 
                            border: '1px solid #333', 
                            borderRadius: '4px',
                            zIndex: 1000,
                            maxHeight: '200px',
                            overflowY: 'auto',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                        }}>
                            {fishermen
                                .filter(f => 
                                    f.name.toLowerCase().includes(fishermanSearch.toLowerCase()) || 
                                    (f.boat_name && f.boat_name.toLowerCase().includes(fishermanSearch.toLowerCase()))
                                )
                                .map(f => (
                                    <div 
                                        key={f.id} 
                                        onClick={() => {
                                            setFishermanId(f.id);
                                            setFishermanSearch(f.name);
                                            setShowFishermanList(false);
                                        }}
                                        style={{ 
                                            padding: '10px', 
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #333',
                                            backgroundColor: fishermanId === f.id ? '#1a365d' : 'transparent'
                                        }}
                                    >
                                        <strong>{f.name}</strong> {f.boat_name ? `(${f.boat_name})` : ''}
                                    </div>
                                ))
                            }
                        </div>
                    )}
                    {showFishermanList && (
                        <div 
                            onClick={() => setShowFishermanList(false)}
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
                        />
                    )}
                </div>

                <div className="form-group">
                    <label>Data</label>
                    <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required />
                </div>

                <div className="form-group">
                    <label>Categoria</label>
                    <select name="category" required>
                        <option value="Gelo">Gelo</option>
                        <option value="Diesel">Diesel</option>
                        <option value="Rancho">Rancho</option>
                        <option value="Pecas">Peças</option>
                        <option value="Vale">Vale</option>
                        <option value="Pescado">Pescado</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Valor (R$)</label>
                        <input type="number" step="0.01" name="amount" placeholder="0,00" inputMode="decimal" />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Quantidade (kg)</label>
                        <input type="number" step="0.01" name="quantity" placeholder="Opcional" inputMode="decimal" />
                    </div>
                </div>

                <div className="form-group">
                    <label>Observação (Opcional)</label>
                    <input type="text" name="notes" placeholder="Ex: Compra de 500kg de gelo" />
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Despesa"}
                </button>
            </form>

            {lastEntry && (
                <div className="print-only">
                    <TicketContent title="VIA DO PESCADOR" />
                    <div style={{ height: '30px', borderBottom: '2px solid #000', margin: '15px 0' }}></div>
                    <TicketContent title="VIA DA PEIXARIA" />
                </div>
            )}
        </>
    );
}
