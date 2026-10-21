document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================
       1. RECIPE COMPOSER EXTRA FIELDS TOGGLE
       ========================================== */
    const toggleFieldsBtn = document.getElementById("toggleRecipeFields");
    const extraFields = document.getElementById("recipeExtraFields");

    if (toggleFieldsBtn && extraFields) {
        toggleFieldsBtn.addEventListener("click", () => {
            extraFields.classList.toggle("open");
            const isOpen = extraFields.classList.contains("open");
            toggleFieldsBtn.innerHTML = isOpen ? "Hide Recipe Details" : "+ Add Recipe Details (Ingredients & Time)";
        });
    }

    /* ==========================================
       2. POST COMPOSER SUBMISSION
       ========================================== */
       /*
    const submitBtn = document.getElementById("submitRecipeBtn");
    const postTextInput = document.getElementById("postTextInput");
    const recipeTitleInput = document.getElementById("recipeTitleInput");
    const prepTimeInput = document.getElementById("prepTimeInput");
    const difficultySelect = document.getElementById("difficultySelect");
    const servingsInput = document.getElementById("servingsInput");
    const ingredientsInput = document.getElementById("ingredientsInput");
    const instructionsInput = document.getElementById("instructionsInput");
    const imageUrlInput = document.getElementById("imageUrlInput");
    const feedTimeline = document.getElementById("feedTimeline");

    if (submitBtn && feedTimeline) {
        submitBtn.addEventListener("click", (e) => {
            e.preventDefault();

            const text = postTextInput ? postTextInput.value.trim() : "";
            const title = recipeTitleInput ? recipeTitleInput.value.trim() : "";
            const prepTime = prepTimeInput ? prepTimeInput.value.trim() : "20 mins";
            const difficulty = difficultySelect ? difficultySelect.value : "Easy";
            const servings = servingsInput ? servingsInput.value.trim() : "4 servings";
            const ingredients = ingredientsInput ? ingredientsInput.value.trim() : "";
            const instructions = instructionsInput ? instructionsInput.value.trim() : "";
            let imageUrl = imageUrlInput ? imageUrlInput.value.trim() : "";

            if (!text && !title) {
                alert("Please type a message or enter a recipe title to share!");
                return;
            }

            if (!imageUrl) {
                imageUrl = "https://placehold.co/600x400/d8c3ad/5a4030?text=Fresh+Homemade+Recipe";
            }

            const newCard = createPostCard({
                authorName: "Krisztina",
                authorHandle: "@chef_krisztina",
                avatarUrl: "https://placehold.co/600x400/d8c3ad/5a4030?text=Krisztina",
                isOwner: true,
                timeAgo: "Just now",
                text: text,
                recipeTitle: title || "Chef's Special Creation",
                prepTime: prepTime,
                difficulty: difficulty,
                servings: servings,
                ingredients: ingredients || "Fresh ingredients, love, and care.",
                instructions: instructions || "Mix ingredients, cook to perfection, serve warm!",
                imageUrl: imageUrl,
                tags: ["#MyRecipe", "#FreshCook", "#Homemade"]
            });

            // Prepend new card to the timeline
            feedTimeline.insertBefore(newCard, feedTimeline.firstChild);

            // Reset form
            if (postTextInput) postTextInput.value = "";
            if (recipeTitleInput) recipeTitleInput.value = "";
            if (ingredientsInput) ingredientsInput.value = "";
            if (instructionsInput) instructionsInput.value = "";
            if (imageUrlInput) imageUrlInput.value = "";

            if (extraFields) extraFields.classList.remove("open");
            if (toggleFieldsBtn) toggleFieldsBtn.innerHTML = "+ Add Recipe Details (Ingredients & Time)";
        });
    }
*/
    /* ==========================================
       3. HELPER TO CREATE DYNAMIC FEED CARDS
       ========================================== */
    function createPostCard(data) {
        const card = document.createElement("article");
        card.className = "feed-card";
        card.setAttribute("data-tags", data.tags.join(" ").toLowerCase());
        card.setAttribute("data-title", data.recipeTitle.toLowerCase());
        card.setAttribute("data-author", data.authorName.toLowerCase());

        const ingredientsList = data.ingredients.split(",")
            .map(i => `<li>${i.trim()}</li>`).join("");

        card.innerHTML = `
            <div class="post-header">
                <div class="author-info">
                    <img class="author-avatar" src="${data.avatarUrl}" alt="${data.authorName}">
                    <div class="author-details">
                        <div class="author-name-row">
                            <a href="personal page.html" class="author-name">${data.authorName}</a>
                            ${data.isOwner ? '<span class="author-badge">(You)</span>' : ''}
                        </div>
                        <div class="author-handle-time">${data.authorHandle} • ${data.timeAgo}</div>
                    </div>
                </div>
                ${!data.isOwner ? '<button class="btn-follow">+ Follow</button>' : '<a href="personal page.html" class="btn-follow following">View Profile</a>'}
            </div>

            <div class="post-content">
                ${data.text}
                <div class="post-tags">
                    ${data.tags.map(t => `<a href="#" class="tag-pill">${t}</a>`).join("")}
                </div>
            </div>

            <div class="post-recipe-card">
                <img class="post-recipe-image" src="${data.imageUrl}" alt="${data.recipeTitle}">
                <div class="post-recipe-meta">
                    <div class="recipe-title-text">${data.recipeTitle}</div>
                    <div class="recipe-badges">
                        <span class="badge-item">Time: ${data.prepTime}</span>
                        <span class="badge-item">Difficulty: ${data.difficulty}</span>
                        <span class="badge-item">Servings: ${data.servings}</span>
                    </div>
                    <button class="btn-toggle-recipe-details">
                        <span>Show Ingredients & Steps</span> ⌄
                    </button>
                    <div class="recipe-full-instructions">
                        <h4>Ingredients</h4>
                        <ul>${ingredientsList}</ul>
                        <h4>Instructions</h4>
                        <p>${data.instructions}</p>
                    </div>
                </div>
            </div>

            <div class="post-action-bar">
                <button class="action-btn comment-btn">
                    Replies <span class="comment-count">0</span>
                </button>
                <button class="action-btn recook-btn">
                    Re-cook <span class="recook-count">0</span>
                </button>
                <button class="action-btn like-btn">
                    Favorite <span class="like-count">0</span>
                </button>
                <button class="action-btn bookmark-btn">
                    Save
                </button>
                <button class="action-btn share-btn">
                    Share
                </button>
            </div>

            <div class="post-comments-container">
                <div class="comment-list"></div>
                <div class="add-comment-row">
                    <input type="text" class="add-comment-input" placeholder="Write a reply or ask about ingredients...">
                    <button class="btn-send-comment">Reply</button>
                </div>
            </div>
        `;

        bindCardEvents(card);
        return card;
    }

    /* ==========================================
       4. BIND INTERACTION EVENTS TO CARDS
       ========================================== */
    function bindCardEvents(card) {
        // Toggle Recipe Details
        const toggleBtn = card.querySelector(".btn-toggle-recipe-details");
        const detailsPanel = card.querySelector(".recipe-full-instructions");

        if (toggleBtn && detailsPanel) {
            toggleBtn.addEventListener("click", () => {
                detailsPanel.classList.toggle("open");
                const isOpen = detailsPanel.classList.contains("open");
                toggleBtn.querySelector("span").textContent = isOpen ? "Hide Ingredients & Steps" : "Show Ingredients & Steps";
            });
        }

        // Like Button
        const likeBtn = card.querySelector(".like-btn");
        const likeCountEl = card.querySelector(".like-count");
        if (likeBtn && likeCountEl) {
            likeBtn.addEventListener("click", () => {
                likeBtn.classList.toggle("liked");
                let count = parseInt(likeCountEl.textContent) || 0;
                if (likeBtn.classList.contains("liked")) {
                    likeBtn.innerHTML = `Favorited <span class="like-count">${count + 1}</span>`;
                } else {
                    likeBtn.innerHTML = `Favorite <span class="like-count">${Math.max(0, count - 1)}</span>`;
                }
            });
        }

        // Re-cook Button
        const recookBtn = card.querySelector(".recook-btn");
        const recookCountEl = card.querySelector(".recook-count");
        if (recookBtn && recookCountEl) {
            recookBtn.addEventListener("click", () => {
                recookBtn.classList.toggle("reposted");
                let count = parseInt(recookCountEl.textContent) || 0;
                if (recookBtn.classList.contains("reposted")) {
                    count++;
                } else {
                    count = Math.max(0, count - 1);
                }
                recookCountEl.textContent = count;
            });
        }

        // Bookmark Button
        const bookmarkBtn = card.querySelector(".bookmark-btn");
        if (bookmarkBtn) {
            bookmarkBtn.addEventListener("click", () => {
                bookmarkBtn.classList.toggle("bookmarked");
                bookmarkBtn.textContent = bookmarkBtn.classList.contains("bookmarked") ? "Saved" : "Save";
            });
        }

        // Share Button
        const shareBtn = card.querySelector(".share-btn");
        if (shareBtn) {
            shareBtn.addEventListener("click", () => {
                alert(`Recipe link copied to clipboard! Share this tasty dish.`);
            });
        }

        // Toggle Comments Drawer
        const commentBtn = card.querySelector(".comment-btn");
        const commentsContainer = card.querySelector(".post-comments-container");
        if (commentBtn && commentsContainer) {
            commentBtn.addEventListener("click", () => {
                commentsContainer.classList.toggle("open");
            });
        }

        // Send Comment
        const sendCommentBtn = card.querySelector(".btn-send-comment");
        const commentInput = card.querySelector(".add-comment-input");
        const commentList = card.querySelector(".comment-list");
        const commentCountEl = card.querySelector(".comment-count");

        if (sendCommentBtn && commentInput && commentList) {
            sendCommentBtn.addEventListener("click", () => {
                const text = commentInput.value.trim();
                if (!text) return;

                const commentItem = document.createElement("div");
                commentItem.className = "comment-item";
                commentItem.innerHTML = `
                    <img class="comment-avatar" src="https://placehold.co/600x400/d8c3ad/5a4030?text=Krisztina" alt="Krisztina">
                    <div class="comment-body">
                        <span class="comment-user">Krisztina (@chef_krisztina)</span>
                        <span class="comment-text">${text}</span>
                    </div>
                `;
                commentList.appendChild(commentItem);
                commentInput.value = "";

                if (commentCountEl) {
                    let count = parseInt(commentCountEl.textContent) || 0;
                    commentCountEl.textContent = count + 1;
                }
            });

            commentInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    sendCommentBtn.click();
                }
            });
        }

        // Follow Button
        const followBtn = card.querySelector(".btn-follow");
        if (followBtn && !followBtn.classList.contains("following")) {
            followBtn.addEventListener("click", () => {
                followBtn.classList.toggle("following");
                followBtn.textContent = followBtn.classList.contains("following") ? "Following" : "+ Follow";
            });
        }
    }

    // Attach events to static existing cards
    document.querySelectorAll(".feed-card").forEach(card => bindCardEvents(card));

    /* ==========================================
       5. FEED TABS FILTERING
       ========================================== */
    const feedTabs = document.querySelectorAll(".feed-tab");
    feedTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            feedTabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const filter = tab.getAttribute("data-tab");
            const cards = document.querySelectorAll(".feed-card");

            cards.forEach(card => {
                if (filter === "for-you") {
                    card.style.display = "flex";
                } else if (filter === "following") {
                    // Show posts by followed chefs or user
                    const isOwner = card.getAttribute("data-author") === "krisztina";
                    const isFollowing = card.querySelector(".btn-follow.following");
                    if (isOwner || isFollowing) {
                        card.style.display = "flex";
                    } else {
                        card.style.display = "none";
                    }
                } else if (filter === "trending") {
                    // Show cards with higher likes or specific tags
                    const likeCount = parseInt(card.querySelector(".like-count")?.textContent || "0");
                    if (likeCount >= 10 || card.getAttribute("data-tags")?.includes("trending") || card.getAttribute("data-tags")?.includes("viral")) {
                        card.style.display = "flex";
                    } else {
                        card.style.display = "flex";
                    }
                }
            });
        });
    });

    /* ==========================================
       6. LIVE SEARCH FILTERING
       ========================================== */
    const searchInput = document.getElementById("feedSearchInput");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = searchInput.value.toLowerCase().trim();
            const cards = document.querySelectorAll(".feed-card");

            cards.forEach(card => {
                const title = card.getAttribute("data-title") || "";
                const tags = card.getAttribute("data-tags") || "";
                const author = card.getAttribute("data-author") || "";
                const text = card.querySelector(".post-content")?.textContent.toLowerCase() || "";

                if (title.includes(query) || tags.includes(query) || author.includes(query) || text.includes(query)) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        });
    }

});
