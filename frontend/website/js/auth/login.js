const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("senha");
const feedback = document.getElementById("loginFeedback");
const submitButton = document.getElementById("loginSubmit");

function readLoginIntent() {
    const params = new URLSearchParams(window.location.search);

    const expired = params.get("expired") === "1" || readLoginFlag(LOGIN_EXPIRED_KEY) === "1";
    const registered = params.get("registered") === "1" || readLoginFlag(LOGIN_REGISTERED_KEY) === "1";
    const next = params.get("next") ?? readLoginFlag(LOGIN_NEXT_KEY);

    clearLoginFlag(LOGIN_EXPIRED_KEY);
    clearLoginFlag(LOGIN_REGISTERED_KEY);

    if (window.location.search) {
        history.replaceState(null, "", "login.html");
    }

    return { expired, registered, next };
}

const loginIntent = readLoginIntent();

function showFeedback(message, type = "error") {
    feedback.textContent = message;
    feedback.className = `auth-feedback ${type}`;
    feedback.hidden = false;
}

function clearFeedback() {
    feedback.hidden = true;
    feedback.textContent = "";
}

function setLoading(isLoading) {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? "Entrando..." : "Entrar";
}

function loginNextPath(role) {
    const raw = String(loginIntent.next ?? "").trim();
    if (!raw) return "";

    if (!/^[a-z0-9][a-z0-9._-]*\.html(\?[^#]*)?(#.*)?$/i.test(raw)) return "";
    if (/^(login|register)\.html/i.test(raw)) return "";

    const file = raw.split("?")[0].split("#")[0];
    const panelType = Object.keys(PANEL_FILES).find((key) => PANEL_FILES[key] === file);

    if (panelType && !panelsForRole(role).includes(panelType)) return "";

    return raw;
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFeedback();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showFeedback("Preencha e-mail e senha.");
        return;
    }

    if (!emailInput.checkValidity()) {
        showFeedback("Informe um e-mail válido.");
        emailInput.focus();
        return;
    }

    setLoading(true);

    try {
        const session = await login(email, password);
        const next = loginNextPath(session.role);

        clearLoginFlag(LOGIN_NEXT_KEY);

        if (next) {
            window.location.replace(next);
            return;
        }

        redirectToDefaultPanel(session.role);
    } catch (error) {
        if (error instanceof ApiError) {
            if (error.status === 401) {
                showFeedback("E-mail ou senha inválidos.");
            } else if (error.status === 403) {
                showFeedback("Sua conta está suspensa. Fale com o suporte.");
            } else if (error.status === 400) {
                const firstError = Object.values(error.validationErrors ?? {})[0];
                showFeedback(firstError ?? "Dados inválidos.");
            } else {
                showFeedback(error.message);
            }
        } else {
            showFeedback(
                "Não foi possível conectar à API. Ela está rodando em localhost:8080?"
            );
        }
    } finally {
        setLoading(false);
    }
});

[emailInput, passwordInput].forEach(input => {
    input.addEventListener("input", clearFeedback);
});

if (loginIntent.expired) {
    showFeedback("Sua sessão expirou. Entre novamente para continuar.", "warning");
} else if (loginIntent.registered) {
    showFeedback("Conta criada com sucesso! Faça login para continuar.", "success");
}