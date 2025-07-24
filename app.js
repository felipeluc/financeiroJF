// Importações
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBFImw6Px0VKLiSVba8L-9PdjLPIU_HmSM",
  authDomain: "financeiro-409db.firebaseapp.com",
  projectId: "financeiro-409db",
  storageBucket: "financeiro-409db.firebasestorage.app",
  messagingSenderId: "124692561019",
  appId: "1:124692561019:web:ceb10e49cf667d61f3b6de"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Usuários e senhas fixos (também podem estar no Firestore depois)
const usuarios = {
  "João": "joao1234",
  "Felipe": "felipe1515",
  "Iamilis": "iamillis1234",
  "Ana Beatriz": "bia1234"
};

let usuarioAtual = null;

// Função de login
window.login = async function () {
  const nome = document.getElementById("user-select").value;
  const senha = document.getElementById("password").value;

  if (usuarios[nome] === senha) {
    usuarioAtual = nome;

    // Checa se já existe dados no Firestore
    const docRef = doc(db, "usuarios", nome);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Cria documento inicial se não existir
      await setDoc(docRef, {
        salario: 0,
        guardar: 0,
        fixos: [],
        variaveis: [],
        cartao: {
          limite: 0,
          faturaAtual: 0,
          fixos: [],
          outros: []
        },
        planejamento: []
      });
    }

    document.getElementById("login-container").style.display = "none";
    document.getElementById("main-app").style.display = "block";

    // Carrega dados do Firestore
    carregarDadosUsuario(nome);
  } else {
    alert("Usuário ou senha incorretos!");
  }
};

// Função para carregar os dados do Firestore ao fazer login
async function carregarDadosUsuario(nome) {
  const docRef = doc(db, "usuarios", nome);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const dados = docSnap.data();

    // Preencher os campos com dados do usuário
    document.getElementById("salario").value = dados.salario || "";
    document.getElementById("guardar").value = dados.guardar || "";

    // Gastos fixos
    dados.fixos.forEach(item => {
      addGastoFixo(item.nome, item.valor);
    });

    // Gastos variáveis
    dados.variaveis.forEach(item => {
      addGastoVariavel(item.desc, item.valor, item.categoria);
    });

    calcularResumo();
  }
}
// Containers
const listaFixos = document.getElementById("lista-fixos");
const listaVariaveis = document.getElementById("lista-variaveis");

// Adicionar gasto fixo
window.addGastoFixo = function (nome = "", valor = 0) {
  const div = document.createElement("div");
  div.classList.add("item");
  div.innerHTML = `
    <input type="text" value="${nome}" placeholder="Nome da conta" class="fixo-nome"/>
    <input type="number" value="${valor}" placeholder="Valor" class="fixo-valor"/>
  `;
  listaFixos.appendChild(div);

  div.querySelector(".fixo-valor").addEventListener("input", salvarGastosFixos);
  div.querySelector(".fixo-nome").addEventListener("input", salvarGastosFixos);
};

// Salvar gastos fixos no Firestore
async function salvarGastosFixos() {
  const fixos = Array.from(listaFixos.querySelectorAll(".item")).map(item => {
    return {
      nome: item.querySelector(".fixo-nome").value,
      valor: parseFloat(item.querySelector(".fixo-valor").value) || 0
    };
  });

  await updateDoc(doc(db, "usuarios", usuarioAtual), {
    fixos: fixos
  });

  calcularResumo();
}

// Adicionar gasto variável
window.addGastoVariavel = function (desc = "", valor = 0, categoria = "Alimentação") {
  const div = document.createElement("div");
  div.classList.add("item");
  div.innerHTML = `
    <input type="text" value="${desc}" placeholder="Descrição" class="var-desc"/>
    <input type="number" value="${valor}" placeholder="Valor" class="var-valor"/>
    <select class="var-cat">
      <option ${categoria === "Alimentação" ? "selected" : ""}>Alimentação</option>
      <option ${categoria === "Transporte" ? "selected" : ""}>Transporte</option>
      <option ${categoria === "Lazer" ? "selected" : ""}>Lazer</option>
      <option ${categoria === "Compras" ? "selected" : ""}>Compras</option>
      <option ${categoria === "Contas" ? "selected" : ""}>Contas</option>
    </select>
  `;
  listaVariaveis.appendChild(div);

  div.querySelector(".var-desc").addEventListener("input", salvarGastosVariaveis);
  div.querySelector(".var-valor").addEventListener("input", salvarGastosVariaveis);
  div.querySelector(".var-cat").addEventListener("change", salvarGastosVariaveis);
};

// Salvar gastos variáveis no Firestore
async function salvarGastosVariaveis() {
  const variaveis = Array.from(listaVariaveis.querySelectorAll(".item")).map(item => {
    return {
      desc: item.querySelector(".var-desc").value,
      valor: parseFloat(item.querySelector(".var-valor").value) || 0,
      categoria: item.querySelector(".var-cat").value
    };
  });

  await updateDoc(doc(db, "usuarios", usuarioAtual), {
    variaveis: variaveis
  });

  calcularResumo();
}

// Cálculo total de resumo (dinheiro disponível, guardar, etc.)
window.calcularResumo = async function () {
  const salario = parseFloat(document.getElementById("salario").value) || 0;
  const guardar = parseFloat(document.getElementById("guardar").value) || 0;

  let total = 0;

  listaFixos.querySelectorAll(".item").forEach(item => {
    const val = parseFloat(item.querySelector(".fixo-valor").value) || 0;
    total += val;
  });

  listaVariaveis.querySelectorAll(".item").forEach(item => {
    const val = parseFloat(item.querySelector(".var-valor").value) || 0;
    total += val;
  });

  const disponivel = salario - total - guardar;

  document.getElementById("total-gastos").textContent = "R$ " + total.toFixed(2).replace(".", ",");
  document.getElementById("disponivel").textContent = "R$ " + disponivel.toFixed(2).replace(".", ",");
  document.getElementById("guardado").textContent = "R$ " + guardar.toFixed(2).replace(".", ",");

  // Atualizar salário e guardar também no Firebase
  await updateDoc(doc(db, "usuarios", usuarioAtual), {
    salario: salario,
    guardar: guardar
  });
};

// Salvar mudanças imediatas nos campos salário / guardar
document.getElementById("salario").addEventListener("input", calcularResumo);
document.getElementById("guardar").addEventListener("input", calcularResumo);
// Containers
const fixosCartao = document.getElementById("lista-fixos-cartao");
const outrosCartao = document.getElementById("lista-outros-cartao");

// Inputs
const limiteInput = document.getElementById("limite-cartao");
const faturaInput = document.getElementById("fatura-atual");

// Atualiza valores digitados de limite e fatura no Firebase
limiteInput.addEventListener("input", salvarCartao);
faturaInput.addEventListener("input", salvarCartao);

// Adiciona gasto fixo no cartão
window.addCartaoFixo = function (desc = "", valor = 0) {
  const div = document.createElement("div");
  div.classList.add("item");
  div.innerHTML = `
    <input type="text" value="${desc}" placeholder="Descrição" class="cartao-desc" />
    <input type="number" value="${valor}" placeholder="Valor" class="cartao-valor" />
  `;
  fixosCartao.appendChild(div);

  div.querySelector(".cartao-desc").addEventListener("input", salvarCartao);
  div.querySelector(".cartao-valor").addEventListener("input", salvarCartao);
};

// Adiciona gasto de outra pessoa no cartão
window.addCartaoOutros = function (nome = "", valor = 0) {
  const div = document.createElement("div");
  div.classList.add("item");
  div.innerHTML = `
    <input type="text" value="${nome}" placeholder="Quem gastou" class="outro-nome" />
    <input type="number" value="${valor}" placeholder="Valor" class="outro-valor" />
  `;
  outrosCartao.appendChild(div);

  div.querySelector(".outro-nome").addEventListener("input", salvarCartao);
  div.querySelector(".outro-valor").addEventListener("input", salvarCartao);
};

// Salva os dados do cartão no Firestore
async function salvarCartao() {
  const fixos = Array.from(fixosCartao.querySelectorAll(".item")).map(item => ({
    desc: item.querySelector(".cartao-desc").value,
    valor: parseFloat(item.querySelector(".cartao-valor").value) || 0
  }));

  const outros = Array.from(outrosCartao.querySelectorAll(".item")).map(item => ({
    nome: item.querySelector(".outro-nome").value,
    valor: parseFloat(item.querySelector(".outro-valor").value) || 0
  }));

  const limite = parseFloat(limiteInput.value) || 0;
  const fatura = parseFloat(faturaInput.value) || 0;

  await updateDoc(doc(db, "usuarios", usuarioAtual), {
    cartao: {
      limite,
      faturaAtual: fatura,
      fixos,
      outros
    }
  });

  calcularCartao();
}

// Calcula e exibe totais do cartão
window.calcularCartao = function () {
  const limite = parseFloat(limiteInput.value) || 0;
  const faturaAtual = parseFloat(faturaInput.value) || 0;

  let totalVoce = 0;
  let totalOutros = 0;

  fixosCartao.querySelectorAll(".item").forEach(item => {
    const valor = parseFloat(item.querySelector(".cartao-valor").value) || 0;
    totalVoce += valor;
  });

  outrosCartao.querySelectorAll(".item").forEach(item => {
    const valor = parseFloat(item.querySelector(".outro-valor").value) || 0;
    totalOutros += valor;
  });

  const total = totalVoce + totalOutros;
  const disponivel = limite - total;

  document.getElementById("gasto-voce").textContent = "R$ " + totalVoce.toFixed(2).replace('.', ',');
  document.getElementById("total-fatura").textContent = "R$ " + (faturaAtual + total).toFixed(2).replace('.', ',');
  document.getElementById("outros-devem").textContent = "R$ " + totalOutros.toFixed(2).replace('.', ',');
  document.getElementById("disponivel-cartao").textContent = "R$ " + disponivel.toFixed(2).replace('.', ',');
};

// Carregar dados do cartão (com base no Firestore)
function preencherCartao(cartao) {
  limiteInput.value = cartao.limite || 0;
  faturaInput.value = cartao.faturaAtual || 0;

  (cartao.fixos || []).forEach(g => addCartaoFixo(g.desc, g.valor));
  (cartao.outros || []).forEach(g => addCartaoOutros(g.nome, g.valor));

  calcularCartao();
}

// Chamar essa função dentro de `carregarDadosUsuario`:
async function carregarDadosUsuario(nome) {
  const docRef = doc(db, "usuarios", nome);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const dados = docSnap.data();

    document.getElementById("salario").value = dados.salario || "";
    document.getElementById("guardar").value = dados.guardar || "";

    dados.fixos.forEach(item => addGastoFixo(item.nome, item.valor));
    dados.variaveis.forEach(item => addGastoVariavel(item.desc, item.valor, item.categoria));

    preencherCartao(dados.cartao || {});
    calcularResumo();
  }
}
const mesesLista = document.getElementById("lista-meses");

// Adiciona visualmente um mês planejado
window.addMesPlanejado = function (nomeMes = "", salario = 0, gastos = []) {
  const div = document.createElement("div");
  div.classList.add("mes-planejado");

  div.innerHTML = `
    <input type="text" value="${nomeMes}" placeholder="Ex: Agosto/2025" class="nome-mes" />
    <input type="number" value="${salario}" placeholder="Salário esperado" class="salario-planejado" />
    <div class="gastos-planejados">
      ${(gastos || []).map(g => `
        <div class="item-gasto">
          <input type="text" value="${g.categoria}" placeholder="Categoria" class="categoria-gasto" />
          <input type="number" value="${g.valor}" placeholder="Valor" class="valor-gasto" />
        </div>`).join("")}
    </div>
    <button class="add-gasto-mes">+ Gasto</button>
  `;

  mesesLista.appendChild(div);

  div.querySelector(".add-gasto-mes").addEventListener("click", () => {
    const cont = div.querySelector(".gastos-planejados");
    const item = document.createElement("div");
    item.classList.add("item-gasto");
    item.innerHTML = `
      <input type="text" placeholder="Categoria" class="categoria-gasto" />
      <input type="number" placeholder="Valor" class="valor-gasto" />
    `;
    cont.appendChild(item);

    item.querySelectorAll("input").forEach(inp => inp.addEventListener("input", salvarMeses));
  });

  div.querySelectorAll("input").forEach(inp => {
    inp.addEventListener("input", salvarMeses);
  });
};

// Salva todos os meses planejados no Firestore
async function salvarMeses() {
  const todos = Array.from(mesesLista.querySelectorAll(".mes-planejado")).map(mesDiv => {
    const nomeMes = mesDiv.querySelector(".nome-mes").value;
    const salario = parseFloat(mesDiv.querySelector(".salario-planejado").value) || 0;

    const gastos = Array.from(mesDiv.querySelectorAll(".item-gasto")).map(gasto => ({
      categoria: gasto.querySelector(".categoria-gasto").value,
      valor: parseFloat(gasto.querySelector(".valor-gasto").value) || 0
    }));

    return { nomeMes, salario, gastos };
  });

  await updateDoc(doc(db, "usuarios", usuarioAtual), {
    mesesPlanejados: todos
  });
}

// Preenche interface com meses do Firestore
function preencherMeses(meses) {
  mesesLista.innerHTML = "";
  (meses || []).forEach(m => addMesPlanejado(m.nomeMes, m.salario, m.gastos));
}

// 🔁 ATUALIZA carregarDadosUsuario para incluir planejamento de meses
async function carregarDadosUsuario(nome) {
  const docSnap = await getDoc(doc(db, "usuarios", nome));
  if (docSnap.exists()) {
    const dados = docSnap.data();

    // Preencher Meu Dinheiro
    document.getElementById("valorTotal").value = dados.valorTotal || 0;
    document.getElementById("valorDisponivel").value = dados.valorDisponivel || 0;
    preencherContasFixas(dados.contasFixas || []);
    preencherGastosLivres(dados.gastos || []);

    // Preencher Meu Cartão
    document.getElementById("limiteCartao").value = dados.limiteCartao || 0;
    preencherGastosCartao(dados.gastosCartao || []);

    // Preencher Próximos Meses ✅
    preencherMeses(dados.mesesPlanejados || []);
  }
}
// Mapeamento das seções e botões
const paginas = {
  dinheiro: document.getElementById("pagina-dinheiro"),
  cartao: document.getElementById("pagina-cartao"),
  meses: document.getElementById("pagina-meses"),
};

const botoes = {
  dinheiro: document.getElementById("btn-dinheiro"),
  cartao: document.getElementById("btn-cartao"),
  meses: document.getElementById("btn-meses"),
};

// Função para exibir uma única aba por vez
function mostrarPagina(nome) {
  for (let chave in paginas) {
    paginas[chave].style.display = chave === nome ? "block" : "none";
  }

  for (let chave in botoes) {
    if (botoes[chave]) {
      botoes[chave].classList.toggle("ativo", chave === nome); // opcional: destaca aba ativa
    }
  }
}

// Adiciona eventos aos botões de navegação
botoes.dinheiro?.addEventListener("click", () => mostrarPagina("dinheiro"));
botoes.cartao?.addEventListener("click", () => mostrarPagina("cartao"));
botoes.meses?.addEventListener("click", () => mostrarPagina("meses"));

// Exibe aba inicial padrão ao carregar
mostrarPagina("dinheiro");
<form id="login-form">
  <select id="login-usuario">
    <option value="joao@financeiro.com">João</option>
    <option value="felipe@financeiro.com">Felipe</option>
    <option value="iamilis@financeiro.com">Iamilis</option>
    <option value="bia@financeiro.com">Ana Beatriz</option>
  </select>
  <input type="password" id="login-senha" placeholder="Senha" />
  <button type="submit">Entrar</button>
</form>
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app);

// Listener do formulário de login
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("login-usuario").value;
  const senha = document.getElementById("login-senha").value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    // Verifica se já existe um documento com os dados do usuário
    const userDocRef = doc(db, "usuarios", user.uid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      // Cria estrutura inicial do usuário
      await setDoc(userDocRef, {
        salario: 0,
        guardar: 0,
        gastosFixos: [],
        gastosVariaveis: [],
        cartao: {
          limite: 0,
          fatura: 0,
          fixos: [],
          outros: []
        },
        planejamento: {}
      });
    }

    // Salva ID do usuário logado e inicia app
    localStorage.setItem("uid", user.uid);
    iniciarApp(user.uid);
  } catch (error) {
    alert("Login inválido. Verifique o e-mail e senha.");
    console.error(error);
  }
});
async function iniciarApp(uid) {
  const docRef = doc(db, "usuarios", uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const dados = docSnap.data();

    // Preencher salário
    document.getElementById("input-salario").value = dados.salario || "";

    // Contas fixas
    const containerFixas = document.getElementById("lista-contas-fixas");
    containerFixas.innerHTML = "";
    (dados.contasFixas || []).forEach(conta => {
      const div = document.createElement("div");
      div.innerHTML = `${conta.nome}: R$ ${conta.valor.toFixed(2)}`;
      containerFixas.appendChild(div);
    });

    // Gastos variáveis
    const containerVariaveis = document.getElementById("lista-gastos-variaveis");
    containerVariaveis.innerHTML = "";
    (dados.gastosVariaveis || []).forEach(gasto => {
      const div = document.createElement("div");
      div.innerHTML = `${gasto.descricao} (${gasto.categoria}): R$ ${gasto.valor.toFixed(2)}`;
      containerVariaveis.appendChild(div);
    });

    // Quanto quer guardar
    document.getElementById("input-guardar").value = dados.querGuardar || "";

    // Cartão
    document.getElementById("input-cartao-pode-gastar").value = dados.cartao?.podeGastar || "";
    document.getElementById("input-cartao-fatura").value = dados.cartao?.faturaAtual || "";

    const containerCartaoFixos = document.getElementById("lista-cartao-fixos");
    containerCartaoFixos.innerHTML = "";
    (dados.cartao?.fixos || []).forEach(gasto => {
      const div = document.createElement("div");
      div.innerHTML = `${gasto.nome}: R$ ${gasto.valor.toFixed(2)}`;
      containerCartaoFixos.appendChild(div);
    });

    const containerCartaoOutros = document.getElementById("lista-cartao-outros");
    containerCartaoOutros.innerHTML = "";
    (dados.cartao?.outros || []).forEach(gasto => {
      const div = document.createElement("div");
      div.innerHTML = `${gasto.nome}: R$ ${gasto.valor.toFixed(2)}`;
      containerCartaoOutros.appendChild(div);
    });

    // Planejamento dos meses
    const mesesContainer = document.getElementById("lista-planejamento");
    mesesContainer.innerHTML = "";
    (dados.planejamento || []).forEach((mes, index) => {
      const div = document.createElement("div");
      div.innerHTML = `<strong>${mes.nome}</strong>: Salário estimado R$ ${mes.salario || 0}, Fixos: R$ ${mes.gastosFixos || 0}, Saldo previsto: R$ ${mes.saldo || 0}`;
      mesesContainer.appendChild(div);
    });

    // Atualizar totais visuais
    atualizarTotais();

    // Mostrar conteúdo e esconder login
    document.getElementById("tela-login").style.display = "none";
    document.getElementById("tela-app").style.display = "block";

  } else {
    alert("Dados não encontrados.");
  }
}
function atualizarTotais() {
  const salario = parseFloat(document.getElementById("input-salario").value) || 0;
  const guardar = parseFloat(document.getElementById("input-guardar").value) || 0;

  // Somar contas fixas
  let totalFixas = 0;
  const fixasDivs = document.querySelectorAll("#lista-contas-fixas div");
  fixasDivs.forEach(div => {
    const valor = parseFloat(div.textContent.split("R$")[1]) || 0;
    totalFixas += valor;
  });

  // Somar gastos variáveis
  let totalVariaveis = 0;
  const variaveisDivs = document.querySelectorAll("#lista-gastos-variaveis div");
  variaveisDivs.forEach(div => {
    const valor = parseFloat(div.textContent.split("R$")[1]) || 0;
    totalVariaveis += valor;
  });

  // Valor disponível = salário - fixos - variáveis - guardar
  const disponivel = salario - totalFixas - totalVariaveis - guardar;

  // Exibir os totais na interface
  document.getElementById("total-fixas").textContent = `R$ ${totalFixas.toFixed(2)}`;
  document.getElementById("total-variaveis").textContent = `R$ ${totalVariaveis.toFixed(2)}`;
  document.getElementById("total-disponivel").textContent = `R$ ${disponivel.toFixed(2)}`;

  // Cartão - soma fixos + outros
  let totalCartao = 0;
  const cartaoDivs = document.querySelectorAll("#lista-cartao-fixos div, #lista-cartao-outros div");
  cartaoDivs.forEach(div => {
    const valor = parseFloat(div.textContent.split("R$")[1]) || 0;
    totalCartao += valor;
  });
  document.getElementById("total-cartao").textContent = `R$ ${totalCartao.toFixed(2)}`;
}
function configurarAutoSalvar(uid) {
  const inputSalario = document.getElementById("input-salario");
  const inputGuardar = document.getElementById("input-guardar");

  inputSalario.addEventListener("change", () => {
    salvarSalario(uid, parseFloat(inputSalario.value) || 0);
    atualizarTotais();
  });

  inputGuardar.addEventListener("change", () => {
    salvarGuardar(uid, parseFloat(inputGuardar.value) || 0);
    atualizarTotais();
  });

  // Botão adicionar conta fixa
  document.getElementById("btn-add-fixa").addEventListener("click", () => {
    const nome = prompt("Nome da conta fixa:");
    const valor = parseFloat(prompt("Valor (R$):")) || 0;
    if (nome && valor > 0) {
      adicionarContaFixa(uid, nome, valor);
    }
  });

  // Botão adicionar gasto variável
  document.getElementById("btn-add-variavel").addEventListener("click", () => {
    const nome = prompt("Nome do gasto:");
    const valor = parseFloat(prompt("Valor (R$):")) || 0;
    if (nome && valor > 0) {
      adicionarGastoVariavel(uid, nome, valor);
    }
  });

  // Botão adicionar gasto no cartão (fixo ou outro)
  document.getElementById("btn-add-cartao-fixo").addEventListener("click", () => {
    const nome = prompt("Nome da conta do cartão:");
    const valor = parseFloat(prompt("Valor (R$):")) || 0;
    if (nome && valor > 0) {
      adicionarCartaoFixo(uid, nome, valor);
    }
  });

  document.getElementById("btn-add-cartao-outro").addEventListener("click", () => {
    const nome = prompt("Nome do gasto:");
    const valor = parseFloat(prompt("Valor (R$):")) || 0;
    if (nome && valor > 0) {
      adicionarCartaoOutro(uid, nome, valor);
    }
  });
}
// Variável global do mês atual
let mesAtual = ""; // Ex: "2025-07"

// Função para obter o mês atual no formato "YYYY-MM"
function obterMesAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
}

// Função para mudar de mês e carregar os dados correspondentes
function mudarMes(uid, novoMes) {
  mesAtual = novoMes;
  carregarDados(uid);
}

// Função para preencher o select com todos os meses do ano atual
function preencherSelectMeses(uid) {
  const select = document.getElementById("select-mes");
  select.innerHTML = "";

  const anoAtual = new Date().getFullYear();
  const meses = [
    "01", "02", "03", "04", "05", "06",
    "07", "08", "09", "10", "11", "12"
  ];

  meses.forEach(m => {
    const option = document.createElement("option");
    const mesId = `${anoAtual}-${m}`;
    option.value = mesId;
    option.textContent = `${m}/${anoAtual}`;
    if (mesId === mesAtual) option.selected = true;
    select.appendChild(option);
  });

  select.addEventListener("change", () => {
    mudarMes(uid, select.value);
  });
}
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";  
const db = getFirestore(app);

// Função para salvar os dados no Firebase
async function salvarDados(uid, dados) {
  if (!mesAtual) mesAtual = obterMesAtual();
  const ref = doc(db, "usuarios", uid, "meses", mesAtual);
  try {
    await setDoc(ref, dados);
    console.log("Dados salvos com sucesso!");
  } catch (erro) {
    console.error("Erro ao salvar dados:", erro);
  }
}

// Função para carregar os dados do Firebase
async function carregarDados(uid) {
  if (!mesAtual) mesAtual = obterMesAtual();
  const ref = doc(db, "usuarios", uid, "meses", mesAtual);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const dados = snap.data();
      preencherCamposComDados(dados);
    } else {
      console.log("Nenhum dado encontrado para o mês:", mesAtual);
      preencherCamposComDados({}); // limpa se não houver
    }
  } catch (erro) {
    console.error("Erro ao carregar dados:", erro);
  }
}
// Coletar todos os dados da tela e retornar em um objeto
function coletarDadosDosCampos() {
  const salario = parseFloat(document.getElementById("salario").value) || 0;
  const guardar = parseFloat(document.getElementById("valorGuardar").value) || 0;
  const valorFatura = parseFloat(document.getElementById("valorFatura").value) || 0;
  const limiteCartao = parseFloat(document.getElementById("limiteCartao").value) || 0;

  const contasFixas = Array.from(document.querySelectorAll(".conta-fixa")).map(el => ({
    nome: el.querySelector(".nome-conta").value,
    valor: parseFloat(el.querySelector(".valor-conta").value) || 0,
  }));

  const gastosVariaveis = Array.from(document.querySelectorAll(".gasto-variavel")).map(el => ({
    descricao: el.querySelector(".descricao-gasto").value,
    valor: parseFloat(el.querySelector(".valor-gasto").value) || 0,
    categoria: el.querySelector(".categoria-gasto").value,
  }));

  const cartaoFixos = Array.from(document.querySelectorAll(".cartao-fixo")).map(el => ({
    nome: el.querySelector(".nome-cartao").value,
    valor: parseFloat(el.querySelector(".valor-cartao").value) || 0,
  }));

  const cartaoOutros = Array.from(document.querySelectorAll(".cartao-outro")).map(el => ({
    nome: el.querySelector(".nome-outro").value,
    valor: parseFloat(el.querySelector(".valor-outro").value) || 0,
  }));

  return {
    salario,
    guardar,
    valorFatura,
    limiteCartao,
    contasFixas,
    gastosVariaveis,
    cartaoFixos,
    cartaoOutros
  };
}
function calcularTotaisDashboard() {
  const salario = parseFloat(document.getElementById("salario").value) || 0;
  const guardar = parseFloat(document.getElementById("valorGuardar").value) || 0;

  let totalFixas = 0;
  document.querySelectorAll(".conta-fixa").forEach(el => {
    totalFixas += parseFloat(el.querySelector(".valor-conta").value) || 0;
  });

  let totalGastos = 0;
  document.querySelectorAll(".gasto-variavel").forEach(el => {
    totalGastos += parseFloat(el.querySelector(".valor-gasto").value) || 0;
  });

  const totalDisponivel = salario - guardar - totalFixas - totalGastos;

  document.getElementById("totalFixas").innerText = `R$ ${totalFixas.toFixed(2)}`;
  document.getElementById("totalGastos").innerText = `R$ ${totalGastos.toFixed(2)}`;
  document.getElementById("disponivel").innerText = `R$ ${totalDisponivel.toFixed(2)}`;
}
function calcularTotaisCartao() {
  const limite = parseFloat(document.getElementById("limiteCartao").value) || 0;

  let totalFixosCartao = 0;
  document.querySelectorAll(".cartao-fixo").forEach(el => {
    totalFixosCartao += parseFloat(el.querySelector(".valor-cartao").value) || 0;
  });

  let totalOutrosCartao = 0;
  document.querySelectorAll(".cartao-outro").forEach(el => {
    totalOutrosCartao += parseFloat(el.querySelector(".valor-outro").value) || 0;
  });

  const totalGastoCartao = totalFixosCartao + totalOutrosCartao;
  const saldoCartao = limite - totalGastoCartao;

  document.getElementById("totalCartaoFixos").innerText = `R$ ${totalFixosCartao.toFixed(2)}`;
  document.getElementById("totalCartaoOutros").innerText = `R$ ${totalOutrosCartao.toFixed(2)}`;
  document.getElementById("saldoCartao").innerText = `R$ ${saldoCartao.toFixed(2)}`;
}
async function exportarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const uid = auth.currentUser.uid;
  const userDoc = await getDoc(doc(db, "usuarios", uid));
  const data = userDoc.data();

  const gastosFixos = data.gastosFixos || [];
  const gastosVariaveis = data.gastosVariaveis || [];
  const salario = data.salario || 0;
  const valorCartao = data.valorCartao || 0;
  const limiteCartao = data.limiteCartao || 0;
  const guardar = data.valorGuardar || 0;

  let y = 10;

  doc.setFontSize(16);
  doc.text("Resumo Financeiro do Mês", 10, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Salário: R$ ${salario.toFixed(2)}`, 10, y);
  y += 10;

  doc.text(`Guardar: R$ ${guardar.toFixed(2)}`, 10, y);
  y += 10;

  doc.text("Gastos Fixos:", 10, y);
  y += 8;
  gastosFixos.forEach(g => {
    doc.text(`- ${g.nome}: R$ ${parseFloat(g.valor).toFixed(2)}`, 12, y);
    y += 7;
  });

  y += 5;
  doc.text("Gastos Variáveis:", 10, y);
  y += 8;
  gastosVariaveis.forEach(g => {
    doc.text(`- ${g.descricao} (${g.categoria}): R$ ${parseFloat(g.valor).toFixed(2)}`, 12, y);
    y += 7;
  });

  y += 5;
  doc.text("Cartão de Crédito:", 10, y);
  y += 8;
  doc.text(`- Limite: R$ ${limiteCartao.toFixed(2)}`, 12, y);
  y += 7;
  doc.text(`- Valor Atual: R$ ${valorCartao.toFixed(2)}`, 12, y);
  y += 10;

  doc.save("relatorio_financeiro.pdf");
}
async function exportarExcel() {
  const uid = auth.currentUser.uid;
  const userDoc = await getDoc(doc(db, "usuarios", uid));
  const data = userDoc.data();

  const salario = data.salario || 0;
  const guardar = data.valorGuardar || 0;
  const gastosFixos = data.gastosFixos || [];
  const gastosVariaveis = data.gastosVariaveis || [];
  const valorCartao = data.valorCartao || 0;
  const limiteCartao = data.limiteCartao || 0;

  const fixos = gastosFixos.map(g => ({ Tipo: "Fixo", Nome: g.nome, Valor: parseFloat(g.valor) }));
  const variaveis = gastosVariaveis.map(g => ({
    Tipo: "Variável",
    Nome: g.descricao,
    Categoria: g.categoria,
    Valor: parseFloat(g.valor)
  }));

  const resumo = [
    { Item: "Salário", Valor: salario },
    { Item: "Guardar", Valor: guardar },
    { Item: "Cartão - Limite", Valor: limiteCartao },
    { Item: "Cartão - Valor Atual", Valor: valorCartao }
  ];

  const wb = XLSX.utils.book_new();
  const resumoSheet = XLSX.utils.json_to_sheet(resumo);
  const fixosSheet = XLSX.utils.json_to_sheet(fixos);
  const variaveisSheet = XLSX.utils.json_to_sheet(variaveis);

  XLSX.utils.book_append_sheet(wb, resumoSheet, "Resumo");
  XLSX.utils.book_append_sheet(wb, fixosSheet, "Fixos");
  XLSX.utils.book_append_sheet(wb, variaveisSheet, "Variáveis");

  XLSX.writeFile(wb, "financeiro.xlsx");
}
