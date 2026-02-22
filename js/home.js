
let texts = [
    "Tracking the sky, moment by moment.",
    "Weather updates you can trust.",
    "Follow the moon. Feel the rhythm.",
    "Real-time weather. Real-time sky.",
    "Your window to the atmosphere."
];

let intro = document.getElementById("introText");
let index = 0;

function cycleText() {
    intro.classList.remove("show");

    setTimeout(() => {
        intro.textContent = texts[index];
        intro.classList.add("show");
        index = (index + 1) % texts.length; 
    }, 400);
}

cycleText();
setInterval(cycleText, 3000);

let starsContainer = document.querySelector(".stars-bg");

function createStars(count = 120) {
    for (let i = 0; i < count; i++) {
        let star = document.createElement("span");

        star.style.top = Math.random() * 100 + "%";
        star.style.left = Math.random() * 100 + "%";

        let size = Math.random() * 2 + 1;
        star.style.width = size + "px";
        star.style.height = size + "px";

        star.style.animationDuration = (Math.random() * 20 + 10) + "s";

        starsContainer.appendChild(star);
    }
}

createStars(150); 
