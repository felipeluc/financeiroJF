// app.js (module)
// SPA + login local + Firestore operations
import { db, doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc, updateDoc } from "./firebase.js";

/*
  Comportamento:
  - Login local (não usa Firebase Auth): apenas valida email/senha contra valores fixos.
  - Ao logar, definimos uid = 'admin_felipe_01' (ID fixo do admin).
  - Criamos documento do admin automaticamente (se não existir).
  - CRUD básico nas coleções:
      usuarios/{uid}/contas_fixas -> subcollection
      usuarios/{uid}/contas_variaveis -> subcollection
    Cartão salvo como doc em usuarios/{uid} campo cartao (merge).
*/

// credenciais locais
const LOCAL_ADMIN = {
  id: "admin_felipe_01",
  email: "felipe@admin.com",
  senha: "felipe15",
  nome: "Felipe",
  tipo: "admin"
};

// elementos UI
const loginSection = document.getElementById("login-section");
const appDiv = document.getElementById("app");
const loginBtn = document.getElementById("login-btn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginError = document.getElementById("login-error");

const menuItems = document.querySelectorAll(".menu-item");
const sections = document.querySelectorAll(".section");

// campos fixas/variaveis/cartao
const fixaNome = document.getElementById("fixaNome");
const fixaValor = document.getElementById("fixaValor");
const addFixaBtn = document.getElementById("addFixa");
const listaFixasDiv = document.getElementById("listaFixas");

const varNome = document.getElementById("varNome");
const varValor = document.getElementById("varValor");
const addVarBtn = document.getElementById("addVariavel");
const listaVariaveisDiv = document.getElementById("listaVariaveis");

const cartaoLimite = document.getElementById("cartaoLimite");
const cartaoUsado = document.getElementById("cartaoUsado");
const salvarCartaoBtn = document.getElementById("salvarCartao");

const totalMesEl = document.getElementById("totalMes");

// uid fixo (admin)
const UID = LOCAL_ADMIN.id;

// ------------- Helpers Firestore paths -------------
const userDocRef = (uid) => doc(db, "usuarios", uid);
const contasFixasCol = (uid) => collection(db, `usuarios/${uid}/contas_fixas`);
const contasVarsCol = (uid) => collection(db, `usuarios/${uid}/contas_variaveis`);

// ------------- Criar admin no Firestore (se não existir) -------------
async function ensureAdminDoc() {
  try {
    const uRef = userDocRef(UID);
    const snap = await getDoc(uRef);
    if (!snap.exists()) {
      await setDoc(uRef, {
        nome: LOCAL_ADMIN.nome,
        email: LOCAL_ADMIN.email,
        tipo: LOCAL_ADMIN.tipo,
        cartao: { limite: 0, usado: 0 }
      });
      console.log("Documento admin criado.");
    } else {
      // garante que exista o campo cartao
      const data = snap.data();
      if (!data.cartao) {
        await setDoc(uRef, { cartao: { limite: 0, usado: 0 } }, { merge: true });
      }
    }
  } catch (err) {
    console.error("Erro ao garantir admin:", err);
  }
}

// ------------- Login local (sem Auth) -------------
loginBtn.addEventListener("click", async () => {
  loginError.textContent = "";
  const email = emailInput.value.trim();
  const senha = passwordInput.value.trim();

  if (!email || !senha) {
    loginError.textContent = "Preencha email e senha.";
    return;
  }

  // valida local
  if (email === LOCAL_ADMIN.email && senha === LOCAL_ADMIN.senha) {
    // garantir admin doc e abrir app
    await ensureAdminDoc();
    // salva sessão simples
    localStorage.setItem("sf_user", JSON.stringify({ uid: UID, email: LOCAL_ADMIN.email }));
    showApp();
    await refreshAll();
  } else {
    loginError.textContent = "Credenciais inválidas.";
  }
});

// ------------- Mostrar app (após login) -------------
function showApp() {
  loginSection.style.display = "none";
  appDiv.style.display = "block";
}

// ------------- SPA menu -------------
menuItems.forEach(mi => {
  mi.addEventListener("click", () => {
    menuItems.forEach(x => x.classList.remove("active"));
    mi.classList.add("active");
    const screen = mi.dataset.screen;
    sections.forEach(s => s.classList.remove("visible"));
    document.getElementById(screen).classList.add("visible");
  });
});

// ------------- Contas Fixas -------------
addFixaBtn.addEventListener("click", async () => {
  const nome = (fixaNome.value || "").trim();
  const valor = parseFloat(fixaValor.value || 0);
  if (!nome || isNaN(valor) || valor <= 0) { alert("Informe nome e valor válido."); return; }
  try {
    await addDoc(contasFixasCol(UID), {
      nome,
      valor: Number(valor.toFixed(2)),
      createdAt: new Date().toISOString()
    });
    fixaNome.value = ""; fixaValor.value = "";
    await refreshFixas();
    await refreshTotal();
  } catch (err) {
    console.error(err); alert("Erro ao adicionar conta fixa.");
  }
});

async function refreshFixas(){
  listaFixasDiv.innerHTML = "<div class='small'>Carregando...</div>";
  try {
    const snap = await getDocs(contasFixasCol(UID));
    if (snap.empty) { listaFixasDiv.innerHTML = "<div class='small'>Nenhuma conta fixa cadastrada.</div>"; return; }
    const html = [];
    snap.forEach(d => {
      const data = d.data();
      html.push(`<div class="list-item"><div><strong>${data.nome}</strong><div class="small">R$ ${Number(data.valor).toFixed(2)}</div></div><div class="row"><button data-id="${d.id}" class="btn del-fixa">Remover</button></div></div>`);
    });
    listaFixasDiv.innerHTML = html.join("");
    // attach delete handlers
    document.querySelectorAll(".del-fixa").forEach(b => b.addEventListener("click", async (ev) => {
      const id = b.dataset.id;
      if (!confirm("Remover essa conta fixa?")) return;
      await deleteDoc(doc(db, `usuarios/${UID}/contas_fixas/${id}`));
      await refreshFixas();
      await refreshTotal();
    }));
  } catch (err) {
    console.error(err); listaFixasDiv.innerHTML = "<div class='small'>Erro ao carregar.</div>";
  }
}

// ------------- Contas Variáveis -------------
addVarBtn.addEventListener("click", async () => {
  const nome = (varNome.value || "").trim();
  const valor = parseFloat(varValor.value || 0);
  if (!nome || isNaN(valor) || valor <= 0) { alert("Informe descrição e valor válido."); return; }
  try {
    await addDoc(contasVarsCol(UID), {
      nome,
      valor: Number(valor.toFixed(2)),
      createdAt: new Date().toISOString()
    });
    varNome.value = ""; varValor.value = "";
    await refreshVariaveis();
    await refreshTotal();
  } catch (err) {
    console.error(err); alert("Erro ao adicionar conta variável.");
  }
});

async function refreshVariaveis(){
  listaVariaveisDiv.innerHTML = "<div class='small'>Carregando...</div>";
  try {
    const snap = await getDocs(contasVarsCol(UID));
    if (snap.empty) { listaVariaveisDiv.innerHTML = "<div class='small'>Nenhuma conta variável cadastrada.</div>"; return; }
    const html = [];
    snap.forEach(d => {
      const data = d.data();
      html.push(`<div class="list-item"><div><strong>${data.nome}</strong><div class="small">R$ ${Number(data.valor).toFixed(2)}</div></div><div class="row"><button data-id="${d.id}" class="btn del-var">Remover</button></div></div>`);
    });
    listaVariaveisDiv.innerHTML = html.join("");
    // attach delete handlers
    document.querySelectorAll(".del-var").forEach(b => b.addEventListener("click", async () => {
      const id = b.dataset.id;
      if (!confirm("Remover essa conta variável?")) return;
      await deleteDoc(doc(db, `usuarios/${UID}/contas_variaveis/${id}`));
      await refreshVariaveis();
      await refreshTotal();
    }));
  } catch (err) {
    console.error(err); listaVariaveisDiv.innerHTML = "<div class='small'>Erro ao carregar.</div>";
  }
}

// ------------- Cartão -------------
salvarCartaoBtn.addEventListener("click", async () => {
  const limite = parseFloat(cartaoLimite.value || 0);
  const usado = parseFloat(cartaoUsado.value || 0);
  if (isNaN(limite) || isNaN(usado) || limite < 0 || usado < 0) { alert("Informe valores válidos."); return; }
  try {
    // guarda como campo cartao no doc do usuário (merge)
    await setDoc(doc(db, "usuarios", UID), { cartao: { limite: Number(limite.toFixed(2)), usado: Number(usado.toFixed(2)) } }, { merge: true });
    alert("Cartão salvo.");
    await refreshCard();
    await refreshTotal();
  } catch (err) {
    console.error(err); alert("Erro ao salvar cartão.");
  }
});

async function refreshCard(){
  try {
    const snap = await getDoc(doc(db, "usuarios", UID));
    const data = snap.exists() ? snap.data() : null;
    if (data && data.cartao) {
      cartaoLimite.value = data.cartao.limite ?? 0;
      cartaoUsado.value = data.cartao.usado ?? 0;
    } else {
      cartaoLimite.value = 0; cartaoUsado.value = 0;
    }
  } catch (err) { console.error(err); }
}

// ------------- Total do mês -------------
async function refreshTotal(){
  try {
    // soma fixas
    const sf = await getDocs(contasFixasCol(UID));
    let totalFixas = 0;
    sf.forEach(d => totalFixas += Number(d.data().valor || 0));

    // soma variaveis
    const sv = await getDocs(contasVarsCol(UID));
    let totalVars = 0;
    sv.forEach(d => totalVars += Number(d.data().valor || 0));

    // cartao usado (campo no doc usuário)
    const ud = await getDoc(doc(db, "usuarios", UID));
    let usado = 0;
    if (ud.exists()) {
      const udata = ud.data();
      usado = (udata.cartao && Number(udata.cartao.usado)) || 0;
    }

    const total = totalFixas + totalVars + usado;
    totalMesEl.textContent = `R$ ${Number(total).toFixed(2)}`;
  } catch (err) {
    console.error(err);
    totalMesEl.textContent = "R$ 0,00";
  }
}

// ------------- Refreshers -------------
async function refreshAll(){
  await refreshFixas();
  await refreshVariaveis();
  await refreshCard();
  await refreshTotal();
}

// ------------- inicialização: se já logado localmente, abre app -------------
(function boot() {
  const session = localStorage.getItem("sf_user");
  if (session) {
    // assume sessão válida
    showApp();
    refreshAll();
  } else {
    // login inicial: pre-fill admin creds (UX)
    emailInput.value = LOCAL_ADMIN.email;
    passwordInput.value = LOCAL_ADMIN.senha;
  }
})();
