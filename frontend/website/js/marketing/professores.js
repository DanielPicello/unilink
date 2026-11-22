const filtros = document.querySelectorAll(".filtro");
const cards = document.querySelectorAll(".card-professor");
const pesquisa = document.querySelector("#pesquisa");

let categoriaAtual = "todos";

function aplicarFiltros() {
    const texto = pesquisa.value.trim().toLowerCase();

    cards.forEach((card) => {
        const materia = card.dataset.materia;
        const nome = card.querySelector(".nome")?.textContent.toLowerCase() ?? "";
        const universidade = card.querySelector(".universidade")?.textContent.toLowerCase() ?? "";
        const formacao = card.querySelector(".formacao")?.textContent.toLowerCase() ?? "";

        const passaCategoria =
            categoriaAtual === "todos" || materia === categoriaAtual;

        const passaPesquisa =
            !texto ||
            nome.includes(texto) ||
            universidade.includes(texto) ||
            formacao.includes(texto);

        card.style.display = passaCategoria && passaPesquisa ? "" : "none";
    });
}

function marcarFiltroAtivo(filtroAtivo) {
    filtros.forEach((filtro) => {
        const ativo = filtro === filtroAtivo;
        filtro.classList.toggle("ativo", ativo);
        filtro.setAttribute("aria-pressed", String(ativo));
    });
}

pesquisa.addEventListener("input", aplicarFiltros);

filtros.forEach((filtro) => {
    filtro.addEventListener("click", () => {
        categoriaAtual = filtro.dataset.filtro;
        marcarFiltroAtivo(filtro);
        aplicarFiltros();
    });
});

marcarFiltroAtivo(document.querySelector('.filtro[data-filtro="todos"]'));
aplicarFiltros();