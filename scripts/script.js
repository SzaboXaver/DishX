const dropdowns = document.querySelectorAll(".recipe-dropdown");

dropdowns.forEach(dropdown => {

    dropdown.addEventListener("click", () => {

        const section =
            dropdown.closest(".recipe-section");

        section.classList.toggle("open");

    });

});


/* =========================
   RECIPE CARDS
   ========================= */

const recipeCards =
    document.querySelectorAll(".recipe-card");

const recipeDetails =
    document.querySelector(".recipe-details");


recipeCards.forEach(card => {

    card.addEventListener("click", function(event) {

        // Don't open the recipe when clicking the heart
        if (event.target.closest(".favorite-button")) {
            return;
        }

        if (recipeDetails) {
            recipeDetails.classList.toggle("open");
        }

    });

});