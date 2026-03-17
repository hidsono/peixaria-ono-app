import { getProducts, createProduct, deleteProduct } from "../actions";
import { Package, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProductForm from "./ProductForm";

export default async function ProdutosPage() {
    const products = await getProducts();

    return (
        <div className="container overflow-y-auto" style={{ paddingBottom: "100px" }}>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/pescarias" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </Link>
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">
                        <Package className="text-emerald-400" /> Catálogo de Pescados
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulário de Cadastro (Client Component) */}
                <ProductForm action={createProduct} />

                {/* Lista de Produtos */}
                <div className="lg:col-span-2 space-y-4">
                    {products.length === 0 ? (
                        <div className="card text-center py-20 opacity-40">
                            <Package size={60} className="mx-auto mb-4" />
                            <p>Nenhum pescado cadastrado ainda.</p>
                        </div>
                    ) : (
                        products.map((product) => (
                            <div key={product.id} className="card flex items-center justify-between group hover:border-emerald-500/50 transition-all">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner">
                                        <Package size={28} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black uppercase tracking-tight italic">{product.name}</h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {product.ncm && (
                                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                                                    NCM: {product.ncm}
                                                </span>
                                            )}
                                            {product.cest && (
                                                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                                                    CEST: {product.cest}
                                                </span>
                                            )}
                                            {product.defaultPrice && (
                                                <span className="text-[10px] bg-white/5 text-slate-300 px-2 py-0.5 rounded border border-white/10 font-bold">
                                                    R$ {product.defaultPrice.toFixed(2)}/kg
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <form action={async () => {
                                        'use server'
                                        await deleteProduct(product.id)
                                    }}>
                                        <button className="p-2 text-slate-500 hover:text-rose-500 transition-colors">
                                            <Trash2 size={20} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
