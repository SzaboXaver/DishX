import { supabase } from "./supabaseClient.js";

document.querySelector(".login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await login();
});

async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const loginButton = document.getElementById("loginBtn");
  const loginData = {
    email,
    password,
  };

  loginButton.disabled = true; // no double submit

  const { error } = await supabase.auth.signInWithPassword(loginData);
  if (error) {
    console.error("Login error:", error);
    alert("Login failed: " + error.message);
    loginButton.disabled = false;
    return;
  }

  alert("Login successful!");
  window.location.href = "../pages/index.html";
}