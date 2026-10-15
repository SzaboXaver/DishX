import { createClient } from "https://esm.sh/@supabase/supabase-js@2"; //Supabase import
import dayjs from "https://cdn.jsdelivr.net/npm/dayjs@1.11.23/+esm"; //dayjs import
const supabase = createClient(
  "https://zlncrzsnizkozucrkvyn.supabase.co", //Project URL
  "sb_publishable_RJZkVfaz6GD0OF1jTFLTGQ_T9ESEubR", //Publishable key
);
let spanHtml = ``;
let spanBottomHtml = ``;
let html = "";
const {
  data: { session },
} = await supabase.auth.getSession();

if (!{ session }) {
  html = "";

  document.querySelector(".feed-timeline").innerHTML = html;
} else {
  spanHtml = `
<img src="https://placehold.co/600x400/d8c3ad/5a4030?text=Krisztina" alt="No User Profile">
<span>No User</span>
`;
  spanBottomHtml = `
    <img src="https://placehold.co/600x400/d8c3ad/5a4030?text=No_User" alt="No_User">
    <div class="user-card-names">
        <span class="user-card-name">No User</span>
        <span class="user-card-handle">@No User</span>
    </div>
`;
  document.querySelector(".sidebar-user-card").innerHTML = spanBottomHtml;
  await loadProfile(spanHtml, spanBottomHtml);
  await loadRecipes();
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-toggle-recipe-details");
  if (!btn) return;

  const details = btn.parentElement.querySelector(".recipe-full-instructions");
  details.classList.toggle("open"); // vagy amilyen osztályt a CSS-ed használ
});
document
  .getElementById("submitRecipeBtn")
  .addEventListener("click", () => uploadRecipe());

async function uploadRecipe() {
  const thoughts = document.getElementById("postTextInput").value;
  const recipeTitle = document.getElementById("recipeTitleInput").value;
  const prepTime = document.getElementById("prepTimeInput").value;
  const difficulty = document.getElementById("difficultySelect").value;
  const servings = document.getElementById("servingsInput").value;
  const ingredients = document.getElementById("ingredientsInput").value;
  const cookingSteps = document.getElementById("instructionsInput").value;
  const imageFileInput = document.getElementById("imageFileInput").files[0];
  const visibility = document.getElementById("visibilitySelect").value;
  const hashtags = document
    .getElementById("hashtags")
    .value.replace(/\s+/g, "");
  const likescount = 0;
  const dateofpub = dayjs().format("YYYY-MM-DD");
  const fileExt = imageFileInput.name.split(".").pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const url = `public/${fileName}`;

  if (!imageFileInput) {
    alert("Válassz ki egy képet!");
    return;
  }

  //Upload image to Supabase Storage
  const uploadImage = await supabase.storage
    .from("recipeImages") // bucket neve
    .upload(url, imageFileInput); // helye a bucket-ben, fájl
  if (uploadImage.error) {
    console.error("Upload error:", uploadImage.error);
    return;
  }

  const response = await supabase.auth.getUser();
  const id = response.data?.user?.id;
  if (response.error) {
    console.error("Error during selecting the user:", response.error.message);
    return;
  }

  if (!id) {
    alert("Sign in to reach this feature!");
    return;
  }
  console.log(id);

  //Upload recipe and imageFilePath to Supabase
  if (visibility === "public") {
    const { error: insertError } = await supabase
      .from("public_recipes")
      .insert({
        nameid: id,
        likescount,
        dateofpub,
        thoughts,
        recipetitle: recipeTitle,
        preptime: prepTime,
        difficulty,
        servings,
        ingredients,
        cookingsteps: cookingSteps,
        imageSrc: url,
        hashtags,
      });
    if (insertError) {
      console.error("Insert error:", insertError);
      await supabase.storage.from("recipeImages").remove([url]);
      return;
    }
  }
  if (visibility === "private") {
    const { error: insertError } = await supabase
      .from("private_recipes")
      .insert({
        nameid: id,
        dateofpub,
        thoughts,
        recipetitle: recipeTitle,
        preptime: prepTime,
        difficulty,
        servings,
        ingredients,
        cookingsteps: cookingSteps,
        imageSrc: url,
        hashtags,
      });
    if (insertError) {
      console.error("Insert error:", insertError);
      await supabase.storage.from("recipeImages").remove([url]);
      return;
    }
  }

  await loadRecipes();
  alert("Recipe uploaded successfully!");
}

async function loadRecipes() {
  const userResponse = await supabase.auth.getSession();
  if (userResponse.error) {
    console.error(userResponse.error);
    return;
  }
  const user_id = userResponse.data.session.user.id;
  html = "";
  const { data: recipes, error: recipesError } = await supabase
    .from("public_recipes")
    .select();

  if (recipesError) {
    console.error("Error fetching recipes:", recipesError);
    return;
  }

  const recipesWithUsers = await Promise.all(
    recipes.map(async (recipe) => {
      const { data: userData } = await supabase
        .from("recipes_with_users")
        .select("username")
        .eq("nameid", recipe.nameid)
        .limit(1)
        .single();

      return {
        ...recipe,
        username: userData?.username || "Unknown writer!",
      };
    }),
  );

  recipesWithUsers.forEach((recipe) => {
    const username = recipe.username;
    const { data: img } = supabase.storage
      .from("recipeImages")
      .getPublicUrl(recipe.imageSrc);

    html += `
        <article class="feed-card" data-tags="${recipe.hashtags}" data-title="chocolate cake"
                    data-author="${username}">
                    <div class="post-header">
                        <div class="author-info">
                            <img class="author-avatar" src="https://placehold.co/600x400/d8c3ad/5a4030?text=${username}"
                                alt="${username}">
                            <div class="author-details">
                                <div class="author-name-row">
                                    <a href="personal page.html" class="author-name">${username}</a>
                                    <span class="author-badge">(You)</span>
                                </div>
                                <div class="author-handle-time">@${username} • ${recipe.dateofpub}</div>
                            </div>
                        </div>
                        ${
                          recipe.nameid !== user_id
                            ? `
                            <button class='follow-btn' data-user-id="${user_id} data-poster-id="${recipe.nameid}">Follow</button>
                            <a href="otheronesPage.html?uid=${encodeURIComponent(recipe.nameid)}&username=${encodeURIComponent(recipe.username)}"
                            class="btn-follow following js-view-profile">View Profile</a>
                            `
                            : ""
                        }
                        </div>
                    <div class="post-content">
                        ${recipe.thoughts}
                        <div class="post-tags">
                            ${(recipe.hashtags ?? "")
                              .split("#")
                              .filter(Boolean)
                              .map(
                                (t) => `<a href="#" class="tag-pill">#${t}</a>`,
                              )
                              .join("")}
                        </div>
                    </div>

                    <div class="post-recipe-card">
                        <img class="post-recipe-image"
                            src="${img.publicUrl}" alt="${recipe.recipetitle}">
                        <div class="post-recipe-meta">
                            <div class="recipe-title-text">${recipe.recipetitle}</div>
                            <div class="recipe-badges">
                                <span class="badge-item">Time: ${recipe.preptime}</span>
                                <span class="badge-item">Difficulty: ${recipe.difficulty}</span>
                                <span class="badge-item">Servings: ${recipe.servings}</span>
                            </div>
                            <button class="btn-toggle-recipe-details">
                                <span>Show Ingredients & Steps</span> ⌄
                            </button>
                            <div class="recipe-full-instructions">
                                <h4>Ingredients</h4>
                                <ul>
                                ${recipe.ingredients
                                  .split("\n")
                                  .map((i) => `<li>${i}</li>`)
                                  .join("")}
                                </ul>
                                <h4>Instructions</h4>
                                <p>${recipe.cookingsteps}</p>
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
                        <button class="action-btn like-btn liked js-like-btn" data-post-id="${recipe.id}" data-like-count="${recipe.likescount}">
                            Favorite <span class="like-count">${recipe.likescount}</span>
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
  });
  document.querySelector(".feed-timeline").innerHTML = html;
}
loadRecipes();

document.querySelector(".user-badge-nav").innerHTML = spanHtml;

export async function loadProfile(spanHtml, spanBottomHtml) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) {
    console.error("No SignedIn user!");
  }

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
      console.error("Insert error:", insertError);
      return;
    }

    // a frissített számláló visszaolvasása
    const { data: post, error: countError } = await supabase
      .from("public_recipes") // a tábla, ahol a like_count van
      .select("likescount")
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

document.addEventListener("click", async (e) => {
  const button = e.target.closest(".follow-btn");
  if (!button) return;

  button.disabled = true;
  try {
    const followedId = button.dataset.posterId;

    const { error } = await supabase
      .from("follows")
      .insert({ followedid: followedId });

    if (error) {
      if (error.code === "23505") {
        console.log("You're already following him.");
      } else {
        console.error(error);
      }
      return;
    }

    window.alert("Follow Successful!");
  } finally {
    button.disabled = false;
  }
});


loadProfile();

async function usersToFollow(user_id) {
  const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
  const divElement = document.getElementById("chefsToFollow");
  if (!divElement) return;

  const { data, error } = await supabase
    .from("recipes_with_users")
    .select("nameid, username")
    .neq("nameid", user_id);   // magadat ne ajánlja

  if (error) {
    console.error(error);
    return;
  }

  // minden szerző csak egyszer, max. 5 fő
  const uniqueUsers = [...new Map(data.map((u) => [u.nameid, u])).values()].slice(0, 5);

  divElement.innerHTML =
    `<div class="widget-title">Chefs to Follow</div>` +
    uniqueUsers
      .map(
        (user) => `
      <div class="chef-suggest-item">
        <div class="chef-suggest-info">
          <img src="https://placehold.co/600x400/927965/ffffff?text=${encodeURIComponent(user.username)}"
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

document.addEventListener("click", async (e) => {
  const button = e.target.closest(".btn-follow");
  if (!button) return;

  button.disabled = true;
  try {
    const followedId = button.dataset.userId;

    const { error } = await supabase
      .from("follows")
      .insert({ followedid: followedId });

    if (error) {
      if (error.code === "23505") {
        console.log("You're already following him.");
      } else {
        console.error(error);
      }
      return;
    }

    window.alert("Follow Successful!");
  } finally {
    button.disabled = false;
  }
});
await usersToFollow(session?.user?.id);

