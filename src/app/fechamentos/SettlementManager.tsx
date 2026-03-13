"use client";

import { useState } from "react";
import { getSettlementData, createSettlement } from "./actions";
import { useNotification } from "../NotificationContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SettlementManager({ fishermen }: { fishermen: any[] }) {
    const { showToast } = useNotification();
    const [fishermanId, setFishermanId] = useState("");
    const [fishermanSearch, setFishermanSearch] = useState("");
    const [showFishermanList, setShowFishermanList] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [data, setData] = useState<any>(null);
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [expensesAmounts, setExpensesAmounts] = useState<Record<string, number>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [receipt, setReceipt] = useState<any>(null);

    const fetchLandingData = async () => {
        if (!fishermanId || !startDate || !endDate) return;
        const result = await getSettlementData(fishermanId, startDate, endDate);
        setData(result);
        setPrices({});

        // Inicializa os valores das despesas com os valores originais do banco
        const initialExpenses: Record<string, number> = {};
        result.expenses.forEach((e: any) => {
            initialExpenses[e.id] = e.amount;
        });
        setExpensesAmounts(initialExpenses);

        setReceipt(null);
    };

    const calculateBruteTotal = () => {
        if (!data) return 0;
        return data.groupedLandings.reduce((acc: number, item: any) => {
            const price = prices[item.species] || 0;
            return acc + (item.weight * price);
        }, 0);
    };

    const calculateExpensesTotal = () => {
        if (!data) return 0;
        return Object.values(expensesAmounts).reduce((acc, curr) => acc + curr, 0);
    };

    const handleSave = async () => {
        if (!fishermanId || !startDate || !endDate) {
            showToast("⚠️ Preencha todos os campos do período e pescador", "warning");
            return;
        }

        const gross_total = calculateBruteTotal();
        const expenses_total = calculateExpensesTotal();
        const net_total = gross_total - expenses_total;

        setIsSaving(true);
        try {
            const adjustedExpenses = Object.entries(expensesAmounts).map(([id, amount]) => ({ id, amount }));

            const result = await createSettlement({
                fishermanId,
                start_date: startDate,
                end_date: endDate,
                gross_total,
                expenses_total,
                net_total,
                adjustedExpenses
            });

            if (result && (result as any).error) {
                showToast(`❌ Erro: ${(result as any).error}`, "error");
            } else if (result) {
                setReceipt({
                    ...result,
                    fisherman: fishermen.find(f => f.id === fishermanId),
                    groupedLandings: data.groupedLandings.map((l: any) => ({ ...l, price: prices[l.species] || 0 })),
                    expenses: data.expenses.map((e: any) => ({ ...e, amount: expensesAmounts[e.id] })),
                    dailySummary: data.dailySummary.map((day: any) => ({
                        ...day,
                        expenses: day.expenses.map((e: any) => ({ ...e, amount: expensesAmounts[e.id] }))
                    }))
                });
                showToast("Fechamento realizado com sucesso!", "success");
            }
        } catch (error: any) {
            console.error("Erro ao salvar fechamento:", error);
            showToast(`❌ Falha ao salvar: ${error.message || "Erro desconhecido"}`, "error");
        } finally {
            setIsSaving(false);
        }
    };


    const generatePDF = () => {
        if (!receipt) return;

        const doc = new jsPDF();
        const fishermanName = receipt.fisherman.name;
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `Recibo_${fishermanName.replace(/\s+/g, '_')}_${dateStr}.pdf`;

        doc.setFontSize(18);
        doc.text("Peixaria Ono - Recibo de Fechamento", 105, 20, { align: "center" });

        doc.setFontSize(12);
        doc.text(`Pescador: ${receipt.fisherman.name}`, 20, 40);
        doc.text(`Barco: ${receipt.fisherman.boat_name}`, 20, 50);
        doc.text(`Período: ${new Date(receipt.start_date).toLocaleDateString()} a ${new Date(receipt.end_date).toLocaleDateString()}`, 20, 60);

        // Tabela de Pescados
        const bodyLandings = receipt.groupedLandings.map((l: any) => [
            l.species,
            `${l.weight.toFixed(2)} kg`,
            `R$ ${l.price.toFixed(2)}`,
            `R$ ${(l.weight * l.price).toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: 70,
            head: [["Especie", "Peso", "Preco/kg", "Subtotal"]],
            body: bodyLandings,
            theme: 'grid',
            headStyles: { fillColor: [0, 31, 63] }
        });

        let finalY = (doc as any).lastAutoTable.finalY + 10;

        // Tabela de Despesas
        if (receipt.expenses.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Detalhamento de Despesas", 20, finalY);

            const bodyExpenses = receipt.expenses.map((e: any) => [
                new Date(e.date).toLocaleDateString(),
                e.category + (e.quantity ? ` (${e.quantity} kg)` : ''),
                e.notes || "-",
                `R$ ${e.amount.toFixed(2)}`
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [["Data", "Categoria", "Obs", "Valor"]],
                body: bodyExpenses,
                theme: 'plain',
                headStyles: { fillColor: [150, 0, 0], textColor: [255, 255, 255] }
            });

            finalY = (doc as any).lastAutoTable.finalY + 10;
        }

        // Tabela Diária (Opcional, mas solicitada pelo usuário como Detalhamento)
        doc.addPage();
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Detalhamento Diário (Entradas e Saídas)", 20, 20);

        const dailyBody: any[] = [];
        receipt.dailySummary.forEach((day: any) => {
            const dateStr = new Date(day.date).toLocaleDateString();
            
            // Adiciona as entradas do dia
            day.landings.forEach((l: any, idx: number) => {
                dailyBody.push([
                    idx === 0 ? dateStr : "",
                    `Entrada: ${l.species}`,
                    `${l.weight.toFixed(2)} kg`,
                    "-"
                ]);
            });

            // Adiciona as saídas (despesas) do dia
            day.expenses.forEach((e: any) => {
                dailyBody.push([
                    "",
                    `Saída: ${e.category}`,
                    e.quantity ? `${e.quantity} kg` : "-",
                    `R$ ${e.amount.toFixed(2)}`
                ]);
            });
        });

        autoTable(doc, {
            startY: 30,
            head: [["Data", "Descrição", "Qtd/Peso", "Valor"]],
            body: dailyBody,
            theme: 'grid',
            headStyles: { fillColor: [50, 50, 50] }
        });

        finalY = (doc as any).lastAutoTable.finalY + 10;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text(`Total Bruto: R$ ${receipt.gross_total.toFixed(2)}`, 140, finalY, { align: "right" });
        doc.text(`Total Despesas: - R$ ${receipt.expenses_total.toFixed(2)}`, 140, finalY + 10, { align: "right" });
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`VALOR LÍQUIDO: R$ ${receipt.net_total.toFixed(2)}`, 140, finalY + 22, { align: "right" });

        doc.save(fileName);
    };

    const handlePrint = () => {
        window.print();
    };

    if (receipt) {
        const ReceiptContent = ({ title }: { title: string }) => (
            <div className="print-receipt" style={{ background: '#fff', color: '#000', padding: '10px 0', fontFamily: 'monospace', borderBottom: '2px solid #000' }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <h2 style={{ margin: 0 }}>PEIXARIA ONO</h2>
                    <p style={{ fontSize: '12px', margin: 0 }}>Recibo de Fechamento - {title}</p>
                </div>

                <div style={{ borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '5px 0', margin: '10px 0' }}>
                    <p style={{ margin: '2px 0' }}><strong>Pescador:</strong> {receipt.fisherman.name}</p>
                    <p style={{ margin: '2px 0' }}><strong>Barco:</strong> {receipt.fisherman.boat_name || "-"}</p>
                    <p style={{ margin: '2px 0' }}><strong>Período:</strong> {new Date(receipt.start_date).toLocaleDateString()} a {new Date(receipt.end_date).toLocaleDateString()}</p>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #000' }}>
                            <th align="left">Espécie</th>
                            <th align="right">Peso</th>
                            <th align="right">Preço</th>
                            <th align="right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {receipt.groupedLandings.map((l: any) => (
                            <tr key={l.species}>
                                <td>{l.species}</td>
                                <td align="right">{l.weight}kg</td>
                                <td align="right">R${l.price.toFixed(2)}</td>
                                <td align="right">R${(l.weight * l.price).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div style={{ marginTop: '20px' }}>
                    <h3 style={{ borderBottom: '2px solid #000', fontSize: '13px', margin: '5px 0' }}>Detalhamento por Dia (Entrada e Saída)</h3>
                    {receipt.dailySummary.map((day: any) => (
                        <div key={day.date} style={{ marginBottom: '10px', borderBottom: '1px dashed #ccc', paddingBottom: '5px' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '12px' }}>Dia {new Date(day.date).toLocaleDateString()}</div>
                            
                            {/* Entradas */}
                            {day.landings.map((l: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', paddingLeft: '10px' }}>
                                    <span>📥 {l.species}</span>
                                    <span>{l.weight.toFixed(2)} kg</span>
                                </div>
                            ))}

                            {/* Saídas */}
                            {day.expenses.map((e: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', paddingLeft: '10px', color: '#ff0000' }}>
                                    <span>📤 {e.category} {e.quantity ? `(${e.quantity}kg)` : ''}</span>
                                    <span>- R$ {e.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '15px', borderTop: '2px solid #000', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Valor Bruto:</span>
                        <span>R$ {receipt.gross_total.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>Despesas:</span>
                        <span>- R$ {receipt.expenses_total.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginTop: '5px', borderTop: '1px solid #000', paddingTop: '5px' }}>
                        <span>LÍQUIDO:</span>
                        <span>R$ {receipt.net_total.toFixed(2)}</span>
                    </div>
                </div>

                <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '10px' }}>
                    <p>Assinatura: _________________________________</p>
                    <p>Emitido em {new Date().toLocaleString()}</p>
                </div>
            </div>
        );

        return (
            <div>
                <div className="no-print">
                    <div className="card" style={{ background: '#fff', color: '#000', padding: '20px' }}>
                        <ReceiptContent title="VIA DO SISTEMA" />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handlePrint} className="btn-primary" style={{ background: '#00cc66', color: '#fff' }}>🖨️ Imprimir (2 Vias)</button>
                            <button onClick={generatePDF} className="btn-primary" style={{ background: '#003366', color: '#fff' }}>📄 Salvar PDF</button>
                        </div>
                        <button onClick={() => setReceipt(null)} className="btn-primary" style={{ marginTop: '10px', width: '100%', background: '#666', color: '#fff' }}>Novo Fechamento</button>
                    </div>
                </div>

                {/* Camada de Impressão (invisível na tela, visível no print) */}
                <div className="print-only">
                    <ReceiptContent title="VIA DO PESCADOR" />
                    <div style={{ height: '50px', borderBottom: '2px dashed #000', margin: '20px 0' }}></div>
                    <ReceiptContent title="VIA DA PEIXARIA" />
                </div>
            </div>
        );
    }


    return (
        <div>
            <div className="card">
                <div className="form-group" style={{ position: 'relative' }}>
                    <label>Pescador</label>
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
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Início</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Fim</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                </div>
                <button className="btn-primary" style={{ width: '100%' }} onClick={fetchLandingData}>Buscar Dados</button>
            </div>

            {data && (
                <div className="card">
                    <h2>Acerto de Pescados</h2>
                    {data.groupedLandings.map((item: any) => (
                        <div key={item.species} style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600' }}>{item.species}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total: {item.weight} kg</div>
                            </div>
                            <div style={{ width: '120px' }}>
                                <label style={{ fontSize: '10px' }}>Preço R$/kg</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={prices[item.species] || ""}
                                    onChange={(e) => setPrices({ ...prices, [item.species]: parseFloat(e.target.value) })}
                                    style={{ padding: '8px' }}
                                />
                            </div>
                        </div>
                    ))}

                    <div style={{ marginTop: '30px' }}>
                        <h2 style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>Ajuste de Despesas</h2>
                        {data.expenses.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Nenhuma despesa no período.</p>
                        ) : (
                            data.expenses.map((e: any) => (
                                <div key={e.id} style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,0,0,0.05)', padding: '10px', borderRadius: '6px' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px' }}>{new Date(e.date).toLocaleDateString()} - <strong>{e.category}</strong> {e.quantity ? `(${e.quantity} kg)` : ''}</div>
                                        {e.notes && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{e.notes}</div>}
                                    </div>
                                    <div style={{ width: '100px' }}>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={expensesAmounts[e.id] ?? ""}
                                            onChange={(ev) => setExpensesAmounts({ ...expensesAmounts, [e.id]: parseFloat(ev.target.value) || 0 })}
                                            style={{ padding: '6px', fontSize: '14px', border: '1px solid rgba(255,0,0,0.2)' }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div style={{ marginTop: '30px' }}>
                        <h2 style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>Detalhamento por Dia (Entrada e Saída)</h2>
                        {data.dailySummary.map((day: any) => (
                            <div key={day.date} style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px' }}>
                                <div style={{ fontWeight: 'bold', color: 'var(--accent-blue)', marginBottom: '8px' }}>Dia {new Date(day.date).toLocaleDateString()}</div>
                                
                                {day.landings.map((l: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                                        <span>📥 {l.species}</span>
                                        <span style={{ color: 'var(--text-secondary)' }}>{l.weight.toFixed(2)} kg</span>
                                    </div>
                                ))}

                                {day.expenses.map((e: any, i: number) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px', color: 'var(--danger)' }}>
                                        <span>📤 {e.category} {e.quantity ? `(${e.quantity}kg)` : ''}</span>
                                        <span>- R$ {(expensesAmounts[e.id] ?? e.amount).toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Total Bruto (Peixes):</span>
                            <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold' }}>R$ {calculateBruteTotal().toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Total Despesas (Ajustado):</span>
                            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>- R$ {calculateExpensesTotal().toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '22px', borderTop: '2px solid rgba(255,255,255,0.2)', paddingTop: '15px', marginTop: '10px' }}>
                            <span>SALDO LÍQUIDO:</span>
                            <span style={{ color: 'var(--success)' }}>R$ {(calculateBruteTotal() - calculateExpensesTotal()).toFixed(2)}</span>
                        </div>
                    </div>


                    <button
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '20px' }}
                        onClick={handleSave}
                        disabled={isSaving || calculateBruteTotal() === 0}
                    >
                        {isSaving ? "Salvando..." : "Finalizar e Gerar Recibo"}
                    </button>
                </div>
            )}
        </div>
    );
}
