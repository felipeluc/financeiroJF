
function adicionarContaFixa() {
  const container = document.getElementById('contas-fixas');
  const novaLinha = document.createElement('div');
  novaLinha.className = 'linha';
  novaLinha.innerHTML = \`
    <input type="text" placeholder="Nome" />
    <input type="number" placeholder="Valor" />
  \`;
  container.appendChild(novaLinha);
}
