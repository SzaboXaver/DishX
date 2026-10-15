import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase = createClient(
  "https://zlncrzsnizkozucrkvyn.supabase.co", //Project URL
  "sb_publishable_RJZkVfaz6GD0OF1jTFLTGQ_T9ESEubR", //Publishable key
);
const {
  data: { session },
} = await supabase.auth.getSession();
if (!{ session }) console.error("No signed in User!");
else {
}

async function loadProfile() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) {
    console.error("No SignedIn user!");
  }
  let spanBottomHtml;
  let spanHtml;

  if (user) {
    const username = user?.user_metadata?.username;

    spanHtml = `
        <img src="https://placehold.co/600x400/d8c3ad/5a4030?text=${username}" alt="${username} Profile">
        <span>${username}</span> 
        `;

    spanBottomHtml = `
        <img src="https://placehold.co/600x400/d8c3ad/5a4030?text=${username}" alt="${username}">
    <div class="user-card-names">
        <span class="user-card-name">${username}</span>
        <span class="user-card-handle">@${username}</span>
    </div>
    `;
  }

  document.querySelector(".sidebar-user-card").innerHTML = spanBottomHtml;

  document.querySelector(".user-badge-nav").innerHTML = spanHtml;
}

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

let allRecipes = [];

function renderExploreGrid(recipes) {
  const gridElement = document.getElementById("exploreGrid");
  if (!gridElement) return;

  if (recipes.length === 0) {
    gridElement.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;">
      <h3>No matching recipe posts found</h3></div>`;
    return;
  }

  gridElement.innerHTML = recipes.map((recipe) => {
    const { data: img } = supabase.storage
      .from("recipeImages")
      .getPublicUrl(recipe.imageSrc);

    return `
      <div class="explore-card" data-id="${esc(recipe.id)}">
        <div class="explore-img-wrapper">
          <img class="explore-img" src="${esc(img.publicUrl)}" alt="${esc(recipe.recipetitle)}">
          <div class="explore-overlay">
            <span class="explore-badge">${esc(recipe.preptime)} • ${esc(recipe.difficulty)}</span>
            <button class="explore-view-btn">View Recipe Post</button>
          </div>
          <button class="explore-bookmark-btn" data-post-id="${esc(recipe.id)}" title="Save Recipe">Save</button>
        </div>
        <div class="explore-card-info">
          <h3 class="explore-recipe-title">${esc(recipe.recipetitle)}</h3>
          <div class="explore-author-row">
            <img class="explore-author-avatar"
                 src="https://placehold.co/600x400/d8c3ad/5a4030?text=${encodeURIComponent(recipe.username)}"
                 alt="${esc(recipe.username)}">
            <span>${esc(recipe.username)} • ${esc(recipe.likescount)} Likes</span>
          </div>
        </div>
      </div>`;
  }).join("");
}

function filterExploreGrid() {
  const query = document.getElementById("exploreSearchInput")?.value.toLowerCase().trim() || "";
  const activeTag = document.querySelector(".explore-tag-pill.active")?.dataset.tag || "all";

  const filtered = allRecipes.filter((r) => {
    const matchesQuery = !query ||
      String(r.recipetitle ?? "").toLowerCase().includes(query) ||
      String(r.username ?? "").toLowerCase().includes(query);
    const matchesTag = activeTag === "all" ||
      String(r.recipetitle ?? "").toLowerCase().includes(activeTag.toLowerCase());
    return matchesQuery && matchesTag;
  });

  renderExploreGrid(filtered);
}

async function loadRecipes() {
  const { data, error } = await supabase.from("public_recipes").select();
  if (error) { console.error(error); return; }

  allRecipes = await Promise.all(
    data.map(async (recipe) => {
      const { data: userData } = await supabase
        .from("recipes_with_users")
        .select("username")
        .eq("nameid", recipe.nameid)
        .limit(1)
        .maybeSingle();
      return { ...recipe, username: userData?.username || "Unknown writer!" };
    }),
  );

  renderExploreGrid(allRecipes);
}


document.getElementById("exploreSearchInput")?.addEventListener("input", filterExploreGrid);

document.querySelectorAll(".explore-tag-pill").forEach((pill) => {
  pill.addEventListener("click", () => {
    document.querySelectorAll(".explore-tag-pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    filterExploreGrid();
  });
});

document.addEventListener("click", async (e) => {
  const likeBtn = e.target.closest(".explore-bookmark-btn");
  if (!likeBtn) return;

  likeBtn.disabled = true;

  try {
    const post_id = likeBtn.dataset.postId;

    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("Session error:", sessionError);
      return;
    }
    if (!data.session) {
      console.error("No signed in user!");
      return;
    }

    const user_id = data.session.user.id;

    const { error: insertError } = await supabase
      .from("favorite")
      .insert({ post_id, user_id });
      if(insertError.code === "23505") {
        window.alert("You've already saved this recipe before.");
    }
    if (insertError) {
      console.error("Insert error:", insertError);
      return;
    }

    
    // a frissített számláló visszaolvasása
    const { data: post, error: countError } = await supabase
      .from("public_recipes") // a tábla, ahol a like_count van
      .select("like_count")
      .eq("nameid", post_id)
      .single();

    if (countError) {
      console.error("Count error:", countError);
      return;
    }

    // UI frissítése
    likeBtn.dataset.like_count = post.likeCount;
    likeBtn.querySelector(".like-count").textContent = post.likeCount;
  } finally {
    likeBtn.disabled = false;
  }


});
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
                 src="https://placehold.co/600x400/d8c3ad/5a4030?text=${encodeURIComponent(recipe.username)}"
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
await loadProfile();
await loadRecipes();