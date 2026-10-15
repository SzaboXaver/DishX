/* =========================================================
   DISHX COMMON APP LOGIC
   Handles: Notification Bell, Bookmarks Sync, Explore Grid & Modal
   ========================================================= */

// SHARED RECIPE DATASET
const DISHX_RECIPES = [
  {
    id: "post-1",
    authorName: "Krisztina",
    authorHandle: "@chef_krisztina",
    avatarUrl: "https://placehold.co/600x400/d8c3ad/5a4030?text=Krisztina",
    isOwner: true,
    timeAgo: "2h ago",
    text: "Just baked this rich, decadent Chocolate Cake! Super moist layers with a glossy ganache frosting. Here is the full recipe for everyone to try!",
    recipeTitle: "Rich Chocolate Layer Cake",
    prepTime: "45 mins",
    difficulty: "Medium",
    servings: "8 servings",
    ingredients:
      "2 cups all-purpose flour, 2 cups granulated sugar, 3/4 cup unsweetened cocoa powder, 2 tsp baking powder & 1.5 tsp baking soda, 2 large eggs & 1 cup milk, 1/2 cup vegetable oil & 1 cup boiling water",
    instructions:
      "Preheat oven to 350°F (175°C). Whisk together flour, sugar, cocoa, baking powder, and baking soda. Add eggs, milk, and oil; beat for 2 minutes. Stir in boiling water (batter will be thin). Pour into pans and bake for 30–35 minutes.",
    imageUrl:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80",
    tags: ["#Baking", "#ChocolateCake", "#Desserts"],
    likes: 48,
    liked: true,
    recooks: 12,
    repliesCount: 3,
    comments: [
      {
        user: "Marco (@gourmet_marco)",
        avatar: "https://placehold.co/600x400/b89b7d/5a4030?text=Marco",
        text: "That ganache gloss is unreal! Do you use dark or milk chocolate for it?",
      },
      {
        user: "Sarah (@baker_sarah)",
        avatar: "https://placehold.co/600x400/806653/ffffff?text=Sarah",
        text: "Saved to my baking wishlist! Trying this weekend.",
      },
    ],
  },
  {
    id: "post-2",
    authorName: "Chef Marco",
    authorHandle: "@gourmet_marco",
    avatarUrl: "https://placehold.co/600x400/b89b7d/5a4030?text=Marco",
    isOwner: false,
    timeAgo: "4h ago",
    text: "Rule #1 of authentic Carbonara: NO CREAM allowed! Just egg yolks, Pecorino Romano cheese, crispy Guanciale, and fresh black pepper. Silky perfection in 15 minutes!",
    recipeTitle: "Authentic Roman Pasta Carbonara",
    prepTime: "15 mins",
    difficulty: "Medium",
    servings: "2 servings",
    ingredients:
      "200g Spaghetti or Rigatoni, 100g Guanciale (or thick pancetta), 3 large egg yolks + 1 whole egg, 50g freshly grated Pecorino Romano, Freshly cracked black pepper",
    instructions:
      "Fry guanciale until golden and crispy. Whisk egg yolks with Pecorino and lots of black pepper. Boil pasta al dente. Reserve pasta water, combine hot pasta with guanciale, remove from heat, then quickly stir in egg mix with splash of starchy pasta water to create a creamy sauce.",
    imageUrl:
      "https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80",
    tags: ["#Pasta", "#Italian", "#QuickMeals"],
    likes: 142,
    liked: false,
    recooks: 45,
    repliesCount: 18,
    comments: [
      {
        user: "Krisztina (@chef_krisztina)",
        avatar: "https://placehold.co/600x400/d8c3ad/5a4030?text=Krisztina",
        text: "Guanciale makes all the difference! Beautiful technique Chef.",
      },
    ],
  },
  {
    id: "post-3",
    authorName: "Baker Sarah",
    authorHandle: "@baker_sarah",
    avatarUrl: "https://placehold.co/600x400/806653/ffffff?text=Sarah",
    isOwner: false,
    timeAgo: "6h ago",
    text: "Look at that open crumb structure! 80% hydration sourdough fermented for 24 hours in the fridge. The blistered crust crackles when you cut into it!",
    recipeTitle: "High-Hydration Artisan Sourdough",
    prepTime: "24 hrs",
    difficulty: "Hard",
    servings: "1 Large Loaf",
    ingredients:
      "400g Bread Flour + 100g Whole Wheat Flour, 400g Water (80% hydration), 100g Active Sourdough Starter, 10g Fine Sea Salt",
    instructions:
      "Autolyse flour and water for 1 hour. Mix in active starter and salt. Perform 4 stretch-and-folds over 2 hours. Bulk ferment until risen 50%. Shape into a boule, cold retard in banneton for 16-24 hours. Bake in preheated Dutch oven at 450°F covered for 20 mins, then uncovered for 20 mins.",
    imageUrl:
      "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&w=800&q=80",
    tags: ["#Bread", "#Sourdough", "#Baking"],
    likes: 89,
    liked: false,
    recooks: 29,
    repliesCount: 9,
    comments: [],
  },
  {
    id: "post-4",
    authorName: "Mario Rossi",
    authorHandle: "@pizza_mario",
    avatarUrl: "https://placehold.co/600x400/927965/ffffff?text=Mario",
    isOwner: false,
    timeAgo: "8h ago",
    text: "Classic Neapolitan Margherita pizza baked at 900°F! San Marzano tomatoes, fresh mozzarella di bufala, and fragrant basil leaves.",
    recipeTitle: "Wood-Fired Margherita Pizza",
    prepTime: "30 mins",
    difficulty: "Medium",
    servings: "2 Pizzas",
    ingredients:
      "500g Tipo 00 Flour, 325ml Water, 3g Fresh Yeast, 10g Sea Salt, San Marzano Tomatoes, Buffalo Mozzarella, Fresh Basil",
    instructions:
      "Prepare dough and ferment for 24h. Stretch out dough by hand, top with crushed San Marzano tomatoes and mozzarella slices. Bake in pizza oven or steel plate at max heat until charred crust bubbles.",
    imageUrl:
      "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80",
    tags: ["#Italian", "#Pizza", "#QuickMeals"],
    likes: 115,
    liked: false,
    recooks: 34,
    repliesCount: 14,
    comments: [],
  },
  {
    id: "post-5",
    authorName: "Chef Elena",
    authorHandle: "@pastry_elena",
    avatarUrl: "https://placehold.co/600x400/b89b7d/ffffff?text=Elena",
    isOwner: false,
    timeAgo: "12h ago",
    text: "Sun-dried tomatoes, spinach, and tender chicken breasts in a rich garlic cream sauce. Quick 20-minute dinner that tastes like a 5-star restaurant!",
    recipeTitle: "Creamy Tuscan Garlic Chicken",
    prepTime: "20 mins",
    difficulty: "Easy",
    servings: "4 servings",
    ingredients:
      "2 chicken breasts halved, 1 tbsp olive oil, 1 cup heavy cream, 1/2 cup chicken broth, 1 tsp garlic powder, 1 cup spinach, 1/2 cup sun-dried tomatoes",
    instructions:
      "Sear chicken in olive oil until golden. Remove chicken, sauté garlic and sun-dried tomatoes. Add cream and chicken broth, simmer until thickened. Stir in spinach and return chicken to pan.",
    imageUrl:
      "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=800&q=80",
    tags: ["#QuickMeals", "#Italian", "#Desserts"],
    likes: 204,
    liked: false,
    recooks: 67,
    repliesCount: 22,
    comments: [],
  },
  {
    id: "post-6",
    authorName: "Vegan Sam",
    authorHandle: "@vegan_eats",
    avatarUrl: "https://placehold.co/600x400/5a4030/ffffff?text=Sam",
    isOwner: false,
    timeAgo: "1d ago",
    text: "Start your morning with antioxidants! Frozen berries, avocado for creaminess, topped with chia seeds, coconut flakes, and fresh kiwi.",
    recipeTitle: "Tropical Berry Avocado Smoothie Bowl",
    prepTime: "10 mins",
    difficulty: "Easy",
    servings: "1 Bowl",
    ingredients:
      "1 cup frozen mixed berries, 1/2 ripe avocado, 1/2 cup almond milk, 1 tbsp chia seeds, Sliced kiwi & coconut flakes",
    instructions:
      "Blend frozen berries, avocado, and almond milk until smooth and thick. Pour into a bowl and arrange chia seeds, kiwi, and coconut on top.",
    imageUrl:
      "https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=800&q=80",
    tags: ["#QuickMeals", "#Desserts"],
    likes: 76,
    liked: false,
    recooks: 15,
    repliesCount: 5,
    comments: [],
  },
];

// LOCAL STORAGE BOOKMARKS MANAGER
function getSavedBookmarkIds() {
  try {
    const saved = localStorage.getItem("dishx_bookmarks");
    if (!saved) {
      // Default bookmarked post-1 (Chocolate Cake)
      const initial = ["post-1"];
      localStorage.setItem("dishx_bookmarks", JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(saved);
  } catch (e) {
    return ["post-1"];
  }
}

function toggleBookmark(postId) {
  let ids = getSavedBookmarkIds();
  if (ids.includes(postId)) {
    ids = ids.filter((id) => id !== postId);
  } else {
    ids.push(postId);
  }
  localStorage.setItem("dishx_bookmarks", JSON.stringify(ids));
  return ids.includes(postId);
}

function isBookmarked(postId) {
  return getSavedBookmarkIds().includes(postId);
}

// INITIALIZATION ON DOM LOADED
document.addEventListener("DOMContentLoaded", () => {
  /* =========================================================
       1. TOP-RIGHT NOTIFICATION BELL SYSTEM
       ========================================================= */
  const notifBellBtn = document.getElementById("notifBellBtn");
  const notifDropdown = document.getElementById("notifDropdown");
  const markReadBtn = document.getElementById("markReadBtn");
  const notifBadge = document.getElementById("notifBadge");

  if (notifBellBtn && notifDropdown) {
    notifBellBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!notifDropdown.contains(e.target) && e.target !== notifBellBtn) {
        notifDropdown.classList.remove("open");
      }
    });
  }

  if (markReadBtn && notifDropdown) {
    markReadBtn.addEventListener("click", () => {
      const unreadItems = notifDropdown.querySelectorAll(".notif-item.unread");
      unreadItems.forEach((item) => item.classList.remove("unread"));
      if (notifBadge) {
        notifBadge.style.display = "none";
      }
    });
  }

  /* =========================================================
       2. EXPLORE PAGE FUNCTIONALITY
       ========================================================= */
       /*
  const exploreGrid = document.getElementById("exploreGrid");
  const exploreSearchInput = document.getElementById("exploreSearchInput");
  const exploreTagPills = document.querySelectorAll(".explore-tag-pill");

  if (exploreGrid) {
    renderExploreGrid(DISHX_RECIPES);

    if (exploreSearchInput) {
      exploreSearchInput.addEventListener("input", () => {
        filterExploreGrid();
      });
    }

    if (exploreTagPills) {
      exploreTagPills.forEach((pill) => {
        pill.addEventListener("click", () => {
          exploreTagPills.forEach((p) => p.classList.remove("active"));
          pill.classList.add("active");
          filterExploreGrid();
        });
      });
    }
  }

  function filterExploreGrid() {
    if (!exploreGrid) return;
    const query = exploreSearchInput
      ? exploreSearchInput.value.toLowerCase().trim()
      : "";
    const activeTag =
      document.querySelector(".explore-tag-pill.active")?.dataset.tag || "all";

    const filtered = DISHX_RECIPES.filter((recipe) => {
      const matchesQuery =
        !query ||
        recipe.recipeTitle.toLowerCase().includes(query) ||
        recipe.text.toLowerCase().includes(query) ||
        recipe.authorName.toLowerCase().includes(query) ||
        recipe.ingredients.toLowerCase().includes(query) ||
        recipe.tags.some((t) => t.toLowerCase().includes(query));

      const matchesTag =
        activeTag === "all" ||
        recipe.tags.some((t) =>
          t.toLowerCase().includes(`#${activeTag.toLowerCase()}`),
        ) ||
        recipe.recipeTitle.toLowerCase().includes(activeTag.toLowerCase());

      return matchesQuery && matchesTag;
    });

    renderExploreGrid(filtered);
  }

  function renderExploreGrid(recipes) {
    if (!exploreGrid) return;
    exploreGrid.innerHTML = "";

    if (recipes.length === 0) {
      exploreGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #806653;">
                    <h3>No matching recipe posts found</h3>
                    <p style="margin-top: 6px;">Try searching for another dish, ingredient, or tag!</p>
                </div>
            `;
      return;
    }

    recipes.forEach((recipe) => {
      const card = document.createElement("div");
      card.className = "explore-card";
      card.setAttribute("data-id", recipe.id);

      const saved = isBookmarked(recipe.id);

      card.innerHTML = `
                <div class="explore-img-wrapper">
                    <img class="explore-img" src="${recipe.imageUrl}" alt="${recipe.recipeTitle}">
                    <div class="explore-overlay">
                        <span class="explore-badge">${recipe.prepTime} • ${recipe.difficulty}</span>
                        <button class="explore-view-btn">View Recipe Post</button>
                    </div>
                    <button class="explore-bookmark-btn ${saved ? "bookmarked" : ""}" data-id="${recipe.id}" title="${saved ? "Unsave Recipe" : "Save Recipe"}">
                        ${saved ? "Saved" : "Save"}
                    </button>
                </div>
                <div class="explore-card-info">
                    <h3 class="explore-recipe-title">${recipe.recipeTitle}</h3>
                    <div class="explore-author-row">
                        <img class="explore-author-avatar" src="${recipe.avatarUrl}" alt="${recipe.authorName}">
                        <span>${recipe.authorName} • ${recipe.likes} Likes</span>
                    </div>
                </div>
            `;

      // Clicking card or View button opens Modal
      card.addEventListener("click", (e) => {
        if (e.target.closest(".explore-bookmark-btn")) return;
        openRecipeModal(recipe);
      });

      // Bookmark button toggle
      const bookmarkBtn = card.querySelector(".explore-bookmark-btn");
      if (bookmarkBtn) {
        bookmarkBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const nowSaved = toggleBookmark(recipe.id);
          bookmarkBtn.classList.toggle("bookmarked", nowSaved);
          bookmarkBtn.textContent = nowSaved ? "Saved" : "Save";
          bookmarkBtn.title = nowSaved ? "Unsave Recipe" : "Save Recipe";
        });
      }

      exploreGrid.appendChild(card);
    });
  }
*/
  /* =========================================================
       3. RECIPE DETAIL MODAL DIALOG
       ========================================================= */
       /*
  function openRecipeModal(recipe) {
    let modalBackdrop = document.getElementById("recipeModalBackdrop");
    if (!modalBackdrop) {
      modalBackdrop = document.createElement("div");
      modalBackdrop.id = "recipeModalBackdrop";
      modalBackdrop.className = "modal-backdrop";
      document.body.appendChild(modalBackdrop);
    }

    const ingredientsHtml = recipe.ingredients
      .split(",")
      .map((i) => `<li>${i.trim()}</li>`)
      .join("");

    const saved = isBookmarked(recipe.id);

    modalBackdrop.innerHTML = `
            <div class="modal-dialog">
                <button class="modal-close-btn" id="modalCloseBtn">&times;</button>
                <article class="feed-card" style="border: none; box-shadow: none; padding: 0;">
                    <div class="post-header">
                        <div class="author-info">
                            <img class="author-avatar" src="${recipe.avatarUrl}" alt="${recipe.authorName}">
                            <div class="author-details">
                                <div class="author-name-row">
                                    <span class="author-name">${recipe.authorName}</span>
                                    ${recipe.isOwner ? '<span class="author-badge">(You)</span>' : ""}
                                </div>
                                <div class="author-handle-time">${recipe.authorHandle} • ${recipe.timeAgo}</div>
                            </div>
                        </div>
                    </div>

                    <div class="post-content">
                        ${recipe.text}
                        <div class="post-tags">
                            ${recipe.tags.map((t) => `<a href="#" class="tag-pill">${t}</a>`).join("")}
                        </div>
                    </div>

                    <div class="post-recipe-card">
                        <img class="post-recipe-image" src="${recipe.imageUrl}" alt="${recipe.recipeTitle}">
                        <div class="post-recipe-meta">
                            <div class="recipe-title-text">${recipe.recipeTitle}</div>
                            <div class="recipe-badges">
                                <span class="badge-item">Time: ${recipe.prepTime}</span>
                                <span class="badge-item">Difficulty: ${recipe.difficulty}</span>
                                <span class="badge-item">Servings: ${recipe.servings}</span>
                            </div>
                            <div class="recipe-full-instructions open" style="display: block;">
                                <h4>Ingredients</h4>
                                <ul>${ingredientsHtml}</ul>
                                <h4>Instructions</h4>
                                <p>${recipe.instructions}</p>
                            </div>
                        </div>
                    </div>

                    <div class="post-action-bar">
                        <button class="action-btn modal-like-btn ${recipe.liked ? "liked" : ""}">
                            Favorite <span class="modal-like-count">${recipe.likes}</span>
                        </button>
                        <button class="action-btn modal-bookmark-btn ${saved ? "bookmarked" : ""}">
                            ${saved ? "Saved" : "Save"}
                        </button>
                        <button class="action-btn modal-share-btn">
                            Share
                        </button>
                    </div>
                </article>
            </div>
        `;

    // Open modal animation
    requestAnimationFrame(() => {
      modalBackdrop.classList.add("open");
    });

    // Close events
    const closeBtn = modalBackdrop.querySelector("#modalCloseBtn");
    closeBtn.addEventListener("click", () => {
      modalBackdrop.classList.remove("open");
    });

    modalBackdrop.addEventListener("click", (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove("open");
      }
    });

    // Modal Bookmark button toggle
    const modalBookmarkBtn = modalBackdrop.querySelector(".modal-bookmark-btn");
    if (modalBookmarkBtn) {
      modalBookmarkBtn.addEventListener("click", () => {
        const nowSaved = toggleBookmark(recipe.id);
        modalBookmarkBtn.classList.toggle("bookmarked", nowSaved);
        modalBookmarkBtn.textContent = nowSaved ? "Saved" : "Save";

        // Re-render Explore or Bookmarks grid if open
        if (exploreGrid) filterExploreGrid();
        if (document.getElementById("bookmarksContainer"))
          renderBookmarksPage();
      });
    }
  }
*/
  /* =========================================================
       4. BOOKMARKS PAGE FUNCTIONALITY
       ========================================================= */
  const bookmarksCountPill = document.getElementById("bookmarksCountPill");

  /*
    function renderBookmarksPage() {
        if (!bookmarksContainer) return;

        const savedIds = getSavedBookmarkIds();
        const savedRecipes = DISHX_RECIPES.filter(r => savedIds.includes(r.id));

        if (bookmarksCountPill) {
            bookmarksCountPill.textContent = `${savedRecipes.length} Saved Recipe${savedRecipes.length === 1 ? '' : 's'}`;
        }


        bookmarksContainer.innerHTML = "";

        savedRecipes.forEach(recipe => {
            const card = document.createElement("article");
            card.className = "feed-card";
            card.setAttribute("data-id", recipe.id);

            const ingredientsList = recipe.ingredients.split(",")
                .map(i => `<li>${i.trim()}</li>`).join("");

            card.innerHTML = `
                <div class="post-header">
                    <div class="author-info">
                        <img class="author-avatar" src="${recipe.avatarUrl}" alt="${recipe.authorName}">
                        <div class="author-details">
                            <div class="author-name-row">
                                <span class="author-name">${recipe.authorName}</span>
                                ${recipe.isOwner ? '<span class="author-badge">(You)</span>' : ''}
                            </div>
                            <div class="author-handle-time">${recipe.authorHandle} • ${recipe.timeAgo}</div>
                        </div>
                    </div>
                </div>

                <div class="post-content">
                    ${recipe.text}
                    <div class="post-tags">
                        ${recipe.tags.map(t => `<a href="#" class="tag-pill">${t}</a>`).join("")}
                    </div>
                </div>

                <div class="post-recipe-card">
                    <img class="post-recipe-image" src="${recipe.imageUrl}" alt="${recipe.recipeTitle}">
                    <div class="post-recipe-meta">
                        <div class="recipe-title-text">${recipe.recipeTitle}</div>
                        <div class="recipe-badges">
                            <span class="badge-item">Time: ${recipe.prepTime}</span>
                            <span class="badge-item">Difficulty: ${recipe.difficulty}</span>
                            <span class="badge-item">Servings: ${recipe.servings}</span>
                        </div>
                        <button class="btn-toggle-recipe-details">
                            <span>Show Ingredients & Steps</span> ⌄
                        </button>
                        <div class="recipe-full-instructions">
                            <h4>Ingredients</h4>
                            <ul>${ingredientsList}</ul>
                            <h4>Instructions</h4>
                            <p>${recipe.instructions}</p>
                        </div>
                    </div>
                </div>

                <div class="post-action-bar">
                    <button class="action-btn like-btn ${recipe.liked ? 'liked' : ''}">
                        Favorite <span class="like-count">${recipe.likes}</span>
                    </button>
                    <button class="action-btn bookmark-btn bookmarked">
                        Saved
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
                    toggleDetailsBtn.querySelector("span").textContent = isOpen ? "Hide Ingredients & Steps" : "Show Ingredients & Steps";
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

            bookmarksContainer.appendChild(card);
        });
    }*/
});
