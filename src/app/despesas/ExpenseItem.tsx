"use client";

import { useState } from "react";
import { updateExpense, deleteExpense } from "../actions";

export default function ExpenseItem({ expense }: { expense: any }) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <div className="card">
                <form action={async (formData) => {
                    await updateExpense(expense.id, formData);
                    setIsEditing(false);
                }}>
                    <div className="form-group">
                        <label>Data</label>
                        <input type="date" name="date" defaultValue={new Date(expense.date).toISOString().split('T')[0]} required />
                    </div>
                    <div className="form-group">
                        <label>Categoria</label>
                        <select name="category" defaultValue={expense.category} required>
                            <option value="Gelo">Gelo</option>
                            <option value="Diesel">Diesel</option>
                            <option value="Rancho">Rancho</option>
                            <option value="Pecas">Peças</option>
                            <option value="Vale">Vale</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Valor (R$)</label>
                        <input type="number" step="0.01" name="amount" defaultValue={expense.amount} required />
                    </div>
                    <div className="form-group">
                        <label>Observação</label>
                        <input type="text" name="notes" defaultValue={expense.notes || ""} />
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
                <div style={{ fontWeight: '600' }}>{expense.category}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {expense.fisherman?.name || 'Pescador não encontrado'} - {new Date(expense.date).toLocaleDateString('pt-BR')}
                    {expense.notes && <div style={{ fontStyle: 'italic' }}>{expense.notes}</div>}
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--danger)' }}>R$ {expense.amount.toFixed(2)}</div>
                <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', color: 'var(--accent-blue)', fontSize: '12px' }}>Editar</button>
                <button onClick={() => {
                    if (confirm("Deseja excluir esta despesa?")) deleteExpense(expense.id);
                }} style={{ background: 'transparent', color: 'var(--danger)', fontSize: '12px' }}>Excluir</button>
            </div>
        </div>
    );
}
