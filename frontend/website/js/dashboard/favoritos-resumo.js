const RESUMO_LIMIT = 3;

const resumoLista = document.getElementById("favResumoLista");
const resumoVazio = document.getElementById("favResumoVazio");
const resumoStat = document.getElementById("favStatValue");

function mostrarResumoVazio(mensagem) {
    resumoVazio.textContent = mensagem;
    resumoVazio.hidden = false;
    resumoLista.hidden = true;
}

function criarResumoRow(item) {
    const row = document.createElement("div");
    row.className = "panel-fav";

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
    titulo.textContent = nome;
    info.appendChild(titulo);

    const subtitulo = document.createElement("span");
    subtitulo.textContent = teacher
        ? [teacher.university, teacher.course].filter(Boolean).join(" · ")
        : "Perfil não disponível";
    info.appendChild(subtitulo);

    row.appendChild(info);

    if (teacher) {
        const preco = document.createElement("strong");
        preco.className = "panel-fav-price";
        preco.textContent = `R$ ${formatPanelMoney(teacher.hourlyRate)}/h`;
        row.appendChild(preco);
    }

    return row;
}

async function carregarResumoFavoritos() {
    try {
        const viewer = await loadFavoriteViewer();

        if (!viewer.canFavorite) {
            resumoStat.textContent = "—";
            mostrarResumoVazio("Favoritos disponíveis apenas para contas de aluno.");
            return;
        }

        const data = await listFavoriteTeachers({ page: 0, size: RESUMO_LIMIT });
        const itens = data?.content ?? [];
        const total = data?.page?.totalElements ?? itens.length;

        resumoStat.textContent = String(total);

        if (itens.length === 0) {
            mostrarResumoVazio("Você ainda não tem professores favoritos.");
            return;
        }

        resumoLista.textContent = "";
        itens.forEach((item) => resumoLista.appendChild(criarResumoRow(item)));

        resumoVazio.hidden = true;
        resumoLista.hidden = false;
    } catch (error) {
        console.error("Falha ao carregar o resumo de favoritos:", error);
        resumoStat.textContent = "—";
        mostrarResumoVazio("Não foi possível carregar seus favoritos.");
    }
}

carregarResumoFavoritos();