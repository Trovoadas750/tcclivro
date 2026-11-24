/**
 * Link do CTA de vendedor, que muda conforme a conta:
 *   - deslogado ou cliente → "Tornar-se vendedor" (/vendedor/cadastro)
 *   - vendedor             → "Meu painel" (/painel-vendedor)
 * Aceita className e um ícone opcional para se encaixar em cada lugar
 * (rodapé, banner da página inicial etc.).
 */
'use client';

import Link from 'next/link';
import Icone from '@/components/Icone';
import { useTipoConta } from '@/lib/useTipoConta';

export default function CtaVendedor({ className, icone = false }) {
  const { tipo } = useTipoConta();
  const vendedor = tipo === 'vendedor';

  return (
    <Link className={className} href={vendedor ? '/painel-vendedor' : '/vendedor/cadastro'}>
      {icone && <Icone nome="livros" alt="" tam={18} />} {vendedor ? 'Meu painel' : 'Tornar-se vendedor'}
    </Link>
  );
}
