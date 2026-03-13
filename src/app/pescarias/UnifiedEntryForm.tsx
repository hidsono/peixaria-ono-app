"use client";

import { useState, useRef } from "react";
import { createUnifiedTicket } from "../actions";
import { useNotification } from "../NotificationContext";

export default function UnifiedEntryForm({ fishermen, speciesSuggestions = [] }: { fishermen: any[], speciesSuggestions?: string[] }) {
    const { showToast } = useNotification();
    const [fishermanId, setFishermanId] = useState("");
    const [fishermanSearch, setFishermanSearch] = useState("");
    const [showFishermanList, setShowFishermanList] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Novas sugestões aprendidas na sessão atual
    const [sessionSuggestions, setSessionSuggestions] = useState<string[]>([]);

    // Combina sugestões de forma compatível com navegadores antigos
    const combineSuggestions = () => {
        var combined = speciesSuggestions.concat(sessionSuggestions);
        var unique = [];
        for (var i = 0; i < combined.length; i++) {
            if (unique.indexOf(combined[i]) === -1) {
                unique.push(combined[i]);
            }
        }
        return unique.sort();
    };
    const allSuggestions = combineSuggestions();

    // Landings Cart
    const [landings, setLandings] = useState<{ species: string, weight_kg: number }[]>([]);
    const [tempSpecies, setTempSpecies] = useState("");
    const [tempWeight, setTempWeight] = useState("");

    // Expenses Cart
    const [expenses, setExpenses] = useState<{ category: string, amount: number, quantity?: number, notes: string }[]>([]);
    const [tempCategory, setTempCategory] = useState("Gelo");
    const [tempAmount, setTempAmount] = useState("");
    const [tempQty, setTempQty] = useState("");
    const [tempNotes, setTempNotes] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [lastTicket, setLastTicket] = useState<any>(null);
    const [isListening, setIsListening] = useState(false);

    const startVoiceCommand = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            showToast("Seu navegador não suporta comando de voz.", "error");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            showToast("Ouvindo... Fale a espécie e o peso (ex: 'Tainha dez quilos')", "info");
        };

        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript.toLowerCase();
            console.log("Voz capturada:", text);
            
            // Palavras-chave de despesas
            const expenseKeywords = ["gelo", "diesel", "rancho", "peças", "peça", "vale", "despesa", "peixe", "pescado"];
            const isExpense = expenseKeywords.some(key => text.includes(key));

            // Detector de números (melhorado para pegar "dez vírgula cinco", etc)
            const numbers = text.match(/\d+([.,]\d+)?/g);
            const value = numbers ? numbers[0].replace(',', '.') : "";

            if (isExpense) {
                // Tenta achar qual categoria
                if (text.includes("gelo")) setTempCategory("Gelo");
                else if (text.includes("diesel")) setTempCategory("Diesel");
                else if (text.includes("rancho")) setTempCategory("Rancho");
                else if (text.includes("vale")) setTempCategory("Vale");
                else if (text.includes("peça")) setTempCategory("Pecas");
                else if (text.includes("peixe") || text.includes("pescado")) setTempCategory("Pescado");

                if (value) {
                    setTempAmount(value);
                    showToast(`Despesa: ${value} em ${text.split(' ')[0]}`, "success");
                }
            } else {
                // Lógica de Pescados
                let species = text
                    .replace(numbers ? numbers[0] : "", "")
                    .replace(/quilos?|kg|de/g, "")
                    .trim();

                if (species) {
                    species = species.charAt(0).toUpperCase() + species.slice(1);
                    setTempSpecies(species);
                }
                if (value) {
                    setTempWeight(value);
                }

                if (species && value) {
                    showToast(`Pescado: ${species} - ${value}kg`, "success");
                }
            }
        };

        recognition.onerror = () => {
            setIsListening(false);
            showToast("Erro ao capturar voz.", "error");
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };


    const addLanding = (e?: any) => {
        if (e && e.preventDefault) e.preventDefault();
        
        var species = (tempSpecies || "").trim();
        var weightRaw = (tempWeight || "").trim().replace(',', '.');

        if (species === "") {
            showToast("⚠️ Digite a espécie", "warning");
            return;
        }
        if (weightRaw === "" || isNaN(parseFloat(weightRaw))) {
            showToast("⚠️ Digite um peso válido", "warning");
            return;
        }

        var newLanding = { species: species, weight_kg: parseFloat(weightRaw) };
        setLandings(landings.concat([newLanding]));
        
        var found = false;
        for (var i = 0; i < allSuggestions.length; i++) {
            if (allSuggestions[i] === species) found = true;
        }
        if (!found) {
            setSessionSuggestions(sessionSuggestions.concat([species]));
        }

        setTempSpecies("");
        setTempWeight("");
    };

    const addExpense = (e?: any) => {
        if (e && e.preventDefault) e.preventDefault();

        var amountRaw = (tempAmount || "0").trim().replace(',', '.');
        
        // Se for pescado, a espécie é obrigatória
        if (tempCategory === "Pescado" && !tempNotes) {
            showToast("⚠️ Digite o nome do pescado", "warning");
            return;
        }

        var newExpense = { 
            category: tempCategory, 
            amount: parseFloat(amountRaw) || 0, 
            quantity: tempQty ? parseFloat(tempQty.replace(',', '.')) : undefined,
            notes: (tempNotes || "").trim() 
        };
        setExpenses(expenses.concat([newExpense]));
        setTempAmount("");
        setTempQty("");
        setTempNotes("");
    };

    const handleSubmit = async function() {
        if (!fishermanId) {
            showToast("Por favor, selecione um pescador.", "error");
            return;
        }

        var finalLandings = landings.concat([]);
        var finalExpenses = expenses.concat([]);

        // Tenta adicionar o que estiver nos campos temporários
        if (tempSpecies && tempWeight) {
            finalLandings.push({ species: tempSpecies, weight_kg: parseFloat(tempWeight.replace(',', '.')) });
        }
        if (tempAmount) {
            var qtyRaw = tempQty ? parseFloat(tempQty.replace(',', '.')) : undefined;
            finalExpenses.push({ category: tempCategory, amount: parseFloat(tempAmount.replace(',', '.')), quantity: qtyRaw, notes: tempNotes });
        }

        if (finalLandings.length === 0 && finalExpenses.length === 0) {
            showToast("Adicione pelo menos um pescado ou uma despesa.", "warning");
            return;
        }

        try {
            setIsSaving(true);
            
            var fisherman = null;
            for (var i = 0; i < fishermen.length; i++) {
                if (fishermen[i].id === fishermanId) {
                    fisherman = fishermen[i];
                    break;
                }
            }

            const result = await createUnifiedTicket({
                fishermanId: fishermanId,
                date: date,
                landings: finalLandings,
                expenses: finalExpenses
            });

            if (result.success) {
                setLastTicket({
                    fishermanName: fisherman ? fisherman.name : "",
                    boatName: fisherman ? fisherman.boat_name : "",
                    date: date,
                    landings: finalLandings,
                    expenses: finalExpenses
                });

                setLandings([]);
                setExpenses([]);
                setTempSpecies("");
                setTempWeight("");
                setTempAmount("");
                setTempQty("");
                setTempNotes("");
                showToast("Ticket gerado com sucesso!", "success");
            }
        } catch (error) {
            console.error(error);
            showToast("Erro ao salvar: Verifique sua conexão.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePrint = function() {
        window.print();
    };

    const handleWhatsApp = function() {
        if (!lastTicket) return;

        var fixedNumber = "551238622922";
        var message = "*PEIXARIA ONO - TICKET DE ENTRADA*%0A";
        message += "---------------------------%0A";
        message += "*Pescador:* " + lastTicket.fishermanName + "%0A";
        message += "*Barco:* " + (lastTicket.boatName || "-") + "%0A";
        message += "*Data:* " + new Date(lastTicket.date).toLocaleDateString() + "%0A%0A";

        if (lastTicket.landings.length > 0) {
            message += "*PESCADOS:*%0A";
            for (var i = 0; i < lastTicket.landings.length; i++) {
                var l = lastTicket.landings[i];
                message += "- " + l.species + ": " + l.weight_kg.toFixed(2) + " kg%0A";
            }
            message += "%0A";
        }

        if (lastTicket.expenses.length > 0) {
            message += "*DESPESAS:*%0A";
            for (var j = 0; j < lastTicket.expenses.length; j++) {
                var e = lastTicket.expenses[j];
                var qtyStr = e.quantity ? " (" + e.quantity + " kg)" : "";
                message += "- " + e.category + (e.notes ? " [" + e.notes + "]" : "") + qtyStr + ": R$ " + e.amount.toFixed(2) + "%0A";
            }
        }

        message += "%0A_Enviado via Sistema Peixaria Ono_";

        var whatsappUrl = "https://wa.me/" + fixedNumber + "?text=" + message;
        window.open(whatsappUrl, '_blank');
    };

    const TicketContent = function(props: { title: string }) {
        var fisherman = null;
        for (var i = 0; i < fishermen.length; i++) {
            if (fishermen[i].id === fishermanId) {
                fisherman = fishermen[i];
                break;
            }
        }
        var title = props.title;
        return (
            <div className="print-receipt" style={{ padding: '5mm 0', borderBottom: '2px solid #000', fontFamily: 'monospace' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ margin: 0 }}>PEIXARIA ONO</h2>
                    <p style={{ fontSize: '12px', margin: '2mm 0' }}>Ticket de Entrada - {title}</p>
                </div>
                <div style={{ margin: '3mm 0', borderTop: '2px solid #000', borderBottom: '2px solid #000', padding: '2mm 0', fontSize: '12px' }}>
                    <p><strong>Pescador:</strong> {lastTicket.fishermanName}</p>
                    <p><strong>Barco:</strong> {lastTicket.boatName || "-"}</p>
                    {fisherman && (
                        <div style={{ fontSize: '11px' }}>
                            <p><strong>CPF:</strong> {fisherman.cpf || "-"}</p>
                            <p><strong>RGP:</strong> {fisherman.rgp || "-"}</p>
                            <p><strong>Método:</strong> {fisherman.metodo || "-"}</p>
                        </div>
                    )}
                    <p><strong>Data:</strong> {new Date(lastTicket.date).toLocaleDateString()}</p>
                </div>

                {lastTicket.landings.length > 0 && (
                    <div style={{ marginBottom: '5mm' }}>
                        <p style={{ fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: '1mm' }}>PESCADOS</p>
                        <table style={{ width: '100%', fontSize: '12px' }}>
                            <tbody>
                                {lastTicket.landings.map(function(l: any, i: number) {
                                    return (
                                        <tr key={i}>
                                            <td>{l.species}</td>
                                            <td align="right">{l.weight_kg.toFixed(2)} kg</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {lastTicket.expenses.length > 0 && (
                    <div style={{ marginBottom: '5mm' }}>
                        <p style={{ fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: '1mm' }}>DESPESAS</p>
                        <table style={{ width: '100%', fontSize: '12px' }}>
                            <tbody>
                                {lastTicket.expenses.map(function(e: any, i: number) {
                                    return (
                                        <tr key={i}>
                                            <td>
                                                <div>{e.category} {e.quantity ? `(${e.quantity} kg)` : ''}</div>
                                                {e.notes && <div style={{ fontSize: '10px', fontStyle: 'italic' }}>Obs: {e.notes}</div>}
                                            </td>
                                            <td align="right" valign="top">R$ {e.amount.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ marginTop: '10mm', textAlign: 'center', fontSize: '10px' }}>
                    <p>Assinatura: ________________________</p>
                    <p style={{ marginTop: '5mm' }}>Emitido em {new Date().toLocaleString()}</p>
                </div>
            </div>
        );
    };

    return (
        <>
            <datalist id="species-list">
                {allSuggestions.map((s) => (
                    <option key={s} value={s} />
                ))}
            </datalist>

            <div className="no-print">
                <div className="card" style={{ border: '2px solid #00d4ff', backgroundColor: '#112240' }}>
                    <div style={{ marginBottom: '15px' }}>
                        <h2 style={{ margin: 0 }}>Novo Ticket</h2>
                    </div>
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label>Pescador / Barco</label>
                        <input 
                            type="text" 
                            placeholder="Pesquisar pescador ou barco..."
                            value={fishermen.find(f => f.id === fishermanId)?.name || fishermanSearch}
                            onChange={(e) => {
                                setFishermanSearch(e.target.value);
                                if (fishermanId) setFishermanId(""); // Clear selection if typing
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
                                {fishermen.filter(f => 
                                    f.name.toLowerCase().includes(fishermanSearch.toLowerCase()) || 
                                    (f.boat_name && f.boat_name.toLowerCase().includes(fishermanSearch.toLowerCase()))
                                ).length === 0 && (
                                    <div style={{ padding: '10px', color: '#8892b0' }}>Nenhum pescador encontrado</div>
                                )}
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
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ width: '100%', height: '45px' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                        <button 
                            type="button"
                            onClick={startVoiceCommand}
                            style={{ 
                                backgroundColor: isListening ? '#ff4d4d' : '#00d4ff', 
                                color: isListening ? '#fff' : '#000',
                                padding: '12px 24px',
                                borderRadius: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                fontWeight: 'bold',
                                border: 'none',
                                animation: isListening ? 'pulse 1.5s infinite' : 'none',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                            }}
                        >
                            <span style={{ fontSize: '20px' }}>{isListening ? '🛑' : '🎤'}</span>
                            {isListening ? 'Parar de Ouvir' : 'Lançar por Voz'}
                        </button>
                    </div>

                    <style jsx>{`
                        @keyframes pulse {
                            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.7); }
                            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(255, 77, 77, 0); }
                            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 77, 77, 0); }
                        }
                    `}</style>

                    <div style={{ borderTop: '1px solid #333', paddingTop: '15px', marginTop: '15px' }}>
                        <h3 style={{ fontSize: '16px', color: '#00d4ff', marginBottom: '10px' }}>🎣 Adicionar Pescados</h3>
                        <div style={{ width: '100%' }}>
                            <input
                                type="text"
                                placeholder="Espécie"
                                value={tempSpecies}
                                onChange={(e) => setTempSpecies(e.target.value || "")}
                                style={{ width: '50%', height: '50px', float: 'left', marginRight: '5px' }}
                                list="species-list"
                            />
                            <input
                                type="text"
                                placeholder="kg"
                                value={tempWeight}
                                onChange={(e) => setTempWeight((e.target.value || "").replace(',', '.'))}
                                style={{ width: '20%', height: '50px', float: 'left', marginRight: '5px' }}
                            />
                            <button
                                type="button"
                                onClick={addLanding}
                                style={{
                                    width: '20%',
                                    background: '#00d4ff',
                                    color: '#000',
                                    height: '50px',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    float: 'left'
                                }}
                            >
                                +
                            </button>
                            <div style={{ clear: 'both' }}></div>
                        </div>
                        {landings.length > 0 && (
                            <div style={{ marginTop: '10px', backgroundColor: '#1a365d', padding: '10px', borderRadius: '5px' }}>
                                {landings.map(function(l, i) {
                                    return (
                                        <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>
                                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff' }}>{l.species}</span>
                                            <span style={{ float: 'right', color: '#00d4ff', fontWeight: 'bold' }}>
                                                {l.weight_kg} kg 
                                                <button onClick={function() { setLandings(landings.filter(function(_, idx) { return idx !== i; })) }} style={{ color: 'red', background: 'transparent', marginLeft: '10px', border: 'none', fontSize: '18px', fontWeight: 'bold' }}>×</button>
                                            </span>
                                            <div style={{ clear: 'both' }}></div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div style={{ borderTop: '1px solid #333', paddingTop: '15px', marginTop: '15px' }}>
                        <h3 style={{ fontSize: '16px', color: '#ff4d4d', marginBottom: '10px' }}>💸 Adicionar Despesas</h3>
                        <div style={{ width: '100%' }}>
                            <select value={tempCategory} onChange={(e) => setTempCategory(e.target.value)} style={{ width: '30%', height: '50px', float: 'left', marginRight: '5px' }}>
                                <option value="Gelo">Gelo</option>
                                <option value="Diesel">Diesel</option>
                                <option value="Rancho">Rancho</option>
                                <option value="Pecas">Peças</option>
                                <option value="Vale">Vale</option>
                                <option value="Pescado">Pescado</option>
                            </select>

                            {tempCategory === "Pescado" ? (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Qual Peixe?"
                                        value={tempNotes}
                                        onChange={(e) => setTempNotes(e.target.value)}
                                        style={{ width: '35%', height: '50px', float: 'left', marginRight: '5px' }}
                                        list="species-list"
                                    />
                                    <input
                                        type="text"
                                        placeholder="kg"
                                        value={tempQty}
                                        onChange={(e) => setTempQty((e.target.value || "").replace(',', '.'))}
                                        style={{ width: '15%', height: '50px', float: 'left', marginRight: '5px' }}
                                    />
                                </>
                            ) : (
                                <>
                                    <input
                                        type="text"
                                        placeholder="R$"
                                        value={tempAmount}
                                        onChange={(e) => setTempAmount((e.target.value || "").replace(',', '.'))}
                                        style={{ width: '25%', height: '50px', float: 'left', marginRight: '5px' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Qtd"
                                        value={tempQty}
                                        onChange={(e) => setTempQty((e.target.value || "").replace(',', '.'))}
                                        style={{ width: '20%', height: '50px', float: 'left', marginRight: '5px' }}
                                    />
                                </>
                            )}

                            <button
                                type="button"
                                onClick={addExpense}
                                style={{
                                    width: '15%',
                                    background: '#ff4d4d',
                                    color: '#fff',
                                    height: '50px',
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    float: 'left'
                                }}
                            >
                                +
                            </button>
                            <div style={{ clear: 'both' }}></div>
                        </div>
                        {tempCategory !== "Pescado" && (
                            <input
                                type="text"
                                placeholder="Observação da despesa (ex: 10 barras)"
                                value={tempNotes}
                                onChange={(e) => setTempNotes(e.target.value)}
                                style={{ width: '100%', marginTop: '8px', height: '40px' }}
                            />
                        )}
                        {expenses.length > 0 && (
                            <div style={{ marginTop: '10px', fontSize: '14px' }}>
                                {expenses.map(function(e, i) {
                                    return (
                                        <div key={i} style={{ borderBottom: '1px solid #333', padding: '8px 0' }}>
                                            <div style={{ width: '100%' }}>
                                                <span style={{ fontWeight: 'bold' }}>{e.category} {e.quantity ? `(${e.quantity} kg)` : ''}</span>
                                                <span style={{ float: 'right' }}>
                                                    R$ {e.amount.toFixed(2)} 
                                                    <button onClick={function() { setExpenses(expenses.filter(function(_, idx) { return idx !== i; })) }} style={{ color: 'red', background: 'transparent', marginLeft: '10px', border: 'none', cursor: 'pointer' }}>×</button>
                                                </span>
                                                <div style={{ clear: 'both' }}></div>
                                            </div>
                                            {e.notes && <div style={{ fontSize: '11px', color: '#8892b0', fontStyle: 'italic' }}>Obs: {e.notes}</div>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="btn-primary"
                        style={{ width: '100%', marginTop: '25px', height: '50px', fontSize: '18px' }}
                        disabled={isSaving || !fishermanId}
                    >
                        {isSaving ? "Salvando..." : "Finalizar e Gerar Ticket"}
                    </button>
                </div>


                {lastTicket && (
                    <div className="card" style={{ background: 'var(--success)', color: '#000', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '10px' }}>✓ Ticket Gerado com Sucesso!</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button onClick={handlePrint} style={{ width: '100%', padding: '15px', fontSize: '16px', fontWeight: 'bold', background: '#000', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                🖨️ IMPRIMIR TICKET (2 VIAS)
                            </button>

                            <button onClick={handleWhatsApp} style={{ width: '100%', padding: '15px', fontSize: '16px', fontWeight: 'bold', background: '#25D366', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                                📱 ENVIAR WHATSAPP (PEIXARIA)
                            </button>
                        </div>

                        <button onClick={() => setLastTicket(null)} style={{ marginTop: '15px', background: 'transparent', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: '#000' }}>
                            Fechar
                        </button>
                    </div>
                )}

            </div>

            {lastTicket && (
                <div className="print-only">
                    <TicketContent title="VIA DO PESCADOR" />
                    <div style={{ height: '30px', borderBottom: '2px dashed #000', margin: '20px 0' }}></div>
                    <TicketContent title="VIA DA PEIXARIA" />
                </div>
            )}
        </>
    );
}
