/**
 * Script de inicialização de tema (equivalente ao <script> do
 * header.php do PHP). Aplica o tema salvo no localStorage ANTES
 * da hidratação, evitando "flash" de tema errado.
 * Este arquivo NÃO é um componente React: é injetado cru no <head>.
 *
 * Valores salvos que não são temas válidos (ex.: os antigos
 * 'livro' e 'claro') caem no tema padrão.
 *
 * Como este script altera o <html> antes do React hidratar, o
 * layout usa `suppressHydrationWarning` no <html>.
 */
import { STORAGE_KEYS, TEMAS, TEMA_PADRAO } from '@/lib/config';

export default function ThemeScript() {
  const code = `
    (function () {
      try {
        var validos = ${JSON.stringify(Object.keys(TEMAS))};
        var t = localStorage.getItem(${JSON.stringify(STORAGE_KEYS.TEMA)});
        if (validos.indexOf(t) === -1) t = ${JSON.stringify(TEMA_PADRAO)};
        document.documentElement.setAttribute('data-theme', t);
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
