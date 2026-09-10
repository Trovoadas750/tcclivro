/**
 * Script de inicialização de tema (equivalente ao <script> do
 * header.php do PHP). Aplica o tema salvo no localStorage ANTES
 * da hidratação, evitando "flash" de tema errado.
 * Este arquivo NÃO é um componente React: é injetado cru no <head>.
 */
export default function ThemeScript() {
  const code = `
    (function () {
      try {
        var t = localStorage.getItem('casa_leitor_tema');
        if (t) document.documentElement.setAttribute('data-theme', t);
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}