let toggleInput = document.querySelector("#dn"); 

function applyTheme(theme) {
    let root = document.documentElement; 

    if (theme === "light") {
        root.classList.add("light");
        root.classList.remove("dark");
        if (toggleInput) toggleInput.checked = false; 
    } else {
        root.classList.add("dark");
        root.classList.remove("light");
        if (toggleInput) toggleInput.checked = true;
    }

    updateThemeImages(theme);      
    updateThemeBackgrounds(theme); 
}

function updateThemeImages(theme) {
    let images = document.querySelectorAll(".theme-img"); 

    images.forEach(img => {
        let newSrc = theme === "light" ? img.dataset.light : img.dataset.dark;
        if (newSrc) img.src = newSrc;
    });
}

function updateThemeBackgrounds(theme) {
    let elements = document.querySelectorAll(".theme-bg"); 

    elements.forEach(el => {
        let img = theme === "light" ? el.dataset.light : el.dataset.dark;
        if (img) el.style.backgroundImage = `url(${img})`;
    });
}

(function initTheme() {
    let savedTheme = localStorage.getItem("theme") || "dark"; 
    applyTheme(savedTheme);
})();

if (toggleInput) {
    toggleInput.addEventListener("change", () => {
        let newTheme = toggleInput.checked ? "dark" : "light"; 
        localStorage.setItem("theme", newTheme); 
        applyTheme(newTheme);
    });
}
