import dayjs from "https://cdn.jsdelivr.net/npm/dayjs@1.11.23/+esm"; //dayjs import
import { supabase } from "./supabaseClient.js";
import { upload, fetchRecipes } from "./actions.js";
import { avatarAttrs, setAvatar } from "./avatar.js";

let spanHtml = ``;
let spanBottomHtml = ``;
let html = "";

// Escapes user-written text before it goes into innerHTML
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

const {
  data: { session },
} = await supabase.auth.getSession();

// Fallback HTML for when nobody is signed in
spanHtml = `
<img src="https://placehold.co/600x400/d8c3ad/5a4030?text=No_User" alt="No User Profile">
<span>No User</span>
`;
spanBottomHtml = `
    <img src="https://placehold.co/600x400/d8c3ad/5a4030?text=No_User" alt="No_User">
    <div class="user-card-names">
        <span class="user-card-name">No User</span>
        <span class="user-card-handle">@No User</span>
    </div>
`;

// loadProfile shows the real user, or the fallback above if nobody is signed in
await loadProfile(spanHtml, spanBottomHtml);

if (!session) {
  html = "";
  document.querySelector(".feed-timeline").innerHTML = html;
} else {
  await loadRecipes();
}

await usersToFollow(session?.user?.id);

// ---------- Click handlers ----------

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-toggle-recipe-details");
  if (!btn) return;

  const details = btn.parentElement.querySelector(".recipe-full-instructions");
  details.classList.toggle("open"); // vagy amilyen osztályt a CSS-ed használ
});

document
  .getElementById("submitRecipeBtn")
  ?.addEventListener("click", () => uploadRecipe());

document.addEventListener("click", async (e) => {
  const likeBtn = e.target.closest(".js-like-btn");
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
    if (insertError) {
      if (insertError.code === "23505") {
        console.log("You already liked this post.");
      } else {
        console.error("Insert error:", insertError);
      }
      return;
    }

    // a frissített számláló visszaolvasása
    const { data: post, error: countError } = await supabase
      .from("public_recipes") // a tábla, ahol a like_count van
      .select("likescount")
      .eq("id", post_id) // a recept id-ja, nem a szerzőé (nameid)
      .single();

    if (countError) {
      console.error("Count error:", countError);
      return;
    }

    // UI frissítése
    likeBtn.dataset.likeCount = post.likescount;
    likeBtn.querySelector(".like-count").textContent = post.likescount;
  } finally {
    likeBtn.disabled = false;
  }
});

// One follow handler for both the feed button (.follow-btn)
// and the "Chefs to Follow" buttons (.btn-follow)
document.addEventListener("click", async (e) => {
  const button = e.target.closest(".follow-btn, .btn-follow");
  // "View Profile" is a link that also has .btn-follow, so skip it
  if (!button || button.classList.contains("js-view-profile")) return;

  const followedId = button.dataset.posterId ?? button.dataset.userId;
  if (!followedId) return;

  button.disabled = true;

  const { error } = await supabase
    .from("follows")
    .insert({ followedid: followedId });

  if (error && error.code !== "23505") {
    console.error(error);
    button.disabled = false; // real error, let them try again
    return;
  }

  if (error) {
    console.log("You're already following him.");
  } else {
    window.alert("Follow Successful!");
  }
  setFollowing(followedId);
});

// ---------- Functions ----------

// Turns every follow button for this chef into a disabled "Following" button
function setFollowing(followedId) {
  document
    .querySelectorAll(
      `.follow-btn[data-poster-id="${followedId}"], .btn-follow[data-user-id="${followedId}"]`,
    )
    .forEach((b) => {
      b.textContent = "Following";
      b.disabled = true;
    });
}

// After the feed is drawn: mark the chefs you already follow
async function markFollowed(user_id) {
  if (!user_id) return;
  const { data, error } = await supabase
    .from("follows")
    .select("followedid")
    .eq("followerid", user_id);
  if (error) {
    console.error(error);
    return;
  }
  data.forEach((row) => setFollowing(row.followedid));
}

async function uploadRecipe() {
  const imageFileInput = document.getElementById("imageFileInput").files[0];
  if (!imageFileInput) {
    alert("Válassz ki egy képet!");
    return;
  }

  const thoughts = document.getElementById("postTextInput").value;
  const recipeTitle = document.getElementById("recipeTitleInput").value;
  const prepTime = document.getElementById("prepTimeInput").value;
  const difficulty = document.getElementById("difficultySelect").value;
  const servings = document.getElementById("servingsInput").value;
  const ingredients = document.getElementById("ingredientsInput").value;
  const cookingSteps = document.getElementById("instructionsInput").value;
  const visibility = document.getElementById("visibilitySelect").value;
  const hashtags = document.getElementById("hashtags").value.replace(/\s+/g, "");
  const likescount = 0;
  const dateofpub = dayjs().format("YYYY-MM-DD");

  const fileExt = imageFileInput.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const url = `public/${fileName}`;

  const result = await upload({
    thoughts,
    recipeTitle,
    prepTime,
    difficulty,
    servings,
    ingredients,
    cookingSteps,
    url,
    imageFileInput,
    visibility,
    hashtags,
    likescount,
    dateofpub,
  });

  if (!result.success) {
    if (result.error.message === "Not signed in") {
      alert("Sign in to reach this feature!");
    } else {
      alert("Upload failed. Please try again.");
    }
    return;
  }

  await loadRecipes();
  alert("Recipe uploaded successfully!");
}

async function loadRecipes() {
  const { recipes, usernames, user_id } = await fetchRecipes();

  const html = recipes
    .map((recipe) => {
      const username = usernames.get(recipe.nameid) || "Unknown writer!";
      const { data: img } = supabase.storage
        .from("recipeImages")
        .getPublicUrl(recipe.imageSrc);

      return `
        <article class="feed-card" data-tags="${esc(recipe.hashtags)}" data-title="${esc(recipe.recipetitle)}"
                    data-author="${esc(username)}">
                    <div class="post-header">
                        <div class="author-info">
                            <img class="author-avatar" ${avatarAttrs(recipe.nameid, username)}
                                alt="${esc(username)}">
                            <div class="author-details">
                                <div class="author-name-row">
                                    <a href="personal page.html" class="author-name">${esc(username)}</a>
                                    ${recipe.nameid === user_id ? `<span class="author-badge">(You)</span>` : ""}
                                </div>
                                <div class="author-handle-time">@${esc(username)} • ${esc(recipe.dateofpub)}</div>
                            </div>
                        </div>
                        ${
                          recipe.nameid !== user_id
                            ? `
                            <button class='follow-btn' data-user-id="${esc(user_id)}" data-poster-id="${esc(recipe.nameid)}">Follow</button>
                            <a href="otheronesPage.html?uid=${encodeURIComponent(recipe.nameid)}&username=${encodeURIComponent(username)}"
                            class="btn-follow following js-view-profile">View Profile</a>
                            `
                            : ""
                        }
                        </div>
                    <div class="post-content">
                        ${esc(recipe.thoughts)}
                        <div class="post-tags">
                            ${(recipe.hashtags ?? "")
                              .split("#")
                              .filter(Boolean)
                              .map((t) => `<a href="#" class="tag-pill">#${esc(t)}</a>`)
                              .join("")}
                        </div>
                    </div>

                    <div class="post-recipe-card">
                        <img class="post-recipe-image"
                            src="${img.publicUrl}" alt="${esc(recipe.recipetitle)}">
                        <div class="post-recipe-meta">
                            <div class="recipe-title-text">${esc(recipe.recipetitle)}</div>
                            <div class="recipe-badges">
                                <span class="badge-item">Time: ${esc(recipe.preptime)}</span>
                                <span class="badge-item">Difficulty: ${esc(recipe.difficulty)}</span>
                                <span class="badge-item">Servings: ${esc(recipe.servings)}</span>
                            </div>
                            <button class="btn-toggle-recipe-details">
                                <span>Show Ingredients & Steps</span> ⌄
                            </button>
                            <div class="recipe-full-instructions">
                                <h4>Ingredients</h4>
                                <ul>
                                ${(recipe.ingredients ?? "")
                                  .split("\n")
                                  .map((i) => `<li>${esc(i)}</li>`)
                                  .join("")}
                                </ul>
                                <h4>Instructions</h4>
                                <p>${esc(recipe.cookingsteps)}</p>
                            </div>
                        </div>
                    </div>

                    <div class="post-action-bar">
                        <button class="action-btn comment-btn">
                            Replies <span class="comment-count">3</span>
                        </button>
                        <button class="action-btn recook-btn">
                            Re-cook <span class="recook-count">12</span>
                        </button>
                        <button class="action-btn like-btn liked js-like-btn" data-post-id="${esc(recipe.id)}" data-like-count="${esc(recipe.likescount)}">
                            Favorite <span class="like-count">${esc(recipe.likescount)}</span>
                        </button>
                        <button class="action-btn bookmark-btn bookmarked">
                            Saved
                        </button>
                        <button class="action-btn share-btn">
                            Share
                        </button>
                    </div>

                    <div class="post-comments-container">
                        <div class="comment-list">
                            <div class="comment-item">
                                <img class="comment-avatar" src="https://placehold.co/600x400/b89b7d/5a4030?text=Marco"
                                    alt="Marco">
                                <div class="comment-body">
                                    <span class="comment-user">Marco (@gourmet_marco)</span>
                                    <span class="comment-text">That ganache gloss is unreal! Do you use dark or milk
                                        chocolate for it?</span>
                                </div>
                            </div>
                            <div class="comment-item">
                                <img class="comment-avatar" src="https://placehold.co/600x400/806653/ffffff?text=Sarah"
                                    alt="Sarah">
                                <div class="comment-body">
                                    <span class="comment-user">Sarah (@baker_sarah)</span>
                                    <span class="comment-text">Saved to my baking wishlist! Trying this weekend.</span>
                                </div>
                            </div>
                        </div>
                        <div class="add-comment-row">
                            <input type="text" class="add-comment-input" placeholder="Write a reply...">
                            <button class="btn-send-comment">Reply</button>
                        </div>
                    </div>
                </article>`;
    })
    .join("");

  const feed = document.querySelector(".feed-timeline");
  if (feed) feed.innerHTML = html;

  await markFollowed(user_id);
}

// If nobody is signed in, the spanHtml / spanBottomHtml passed in are shown instead
export async function loadProfile(spanHtml, spanBottomHtml) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) {
    console.error("No SignedIn user!");
  }

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
  if (bottomEl) bottomEl.innerHTML = spanBottomHtml ?? "";
  if (navEl) navEl.innerHTML = spanHtml ?? "";

  // The avatar next to the "What are you cooking today?" box
  if (user) {
    setAvatar(
      document.querySelector(".composer-avatar"),
      user.id,
      user.user_metadata?.username,
    );
  }
}

async function usersToFollow(user_id) {
  const divElement = document.getElementById("chefsToFollow");
  if (!divElement) return;

  // magadat és akiket már követsz, ne ajánlja
  const excluded = [];
  if (user_id) {
    excluded.push(user_id);
    const { data: followed, error: followedError } = await supabase
      .from("follows")
      .select("followedid")
      .eq("followerid", user_id);
    if (followedError) console.error(followedError);
    excluded.push(...(followed ?? []).map((f) => f.followedid));
  }

  // az összes felhasználó (nem csak akiknek van receptje), max. 5 fő
  let query = supabase.from("users_public").select("nameid, username").limit(5);
  if (excluded.length > 0) {
    query = query.not("nameid", "in", `(${excluded.join(",")})`);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return;
  }

  const uniqueUsers = data;

  divElement.innerHTML =
    `<div class="widget-title">Chefs to Follow</div>` +
    uniqueUsers
      .map(
        (user) => `
      <div class="chef-suggest-item">
        <div class="chef-suggest-info">
          <img ${avatarAttrs(user.nameid, user.username)}
               alt="${esc(user.username)}">
          <div class="user-card-names">
            <span class="user-card-name">${esc(user.username)}</span>
            <span class="user-card-handle">@${esc(user.username)}</span>
          </div>
        </div>
        <button class="btn-follow" data-user-id="${esc(user.nameid)}">+ Follow</button>
      </div>`
      )
      .join("");
}