import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; //Supabase import
const supabase = createClient(
  "https://zlncrzsnizkozucrkvyn.supabase.co", //Project URL
  "sb_publishable_RJZkVfaz6GD0OF1jTFLTGQ_T9ESEubR", //Publishable key
);
console.log("Supabase client initialized:", supabase);

document.querySelector(".login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await login();
});

async function login() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const loginData = {
        email,
        password,
    }
    const {data, error} = await supabase.auth.signInWithPassword(loginData);
    if(error) {
        console.error("Login error:", error);
        alert("Login failed: " + error.message);
    } else {
        alert("Login successful!");
        window.location.href = "../pages/index.html"; 
    }
} 

document
  .querySelector(".register-form")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    await registration();
  });

async function registration() {
  console.log("Registration function called");
  const username = document.getElementById("username").value;
  const email = document.getElementById("registrationEmail").value;
  const password = document.getElementById("registrationPassword").value;
  const userdata = {
    email: email,
    password: password,
    options: {
      data: {
        username: username,
      },
    },
  };

  const { data, error } = await supabase.auth.signUp(userdata);
  if (error) {
    console.error("Registration error:", error);
    alert("Registration failed: " + error.message);
  } else {
    alert("Registration successful!");
  }
}
