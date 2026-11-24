const detailLoading = document.getElementById("detailLoading");
const detailMissing = document.getElementById("detailMissing");
const detailCard = document.getElementById("detailCard");
const detailSubjectSelect = document.getElementById("detailSubjectSelect");
const detailSubjectDetail = document.getElementById("detailSubjectDetail");
const detailHours = document.getElementById("detailHours");

const HOURS_MIN = 1;
const HOURS_MAX = 20;
const TEACHER_ID_KEY = "unilinkTeacherId";
const SLUG_PAGE_SIZE = 50;

let currentTeacher = null;
let favoriteButton = null;

function formatMoney(value) {
    return `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value ?? "";
}

function normalizeHours(value) {
    const number = Math.round(Number(value));
    if (!Number.isFinite(number)) return HOURS_MIN;
    return Math.min(HOURS_MAX, Math.max(HOURS_MIN, number));
}

function showMissing(title, text) {
    setText("detailMissingTitle", title);
    setText("detailMissingText", text);
    detailLoading.hidden = true;
    detailCard.hidden = true;
    detailMissing.hidden = false;
}

async function findTeacherBySlug(slug) {
    let page = 0;
    let totalPages = 1;

    while (page < totalPages) {
        const data = await searchTeachers({ page, size: SLUG_PAGE_SIZE });
        totalPages = data?.page?.totalPages ?? 0;

        const found = (data?.content ?? []).find(
            (teacher) => teacherSlug(teacher.fullName, teacher.teacherId) === slug
        );
        if (found) return found;

        page += 1;
    }

    return null;
}

function renderPhoto(teacher) {
    const host = document.getElementById("detailPhoto");
    host.textContent = "";

    if (teacher.photoUrl) {
        const img = document.createElement("img");
        img.src = `http://localhost:8080${teacher.photoUrl}`;
        img.alt = `Foto de ${teacher.fullName}`;
        host.appendChild(img);
        return;
    }

    host.textContent = initials(teacher.fullName);
    host.setAttribute("aria-label", `Foto de ${teacher.fullName}`);
}

function renderModes(teacher) {
    const host = document.getElementById("detailModes");
    host.textContent = "";

    const todos = new Set();
    (teacher.subjects ?? []).forEach((subject) => {
        (subject.teachingModes ?? []).forEach((mode) => todos.add(mode));
    });

    [
        ["ONLINE", "Online", "online"],
        ["IN_PERSON", "Presencial", "presencial"],
    ].forEach(([value, label, className]) => {
        if (!todos.has(value)) return;

        const badge = document.createElement("span");
        badge.className = className;
        badge.textContent = label;
        host.appendChild(badge);
    });
}

function renderSubjectSelect(teacher) {
    detailSubjectSelect.textContent = "";

    (teacher.subjects ?? []).forEach((subject, index) => {
        const option = document.createElement("option");
        option.value = String(index);
        option.textContent = subject.subject ?? "";
        detailSubjectSelect.appendChild(option);
    });

    renderSelectedSubject();
}

function renderSelectedSubject() {
    detailSubjectDetail.textContent = "";

    const index = Number(detailSubjectSelect.value || 0);
    const subject = currentTeacher?.subjects?.[index];
    if (!subject) return;

    const name = document.createElement("strong");
    name.className = "detalhe-subject-name";
    name.textContent = subject.subject ?? "";
    detailSubjectDetail.appendChild(name);

    const badges = document.createElement("div");
    badges.className = "detalhe-subject-modes";

    (subject.teachingModes ?? []).forEach((mode) => {
        const badge = document.createElement("span");
        badge.className = mode === "IN_PERSON" ? "presencial" : "online";
        badge.textContent = mode === "IN_PERSON" ? "Presencial" : "Online";
        badges.appendChild(badge);
    });

    detailSubjectDetail.appendChild(badges);
}

function renderCalculation() {
    const hours = normalizeHours(detailHours.value);
    const rate = Number(currentTeacher?.hourlyRate ?? 0);

    setText("detailHourRate", formatMoney(rate));
    setText("detailHoursLabel", `${hours}h`);
    setText("detailTotal", formatMoney(rate * hours));
}

detailSubjectSelect.addEventListener("change", renderSelectedSubject);

detailHours.addEventListener("input", renderCalculation);

detailHours.addEventListener("change", () => {
    detailHours.value = normalizeHours(detailHours.value);
    renderCalculation();
});

async function initFavoriteButton(teacherId) {
    const host = document.getElementById("detailFavoriteHost");
    if (!host) return;

    const status = await loadFavoriteStatus([teacherId]);
    if (status === null) return;

    favoriteButton = createFavoriteButton(
        teacherId,
        status.has(teacherId),
        "detalhe-fav-btn"
    );

    host.replaceChildren(favoriteButton);
}

async function initTeacherDetail() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("p");
    const legacyId = params.get("id");
    const storedId = sessionStorage.getItem(TEACHER_ID_KEY);

    if (!slug && !legacyId && !storedId) {
        showMissing(
            "Abra o perfil pela busca",
            "Escolha um professor na página de busca para ver o perfil completo."
        );
        return;
    }

    try {
        let teacherId = legacyId || storedId;

        if (slug) {
            const listed = await findTeacherBySlug(slug);

            if (!listed) {
                showMissing(
                    "Professor não encontrado",
                    "Este perfil pode ter sido desativado ou não estar mais disponível na busca."
                );
                return;
            }

            teacherId = listed.teacherId;
        }

        if (!teacherId) {
            showMissing(
                "Abra o perfil pela busca",
                "Escolha um professor na página de busca para ver o perfil completo."
            );
            return;
        }

        const teacher = await getTeacher(teacherId);
        sessionStorage.setItem(TEACHER_ID_KEY, teacher.teacherId);
        currentTeacher = teacher;

        await initFavoriteButton(teacher.teacherId);    

        detailLoading.hidden = true;
        detailCard.hidden = false;

        renderPhoto(teacher);
        setText("detailName", teacher.fullName);
        setText("detailUniversity", teacher.university);
        setText("detailUniversityFact", teacher.university);
        setText("detailCourse", teacher.course);
        setText("detailCourseFact", teacher.course);
        setText("detailPeriod", teacher.period);
        setText("detailCity", teacher.city);
        setText("detailCityFact", teacher.city);
        setText("detailBio", teacher.bio);

        document.title = `${teacher.fullName} | UniLink`;

        renderModes(teacher);
        renderSubjectSelect(teacher);
        renderCalculation();
    } catch (error) {
        console.error("Falha ao carregar o professor:", error);

        const semApi = !(error instanceof ApiError);
        showMissing(
            semApi ? "Não foi possível carregar o perfil" : "Professor não encontrado",
            semApi
                ? "Verifique se a API está rodando em localhost:8080 e tente novamente."
                : "Este perfil pode ter sido desativado ou não estar mais disponível na busca."
        );
    }
}

initTeacherDetail();