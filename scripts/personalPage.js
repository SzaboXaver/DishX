import { supabase } from "./supabaseClient.js";
import { avatarAttrs, uploadAvatar, refreshAvatars } from "./avatar.js";

// Escapes user-written text before it goes into innerHTML
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

const {
  data: { session },
} = await supabase.auth.getSession();

if (!session) {
  console.error("No signed in User!");
} else {
  await loadProfile();
  await loadFavoriteRecipes();
}

// ---------- Shared helpers ----------

// Number of rows in a table where column = value (only the count, no data)
async function countRows(table, column, value) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, value);
  if (error) {
    console.error(`Count error (${table}):`, error);
    return 0;
  }
  return count ?? 0;
}

// Total likes on all of the user's public recipes
async function likesReceived(user_id) {
  const { data, error } = await supabase
    .from("public_recipes")
    .select("likescount")
    .eq("nameid", user_id);
  if (error) {
    console.error("Likes error:", error);
    return 0;
  }
  return data.reduce((sum, r) => sum + (r.likescount ?? 0), 0);
}

// Fetches all four numbers and writes them into the profile
async function refreshCounts(user_id) {
  const [favorites, likes, followers, following] = await Promise.all([
    countRows("favorite", "user_id", user_id), // recipes you favorited
    likesReceived(user_id), // likes on your recipes
    countRows("follows", "followedid", user_id), // people who follow you
    countRows("follows", "followerid", user_id), // people you follow
  ]);

  const set = (id, n) => {
    const el = document.getElementById(id);
    if (el) el.textContent = n;
  };
  set("favoritesCount", favorites);
  set("likesReceivedCount", likes);
  set("followersCount", followers);
  set("followingCount", following);
}

// Re-runs refreshCounts whenever follows / favorite / public_recipes change
function watchCounts(user_id) {
  let timer;
  const refresh = () => {
    clearTimeout(timer); // several changes at once = one refresh
    timer = setTimeout(() => refreshCounts(user_id), 300);
  };

  supabase
    .channel("profile-counts")
    .on("postgres_changes", { event: "*", schema: "public", table: "follows" }, refresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "favorite" }, refresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "public_recipes" }, refresh)
    .subscribe();
}

// One recipe card + its full-width details (used by both lists)
function recipeCardHtml(recipe) {
  const { data: img } = supabase.storage
    .from("recipeImages")
    .getPublicUrl(recipe.imageSrc);

  return `
    <!-- RECIPE CARD -->
    <div class="recipe-card">

        <img
            class="recipe-image"
            src="${img.publicUrl}"
            alt="Recipe image"
        >

        <button class="favorite-button">
            ♡
        </button>

        <div class="recipe-info">

            <div class="recipe-name">
                ${esc(recipe.recipetitle)}
            </div>

        </div>

    </div>


    <!-- FULL WIDTH RECIPE CONTENT -->
    <div class="recipe-details">

        <h2>
            ${esc(recipe.recipetitle)}
        </h2>
        <h3>
            Ingredients
        </h3>

        <p>
            ${esc(recipe.ingredients)}
        </p>

        <h3>
            Instructions
        </h3>

        <p>
            ${esc(recipe.cookingsteps)}
        </p>

    </div>
  `;
}

// Clicking a card opens/closes its details (the heart button is ignored)
function bindCardToggle(divElement) {
  divElement.querySelectorAll(".recipe-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".favorite-button")) return;
      card.nextElementSibling.classList.toggle("open");
    });
  });
}

// ---------- Profile ----------

// "Change profile picture" button (or a click on the picture) -> file picker -> upload
function bindAvatarUpload(user_id) {
  const pic = document.getElementById("pic");
  const fileInput = document.getElementById("avatarFileInput");
  const changeBtn = document.getElementById("changeAvatarBtn");
  if (!fileInput || !changeBtn) return;

  if (pic) pic.style.cursor = "pointer";
  const openPicker = () => fileInput.click();
  changeBtn.addEventListener("click", openPicker);
  if (pic) pic.addEventListener("click", openPicker);

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    changeBtn.disabled = true;
    changeBtn.textContent = "Uploading...";

    const result = await uploadAvatar(file);

    changeBtn.disabled = false;
    changeBtn.textContent = "Change profile picture";
    fileInput.value = ""; // so choosing the same file again still triggers "change"

    if (!result.success) {
      alert(result.error.message || "Upload failed. Please try again.");
      return;
    }

    refreshAvatars(user_id); // profile picture + nav badge update right away
  });
}

// Kijelentkezés, majd vissza a nyitóoldalra
function bindSignOut() {
  const signOutBtn = document.getElementById("signOutBtn");
  if (!signOutBtn) return;

  signOutBtn.addEventListener("click", async () => {
    signOutBtn.disabled = true;

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
      alert("Sign out failed. Please try again.");
      signOutBtn.disabled = false;
      return;
    }

    window.location.href = "../index.html";
  });
}

async function loadProfile() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("No SignedIn user!");
    return;
  }

  const user_id = user.id;
  const username = user.user_metadata?.username || "User";
  const avatar = avatarAttrs(user_id, username);

  const topBar = document.querySelector(".profile");
  const navEl = document.querySelector(".user-badge-nav");

  if (topBar) {
    topBar.innerHTML = `
<img
    ${avatar}
    alt="@${esc(username)}"
    id="pic"
>

<div class="profile-info">

    <p id="name">
        name: ${esc(username)}
    </p>

    <p id="uid">
        uid: ${esc(user_id)}
    </p>

    <p id="favorites">
        favorites: <span id="favoritesCount">…</span>
    </p>

    <p id="likesReceived">
        likes received: <span id="likesReceivedCount">…</span>
    </p>

    <p id="followers">
        followers: <span id="followersCount">…</span>
    </p>

    <p id="following">
        following: <span id="followingCount">…</span>
    </p>

    <input type="file" id="avatarFileInput" accept="image/*" hidden>
    <button type="button" id="changeAvatarBtn">Change profile picture</button>
    <button type="button" id="signOutBtn">Sign out</button>

</div>
`;
  }

  if (navEl) {
    navEl.innerHTML = `
     <img ${avatar} alt="${esc(username)}">
    <span>${esc(username)}</span>
  `;
  }

  bindAvatarUpload(user_id);
  bindSignOut();
  await refreshCounts(user_id);
  watchCounts(user_id);
  await loadRecipes(user_id, username);
}

// ---------- My recipes (public + private) ----------

async function loadRecipes(user_id, user_name) {
  const divElement = document.getElementById("myRecipes");
  if (!divElement) return;

  // Both queries at the same time instead of one after the other
  const [pubResponse, privResponse] = await Promise.all([
    supabase.from("public_recipes").select().eq("nameid", user_id),
    supabase.from("private_recipes").select().eq("nameid", user_id),
  ]);

  if (pubResponse.error) console.error(pubResponse.error);
  if (privResponse.error) console.error(privResponse.error);

  const allRecipes = [
    ...(pubResponse.data ?? []),
    ...(privResponse.data ?? []),
  ];

  divElement.innerHTML = allRecipes
    .map((recipe) => recipeCardHtml(recipe))
    .join("");

  bindCardToggle(divElement);
}

// ---------- Favorite recipes ----------

async function loadFavoriteRecipes() {
  const divElement = document.getElementById("favoriteRecipes");
  if (!divElement) return;
  let html = ``;
  divElement.innerHTML = html;

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

  const response = await supabase
    .from("favorite")
    .select()
    .eq("user_id", user_id);

  if (response.error) {
    console.error(response.error);
    return;
  }

  const postIds = response.data.map((x) => x.post_id);
  const allRecipes = [];

  if (postIds.length > 0) {
    // One query for all favorite recipes instead of one per favorite
    const { data: recipes, error: recipesError } = await supabase
      .from("public_recipes")
      .select()
      .in("id", postIds);

    if (recipesError) {
      console.error("Error fetching recipes:", recipesError);
      return;
    }

    // One query for all usernames instead of one per recipe
    const nameIds = [...new Set(recipes.map((r) => r.nameid))];
    const { data: users, error: usersError } = await supabase
      .from("recipes_with_users")
      .select("nameid, username")
      .in("nameid", nameIds);

    if (usersError) console.error("Error fetching users:", usersError);

    const usernames = new Map((users ?? []).map((u) => [u.nameid, u.username]));

    const byId = new Map(
      recipes.map((recipe) => [
        String(recipe.id),
        { ...recipe, username: usernames.get(recipe.nameid) || "Unknown writer!" },
      ]),
    );

    // keep the order of the favorites
    for (const post_id of postIds) {
      const recipe = byId.get(String(post_id));
      if (recipe) allRecipes.push(recipe);
    }
  }

  if (allRecipes.length == 0) {
    html = `
     <div class="bookmarks-empty-state">
      <h3 class="bookmarks-empty-title">No Saved Recipes Yet</h3>
      <p class="bookmarks-empty-text">When you find recipes you want to save or cook later, click Save and they will appear right here!</p>
      <a href="explore.html" class="btn-explore-now">Explore Recipes</a>
    </div>`;
    divElement.innerHTML = html;
    return;
  }

  html = allRecipes.map((recipe) => recipeCardHtml(recipe)).join("");
  divElement.innerHTML = html;

  bindCardToggle(divElement);
}