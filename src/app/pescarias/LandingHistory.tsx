"use client";

import { useState } from "react";
import LandingItem from "./LandingItem";
import ExpenseItem from "../despesas/ExpenseItem";

export default function LandingHistory({ landings, expenses }: { landings: any[], expenses: any[] }) {
    const [search, setSearch] = useState("");

    const combined = [
        ...landings.map(l => ({ ...l, type: 'landing' })),
        ...expenses.map(e => ({ ...e, type: 'expense' }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filtered = combined.filter(item => {
        const searchText = search.toLowerCase();
        const fishermanName = item.fisherman?.name?.toLowerCase() || "";
        const boatName = item.fisherman?.boat_name?.toLowerCase() || "";
        
        if (item.type === 'landing') {
            const species = (item as any).species.toLowerCase();
            return fishermanName.includes(searchText) || boatName.includes(searchText) || species.includes(searchText);
        } else {
            const category = (item as any).category.toLowerCase();
            const notes = (item as any).notes?.toLowerCase() || "";
            return fishermanName.includes(searchText) || boatName.includes(searchText) || category.includes(searchText) || notes.includes(searchText);
        }
    });

    return (
        <div>
            <div className="form-group" style={{ marginBottom: '20px' }}>
                <input 
                    type="text" 
                    placeholder="Pesquisar por pescador, barco, espécie ou categoria..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '100%', height: '45px', padding: '10px' }}
                />
            </div>

            {filtered.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Nenhum registro encontrado.</p>
            ) : (
                filtered.map((item) => (
                    <div key={item.id}>
                        {item.type === 'landing' ? (
                            <LandingItem landing={item} />
                        ) : (
                            <ExpenseItem expense={item} />
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
