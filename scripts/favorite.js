const favoriteButtons =
    document.querySelectorAll(".favorite-button");

favoriteButtons.forEach(button => {

    button.addEventListener("click", () => {

        button.classList.toggle("favorite");

        if (button.classList.contains("favorite")) {
            button.textContent = "♥";
        } else {
            button.textContent = "♡";
        }

    });

});