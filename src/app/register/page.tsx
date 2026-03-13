"use client";

import { useActionState } from "react";
import { register } from "../actions";
import Link from "next/link";

export default function RegisterPage() {
    const [state, action, isPending] = useActionState(register, undefined);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh'
        }}>
            <img src="/logo.png" alt="Peixaria Ono" style={{ width: '80px', marginBottom: '20px' }} />
            <h1 style={{ marginBottom: '10px' }}>Criar Conta</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', textAlign: 'center' }}>
                Cadastre-se para começar a gerenciar os romaneios.
            </p>

            <form action={action} className="card" style={{ width: '100%', maxWidth: '350px' }}>
                <div className="form-group">
                    <label>Seu Nome Completo</label>
                    <input type="text" name="name" required placeholder="Ex: Hideo Ono" />
                </div>

                <div className="form-group">
                    <label>Nome de Usuário (Para o login)</label>
                    <input type="text" name="username" required placeholder="Ex: hideo.ono" />
                </div>

                <div className="form-group">
                    <label>Senha</label>
                    <input type="password" name="password" required placeholder="Crie uma senha" />
                </div>

                {state && <p style={{ color: 'var(--danger)', marginBottom: '15px', fontSize: '14px' }}>{state.message}</p>}

                <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%' }}
                    disabled={isPending}
                >
                    {isPending ? "Cadastrando..." : "Finalizar Cadastro"}
                </button>

                <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                    Já tem uma conta? <Link href="/login" style={{ color: 'var(--accent-blue)' }}>Entrar</Link>
                </div>
            </form >
        </div >
    );
}
