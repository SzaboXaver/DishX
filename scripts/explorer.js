import { supabase } from "./supabaseClient.js";
import { avatarAttrs } from "./avatar.js";

// Escapes user-written text before it goes into innerHTML
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

const {
  data: { session },
} = await supabase.auth.getSession();
if (!session) console.error("No signed in User!");

let allRecipes = [];
let savedIds = new Set(); // a bejelentkezett felhasználó elmentett receptjei (string id-k)

// ---------- Profile ----------

async function loadProfile() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) {
    console.error("No SignedIn user!");
  }
  let spanBottomHtml = "";
  let spanHtml = "";

  if (user) {
    const username = user.user_metadata?.username || "User";
    const avatar = avatarAttrs(user.id, username);

    spanHtml = `
        <img ${avatar} alt="${esc(username)} Profile">
        <span>${esc(username)}</span>
        `;

    spanBottomHtml = `
        <img ${avatar} alt="${esc(username)}">
    <div class="user-card-names">
        <span class="user-card-name">${esc(username)}</span>
        <span class="user-card-handle">@${esc(username)}</span>
    </div>
    `;
  }

  const bottomEl = document.querySelector(".sidebar-user-card");
  const navEl = document.querySelector(".user-badge-nav");
  if (bottomEl) bottomEl.innerHTML = spanBottomHtml;
  if (navEl) navEl.innerHTML = spanHtml;
}

// ---------- Saved recipes ----------

async function loadSavedIds() {
  savedIds = new Set();
  if (!session) return;

  const { data, error } = await supabase
    .from("favorite")
    .select("post_id")
    .eq("user_id", session.user.id);

  if (error) {
    console.error("Favorite error:", error);
    return;
  }
  savedIds = new Set((data ?? []).map((x) => String(x.post_id)));
}

// ---------- Explore grid ----------

function renderExploreGrid(recipes) {
  const gridElement = document.getElementById("exploreGrid");
  if (!gridElement) return;

  if (recipes.length === 0) {
    gridElement.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;">
      <h3>No matching recipe posts found</h3></div>`;
    return;
  }

  gridElement.innerHTML = recipes
    .map((recipe) => {
      const { data: img } = supabase.storage
        .from("recipeImages")
        .getPublicUrl(recipe.imageSrc);

      const isSaved = savedIds.has(String(recipe.id));

      return `
      <div class="explore-card" data-id="${esc(recipe.id)}">
        <div class="explore-img-wrapper">
          <img class="explore-img" src="${esc(img.publicUrl)}" alt="${esc(recipe.recipetitle)}">
          <div class="explore-overlay">
            <span class="explore-badge">${esc(recipe.preptime)} • ${esc(recipe.difficulty)}</span>
            <button class="explore-view-btn">View Recipe Post</button>
          </div>
          <button class="explore-bookmark-btn ${isSaved ? "saved" : ""}" data-post-id="${esc(recipe.id)}" title="${isSaved ? "Saved" : "Save Recipe"}">${isSaved ? "Saved" : "Save"}</button>
        </div>
        <div class="explore-card-info">
          <h3 class="explore-recipe-title">${esc(recipe.recipetitle)}</h3>
          <div class="explore-author-row">
            <img class="explore-author-avatar"
                 ${avatarAttrs(recipe.nameid, recipe.username)}
                 alt="${esc(recipe.username)}">
            <span>${esc(recipe.username)} • ${esc(recipe.likescount)} Likes</span>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

function filterExploreGrid() {
  const query =
    document.getElementById("exploreSearchInput")?.value.toLowerCase().trim() || "";
  const activeTag =
    document.querySelector(".explore-tag-pill.active")?.dataset.tag || "all";

  const filtered = allRecipes.filter((r) => {
    const matchesQuery =
      !query ||
      String(r.recipetitle ?? "").toLowerCase().includes(query) ||
      String(r.username ?? "").toLowerCase().includes(query);
    const matchesTag =
      activeTag === "all" ||
      String(r.recipetitle ?? "").toLowerCase().includes(activeTag.toLowerCase());
    return matchesQuery && matchesTag;
  });

  renderExploreGrid(filtered);
}

async function loadRecipes() {
  const { data, error } = await supabase.from("public_recipes").select();
  if (error) {
    console.error(error);
    return;
  }

  // Egy lekérdezés az összes felhasználónévhez (receptenként külön helyett)
  const nameIds = [...new Set(data.map((r) => r.nameid))];
  let usernames = new Map();
  if (nameIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from("recipes_with_users")
      .select("nameid, username")
      .in("nameid", nameIds);
    if (usersError) console.error("Users error:", usersError);
    usernames = new Map((users ?? []).map((u) => [u.nameid, u.username]));
  }

  allRecipes = data.map((recipe) => ({
    ...recipe,
    username: usernames.get(recipe.nameid) || "Unknown writer!",
  }));

  renderExploreGrid(allRecipes);
}

// ---------- Events ----------

document
  .getElementById("exploreSearchInput")
  ?.addEventListener("input", filterExploreGrid);

document.querySelectorAll(".explore-tag-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document
      .querySelectorAll(".explore-tag-pill")
      .forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    filterExploreGrid();
  });
});

// Save gomb
document.addEventListener("click", async (e) => {
  const saveBtn = e.target.closest(".explore-bookmark-btn");
  if (!saveBtn) return;

  const post_id = saveBtn.dataset.postId;

  // már elmentett recept: nincs teendő
  if (savedIds.has(String(post_id))) return;

  if (!session) {
    window.alert("Sign in to save recipes!");
    return;
  }

  saveBtn.disabled = true;

  try {
    const { error: insertError } = await supabase
      .from("favorite")
      .insert({ post_id, user_id: session.user.id });

    if (insertError && insertError.code !== "23505") {
      console.error("Insert error:", insertError);
      return;
    }

    if (insertError) {
      window.alert("You've already saved this recipe before.");
    }

    // sikeres mentés (vagy már el volt mentve): Saved felirat
    savedIds.add(String(post_id));
    saveBtn.textContent = "Saved";
    saveBtn.title = "Saved";
    saveBtn.classList.add("saved");
  } finally {
    saveBtn.disabled = false;
  }
});

// ---------- Recipe modal ----------

function openRecipeModal(recipe) {
  let backdrop = document.getElementById("recipeModalBackdrop");
  if (!backdrop) {
    backdrop = document.createElement("div");
    backdrop.id = "recipeModalBackdrop";
    backdrop.className = "modal-backdrop";
    document.body.appendChild(backdrop);
  }

  const { data: img } = supabase.storage
    .from("recipeImages")
    .getPublicUrl(recipe.imageSrc);

  const ingredientsHtml = String(recipe.ingredients ?? "")
    .split(",")
    .map((i) => `<li>${esc(i.trim())}</li>`)
    .join("");

  backdrop.innerHTML = `
    <div class="modal-dialog">
      <button class="modal-close-btn" id="modalCloseBtn">&times;</button>
      <article class="feed-card" style="border:none; box-shadow:none; padding:0;">
        <div class="post-header">
          <div class="author-info">
            <img class="author-avatar"
                 ${avatarAttrs(recipe.nameid, recipe.username)}
                 alt="${esc(recipe.username)}">
            <div class="author-details">
              <span class="author-name">${esc(recipe.username)}</span>
            </div>
          </div>
        </div>

        <div class="post-recipe-card">
          <img class="post-recipe-image" src="${esc(img.publicUrl)}" alt="${esc(recipe.recipetitle)}">
          <div class="post-recipe-meta">
            <div class="recipe-title-text">${esc(recipe.recipetitle)}</div>
            <div class="recipe-badges">
              <span class="badge-item">Time: ${esc(recipe.preptime)}</span>
              <span class="badge-item">Difficulty: ${esc(recipe.difficulty)}</span>
            </div>
            <div class="recipe-full-instructions open" style="display:block;">
              <h4>Ingredients</h4>
              <ul>${ingredientsHtml}</ul>
              <h4>Instructions</h4>
              <p>${esc(recipe.cookingsteps)}</p>
            </div>
          </div>
        </div>
      </article>
    </div>`;

  requestAnimationFrame(() => backdrop.classList.add("open"));

  backdrop.querySelector("#modalCloseBtn").addEventListener("click", () => {
    backdrop.classList.remove("open");
  });
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) backdrop.classList.remove("open");
  });
}

// megnyitás: egy figyelő a rácson (event delegation)
document.getElementById("exploreGrid")?.addEventListener("click", (e) => {
  if (e.target.closest(".explore-bookmark-btn")) return; // a Save gomb ne nyissa

  const card = e.target.closest(".explore-card");
  if (!card) return;

  const recipe = allRecipes.find((r) => String(r.id) === card.dataset.id);
  if (recipe) openRecipeModal(recipe);
});

// ---------- Start ----------

await loadProfile();
await loadSavedIds(); // a rács kirajzolása előtt kell, hogy a Saved felirat jó legyen
await loadRecipes();