const FAV_PAGE_SIZE = 12;
const FAV_FETCH_SIZE = 50;

const favList = document.getElementById("favList");
const favLoading = document.getElementById("favLoading");
const favEmpty = document.getElementById("favEmpty");
const favError = document.getElementById("favError");
const favForbidden = document.getElementById("favForbidden");
const favMore = document.getElementById("favMore");
const favRetry = document.getElementById("favRetry");
const favTotal = document.getElementById("favTotal");
const favStatTotal = document.getElementById("favStatTotal");
const favStatDisponiveis = document.getElementById("favStatDisponiveis");
const favStatIndisponiveis = document.getElementById("favStatIndisponiveis");

let favAll = [];
let favPage = 0;
let favBusy = false;

function setFavState(state) {
    [favLoading, favEmpty, favError, favForbidden].forEach((element) => {
        element.hidden = true;
    });

    if (state === "loading") favLoading.hidden = false;
    if (state === "empty") favEmpty.hidden = false;
    if (state === "error") favError.hidden = false;
    if (state === "forbidden") favForbidden.hidden = false;

    favList.hidden = state !== "list";
    favMore.hidden =
        state !== "list" || favPage * FAV_PAGE_SIZE >= favAll.length;
}

function updateFavStats() {
    const total = favAll.length;
    const disponiveis = favAll.filter((item) => item.available).length;

    favStatTotal.textContent = String(total);
    favStatDisponiveis.textContent = String(disponiveis);
    favStatIndisponiveis.textContent = String(total - disponiveis);

    favTotal.textContent = `${total} ${total === 1 ? "professor" : "professores"}`;
    favTotal.hidden = total === 0;
}

function criarFavRow(item) {
    const row = document.createElement("div");
    row.className = "panel-fav panel-fav-row";

    const teacher = item.teacher;
    const nome = teacher?.fullName ?? "Perfil indisponível";

    if (teacher?.photoUrl) {
        const img = document.createElement("img");
        img.className = "panel-avatar-img";
        img.src = `http://localhost:8080${teacher.photoUrl}`;
        img.alt = `Foto de ${nome}`;
        row.appendChild(img);
    } else {
        const avatar = document.createElement("div");
        avatar.className = "panel-avatar-img panel-fav-avatar";
        avatar.textContent = initials(nome);
        avatar.setAttribute("aria-label", `Foto de ${nome}`);
        row.appendChild(avatar);
    }

    const info = document.createElement("div");
    info.className = "panel-fav-info";

    const titulo = document.createElement("h4");

    if (teacher) {
        const link = document.createElement("a");
        link.href = `perfil-professor.html?p=${encodeURIComponent(
            teacherSlug(teacher.fullName, item.teacherId)
        )}`;
        link.textContent = teacher.fullName;
        link.addEventListener("click", () => {
            sessionStorage.setItem("unilinkTeacherId", item.teacherId);
        });
        titulo.appendChild(link);
    } else {
        titulo.textContent = "Perfil indisponível";
    }

    const subtitulo = document.createElement("span");
    subtitulo.textContent = teacher
        ? [teacher.university, teacher.course].filter(Boolean).join(" · ")
        : "Este professor não está mais disponível na busca.";

    info.append(titulo, subtitulo);
    row.appendChild(info);

    if (teacher) {
        const preco = document.createElement("strong");
        preco.className = "panel-fav-price";
        preco.textContent = `R$ ${formatPanelMoney(teacher.hourlyRate)}/h`;
        row.appendChild(preco);
    }

    const remover = document.createElement("button");
    remover.type = "button";
    remover.className = "panel-fav-remove";
    remover.dataset.teacherId = item.teacherId;
    remover.setAttribute("aria-label", `Remover ${nome} dos favoritos`);
    remover.innerHTML = `<i class='bx bx-x' aria-hidden="true"></i>`;
    row.appendChild(remover);

    return row;
}

async function buscarTodosFavoritos() {
    const itens = [];
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
        const data = await listFavoriteTeachers({
            page,
            size: FAV_FETCH_SIZE,
        });

        itens.push(...(data?.content ?? []));
        totalPages = data?.page?.totalPages ?? 0;
        page += 1;
    }

    return itens;
}

async function carregarFavoritos({ append = false } = {}) {
    if (favBusy) return;

    favBusy = true;
    favMore.disabled = true;

    if (!append) {
        favAll = [];
        favPage = 0;
        favList.textContent = "";
        setFavState("loading");
    }

    try {
        const viewer = await loadFavoriteViewer();
        if (!viewer.canFavorite) {
            setFavState("forbidden");
            return;
        }

        if (favAll.length === 0) {
            favAll = await buscarTodosFavoritos();
        }

        updateFavStats();

        const inicio = append ? favPage * FAV_PAGE_SIZE : 0;
        const fim = inicio + FAV_PAGE_SIZE;

        favAll.slice(inicio, fim).forEach((item) => {
            favList.appendChild(criarFavRow(item));
        });

        favPage = append ? favPage + 1 : 1;
        setFavState(favList.childElementCount > 0 ? "list" : "empty");
    } catch (error) {
        console.error("Falha ao carregar favoritos:", error);
        if (!append) setFavState("error");
    } finally {
        favBusy = false;
        favMore.disabled = false;
    }
}

favList.addEventListener("click", async (event) => {
    const button = event.target.closest(".panel-fav-remove");
    if (!button || button.disabled) return;

    button.disabled = true;

    try {
        const id = button.dataset.teacherId;
        await removeFavoriteTeacher(id);

        favAll = favAll.filter((item) => item.teacherId !== id);
        button.closest(".panel-fav-row")?.remove();

        updateFavStats();

        if (favList.childElementCount === 0) {
            favPage = 0;
            setFavState("empty");
        }
    } catch (error) {
        console.error("Falha ao remover favorito:", error);
        button.disabled = false;
    }
});

favMore.addEventListener("click", () => carregarFavoritos({ append: true }));
favRetry.addEventListener("click", () => carregarFavoritos());

carregarFavoritos();