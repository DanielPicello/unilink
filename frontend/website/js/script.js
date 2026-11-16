const header = document.getElementById("header");

window.addEventListener("scroll", () => {
    if (!header) return;

    if (window.scrollY > 50) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});

const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");

function setMenuState(open) {
    if (!menuToggle || !mobileMenu) return;

    mobileMenu.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    menuToggle.innerHTML = `<i class='bx ${open ? "bx-x" : "bx-menu"}'></i>`;
}

if (menuToggle && mobileMenu) {
    menuToggle.setAttribute("aria-controls", "mobileMenu");
    menuToggle.setAttribute("aria-expanded", "false");

    menuToggle.addEventListener("click", () => {
        setMenuState(!mobileMenu.classList.contains("open"));
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMenuState(false));
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) setMenuState(false);
    });
}

const currentPage = window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll(".nav-links a, .mobile-nav-links a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
    }
});

const SOCIAL_LABELS = {
    "bxl-facebook": "Facebook",
    "bxl-instagram": "Instagram",
    "bxl-linkedin": "LinkedIn",
    "bxl-youtube": "YouTube",
};

document.querySelectorAll(".footer-social a").forEach((link) => {
    const icon = link.querySelector("i");
    if (!icon) return;

    const network = Object.keys(SOCIAL_LABELS).find((name) => icon.classList.contains(name));
    if (!network) return;

    link.setAttribute("aria-label", `${SOCIAL_LABELS[network]} da UniLink`);
    icon.setAttribute("aria-hidden", "true");
});

document.querySelectorAll("[data-toggle-password]").forEach((button) => {
    const input = document.getElementById(button.dataset.togglePassword);
    if (!input) return;

    button.addEventListener("click", () => {
        const revealing = input.type === "password";

        input.type = revealing ? "text" : "password";
        button.setAttribute("aria-pressed", String(revealing));
        button.setAttribute("aria-label", revealing ? "Ocultar senha" : "Mostrar senha");
        button.querySelector("i").className = `bx ${revealing ? "bx-hide" : "bx-show"}`;
        input.focus();
    });
});