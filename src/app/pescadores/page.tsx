export const dynamic = 'force-dynamic';
import { getFishermen, createFisherman } from "../actions";
import CertificateManager from "./CertificateManager";

export default async function Pescadores() {
    const fishermen = await getFishermen();

    return (
        <div>
            <h1>Cadastro de Pescadores</h1>

            <div className="card">
                <h2>Novo Pescador</h2>
                <form action={createFisherman}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group">
                            <label>Nome do Pescador</label>
                            <input type="text" name="name" required placeholder="Ex: João Silva" />
                        </div>
                        <div className="form-group">
                            <label>Nome do Barco</label>
                            <input type="text" name="boat_name" placeholder="Ex: Estrela do Mar" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                        <div className="form-group">
                            <label>RGP</label>
                            <input type="text" name="rgp" placeholder="Registro" />
                        </div>
                        <div className="form-group">
                            <label>CPF</label>
                            <input type="text" name="cpf" placeholder="000.000.000-00" />
                        </div>
                        <div className="form-group">
                            <label>CNPJ (Produtor)</label>
                            <input type="text" name="cnpj" placeholder="00.000.000/0000-00" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '10px' }}>
                        <div className="form-group">
                            <label>Inscrição Estadual</label>
                            <input type="text" name="inscricaoEstadual" placeholder="Isento ou Número" />
                        </div>
                        <div className="form-group">
                            <label>Telefone</label>
                            <input type="tel" name="phone" placeholder="(11) 99999-9999" />
                        </div>
                        <div className="form-group">
                            <label>Método de Pesca</label>
                            <input type="text" name="metodo" placeholder="Ex: Arrasto, Emalhe..." />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '15px' }}>Salvar Pescador</button>
                </form>
            </div>

            <h2>Lista de Pescadores ({fishermen.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                {fishermen.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Nenhum pescador cadastrado.</p>
                ) : (
                    fishermen.map((f: any) => (
                        <div key={f.id} className="card" style={{ padding: '15px', position: 'relative' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{f.name}</div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', marginTop: '8px' }}>
                                {f.boat_name && <div style={{ color: 'var(--accent-blue)', fontSize: '14px' }}>🚢 <strong>Barco:</strong> {f.boat_name}</div>}
                                {f.metodo && <div style={{ color: '#666', fontSize: '14px' }}>🎣 <strong>Método:</strong> {f.metodo}</div>}
                                {f.rgp && <div style={{ fontSize: '13px' }}>🆔 <strong>RGP:</strong> {f.rgp}</div>}
                                {f.cpf && <div style={{ fontSize: '13px' }}>📄 <strong>CPF:</strong> {f.cpf}</div>}
                                {f.cnpj && <div style={{ fontSize: '13px' }}>🏢 <strong>CNPJ:</strong> {f.cnpj}</div>}
                                {f.inscricaoEstadual && <div style={{ fontSize: '13px' }}>🏛️ <strong>IE:</strong> {f.inscricaoEstadual}</div>}
                                {f.phone && <div style={{ fontSize: '13px' }}>📞 <strong>Tel:</strong> {f.phone}</div>}
                            </div>

                            <CertificateManager 
                                fishermanId={f.id} 
                                fishermanName={f.name} 
                                existingCert={f.certificate} 
                            />

                            {f.createdBy && (
                                <div style={{
                                    color: 'var(--text-secondary)',
                                    fontSize: '10px',
                                    marginTop: '10px',
                                    fontStyle: 'italic',
                                    borderTop: '1px solid #eee',
                                    paddingTop: '5px'
                                }}>
                                    Cadastrado por: {f.createdBy.name}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

