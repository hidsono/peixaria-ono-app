"use client";

import { useState } from "react";
import UnifiedEntryForm from "./UnifiedEntryForm";
import LandingHistory from "./LandingHistory";

export default function PescariasClient({ 
    fishermen, 
    speciesSuggestions, 
    allLandings, 
    allExpenses 
}: { 
    fishermen: any[], 
    speciesSuggestions: string[], 
    allLandings: any[], 
    allExpenses: any[] 
}) {
    const [activeTab, setActiveTab] = useState<'entry' | 'history'>('entry');

    return (
        <div>
            <div className="no-print" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <button 
                    onClick={() => setActiveTab('entry')}
                    style={{ 
                        flex: 1, 
                        padding: '12px', 
                        borderRadius: '8px',
                        backgroundColor: activeTab === 'entry' ? 'var(--accent-blue)' : 'var(--secondary-navy)',
                        color: activeTab === 'entry' ? '#000' : '#fff',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    📝 Nova Entrada
                </button>
                <button 
                    onClick={() => setActiveTab('history')}
                    style={{ 
                        flex: 1, 
                        padding: '12px', 
                        borderRadius: '8px',
                        backgroundColor: activeTab === 'history' ? 'var(--accent-blue)' : 'var(--secondary-navy)',
                        color: activeTab === 'history' ? '#000' : '#fff',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer'
                    }}
                >
                    📜 Histórico / Editar
                </button>
            </div>

            {activeTab === 'entry' ? (
                <UnifiedEntryForm fishermen={fishermen} speciesSuggestions={speciesSuggestions} />
            ) : (
                <LandingHistory landings={allLandings} expenses={allExpenses} />
            )}
        </div>
    );
}
