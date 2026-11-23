const PANELS_BY_ROLE = Object.freeze({
    STUDENT: ["aluno"],
    TEACHER: ["professor"],
    STUDENT_TEACHER: ["aluno", "professor"],
    COMPANY: ["empresa"],
    ADMIN: ["aluno", "professor", "empresa"],
});

const PANEL_FILES = Object.freeze({
    aluno: "painel-aluno.html",
    professor: "painel-professor.html",
    empresa: "painel-empresa.html",
});

const PANEL_STORAGE_KEY = "unilink:panel";
const LOGIN_NEXT_KEY = "unilink:login:next";
const LOGIN_EXPIRED_KEY = "unilink:login:expired";
const LOGIN_REGISTERED_KEY = "unilink:login:registered";

const ROLE_LABELS = Object.freeze({
    STUDENT: "Aluno",
    TEACHER: "Professor",
    STUDENT_TEACHER: "Aluno e Professor",
    COMPANY: "Empresa",
    ADMIN: "Administrador",
});

function panelsForRole(role) {
    return PANELS_BY_ROLE[role] ?? [];
}

function roleLabel(role) {
    return ROLE_LABELS[role] ?? role;
}

function displayName(user) {
    return (
        user?.personalProfile?.fullName ??
        user?.companyProfile?.companyName ??
        user?.email ??
        "Usuário"
    );
}

function firstName(name) {
    const value = String(name ?? "").trim();
    return value.split(/\s+/)[0] || value;
}

function initials(name) {
    const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function loadSession() {
    try {
        return await getCurrentUser();
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            redirectToLogin({ expired: true });
            return null;
        }

        console.error("Falha ao carregar a sessão:", error);
        showApiUnavailable();
        releasePanelGuard();
        return null;
    }
}

async function logoutAndRedirect() {
    try {
        await logout();
    } catch (error) {
        console.error("Falha ao encerrar a sessão:", error);
    } finally {
        window.location.href = "login.html";
    }
}

function redirectToDefaultPanel(role) {
    const panels = panelsForRole(role);

    if (panels.length === 1) {
        window.location.replace(PANEL_FILES[panels[0]]);
        return;
    }

    window.location.replace("dashboard.html");
}

function rememberPanel(type) {
    if (!type) return;

    try {
        sessionStorage.setItem(PANEL_STORAGE_KEY, type);
    } catch (error) {
    }
}

function recallPanel(panels) {
    try {
        const stored = sessionStorage.getItem(PANEL_STORAGE_KEY);
        if (stored && panels.includes(stored)) return stored;
    } catch (error) {
    }

    return "";
}

function writeLoginFlag(key, value) {
    try {
        sessionStorage.setItem(key, value);
    } catch (error) {
    }
}

function readLoginFlag(key) {
    try {
        return sessionStorage.getItem(key) ?? "";
    } catch (error) {
        return "";
    }
}

function clearLoginFlag(key) {
    try {
        sessionStorage.removeItem(key);
    } catch (error) {
    }
}

function releasePanelGuard() {
    document.documentElement.classList.remove("panel-guard-pending");
}

function showApiUnavailable() {
    if (document.getElementById("apiAlert")) return;

    const host = document.querySelector(".perfil-page, .dash-container")
        ?? document.querySelector("main");
    if (!host) return;

    const alert = document.createElement("div");
    alert.id = "apiAlert";
    alert.className = "api-alert";
    alert.setAttribute("role", "status");
    alert.innerHTML = `
        <i class='bx bx-wifi-off' aria-hidden="true"></i>
        <div>
            <strong>A API não respondeu</strong>
            <span>Os dados desta página são de exemplo. Verifique se o backend está rodando em localhost:8080.</span>
        </div>
    `;

    host.prepend(alert);
}

async function requirePanel(panelType) {
    try {
        const user = await getCurrentUser();
        const panels = panelsForRole(user.role);

        if (!panels.includes(panelType)) {
            redirectToDefaultPanel(user.role);
            return null;
        }

        releasePanelGuard();
        return user;
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            redirectToLogin({ expired: true });
            return null;
        }

        console.error("Falha ao validar a sessão:", error);
        showApiUnavailable();
        releasePanelGuard();
        return null;
    }
}

function loginReturnUrl() {
    const file = window.location.pathname.split("/").pop() || "";
    const search = window.location.search;
    const hash = window.location.hash;

    if (!file.endsWith(".html")) return "";
    if (file === "login.html" || file === "register.html") return "";

    return `${file}${search}${hash}`;
}

function redirectToLogin({ expired = false, next = loginReturnUrl() } = {}) {
    if (expired) writeLoginFlag(LOGIN_EXPIRED_KEY, "1");
    if (next) writeLoginFlag(LOGIN_NEXT_KEY, next);

    window.location.replace("login.html");
}

function getFocusable(container) {
    if (!container) return [];

    return Array.from(container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter((element) => element.offsetParent !== null);
}

function trapFocus(container, event) {
    if (event.key !== "Tab") return;

    const items = getFocusable(container);
    if (!items.length) return;

    const first = items[0];
    const last = items[items.length - 1];

    if (!container.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
        return;
    }

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

const PHOTO_DATA_URL = /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/;

let profilePhotoPromise = null;

function safePhotoDataUrl(value) {
    const text = String(value ?? "");
    return PHOTO_DATA_URL.test(text) ? text : "";
}

function loadProfilePhoto() {
    if (!profilePhotoPromise) {
        profilePhotoPromise = getProfilePhoto()
            .then((data) => safePhotoDataUrl(data?.photo))
            .catch((error) => {
                if (!(error instanceof ApiError && error.status === 404)) {
                    console.error("Falha ao carregar a foto de perfil:", error);
                }
                return "";
            });
    }
    return profilePhotoPromise;
}

function refreshProfilePhoto() {
    profilePhotoPromise = null;
    return loadProfilePhoto();
}

function applyAvatarPhoto(element, name, photoUrl) {
    if (!element) return;

    element.textContent = "";
    element.classList.toggle("has-photo", Boolean(photoUrl));

    if (photoUrl) {
        const img = document.createElement("img");
        img.src = photoUrl;
        img.alt = `Foto de ${name}`;
        element.appendChild(img);
        return;
    }

    element.textContent = initials(name);
}

const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png"];

function validateProfilePhoto(file) {
    if (!file) return "Selecione uma imagem.";
    if (!PHOTO_TYPES.includes(file.type)) return "Use uma imagem JPEG ou PNG.";
    if (file.size > PHOTO_MAX_BYTES) return "A imagem deve ter no máximo 5 MB.";
    return "";
}

function teacherNeedsSetup(user) {
    const subjects = user?.teacherProfile?.subjects ?? [];
    return subjects.length > 0 && subjects.some((subject) => !subject.teachingModes?.length);
}

function teacherNeedsPublish(user) {
    const profile = user?.teacherProfile;
    if (!profile || profile.isPublic) return false;

    const subjects = profile.subjects ?? [];
    return subjects.length > 0
        && subjects.every((subject) => (subject.teachingModes ?? []).length > 0);
}

function slugifyText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "professor";
}

function teacherSlug(fullName, teacherId) {
    const id = String(teacherId ?? "").replace(/-/g, "");
    const suffix = id.slice(0, 4) || "0000";
    return `${slugifyText(fullName)}-${suffix}`;
}