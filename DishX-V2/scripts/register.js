import { supabase } from "./supabaseClient.js";

document
  .querySelector(".register-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    await registration();
  });

async function registration() {
  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("registrationEmail").value.trim();
  const password = document.getElementById("registrationPassword").value;
  const registerButton = document.getElementById("registerBtn");
  const userdata = {
    email: email,
    password: password,
    options: {
      data: {
        username: username,
      },
    },
  };

  registerButton.disabled = true; // no double submit

  const { error } = await supabase.auth.signUp(userdata);
  if (error) {
    console.error("Registration error:", error);
    alert("Registration failed: " + error.message);
    registerButton.disabled = false;
    return;
  }

  alert("Registration successful!");
  window.location.href = "login.html"; // same folder (pages/)
}