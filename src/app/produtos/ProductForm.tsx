"use client";

import { useState } from "react";
import { Plus, Hash, Tag, DollarSign, Sparkles } from "lucide-react";
import { lookupTaxInfo } from "@/lib/ncm-lookup";
import { useNotification } from "../NotificationContext";

export default function ProductForm({ action }: { action: (formData: FormData) => void }) {
    const { showToast } = useNotification();
    const [name, setName] = useState("");
    const [ncm, setNcm] = useState("");
    const [cest, setCest] = useState("");
    const [barcode, setBarcode] = useState("");
    const [price, setPrice] = useState("");

    const handleAutoFill = () => {
        if (!name) {
            showToast("Digite o nome da espécie primeiro.", "warning");
            return;
        }

        const info = lookupTaxInfo(name);
        if (info) {
            setNcm(info.ncm);
            setCest(info.cest);
            showToast(`Dados encontrados para "${name}"!`, "success");
        } else {
            showToast("Não encontramos códigos para esta espécie. Digite manualmente.", "info");
        }
    };

    const handleSubmit = (formData: FormData) => {
        // O Form do HTML as vezes não pega o state, então garantimos que os campos estão preenchidos
        action(formData);
        setName("");
        setNcm("");
        setCest("");
        setBarcode("");
        setPrice("");
    };

    return (
        <div className="card h-fit sticky top-4 border-2 border-emerald-500/30">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-emerald-400">
                <Plus size={20} /> Cadastrar Espécie
            </h2>
            <form action={handleSubmit} className="space-y-4">
                <div className="form-group">
                    <label>Nome da Espécie</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            name="name" 
                            required 
                            placeholder="Ex: Tainha" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1"
                        />
                        <button 
                            type="button" 
                            onClick={handleAutoFill}
                            className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg hover:bg-emerald-500/30 transition-all border border-emerald-500/20 flex items-center gap-1 text-[12px] font-bold"
                            title="Tentar preencher NCM e CEST sozinho"
                        >
                            <Sparkles size={16} /> <span className="hidden sm:inline">Auto</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="form-group">
                        <label className="flex items-center gap-1"><Hash size={14} /> NCM</label>
                        <input 
                            type="text" 
                            name="ncm" 
                            placeholder="0302.xxxx" 
                            value={ncm}
                            onChange={(e) => setNcm(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="flex items-center gap-1"><Tag size={14} /> CEST</label>
                        <input 
                            type="text" 
                            name="cest" 
                            placeholder="04.001.00" 
                            value={cest}
                            onChange={(e) => setCest(e.target.value)}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Código de Barras</label>
                    <input 
                        type="text" 
                        name="barcode" 
                        placeholder="EAN-13" 
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label className="flex items-center gap-1"><DollarSign size={14} /> Preço Sugerido (R$/kg)</label>
                    <input 
                        type="text" 
                        name="defaultPrice" 
                        placeholder="0,00" 
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </div>

                <button type="submit" className="btn-primary w-full h-12 text-lg">
                    Salvar no Catálogo
                </button>
            </form>
        </div>
    );
}
