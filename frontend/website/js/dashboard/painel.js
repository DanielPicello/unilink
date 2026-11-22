const panelConfig = {
    aluno: {
        label: "Aluno",
        groups: [
            {
                label: "Estudos",
                items: [
                    { icon: "bx-grid-alt", text: "Visão geral", href: "painel-aluno.html" },
                    { icon: "bx-book-open", text: "Minhas aulas", href: "#" },
                    { icon: "bx-calendar", text: "Agenda", href: "#" },
                    { icon: "bx-check-square", text: "Tarefas", href: "#" },
                    { icon: "bx-folder", text: "Materiais", href: "#" }
                ]
            },
            {
                label: "Conexões",
                items: [
                    { icon: "bx-heart", text: "Favoritos", href: "#" },
                    { icon: "bx-message-rounded-dots", text: "Mensagens", href: "#" }
                ]
            },
            {
                label: "Conta",
                items: [
                    { icon: "bx-credit-card", text: "Pagamentos", href: "#" },
                    { icon: "bx-user-circle", text: "Meu perfil", href: "perfil.html" }
                ]
            }
        ]
    },
    professor: {
        label: "Professor",
        groups: [
            {
                label: "Ensino",
                items: [
                    { icon: "bx-grid-alt", text: "Visão geral", href: "painel-professor.html" },
                    { icon: "bx-calendar", text: "Agenda", href: "#" },
                    { icon: "bx-book-open", text: "Minhas aulas", href: "#" },
                    { icon: "bx-group", text: "Meus alunos", href: "#" },
                    { icon: "bx-folder", text: "Materiais", href: "#" }
                ]
            },
            {
                label: "Negócios",
                items: [
                    { icon: "bx-wallet", text: "Ganhos", href: "#" },
                    { icon: "bx-bulb", text: "Oportunidades", href: "#" },
                    { icon: "bx-message-rounded-dots", text: "Mensagens", href: "#" }
                ]
            },
            {
                label: "Conta",
                items: [
                    { icon: "bx-user-circle", text: "Meu perfil", href: "perfil.html" }
                ]
            }
        ]
    },
    empresa: {
        label: "Empresa",
        groups: [
            {
                label: "Recrutamento",
                items: [
                    { icon: "bx-grid-alt", text: "Visão geral", href: "painel-empresa.html" },
                    { icon: "bx-briefcase", text: "Vagas & Projetos", href: "#" },
                    { icon: "bx-file", text: "Candidatos", href: "#" },
                    { icon: "bx-video", text: "Entrevistas", href: "#" },
                    { icon: "bx-user-check", text: "Contratados", href: "#" }
                ]
            },
            {
                label: "Gestão",
                items: [
                    { icon: "bx-message-rounded-dots", text: "Mensagens", href: "#" },
                    { icon: "bx-receipt", text: "Faturamento", href: "#" }
                ]
            },
            {
                label: "Conta",
                items: [
                    { icon: "bx-user-circle", text: "Perfil da empresa", href: "perfil.html" }
                ]
            }
        ]
    }
};

const explorarGroup = {
    label: "Explorar",
    items: [
        { icon: "bx-transfer-alt", text: "Trocar painel", href: "dashboard.html" },
        { icon: "bx-search", text: "Encontrar professores", href: "professores.html" },
        { icon: "bx-buildings", text: "Empresas", href: "empresas.html" },
        { icon: "bx-home", text: "Home", href: "index.html" }
    ]
};

function renderPanelSidebar() {
    const sidebar = document.getElementById("panelSidebar");
    const nav = document.getElementById("panelNav");
    if (!sidebar || !nav) return;

    const panelType = sidebar.dataset.panel;
    const config = panelConfig[panelType];
    if (!config) return;

    const logoSub = sidebar.querySelector(".panel-logo-sub");
    if (logoSub) logoSub.textContent = `Painel · ${config.label}`;

    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    const groups = [...config.groups, explorarGroup];

    nav.innerHTML = groups.map(group => `
        <div class="panel-nav-group">
            <span class="panel-nav-label">${group.label}</span>
            ${group.items.map(item => `
                <a href="${item.href}" class="panel-nav-link${item.href === currentPage ? " active" : ""}"${item.href === currentPage ? ' aria-current="page"' : ""}>
                    <i class='bx ${item.icon}'></i>
                    <span>${item.text}</span>
                </a>
            `).join("")}
        </div>
    `).join("");
}

document.addEventListener("DOMContentLoaded", renderPanelSidebar);

const panelSidebar = document.getElementById("panelSidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const panelOverlay = document.getElementById("panelOverlay");

function isMobile() {
    return window.innerWidth <= 900;
}

if (sidebarToggle && panelSidebar) {
    sidebarToggle.addEventListener("click", () => {
        panelSidebar.classList.toggle("collapsed");

        if (isMobile()) {
            panelOverlay.classList.toggle("show", panelSidebar.classList.contains("collapsed"));
        }
    });
}

if (panelOverlay) {
    panelOverlay.addEventListener("click", () => {
        panelSidebar.classList.remove("collapsed");
        panelOverlay.classList.remove("show");
    });
}

window.addEventListener("resize", () => {
    if (!isMobile()) {
        panelOverlay.classList.remove("show");
    }
});

if (panelSidebar) {
    panelSidebar.addEventListener("click", (e) => {
        if (e.target.closest(".panel-nav-link") && isMobile()) {
            panelSidebar.classList.remove("collapsed");
            panelOverlay.classList.remove("show");
        }
    });
}


function escapePanelText(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[char]));
}

function formatPanelMoney(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return "";
    return parsed.toFixed(2).replace(".", ",");
}

function topbarPanelType() {
    return document.getElementById("panelSidebar")?.dataset.panel ?? "";
}

function userMenuMarkup(user, photoUrl = "") {
    const name = displayName(user);
    const panels = panelsForRole(user.role);
    const safePhoto = safePhotoDataUrl(photoUrl);

    return `
        <div class="panel-user-head ${safePhoto ? "has-photo" : ""}">
            ${safePhoto ? `<img class="panel-user-photo" src="${safePhoto}" alt="">` : ""}
            <div class="panel-user-head-text">
                <strong id="panelUserName">${escapePanelText(name)}</strong>
                <span id="panelUserEmail">${escapePanelText(user.email)}</span>
                <span class="panel-user-role" id="panelUserRole">${escapePanelText(roleLabel(user.role))}</span>
            </div>
        </div>

        <a class="panel-user-item" href="perfil.html">
            <i class='bx bx-user-circle'></i> Meu perfil
        </a>
        <a class="panel-user-item" href="configuracoes.html">
            <i class='bx bx-cog'></i> Configurações
        </a>
        ${panels.length > 1
            ? `<a class="panel-user-item" href="dashboard.html">
                   <i class='bx bx-transfer-alt'></i> Trocar painel
               </a>`
            : ""}
        <button type="button" class="panel-user-item is-danger" id="panelUserLogout">
            <i class='bx bx-log-out'></i> Sair
        </button>
    `;
}

function bindTopbarMenu(trigger, menu) {
    function closeMenu() {
        if (menu.hidden) return;
        menu.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
    }

    trigger.addEventListener("click", (event) => {
        event.stopPropagation();

        const willOpen = menu.hidden;
        menu.hidden = !willOpen;
        trigger.setAttribute("aria-expanded", String(willOpen));

        if (willOpen) {
            menu.querySelector(".panel-user-item")?.focus();
        }
    });

    menu.addEventListener("click", (event) => event.stopPropagation());
    document.addEventListener("click", closeMenu);

    document.addEventListener("keydown", (event) => {
        if (menu.hidden) return;

        if (event.key === "Escape") {
            closeMenu();
            trigger.focus();
            return;
        }

        trapFocus(menu, event);
    });
}

function renderTopbarMenu(user, photoUrl = "") {
    const avatar = document.querySelector(".panel-avatar");
    if (!avatar) return;

    let wrapper = document.querySelector(".panel-user");
    let menu;

    if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.className = "panel-user";

        const trigger = document.createElement("button");
        trigger.type = "button";
        trigger.className = "panel-user-trigger";
        trigger.id = "panelUserTrigger";
        trigger.setAttribute("aria-label", "Abrir menu da conta");
        trigger.setAttribute("aria-haspopup", "true");
        trigger.setAttribute("aria-controls", "panelUserMenu");

        avatar.parentNode.insertBefore(wrapper, avatar);
        trigger.appendChild(avatar);
        wrapper.appendChild(trigger);

        menu = document.createElement("div");
        menu.className = "panel-user-menu";
        menu.id = "panelUserMenu";
        menu.hidden = true;
        wrapper.appendChild(menu);

        trigger.setAttribute("aria-expanded", "false");
        bindTopbarMenu(trigger, menu);
    } else {
        menu = wrapper.querySelector(".panel-user-menu");
    }

    if (!menu) return;

    menu.innerHTML = userMenuMarkup(user, photoUrl);

    menu.querySelector("#panelUserLogout").addEventListener("click", () => {
        if (typeof clearPerfilDirty === "function") clearPerfilDirty();
        logoutAndRedirect();
    });
}

function filterPanelTabs(panels) {
    document.querySelectorAll(".panel-tab").forEach((tab) => {
        const file = (tab.getAttribute("href") || "").split("/").pop();
        const type = Object.keys(PANEL_FILES).find((key) => PANEL_FILES[key] === file);

        if (type && !panels.includes(type)) tab.remove();
    });
}

function heroMetaItems(user, panelType) {
    const items = [];

    const push = (icon, text) => {
        const value = String(text ?? "").trim();
        if (value) items.push({ icon, text: value });
    };

    if (panelType === "professor" && user.teacherProfile) {
        const teacher = user.teacherProfile;

        push("bx-book", teacher.course);
        push("bx-buildings", teacher.university);
        push("bx-time-five", teacher.period ? `${teacher.period} período` : "");

        if (teacher.hourlyRate !== null && teacher.hourlyRate !== undefined) {
            push("bx-wallet", `R$ ${formatPanelMoney(teacher.hourlyRate)}/h`);
        }

        push("bx-map", teacher.city);
    }

    if (panelType === "aluno" && user.studentProfile) {
        push("bx-book-open", user.studentProfile.educationLevel);
        push("bx-map", user.studentProfile.city);
    }

    if (panelType === "empresa" && user.companyProfile) {
        push("bx-briefcase", user.companyProfile.sector);
        push("bx-group", user.companyProfile.companySize);
        push("bx-map", user.companyProfile.city);
    }

    return items;
}

function renderHeroMeta(user, panelType) {
    const left = document.querySelector(".panel-hero-left");
    if (!left) return;

    let box = left.querySelector(".panel-hero-meta");

    if (!box) {
        box = document.createElement("div");
        box.className = "panel-hero-meta";
        left.appendChild(box);
    }

    const items = heroMetaItems(user, panelType);

    box.innerHTML = items.length
        ? items.map((item) => `
            <span class="panel-meta-chip">
                <i class='bx ${item.icon}'></i>
                ${escapePanelText(item.text)}
            </span>
        `).join("") + `
            <a class="panel-meta-link" href="perfil.html">
                Editar perfil <i class='bx bx-right-arrow-alt'></i>
            </a>
        `
        : `
            <a class="panel-meta-link is-empty" href="perfil.html">
                <i class='bx bx-info-circle'></i> Complete seu perfil
            </a>
        `;
}

async function initPanelSession() {
    const sidebar = document.getElementById("panelSidebar");
    const panelType = sidebar?.dataset.panel;

    if (!panelType) {
        return;
    }

    const user = await requirePanel(panelType);
    if (!user) return;

    const photoUrl = await loadProfilePhoto();

    rememberPanel(panelType);

    const panels = panelsForRole(user.role);

    if (panels.length === 1) {
        document
            .querySelectorAll('.panel-nav-link[href="dashboard.html"]')
            .forEach((link) => link.remove());
    }

    filterPanelTabs(panels);
    document.querySelector(".panel-tab.active")?.setAttribute("aria-current", "page");

    const name = displayName(user);
    const avatar = document.querySelector(".panel-avatar");
    const heroTitle = document.querySelector(".panel-hero-left h1");

    if (avatar) {
        applyAvatarPhoto(avatar, name, photoUrl);
        avatar.title = user.email;
    }

    renderTopbarMenu(user, photoUrl);
    const setupAlert = document.getElementById("panelSetupAlert");
    if (setupAlert) setupAlert.hidden = !teacherNeedsSetup(user);
    renderHeroMeta(user, panelType);

    if (!heroTitle) return;

    if (panelType === "empresa") {
        heroTitle.textContent = name;
    } else if (panelType === "professor") {
        heroTitle.textContent = `Bem-vindo, ${firstName(name)}`;
    } else {
        heroTitle.textContent = `Olá, ${firstName(name)} `;

        const wave = document.createElement("span");
        wave.className = "panel-wave";
        wave.textContent = "👋";
        heroTitle.appendChild(wave);
    }
}

const panelLogoutLink = document.querySelector(".panel-logout");
if (panelLogoutLink) {
    panelLogoutLink.addEventListener("click", (event) => {
        event.preventDefault();
        if (typeof clearPerfilDirty === "function") clearPerfilDirty();
        logoutAndRedirect();
    });
}

initPanelSession();