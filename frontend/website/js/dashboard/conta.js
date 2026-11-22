function stripPanelParam() {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("painel")) return;

    url.searchParams.delete("painel");
    history.replaceState(null, "", url.toString());
}

function resolvePanelType(panels) {
    const fromUrl = new URLSearchParams(window.location.search).get("painel");

    stripPanelParam();

    if (fromUrl && panels.includes(fromUrl)) {
        rememberPanel(fromUrl);
        return fromUrl;
    }

    const stored = recallPanel(panels);
    if (stored) return stored;

    const fromReferrer = String(document.referrer).match(/painel-(aluno|professor|empresa)\.html/);

    if (fromReferrer && panels.includes(fromReferrer[1])) {
        rememberPanel(fromReferrer[1]);
        return fromReferrer[1];
    }

    const fallback = panels[0] ?? null;
    rememberPanel(fallback);
    return fallback;
}

function renderHeroAction(panels) {
    const link = document.getElementById("heroPanelLink");
    if (!link) return;

    if (panels.length === 1) {
        link.href = PANEL_FILES[panels[0]];
        link.innerHTML = "<i class='bx bx-grid-alt'></i> Voltar ao painel";
    } else {
        link.href = "dashboard.html";
        link.innerHTML = "<i class='bx bx-transfer-alt'></i> Meus painéis";
    }
}

function renderShell(user) {
    const sidebar = document.getElementById("panelSidebar");
    const panels = panelsForRole(user.role);
    const panelType = resolvePanelType(panels);

    if (panelType) {
        sidebar.dataset.panel = panelType;
        renderPanelSidebar();
    }

    if (panels.length === 1) {
        document
            .querySelectorAll('.panel-nav-link[href="dashboard.html"]')
            .forEach((link) => link.remove());
    }

    renderHeroAction(panels);
}

async function renderHeader(user) {
    const name = displayName(user);
    const photoUrl = await loadProfilePhoto();

    const topbarAvatar = document.getElementById("topbarAvatar");
    applyAvatarPhoto(topbarAvatar, name, photoUrl);
    topbarAvatar.title = user.email;

    applyAvatarPhoto(document.getElementById("accountAvatar"), name, photoUrl);

    document.getElementById("accountName").textContent = name;
    document.getElementById("accountEmail").textContent = user.email;
    document.getElementById("accountRole").textContent = roleLabel(user.role);

    renderTopbarMenu(user, photoUrl);
}

function setFeedback(element, message, type) {
    element.textContent = message;
    element.className = `perfil-feedback is-${type}`;
    element.hidden = false;
}

function clearFeedback(element) {
    element.textContent = "";
    element.className = "perfil-feedback";
    element.hidden = true;
}

function clearInvalid(form) {
    form.querySelectorAll(".invalid").forEach((input) => input.classList.remove("invalid"));
}

function markInvalid(form, fieldName) {
    const input = form.elements[fieldName];
    if (!input) return;

    input.classList.add("invalid");
    input.focus();
}

function applyServerErrors(form, feedback, validationErrors) {
    const entries = Object.entries(validationErrors ?? {});

    entries.forEach(([field]) => {
        const name = field.split(/[.[]/)[0];
        const input = form.elements[name];
        if (input) input.classList.add("invalid");
    });

    setFeedback(
        feedback,
        entries[0]?.[1] ?? "Confira os dados enviados e tente novamente.",
        "error"
    );
}

const confirmState = { resolve: null, lastFocus: null };

function finishConfirm(result) {
    const resolve = confirmState.resolve;
    if (!resolve) return;

    confirmState.resolve = null;

    const backdrop = document.getElementById("confirmDialog");
    if (backdrop) backdrop.hidden = true;

    document.body.classList.remove("confirm-open");

    if (confirmState.lastFocus && typeof confirmState.lastFocus.focus === "function") {
        confirmState.lastFocus.focus({ preventScroll: true });
    }

    confirmState.lastFocus = null;

    resolve(result);
}

function buildConfirmDialog() {
    const backdrop = document.createElement("div");
    backdrop.id = "confirmDialog";
    backdrop.className = "confirm-backdrop";
    backdrop.hidden = true;

    backdrop.innerHTML = `
        <div class="confirm-box" role="dialog" aria-modal="true" aria-labelledby="confirmTitle"
            aria-describedby="confirmMessage">
            <span class="confirm-icon" id="confirmIcon">
                <i class='bx bx-error-circle'></i>
            </span>
            <h2 id="confirmTitle"></h2>
            <p id="confirmMessage"></p>
            <div class="confirm-actions">
                <button type="button" class="confirm-btn confirm-cancel" id="confirmCancel">Cancelar</button>
                <button type="button" class="confirm-btn confirm-ok" id="confirmOk">Confirmar</button>
            </div>
        </div>
    `;

    backdrop.addEventListener("click", (event) => {
        if (event.target === backdrop) finishConfirm(false);
    });

    backdrop.querySelector("#confirmCancel").addEventListener("click", () => finishConfirm(false));
    backdrop.querySelector("#confirmOk").addEventListener("click", () => finishConfirm(true));

    document.addEventListener("keydown", (event) => {
        if (!confirmState.resolve) return;

        if (event.key === "Escape") {
            event.preventDefault();
            finishConfirm(false);
            return;
        }

        trapFocus(backdrop, event);
    });

    document.body.appendChild(backdrop);

    return backdrop;
}

function openConfirm(options = {}) {
    if (confirmState.resolve) finishConfirm(false);

    const backdrop = document.getElementById("confirmDialog") ?? buildConfirmDialog();

    const {
        title = "Tem certeza?",
        message = "",
        confirmLabel = "Confirmar",
        cancelLabel = "Cancelar",
        danger = false,
        icon = "bx-error-circle",
    } = options;

    document.getElementById("confirmTitle").textContent = title;
    document.getElementById("confirmMessage").textContent = message;

    const ok = document.getElementById("confirmOk");
    ok.textContent = confirmLabel;
    ok.classList.toggle("is-danger", danger);

    document.getElementById("confirmCancel").textContent = cancelLabel;

    const iconBox = document.getElementById("confirmIcon");
    iconBox.classList.toggle("is-danger", danger);
    iconBox.innerHTML = `<i class='bx ${icon}'></i>`;

    confirmState.lastFocus = document.activeElement;

    backdrop.hidden = false;
    document.body.classList.add("confirm-open");

    document.getElementById("confirmCancel").focus();

    return new Promise((resolve) => {
        confirmState.resolve = resolve;
    });
}