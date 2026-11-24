const FAVORITE_ROLES = ["STUDENT", "STUDENT_TEACHER"];

let favoriteViewerPromise = null;

function loadFavoriteViewer() {
    if (favoriteViewerPromise) return favoriteViewerPromise;

    favoriteViewerPromise = getOptionalUser()
        .then((user) => ({
            user,
            canFavorite: Boolean(user && FAVORITE_ROLES.includes(user.role)),
        }))
        .catch((error) => {
            console.error("Falha ao verificar a sessão:", error);
            return { user: null, canFavorite: false };
        });

    return favoriteViewerPromise;
}

async function loadFavoriteStatus(teacherIds) {
    const viewer = await loadFavoriteViewer();
    if (!viewer.canFavorite) return null;

    try {
        const ids = await getFavoriteTeacherStatus(teacherIds);
        return new Set(ids ?? []);
    } catch (error) {
        console.error("Falha ao consultar favoritos:", error);
        return null;
    }
}

function renderFavoriteButton(button, isFavorite) {
    button.setAttribute("aria-pressed", String(isFavorite));
    button.setAttribute(
        "aria-label",
        isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
    );
    button.innerHTML = `
        <i class='bx ${isFavorite ? "bxs-heart" : "bx-heart"}' aria-hidden="true"></i>
        <span>${isFavorite ? "Favoritado" : "Favoritar"}</span>
    `;
}

function createFavoriteButton(teacherId, isFavorite = false, className = "fav-btn") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.teacherId = teacherId;
    renderFavoriteButton(button, isFavorite);

    button.addEventListener("click", async () => {
        if (button.disabled) return;

        const willFavorite = button.getAttribute("aria-pressed") !== "true";
        button.disabled = true;

        try {
            if (willFavorite) {
                await addFavoriteTeacher(teacherId);
            } else {
                await removeFavoriteTeacher(teacherId);
            }
            renderFavoriteButton(button, willFavorite);
        } catch (error) {
            console.error("Falha ao atualizar favorito:", error);
        } finally {
            button.disabled = false;
        }
    });

    return button;
}