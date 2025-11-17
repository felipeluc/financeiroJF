import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  setDoc,
  doc,
  getDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

/* ---------------- LOGIN ---------------- */
const loginBtn = document.getElementById("login-btn");
const loginError = document.getElementById("login-error");

const USERS = {
  "felipe": "felipe15",
  "admin": "1234"
};

loginBtn.onclick = () => {
  const user = document.getElementById("login-user").value;
  const pass = document.getElementById("login-pass").value;

  if (USERS[user] && USERS[user] === pass) {
    localStorage.setItem("usuario", user);
    openScreen("home-screen");
  } else {
    loginError.textContent = "Credenciais incorretas.";
  }
};

/* ---------------- NAVEGAÇÃO ---------------- */
const buttons = document.querySelectorAll("nav button");

buttons.forEach(btn => {
  btn.onclick = () => {
    buttons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    openScreen(btn.dataset.target);
  };
});

function openScreen(id) {
  document.querySelectorAll(".screen, #login-screen")
    .forEach(s => s.classList.remove("active-screen"));

  document.getElementById(id).classList.add("active-screen");
}

/* ---------------- CONTAS FIXAS ---------------- */
document.getElementById("add-fixa").onclick = async () => {
  const nome = document.getElementById("fixa-nome").value;
  const valor = Number(document.getElementById("fixa-valor").value);

  if (!nome || !valor) return;

  await addDoc(collection(db, "contasFixas"), { nome, valor });

  loadFixas();
};

async function loadFixas() {
  const snap = await getDocs(collection(db, "contasFixas"));
  const container = document.getElementById("fixas-list");
  container.innerHTML = "";

  snap.forEach(doc => {
    const d = doc.data();
    container.innerHTML += `<div class="card"><b>${d.nome}</b><br>R$ ${d.valor}</div>`;
  });
}

/* ---------------- CONTAS VARIÁVEIS ---------------- */
document.getElementById("add-var").onclick = async () => {
  const nome = document.getElementById("var-nome").value;
  const valor = Number(document.getElementById("var-valor").value);

  if (!nome || !valor) return;

  await addDoc(collection(db, "variaveis"), { nome, valor });

  loadVariaveis();
};

async function loadVariaveis() {
  const snap = await getDocs(collection(db, "variaveis"));
  const container = document.getElementById("var-list");
  container.innerHTML = "";

  snap.forEach(doc => {
    const d = doc.data();
    container.innerHTML += `<div class="card"><b>${d.nome}</b><br>R$ ${d.valor}</div>`;
  });
}

/* ---------------- CARTÃO ---------------- */
document.getElementById("salvar-cartao").onclick = async () => {
  const limite = Number(document.getElementById("cartao-limite").value);
  const usado = Number(document.getElementById("cartao-usado").value);

  await setDoc(doc(db, "cartao", "dados"), { limite, usado });
};

/* Auto-carregar dados ao abrir */
loadFixas();
loadVariaveis();
