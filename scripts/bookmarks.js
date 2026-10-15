import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase = createClient(
  "https://zlncrzsnizkozucrkvyn.supabase.co", //Project URL
  "sb_publishable_RJZkVfaz6GD0OF1jTFLTGQ_T9ESEubR", //Publishable key
);
const {
  data: { session },
} = await supabase.auth.getSession();
if (!{ session }) console.error("No signed in User!"); else {
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

async function loadSavedRecipes() {
  const divElement = document.getElementById("bookmarksContainer");
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
  const allRecipes = []; 

for (const x of response.data) {
  const post_id = x.post_id;
  console.log("post_id:", x.post_id, typeof x.post_id);

  const { data: recipes, error: recipesError } = await supabase
    .from("public_recipes")
    .select()
    .eq("id", post_id);
console.log("recipes:", recipes, "error:", recipesError);
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
    })
  );

  allRecipes.push(...recipesWithUsers);
}


if(allRecipes.length == 0) {
    html = `
     <div class="bookmarks-empty-state">
      <h3 class="bookmarks-empty-title">No Saved Recipes Yet</h3>
      <p class="bookmarks-empty-text">When you find recipes you want to save or cook later, click Save and they will appear right here!</p>
      <a href="explore.html" class="btn-explore-now">Explore Recipes</a>
    </div>`;
    divElement.innerHTML = html;
}

document.querySelector('.bookmarks-header-card').innerHTML = `
    <div>
    <h1 class="bookmarks-title">Saved Bookmarks</h1>
    <p class="bookmarks-subtitle">Quickly access all the recipe posts you have saved for cooking later.</p>
    </div>
    <span class="bookmarks-count-pill" id="bookmarksCountPill">${allRecipes.length} Saved Recipe</span>
`;

  allRecipes.forEach((recipe) => {
    const username = recipe.username;
    const { data: img } = supabase.storage
      .from("recipeImages")
      .getPublicUrl(recipe.imageSrc);

    const card = document.createElement("article");
    card.className = "feed-card";
    card.setAttribute("data-id", recipe.id);

    card.innerHTML = `
                <div class="post-header">
                    <div class="author-info">
                        <img class="author-avatar" src="https://placehold.co/600x400/d8c3ad/5a4030?text=${username}" alt="${username}">
                        <div class="author-details">
                            <div class="author-name-row">
                                <span class="author-name">${username}</span>
                                ${user_id === recipe.nameid ? '<span class="author-badge">(You)</span>' : ""}
                            </div>
                            <div class="author-handle-time">${username} • ${recipe.dateofpub}</div>
                        </div>
                    </div>
                </div>

                <div class="post-content">
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
                    <img class="post-recipe-image" src="${img.publicUrl}" alt="${recipe.recipetitle}">
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
                            <ul>${recipe.ingredients
                                  .split("\n")
                                  .map((i) => `<li>${i}</li>`)
                                  .join("")}</ul>
                            <h4>Instructions</h4>
                            <p>${recipe.cookingsteps}</p>
                        </div>
                    </div>
                </div>

                <div class="post-action-bar">
                    <button class="action-btn like-btn ${recipe.likescount ? "liked" : ""}">
                        Favorite <span class="like-count">${recipe.likescount}</span>
                    </button>
                    <button class="action-btn bookmark-btn bookmarked js-unsave" data-user-id="${user_id}" data-post-id="${recipe.id}">
                        Unsave
                    </button>
                    <button class="action-btn share-btn">
                        Share
                    </button>
                </div>
            `;

    // Expand details button
    const toggleDetailsBtn = card.querySelector(".btn-toggle-recipe-details");
    const detailsPanel = card.querySelector(".recipe-full-instructions");
    if (toggleDetailsBtn && detailsPanel) {
      toggleDetailsBtn.addEventListener("click", () => {
        detailsPanel.classList.toggle("open");
        const isOpen = detailsPanel.classList.contains("open");
        toggleDetailsBtn.querySelector("span").textContent = isOpen
          ? "Hide Ingredients & Steps"
          : "Show Ingredients & Steps";
      });
    }

    // Bookmark button toggle in Bookmarks list
    const bookmarkBtn = card.querySelector(".bookmark-btn");
    if (bookmarkBtn) {
      bookmarkBtn.addEventListener("click", () => {
        toggleBookmark(recipe.id);
        renderBookmarksPage(); // Immediately re-render so unsaved recipe disappears!
      });
    }

    divElement.appendChild(card);
  });
}

document.addEventListener("click",async (e)=>{
    const unsaveButton = e.target.closest('.js-unsave');
    if(!unsaveButton) return;
    const userId = unsaveButton.dataset.userId;
    const postId = unsaveButton.dataset.postId;
    const { data, error } = await supabase
  .from("favorite")
  .delete()
  .eq("post_id", postId)
  .eq("user_id", userId)
  .select();

console.log("deleted:", data, "error:", error);

if (error) {
  console.error(error);
  window.alert("Unsave failed!");
  return;
}
if (!data || data.length === 0) {
  window.alert("Nothing was deleted.");
  return;
}
window.alert("Successful unsave!");
});

await loadProfile();
await loadSavedRecipes();

