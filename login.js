import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const loginBtn = document.getElementById("login-btn");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("error-msg");

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    errorMsg.textContent = "Preencha todos os campos.";
    return;
  }

  try {
    // Login Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Buscar dados do usuário no Firestore
    const userDoc = await getDoc(doc(db, "usuarios", uid));

    if (!userDoc.exists()) {
      errorMsg.textContent = "Usuário sem permissões cadastradas.";
      return;
    }

    const userData = userDoc.data();

    // Salvar sessão local
    localStorage.setItem("usuarioLogado", JSON.stringify({
      uid,
      nome: userData.nome,
      tipo: userData.tipo
    }));

    // Redirecionar
    if (userData.tipo === "admin") {
      window.location.href = "./admin/dashboard.html";
    } else {
      window.location.href = "./user/dashboard.html";
    }

  } catch (error) {
    console.log(error);
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      errorMsg.textContent = "Credenciais inválidas.";
    } else {
      errorMsg.textContent = "Erro ao fazer login.";
    }
  }
});
