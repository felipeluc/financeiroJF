// Firebase Setup
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBFImw6Px0VKLiSVba8L-9PdjLPIU_HmSM",
  authDomain: "financeiro-409db.firebaseapp.com",
  projectId: "financeiro-409db",
  storageBucket: "financeiro-409db.appspot.com",
  messagingSenderId: "124692561019",
  appId: "1:124692561019:web:ceb10e49cf667d61f3b6de"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lógica de login
let currentUser = null;

function login() {
  const user = document.getElementById("userSelect").value;
  const pass = document.getElementById("password").value;

  const senhas = {
    "Felipe": "Felipe1515",
    "João": "João234"
  };

  if (pass === senhas[user]) {
    currentUser = user;
    document.getElementById("loginContainer").style.display = "none";
    document.getElementById("mainContainer").style.display = "block";
    document.getElementById("welcome").innerText = `Olá, ${user}!`;
    carregarDados();
  } else {
    document.getElementById("loginError").innerText = "Senha incorreta!";
  }
}

// Tabs
function openTab(tabId) {
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach(tab => tab.style.display = "none");
  document.getElementById(tabId).style.display = "block";
}

// Visão Geral
let totalGasto = 0;
const gastos = [];

function adicionarGasto() {
  const desc = document.getElementById("descGasto").value;
  const valor = parseFloat(document.getElementById("valorGasto").value);
  if (desc && valor) {
    gastos.push({ desc, valor });
    totalGasto += valor;
    document.getElementById("jaGastou").value = totalGasto.toFixed(2);
    atualizarDisponivel();
    atualizarLista();
  }
}

function atualizarLista() {
  const lista = document.getElementById("listaGastos");
  lista.innerHTML = "";
  gastos.forEach(g => {
    const li = document.createElement("li");
    li.innerText = `${g.desc}: R$ ${g.valor.toFixed(2)}`;
    lista.appendChild(li);
  });
}

function atualizarDisponivel() {
  const limite = parseFloat(document.getElementById("limite").value) || 0;
  const disponivel = limite - totalGasto;
  document.getElementById("disponivel").innerText = `R$ ${disponivel.toFixed(2)}`;
}

// Fatura
function calcularCartao() {
  const fatura = parseFloat(document.getElementById("valorFatura").value) || 0;
  const outros = parseFloat(document.getElementById("usoOutros").value) || 0;
  const ajuda1 = parseFloat(document.getElementById("ajuda1").value) || 0;
  const ajuda2 = parseFloat(document.getElementById("ajuda2").value) || 0;
  const ajuda3 = parseFloat(document.getElementById("ajuda3").value) || 0;
  const limite = parseFloat(document.getElementById("limiteCartao").value) || 0;

  const totalAjuda = outros + ajuda1 + ajuda2 + ajuda3;
  const seuTotal = fatura - totalAjuda;
  const disponivel = limite - seuTotal;

  document.getElementById("totalSeu").innerText = `R$ ${seuTotal.toFixed(2)}`;
  document.getElementById("disponivelCartao").innerText = `R$ ${disponivel.toFixed(2)}`;
}

// Salário
function calcularSobra() {
  const salario = parseFloat(document.getElementById("salarioRecebido").value) || 0;
  const custos = [
    "mercado", "aluguel", "internet", "racao", "agua", "luz", "despesas"
  ].reduce((acc, id) => acc + (parseFloat(document.getElementById(id).value) || 0), 0);
  const sobra = salario - custos;
  document.getElementById("sobraMes").innerText = `R$ ${sobra.toFixed(2)}`;
}

// Firebase
async function carregarDados() {
  const ref = doc(db, "usuarios", currentUser);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    const data = snap.data();
    document.getElementById("salario").value = data.salario || "";
    document.getElementById("limite").value = data.limite || "";
  }
}

async function salvarDados() {
  const ref = doc(db, "usuarios", currentUser);
  await setDoc(ref, {
    salario: document.getElementById("salario").value,
    limite: document.getElementById("limite").value
  });
}

window.login = login;
window.openTab = openTab;
window.adicionarGasto = adicionarGasto;
window.calcularCartao = calcularCartao;
window.calcularSobra = calcularSobra;
