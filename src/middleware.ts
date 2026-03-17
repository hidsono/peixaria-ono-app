import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const session = request.cookies.get('auth_session');
    const { pathname } = request.nextUrl;

    // Permitir acesso a login e registro sempre
    if (pathname === '/login' || pathname === '/register') {
        if (session) {
            return NextResponse.redirect(new URL('/pescadores', request.url));
        }
        return NextResponse.next();
    }

    // Proteger o resto do app
    if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

// Matcher ultra-estável sem regex complexas
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
