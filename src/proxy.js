/**
 * Proxy do Next.js 16 (equivalente ao antigo middleware.js).
 * Roda antes de toda requisição para:
 *   1) Renovar automaticamente o token de sessão do Supabase (cookies).
 *   2) Bloquear o acesso a rotas que exigem login, redirecionando para
 *      /auth/login quando não houver sessão válida.
 */
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const ROTAS_PROTEGIDAS = ['/minha-conta', '/checkout', '/meus-pedidos'];

export async function proxy(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Não insira lógica entre createServerClient e getUser(): é essa chamada
  // que de fato renova o token. Um "return" antecipado aqui pode deslogar
  // usuários aleatoriamente.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const precisaLogin = ROTAS_PROTEGIDAS.some((rota) => request.nextUrl.pathname.startsWith(rota));
  if (precisaLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('proximo', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
