document.documentElement.classList.add("nav-pending");

const AUTH_PAGES = ["login.html", "register.html"];

function navCurrentPage() {
    return window.location.pathname.split("/").pop() || "index.html";
}

function navPanelHref(user) {
    const panels = panelsForRole(user.role);
    return panels.length === 1 ? PANEL_FILES[panels[0]] : "dashboard.html";
}

function navPanelButton(user) {
    return `<a class="btn-register nav-panel-btn" href="${navPanelHref(user)}">
                <i class='bx bx-grid-alt'></i> Meu painel
            </a>`;
}

async function initSiteNav() {
    const page = navCurrentPage();

    try {
        const user = await getOptionalUser();

        if (AUTH_PAGES.includes(page)) {
            if (user) redirectToDefaultPanel(user.role);
            return;
        }

        if (!user) return;

        const desktop = document.querySelector(".nav-buttons");
        const mobile = document.querySelector(".mobile-nav-buttons");

        if (desktop) desktop.innerHTML = navPanelButton(user);
        if (mobile) mobile.innerHTML = navPanelButton(user);
    } catch (error) {
        console.error("Falha ao verificar a sessão:", error);
    } finally {
        document.documentElement.classList.remove("nav-pending");
    }
}

initSiteNav();