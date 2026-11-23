const dashCards = document.querySelectorAll(".dash-card");
const dashGrid = document.getElementById("dashGrid");
const dashAvatar = document.getElementById("dashAvatar");
const dashUserName = document.getElementById("dashUserName");
const dashUserEmail = document.getElementById("dashUserEmail");
const dashUserRole = document.getElementById("dashUserRole");
const dashSubtitle = document.getElementById("dashSubtitle");
const dashLogout = document.getElementById("dashLogout");

function cardPanelKey(card) {
    if (card.dataset.role) return card.dataset.role;

    const match = card.className.match(/dash-card-(aluno|professor|empresa)/);
    if (match) {
        console.warn(
            `Card "${card.className}" sem data-role. Use data-role="${match[1]}".`
        );
        return match[1];
    }

    console.error(`Card sem data-role nem classe de painel: "${card.className}"`);
    return null;
}

function applySubtitle(visiblePanels) {
    if (visiblePanels.length === 2) {
        dashSubtitle.textContent =
            "Você tem perfil de aluno e de professor. Escolha por onde quer começar.";
    } else if (visiblePanels.length === 3) {
        dashSubtitle.textContent =
            "Você tem acesso a todos os painéis. Escolha qual quer abrir.";
    }
}

async function renderUser(user, visiblePanels) {
    const name = displayName(user);

    const photoUrl = await loadProfilePhoto();
    applyAvatarPhoto(dashAvatar, name, photoUrl);
    dashAvatar.title = user.email;
    const setupAlert = document.getElementById("dashSetupAlert");
    if (setupAlert) setupAlert.hidden = !teacherNeedsSetup(user);
    const publishAlert = document.getElementById("dashPublishAlert");
    if (publishAlert) publishAlert.hidden = !teacherNeedsPublish(user);
    dashUserName.textContent = name;
    dashUserEmail.textContent = user.email;
    dashUserRole.textContent = roleLabel(user.role);

    dashGrid.classList.toggle("dash-grid-double", visiblePanels.length === 2);
    applySubtitle(visiblePanels);

    dashCards.forEach((card) => {
        const key = cardPanelKey(card);
        const allowed = key !== null && visiblePanels.includes(key);
        card.style.display = allowed ? "" : "none";
    });
}

dashCards.forEach((card) => {
    const btn = card.querySelector(".dash-btn");

    card.addEventListener("click", (event) => {
        if (event.target.closest(".dash-btn")) return;
        if (btn) window.location.href = btn.getAttribute("href");
    });
});

async function initDashboard() {
    const user = await loadSession();

    if (!user) {
        dashGrid.style.display = "none";
        dashSubtitle.textContent =
            "Não foi possível carregar sua conta. Recarregue a página ou entre novamente.";
        return;
    }

    const visiblePanels = panelsForRole(user.role);

    if (visiblePanels.length === 0) {
        console.error(
            `Role desconhecida ou não mapeada: "${user.role}". ` +
            `Esperado: ${Object.keys(PANELS_BY_ROLE).join(", ")}.`
        );
        dashGrid.style.display = "none";
        dashSubtitle.textContent =
            "Não identificamos um painel para o seu perfil. Fale com o suporte.";
        return;
    }

    if (visiblePanels.length === 1) {
        redirectToDefaultPanel(user.role);
        return;
    }

    await renderUser(user, visiblePanels);
}

if (dashLogout) {
    dashLogout.addEventListener("click", logoutAndRedirect);
}

initDashboard();