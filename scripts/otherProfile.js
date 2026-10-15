console.log("otherProfile.js betöltve");
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const supabase = createClient(
  "https://zlncrzsnizkozucrkvyn.supabase.co", //Project URL
  "sb_publishable_RJZkVfaz6GD0OF1jTFLTGQ_T9ESEubR", //Publishable key
);
const {
  data: { session },
} = await supabase.auth.getSession();
if (!{ session }) {
  console.error("No signed in User!");
}
const params = new URLSearchParams(window.location.search);
const user_id = params.get("uid");
const username = params.get("username");
console.log("URL uid:", user_id, "| session uid:", session?.user?.id);
if (!user_id) {
  console.error("Missing uid in URL");
}
async function loadProfile() {


  const topBar = document.querySelector(".profile");

  console.log(user_id, username);
  let html = `
<img
    src="https://placehold.co/600x400/d8c3ad/5a4030?text=${username}"
    alt="@${username}"
    id="pic"
>

<div class="profile-info">

    <p id="name">
        name: ${username}
    </p>

    <p id="uid">
        uid: ${user_id}
    </p>

</div>
`;
  topBar.innerHTML = html;
  document.querySelector(".user-badge-nav").innerHTML = `
     <img src="https://placehold.co/600x400/d8c3ad/5a4030?text=${username}" alt="${username}">
    <span>${username}</span>
  `;
  await loadRecipes(user_id, username);
}

await loadProfile();

async function loadRecipes(user_id, user_name) {
  const divElement = document.getElementById("myRecipes");

  const pubResponse = await supabase
    .from("public_recipes")
    .select()
    .eq("nameid", user_id);

  const privResponse = await supabase
    .from("private_recipes")
    .select()
    .eq("nameid", user_id);

  const allRecipes = [];
  for (let x of pubResponse.data) {
    allRecipes.push(x);
  }
  for (let y of privResponse.data) {
    allRecipes.push(y);
  }
  divElement.innerHTML = allRecipes
    .map((recipe) => {
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
                        ${recipe.recipetitle}
                    </div>
    
                </div>
    
            </div>
    
    
            <!-- FULL WIDTH RECIPE CONTENT -->
    
            <div class="recipe-details">
    
                <h2>
                    ${recipe.recipetitle}
                </h2>
                <h3>
                    Ingredients
                </h3>
                
                <p>
                    ${recipe.ingredients}
                </p>
    
                <h3>
                    Instructions
                </h3>
    
                <p>
                    ${recipe.cookingsteps}
                </p>
    
            </div>
  `;
    })

    .join("");
  divElement.querySelectorAll(".recipe-card").forEach((card) => {
    card.addEventListener("click", () => {
      card.nextElementSibling.classList.toggle("open");
    });
  });
}

async function loadFavoriteRecipes() {
  const divElement = document.getElementById("favoriteRecipes");
  if (!divElement) return;
  let html = ``;
  divElement.innerHTML = html;

  const user_id = user_id;

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

allRecipes.forEach((recipe) => {
    const username = recipe.username;
    const { data: img } = supabase.storage
      .from("recipeImages")
      .getPublicUrl(recipe.imageSrc);

    const card = document.createElement("article");
    card.className = "feed-card";
    card.setAttribute("data-id", recipe.id);

    const ingredientsList = recipe.ingredients
      .split(",")
      .map((i) => `<li>${i.trim()}</li>`)
      .join("");
      
      html += `
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
                        ${recipe.recipetitle}
                    </div>
    
                </div>
    
            </div>
    
    
            <!-- FULL WIDTH RECIPE CONTENT -->
    
            <div class="recipe-details">
    
                <h2>
                    ${recipe.recipetitle}
                </h2>
                <h3>
                    Ingredients
                </h3>
                
                <p>
                    ${recipe.ingredients}
                </p>
    
                <h3>
                    Instructions
                </h3>
    
                <p>
                    ${recipe.cookingsteps}
                </p>
    
            </div>`;
      divElement.innerHTML = html;
});
}
await loadFavoriteRecipes();