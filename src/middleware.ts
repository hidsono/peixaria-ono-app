import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('auth_session');
    const { pathname } = request.nextUrl;

    // 1. Permitir acesso público a APIs e rotas de teste (Crucial para o Inngest)
    if (pathname.startsWith('/api') || pathname.startsWith('/teste-online')) {
        return NextResponse.next();
    }

    // 2. Permitir acesso à página de login e registro
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
        if (session) {
            return NextResponse.redirect(new URL('/pescadores', request.url));
        }
        return NextResponse.next();
    }

    // 3. Redirecionar para login se não houver sessão ativa
    if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - logo.png (app logo)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|logo.png).*)',
    ],
};
