AOS.init({
    duration: 1000, 
    offset: 200,    
});
let starCount = 500;
for (let i = 0; i < starCount; i++) {
    let star = document.createElement("div");
    star.classList.add("star");
    star.style.width = star.style.height = Math.random() * 3 + 1 + "px";
    star.style.top = Math.random() * 280 + "%";
    star.style.left = Math.random() * 100 + "%";
    star.style.animationDuration = (Math.random() * 3 + 2) + "s";
    document.body.appendChild(star);
}
let mainMoon = document.querySelector(".main-moon"),
    tooltip = document.getElementById("moonTooltip"),
    moonPhaseName = document.getElementById("moonPhaseName"),
    moonIllumination = document.getElementById("moonIllumination"),
    moonDescription = document.getElementById("moonDescription"),
    calendarImgs = document.querySelectorAll("#moonCalendar img");

calendarImgs.forEach(img => {
    img.addEventListener("mouseover", (e) => {
        let phase = img.dataset.phase,
            illum = img.dataset.illum,
            desc = img.dataset.desc;

        moonPhaseName.textContent = phase;
        moonIllumination.textContent = `Illumination: ${illum}`;
        moonDescription.textContent = desc;
        mainMoon.src = img.src;
        tooltip.textContent = desc;
        let rect = img.getBoundingClientRect();
        tooltip.style.top = rect.top - 10 + "px";
        tooltip.style.left = rect.left + rect.width / 2 - 60 + "px";
        tooltip.style.opacity = 1;
    });

    img.addEventListener("mouseout", () => {
        tooltip.style.opacity = 0;
    });
});
let swiper = new Swiper(".mySwiper", {
    slidesPerView: 1,
    spaceBetween: 20,
    loop: true,
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    breakpoints: {
        768: {
            slidesPerView: 2,
        },
        1024: {
            slidesPerView: 3,
        },
    },
    autoplay: {
        delay: 3000,
    },
});