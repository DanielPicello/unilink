const configState = { user: null };

const passwordForm = document.getElementById("formPassword");
const passwordFeedback = document.getElementById("passwordFeedback");
const deleteForm = document.getElementById("formDelete");
const deleteFeedback = document.getElementById("deleteFeedback");
const deleteActions = document.getElementById("deleteActions");

function validatePasswordForm() {
    const current = passwordForm.elements.currentPassword.value;
    const next = passwordForm.elements.newPassword.value;
    const confirm = passwordForm.elements.confirmPassword.value;

    if (!current) return { field: "currentPassword", message: "Informe sua senha atual." };

    if (next.length < 8) {
        return { field: "newPassword", message: "A nova senha precisa ter no mínimo 8 caracteres." };
    }

    if (next === current) {
        return { field: "newPassword", message: "A nova senha precisa ser diferente da atual." };
    }

    if (confirm !== next) {
        return { field: "confirmPassword", message: "As senhas não conferem." };
    }

    return null;
}

async function handlePasswordSubmit(event) {
    event.preventDefault();

    clearInvalid(passwordForm);
    clearFeedback(passwordFeedback);

    const problem = validatePasswordForm();
    if (problem) {
        markInvalid(passwordForm, problem.field);
        setFeedback(passwordFeedback, problem.message, "error");
        return;
    }

    const button = passwordForm.querySelector('button[type="submit"]');
    const originalHtml = button.innerHTML;

    button.disabled = true;
    button.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Atualizando...";

    try {
        await changePassword({
            currentPassword: passwordForm.elements.currentPassword.value,
            newPassword: passwordForm.elements.newPassword.value,
        });

        passwordForm.reset();
        setFeedback(passwordFeedback, "Senha atualizada com sucesso.", "success");
    } catch (error) {
        if (error instanceof ApiError && error.message === "Senha atual incorreta.") {
            markInvalid(passwordForm, "currentPassword");
            setFeedback(passwordFeedback, "Senha atual incorreta.", "error");
        } else if (error instanceof ApiError && error.status === 401) {
            redirectToLogin({ expired: true });
            return;
        } else if (error instanceof ApiError && error.status === 400) {
            applyServerErrors(passwordForm, passwordFeedback, error.validationErrors);
        } else if (error instanceof ApiError) {
            setFeedback(passwordFeedback, error.message, "error");
        } else {
            setFeedback(
                passwordFeedback,
                "Não foi possível conectar à API. Ela está rodando em localhost:8080?",
                "error"
            );
        }
    } finally {
        button.disabled = false;
        button.innerHTML = originalHtml;
    }
}

function validateDeleteForm() {
    const password = deleteForm.elements.currentPassword.value;
    const confirmation = deleteForm.elements.confirmation.value.trim().toUpperCase();

    if (!password) {
        return { field: "currentPassword", message: "Informe sua senha atual." };
    }

    if (confirmation !== "EXCLUIR") {
        return { field: "confirmation", message: "Digite EXCLUIR para confirmar a exclusão." };
    }

    return null;
}

async function handleDeleteSubmit(event) {
    event.preventDefault();

    clearInvalid(deleteForm);
    clearFeedback(deleteFeedback);

    const problem = validateDeleteForm();
    if (problem) {
        markInvalid(deleteForm, problem.field);
        setFeedback(deleteFeedback, problem.message, "error");
        return;
    }

    const button = deleteForm.querySelector('button[type="submit"]');
    const originalHtml = button.innerHTML;

    button.disabled = true;
    button.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Excluindo...";

    try {
        await deleteAccount({
            currentPassword: deleteForm.elements.currentPassword.value,
        });

        window.location.replace("index.html");
    } catch (error) {
        if (error instanceof ApiError && error.message === "Senha atual incorreta.") {
            markInvalid(deleteForm, "currentPassword");
            setFeedback(deleteFeedback, "Senha atual incorreta.", "error");
        } else if (error instanceof ApiError && error.status === 401) {
            redirectToLogin({ expired: true });
            return;
        } else if (error instanceof ApiError && error.status === 400) {
            applyServerErrors(deleteForm, deleteFeedback, error.validationErrors);
        } else if (error instanceof ApiError) {
            setFeedback(deleteFeedback, error.message, "error");
        } else {
            setFeedback(
                deleteFeedback,
                "Não foi possível conectar à API. Ela está rodando em localhost:8080?",
                "error"
            );
        }

        button.disabled = false;
        button.innerHTML = originalHtml;
    }
}

document.getElementById("revealDelete").addEventListener("click", () => {
    deleteActions.hidden = true;
    deleteForm.hidden = false;
    deleteForm.elements.confirmation.focus();
});

document.getElementById("cancelDelete").addEventListener("click", () => {
    deleteForm.reset();
    clearInvalid(deleteForm);
    clearFeedback(deleteFeedback);
    deleteForm.hidden = true;
    deleteActions.hidden = false;
});

async function initConfiguracoes() {
    const user = await loadSession();

    if (!user) {
        releasePanelGuard();
        return;
    }

    configState.user = user;

    renderShell(user);
    await renderHeader(user);

    releasePanelGuard();
}

passwordForm.addEventListener("submit", handlePasswordSubmit);
deleteForm.addEventListener("submit", handleDeleteSubmit);

initConfiguracoes();