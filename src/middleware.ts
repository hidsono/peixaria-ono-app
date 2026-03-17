import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
    const session = request.cookies.get('auth_session');
    const { pathname } = request.nextUrl;

    // Se estiver tentando acessar o login já logado, vai pra home
    if (session && (pathname === '/login' || pathname === '/register')) {
        return NextResponse.redirect(new URL('/pescadores', request.url));
    }

    // Se não estiver logado, redireciona para login
    if (!session && pathname !== '/login' && pathname !== '/register') {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

// Em vez de usar regex complexa que dá erro na Vercel,
// vamos listar explicitamente os caminhos que devem passar pelo Middleware.
// Rotas que NÃO estão aqui (incluindo /api e arquivos estáticos) passam livre.
export const config = {
    matcher: [
        '/',
        '/pescadores/:path*',
        '/pdv/:path*',
        '/estoque/:path*',
        '/despesas/:path*',
        '/pescarias/:path*',
        '/fiscal/:path*',
        '/produtos/:path*',
        '/configuracoes/:path*',
    ],
};
