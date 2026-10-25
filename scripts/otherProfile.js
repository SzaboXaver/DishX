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
if (!session) {
  console.error("No signed in User!");
}

// Whose profile is this? (from the URL: otheronesPage.html?uid=...&username=...)
const params = new URLSearchParams(window.location.search);
const user_id = params.get("uid");
const username = params.get("username") || "User";

if (!user_id) {
  console.error("Missing uid in URL");
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
    countRows("favorite", "user_id", user_id), // recipes they favorited
    likesReceived(user_id), // likes on their recipes
    countRows("follows", "followedid", user_id), // people who follow them
    countRows("follows", "followerid", user_id), // people they follow
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

async function loadProfile() {
  const topBar = document.querySelector(".profile");
  const avatar = avatarAttrs(user_id, username);

  if (topBar) {
    topBar.innerHTML = `
<img
    ${avatar}
    alt="@${esc(username)}"
    id="pic"
>

<div class="profile-info">

    <p id="name">
      ${esc(username)}
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

</div>
`;
  }

  // The nav badge is always the signed-in user (you), not the profile you are viewing
  const navEl = document.querySelector(".user-badge-nav");
  const myName = session?.user?.user_metadata?.username;
  if (navEl && myName) {
    navEl.innerHTML = `
     <img ${avatarAttrs(session.user.id, myName)} alt="${esc(myName)}">
    <span>${esc(myName)}</span>
  `;
  }

  await refreshCounts(user_id);
  await loadRecipes(user_id, username);
}

// ---------- Recipes of this user ----------

async function loadRecipes(user_id, user_name) {
  const divElement = document.getElementById("myRecipes");
  if (!divElement) return;

  // Private recipes are only loaded when you are looking at your own profile
  const isOwnProfile = session?.user?.id === user_id;

  // Both queries at the same time instead of one after the other
  const [pubResponse, privResponse] = await Promise.all([
    supabase.from("public_recipes").select().eq("nameid", user_id),
    isOwnProfile
      ? supabase.from("private_recipes").select().eq("nameid", user_id)
      : Promise.resolve({ data: [], error: null }),
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

// ---------- Favorite recipes of this user ----------

async function loadFavoriteRecipes() {
  const divElement = document.getElementById("favoriteRecipes");
  if (!divElement) return;
  divElement.innerHTML = "";

  const isOwnProfile = session?.user?.id === user_id;

  // 1) Kedvencek azonosítói
  const favRes = await supabase
    .from("favorite")
    .select("post_id")
    .eq("user_id", user_id);

  if (favRes.error) {
    console.error("Favorite error:", favRes.error);
    return;
  }

  const postIds = (favRes.data ?? []).map((x) => x.post_id);
  console.log("Favorite post ids:", postIds); // ellenőrzéshez

  let found = [];

  if (postIds.length > 0) {
    // 2) Publikus + (saját profilnál) privát receptek egyszerre
    const [pubRes, privRes] = await Promise.all([
      supabase.from("public_recipes").select().in("id", postIds),
      isOwnProfile
        ? supabase.from("private_recipes").select().in("id", postIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (pubRes.error) console.error("Public recipes error:", pubRes.error);
    if (privRes.error) console.error("Private recipes error:", privRes.error);

    found = [...(pubRes.data ?? []), ...(privRes.data ?? [])];

    // 3) Szerzők nevei (ha ez hibás, a receptek akkor is megjelennek)
    const nameIds = [...new Set(found.map((r) => r.nameid))];
    let usernames = new Map();
    if (nameIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from("recipes_with_users")
        .select("nameid, username")
        .in("nameid", nameIds);
      if (usersError) console.error("Users error:", usersError);
      usernames = new Map((users ?? []).map((u) => [u.nameid, u.username]));
    }

    found = found.map((r) => ({
      ...r,
      username: usernames.get(r.nameid) || "Unknown writer!",
    }));
  }

  // 4) A kedvencek sorrendjének megtartása
  const byId = new Map(found.map((r) => [String(r.id), r]));
  const allRecipes = postIds
    .map((id) => byId.get(String(id)))
    .filter(Boolean);

  if (allRecipes.length === 0) {
    divElement.innerHTML = `
     <div class="bookmarks-empty-state">
      <h3 class="bookmarks-empty-title">${username} haven't saved any recipes yet.</h3>
      <p class="bookmarks-empty-text">When ${username} find recipes that ${username} want to save or cook later, those recipes will appear right here!</p>
      <a href="explore.html" class="btn-explore-now">Explore Recipes</a>
    </div>`;
    return;
  }

  divElement.innerHTML = allRecipes.map((r) => recipeCardHtml(r)).join("");
  bindCardToggle(divElement);
}

document.title = `DishX - ${username}'s page`;