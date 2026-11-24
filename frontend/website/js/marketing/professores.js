const pesquisa = document.querySelector("#pesquisa");
const grid = document.getElementById("teachersGrid");
const loading = document.getElementById("teachersLoading");
const emptyState = document.getElementById("teachersEmpty");
const errorState = document.getElementById("teachersError");
const moreButton = document.getElementById("teachersMore");
const limparFiltros = document.getElementById("limparFiltros");
const filtrosCount = document.getElementById("filtrosCount");

const filtroMateria = document.getElementById("filtroMateria");
const filtroCidade = document.getElementById("filtroCidade");
const filtroUniversidade = document.getElementById("filtroUniversidade");
const filtroCurso = document.getElementById("filtroCurso");
const filtroModalidade = document.getElementById("filtroModalidade");
const filtroOrdem = document.getElementById("filtroOrdem");

const PAGE_SIZE = 12;
const CATALOG_PAGE_SIZE = 50;

let paginaVisivel = 0;
let carregando = false;
let filtrosRenderizados = false;
let catalogPromise = null;
let searchTimer;

function normalizeText(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function formatRate(value) {
    const number = Number(value);
    return Number.isFinite(number)
        ? `R$ ${number.toFixed(2).replace(".", ",")}/h`
        : "";
}

function atualizarContadorFiltros() {
    const selects = [
        filtroMateria,
        filtroCidade,
        filtroUniversidade,
        filtroCurso,
        filtroModalidade,
    ];

    const total = selects.filter((select) => select.value).length
        + (filtroOrdem.value !== "id" ? 1 : 0);

    filtrosCount.textContent = String(total);
    filtrosCount.hidden = total === 0;
}

async function loadCatalog() {
    if (catalogPromise) return catalogPromise;

    catalogPromise = (async () => {
        const listing = [];
        let page = 0;
        let totalPages = 1;

        while (page < totalPages) {
            const data = await searchTeachers({ page, size: CATALOG_PAGE_SIZE });
            totalPages = data?.page?.totalPages ?? 0;
            listing.push(...(data?.content ?? []));
            page += 1;
        }

        return Promise.all(
            listing.map(async (teacher) => {
                try {
                    const detail = await getTeacher(teacher.teacherId);
                    return {
                        ...teacher,
                        ...detail,
                        teachingModes: [
                            ...new Set(
                                (detail.subjects ?? []).flatMap(
                                    (subject) => subject.teachingModes ?? []
                                )
                            ),
                        ],
                    };
                } catch (error) {
                    return { ...teacher, subjects: [] };
                }
            })
        );
    })().catch((error) => {
        catalogPromise = null;
        throw error;
    });

    return catalogPromise;
}

function collectOptions(catalog, getValues) {
    const map = new Map();

    catalog.forEach((teacher) => {
        getValues(teacher).forEach((value) => {
            const nome = String(value ?? "").trim();
            if (!nome) return;

            const chave = normalizeText(nome);
            if (!map.has(chave)) map.set(chave, nome);
        });
    });

    return [...map.values()].sort((a, b) =>
        a.localeCompare(b, "pt-br", { sensitivity: "base" })
    );
}

function fillSelect(select, values, placeholder) {
    select.textContent = "";

    const primeira = document.createElement("option");
    primeira.value = "";
    primeira.textContent = placeholder;
    select.appendChild(primeira);

    values.forEach((valor) => {
        const opcao = document.createElement("option");
        opcao.value = valor;
        opcao.textContent = valor;
        select.appendChild(opcao);
    });
}

function renderFiltros(catalog) {
    fillSelect(
        filtroMateria,
        collectOptions(catalog, (teacher) =>
            (teacher.subjects ?? []).map((subject) => subject.subject)
        ),
        "Todas as matérias"
    );

    fillSelect(
        filtroCidade,
        collectOptions(catalog, (teacher) => [teacher.city]),
        "Todas as cidades"
    );

    fillSelect(
        filtroUniversidade,
        collectOptions(catalog, (teacher) => [teacher.university]),
        "Todas as universidades"
    );

    fillSelect(
        filtroCurso,
        collectOptions(catalog, (teacher) => [teacher.course]),
        "Todos os cursos"
    );
}

function filtrarProfessores(catalog) {
    const texto = normalizeText(pesquisa.value);
    const materia = normalizeText(filtroMateria.value);
    const cidade = normalizeText(filtroCidade.value);
    const universidade = normalizeText(filtroUniversidade.value);
    const curso = normalizeText(filtroCurso.value);
    const modalidade = filtroModalidade.value;

    const resultados = catalog.filter((teacher) => {
        const subjects = (teacher.subjects ?? []).map((subject) => subject.subject);

        if (materia && !subjects.some((subject) => normalizeText(subject) === materia)) {
            return false;
        }

        if (cidade && normalizeText(teacher.city) !== cidade) return false;
        if (universidade && normalizeText(teacher.university) !== universidade) return false;
        if (curso && normalizeText(teacher.course) !== curso) return false;
        if (modalidade && !(teacher.teachingModes ?? []).includes(modalidade)) return false;

        if (!texto) return true;

        return [
            teacher.fullName,
            teacher.university,
            teacher.course,
            teacher.city,
            ...subjects,
        ].some((campo) => normalizeText(campo).includes(texto));
    });

    const ordem = filtroOrdem.value;

    resultados.sort((a, b) => {
        if (ordem === "name") {
            return String(a.fullName ?? "").localeCompare(
                String(b.fullName ?? ""),
                "pt-br",
                { sensitivity: "base" }
            );
        }

        if (ordem === "priceAsc") {
            return Number(a.hourlyRate ?? 0) - Number(b.hourlyRate ?? 0);
        }

        if (ordem === "priceDesc") {
            return Number(b.hourlyRate ?? 0) - Number(a.hourlyRate ?? 0);
        }

        return String(a.teacherId).localeCompare(String(b.teacherId));
    });

    return resultados;
}

function createTeacherCard(teacher) {
    const card = document.createElement("article");
    card.className = "card-professor";

    if (teacher.photoUrl) {
        const img = document.createElement("img");
        img.src = `http://localhost:8080${teacher.photoUrl}`;
        img.alt = `Foto de ${teacher.fullName}`;
        card.appendChild(img);
    } else {
        const avatar = document.createElement("div");
        avatar.className = "card-avatar";
        avatar.textContent = initials(teacher.fullName);
        avatar.setAttribute("aria-label", `Foto de ${teacher.fullName}`);
        card.appendChild(avatar);
    }

    const info = document.createElement("div");
    info.className = "card-info";

    const universidade = document.createElement("span");
    universidade.className = "universidade";
    universidade.textContent = teacher.university ?? "";

    const nome = document.createElement("h3");
    nome.className = "nome";
    nome.textContent = teacher.fullName ?? "";

    const formacao = document.createElement("span");
    formacao.className = "formacao";
    formacao.textContent = teacher.course ?? "";

    const cidade = document.createElement("div");
    cidade.className = "cidade";

    const mapIcon = document.createElement("i");
    mapIcon.className = "bx bx-map";
    mapIcon.setAttribute("aria-hidden", "true");

    const cidadeTexto = document.createElement("span");
    cidadeTexto.textContent = teacher.city ?? "";

    cidade.append(mapIcon, cidadeTexto);

    const avaliacao = document.createElement("div");
    avaliacao.className = "avaliacao";

    const taxa = document.createElement("strong");
    taxa.textContent = formatRate(teacher.hourlyRate);
    avaliacao.appendChild(taxa);

    const favButton = createFavoriteButton(teacher.teacherId);
    favButton.hidden = true;
    avaliacao.appendChild(favButton);

    info.append(universidade, nome, formacao, cidade, avaliacao);

    const modes = document.createElement("div");
    modes.className = "card-modes";

    [
        ["ONLINE", "Online", "online"],
        ["IN_PERSON", "Presencial", "presencial"],
    ].forEach(([value, label, className]) => {
        if (!(teacher.teachingModes ?? []).includes(value)) return;

        const badge = document.createElement("span");
        badge.className = className;
        badge.textContent = label;
        modes.appendChild(badge);
    });

    info.appendChild(modes);

    const link = document.createElement("a");
    link.href = `perfil-professor.html?p=${encodeURIComponent(
        teacherSlug(teacher.fullName, teacher.teacherId)
    )}`;
    link.textContent = "Ver Perfil";
    link.addEventListener("click", () => {
        sessionStorage.setItem("unilinkTeacherId", teacher.teacherId);
    });
    info.appendChild(link);

    card.appendChild(info);
    return card;
}

async function carregarProfessores({ append = false } = {}) {
    atualizarContadorFiltros();

    if (carregando) return;

    carregando = true;
    moreButton.disabled = true;
    loading.hidden = append;
    errorState.hidden = true;

    try {
        const catalog = await loadCatalog();

        if (!filtrosRenderizados) {
            renderFiltros(catalog);
            filtrosRenderizados = true;
        }

        const filtrados = filtrarProfessores(catalog);
        const inicio = append ? paginaVisivel * PAGE_SIZE : 0;
        const fim = inicio + PAGE_SIZE;

        if (!append) grid.textContent = "";

        filtrados.slice(inicio, fim).forEach((teacher) => {
            grid.appendChild(createTeacherCard(teacher));
        });

        await aplicarStatusFavoritos();

        paginaVisivel = append ? paginaVisivel + 1 : 1;
        emptyState.hidden = filtrados.length > 0;
        moreButton.hidden = fim >= filtrados.length;
    } catch (error) {
        console.error("Falha ao carregar professores:", error);

        if (!append) {
            grid.textContent = "";
            emptyState.hidden = true;
            paginaVisivel = 0;
        }

        errorState.hidden = false;
        moreButton.hidden = true;
    } finally {
        carregando = false;
        moreButton.disabled = false;
        loading.hidden = true;
    }
}

async function aplicarStatusFavoritos() {
    const botoes = [...grid.querySelectorAll(".fav-btn")];
    if (!botoes.length) return;

    const ids = botoes.map((botao) => botao.dataset.teacherId);
    const favoritos = new Set();

    for (let i = 0; i < ids.length; i += 50) {
        const status = await loadFavoriteStatus(ids.slice(i, i + 50));

        if (status === null) {
            botoes.forEach((botao) => {
                botao.hidden = true;
            });
            return;
        }

        status.forEach((id) => favoritos.add(id));
    }

    botoes.forEach((botao) => {
        renderFavoriteButton(botao, favoritos.has(botao.dataset.teacherId));
        botao.hidden = false;
    });
}

pesquisa.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => carregarProfessores(), 300);
});

[
    filtroMateria,
    filtroCidade,
    filtroUniversidade,
    filtroCurso,
    filtroModalidade,
    filtroOrdem,
].forEach((select) => {
    select.addEventListener("change", () => carregarProfessores());
});

limparFiltros.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    pesquisa.value = "";
    filtroMateria.value = "";
    filtroCidade.value = "";
    filtroUniversidade.value = "";
    filtroCurso.value = "";
    filtroModalidade.value = "";
    filtroOrdem.value = "id";
    carregarProfessores();
});

moreButton.addEventListener("click", () => carregarProfessores({ append: true }));

carregarProfessores();