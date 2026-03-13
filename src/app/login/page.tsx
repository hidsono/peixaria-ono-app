"use client";

import { useActionState } from "react";
import { login } from "../actions";
import Link from "next/link";

export default function LoginPage() {
    const [state, action, isPending] = useActionState(login, undefined);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh'
        }}>
            <img src="/logo.png" alt="Peixaria Ono" style={{ width: '120px', marginBottom: '20px' }} />
            <h1 style={{ marginBottom: '10px' }}>Acesso ao Sistema</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', textAlign: 'center' }}>
                Entre com suas credenciais para gerenciar a Peixaria Ono.
            </p>

            <form action={action} className="card" style={{ width: '100%', maxWidth: '350px' }}>
                <div className="form-group">
                    <label>Usuário</label>
                    <input type="text" name="username" required placeholder="Digite seu usuário" />
                </div>

                <div className="form-group">
                    <label>Senha</label>
                    <input type="password" name="password" required placeholder="Digite sua senha" />
                </div>

                {state && <p style={{ color: 'var(--danger)', marginBottom: '15px', fontSize: '14px' }}>{state.message || "Erro ao entrar."}</p>}

                <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%' }}
                    disabled={isPending}
                >
                    {isPending ? "Entrando..." : "Entrar"}
                </button>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                    Não tem uma conta? <Link href="/register" style={{ color: 'var(--accent-blue)' }}>Cadastre-se</Link>
                </div>
            </form>

            <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                Peixaria Ono © 2026 - Versão Cloud
            </p>
        </div>
    );
}
