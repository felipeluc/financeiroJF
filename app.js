// Firebase config
const firebaseConfig = {
apiKey: "AIzaSyC39MUGnt8gBtK9GEmUdrlGNCe7R9rDq08",
authDomain: "casajoaoefelipe.firebaseapp.com",
projectId: "casajoaoefelipe",
storageBucket: "casajoaoefelipe.firebasestorage.app",
messagingSenderId: "1025146434390",
appId: "1:1025146434390:web:19a9c92bed60d6a83cdcf7"
};


firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


const PASSWORD = "1234";
let currentUser = "";


function login() {
const pass = document.getElementById("password").value;
currentUser = document.getElementById("user").value;


if (pass !== PASSWORD) {
alert("Senha incorreta");
return;
}


document.getElementById("login").classList.add("hidden");
document.getElementById("app").classList.remove("hidden");
loadItems();
}


async function loadItems() {
const menu = document.getElementById("menu");
menu.innerHTML = "";


const snapshot = await db.collection("enxoval").get();
const categories = {};


snapshot.forEach(doc => {
const item = doc.data();
if (!categories[item.categoria]) categories[item.categoria] = [];
categories[item.categoria].push({ id: doc.id, ...item });
});


Object.keys(categories).forEach(cat => {
const div = document.createElement("div");
div.className = "category";
div.innerHTML = `<h3>${cat}</h3>`;


categories[cat]
.sort((a, b) => b.comprado - a.comprado)
.forEach(item => {
const row = document.createElement("div");
row.className = "item " + (item.comprado ? "checked" : "");
row.innerHTML = `
<div>
<strong>${item.nome}</strong><br>
${item.comprado ? `<small>R$ ${item.valor} • ${item.usuario}</small>` : ""}
</div>
}
