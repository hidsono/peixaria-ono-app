"use client";

import { useState } from "react";
import { updateLanding, deleteLanding } from "../actions";

export default function LandingItem({ landing }: { landing: any }) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <div className="card">
                <form action={async (formData) => {
                    await updateLanding(landing.id, formData);
                    setIsEditing(false);
                }}>
                    <div className="form-group">
                        <label>Data</label>
                        <input type="date" name="date" defaultValue={new Date(landing.date).toISOString().split('T')[0]} required />
                    </div>
                    <div className="form-group">
                        <label>Espécie</label>
                        <input type="text" name="species" defaultValue={landing.species} required />
                    </div>
                    <div className="form-group">
                        <label>Peso (kg)</label>
                        <input type="number" step="0.01" name="weight_kg" defaultValue={landing.weight_kg} required />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>Salvar</button>
                        <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, background: 'var(--secondary-navy)', color: '#fff' }}>Cancelar</button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="card" style={{ padding: '12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
                <div style={{ fontWeight: '600' }}>{landing.species}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {landing.fisherman.name} - {new Date(landing.date).toLocaleDateString('pt-BR')}
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{landing.weight_kg} kg</div>
                <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', color: 'var(--accent-blue)', fontSize: '12px' }}>Editar</button>
                <button onClick={() => {
                    if (confirm("Deseja excluir esta entrada?")) deleteLanding(landing.id);
                }} style={{ background: 'transparent', color: 'var(--danger)', fontSize: '12px' }}>Excluir</button>
            </div>
        </div>
    );
}
