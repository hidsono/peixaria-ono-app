"use client";

import { useState, useRef } from "react";
import { createLanding } from "../actions";

export default function LandingForm({ fishermen }: { fishermen: any[] }) {
    const [fishermanId, setFishermanId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [species, setSpecies] = useState("");
    const [weight, setWeight] = useState("");
    const [lastEntry, setLastEntry] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    async function handleSubmit(formData: FormData) {
        setIsSaving(true);
        const fisherman = fishermen.find(f => f.id === fishermanId);

        await createLanding(formData);

        setLastEntry({
            fishermanName: fisherman?.name,
            boatName: fisherman?.boat_name,
            species,
            weight,
            date
        });

        setSpecies(""); // Limpa espécie
        setWeight("");  // Limpa peso
        setIsSaving(false);

        // Foca o campo de espécie para a próxima entrada
        const speciesInput = formRef.current?.querySelector('input[name="species"]') as HTMLInputElement;
        speciesInput?.focus();
    }

    const handlePrint = () => {
        window.print();
    };

    const TicketContent = ({ title }: { title: string }) => (
        <div className="print-receipt" style={{ padding: '10px 0', borderBottom: '2px solid #000', fontFamily: 'monospace' }}>
            <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: 0 }}>PEIXARIA ONO</h3>
                <p style={{ fontSize: '10px', margin: 0 }}>Ticket de Entrada - {title}</p>
            </div>
            <div style={{ margin: '10px 0', fontSize: '12px' }}>
                <p style={{ margin: '2px 0' }}><strong>Pescador:</strong> {lastEntry.fishermanName}</p>
                <p style={{ margin: '2px 0' }}><strong>Barco:</strong> {lastEntry.boatName || "-"}</p>
                <p style={{ margin: '2px 0' }}><strong>Data:</strong> {new Date(lastEntry.date).toLocaleDateString()}</p>
            </div>
            <table style={{ width: '100%', borderTop: '2px solid #000', fontSize: '14px' }}>
                <thead>
                    <tr>
                        <th align="left">Espécie</th>
                        <th align="right">Peso</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{lastEntry.species}</td>
                        <td align="right">{lastEntry.weight} kg</td>
                    </tr>
                </tbody>
            </table>
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px' }}>
                <p>Emitido em {new Date().toLocaleString()}</p>
            </div>
        </div>
    );

    return (
        <>
            <form ref={formRef} action={handleSubmit} className="card no-print">
                {lastEntry && (
                    <div style={{ background: 'rgba(0, 255, 136, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '15px', border: '1px solid var(--success)' }}>
                        <div style={{ color: 'var(--success)', fontSize: '13px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>✓ {lastEntry.species} ({lastEntry.weight}kg) salvo!</span>
                            <button type="button" onClick={handlePrint} style={{ background: 'var(--success)', color: '#000', padding: '5px 10px', fontSize: '11px', borderRadius: '4px' }}>
                                🖨️ Imprimir Ticket
                            </button>
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label>Pescador / Barco</label>
                    <select
                        name="fishermanId"
                        value={fishermanId}
                        onChange={(e) => setFishermanId(e.target.value)}
                        required
                    >
                        <option value="">Selecione o Pescador...</option>
                        {fishermen.map(f => (
                            <option key={f.id} value={f.id}>{f.name} ({f.boat_name})</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Data</label>
                    <input
                        type="date"
                        name="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="form-group" style={{ flex: 2 }}>
                        <label>Espécie</label>
                        <input
                            type="text"
                            name="species"
                            value={species}
                            onChange={(e) => setSpecies(e.target.value)}
                            required
                            placeholder="Ex: Bagre"
                        />
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                        <label>Peso (kg)</label>
                        <input
                            type="number"
                            step="0.01"
                            name="weight_kg"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            required
                            placeholder="0,00"
                            inputMode="decimal"
                        />
                    </div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={isSaving}>
                    {isSaving ? "Salvando..." : "Salvar Espécie"}
                </button>

                <button
                    type="button"
                    onClick={() => { setFishermanId(""); setSpecies(""); setWeight(""); setLastEntry(null); }}
                    style={{ width: '100%', marginTop: '10px', background: 'transparent', border: '1px solid var(--secondary-navy)', color: 'var(--text-secondary)', padding: '8px' }}
                >
                    Limpar Tudo / Próximo Barco
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

