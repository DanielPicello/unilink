const perfilState = { user: null, photoUrl: "" };

const dirtyForms = new Set();
const teacherSetupForm = document.getElementById("teacherSetup");
const teacherModesList = document.getElementById("teacherModesList");
const teacherModesFeedback = document.getElementById("teacherModesFeedback");

function clearPerfilDirty() {
    dirtyForms.clear();
}

function onlyDigits(value) {
    return String(value ?? "").replace(/\D/g, "");
}

function formatCnpj(value) {
    const digits = onlyDigits(value);
    if (digits.length !== 14) return digits;

    return (
        digits.slice(0, 2) + "." +
        digits.slice(2, 5) + "." +
        digits.slice(5, 8) + "/" +
        digits.slice(8, 12) + "-" +
        digits.slice(12)
    );
}

function formatMoney(value) {
    if (value === null || value === undefined || value === "") return "";

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return "";

    return parsed.toFixed(2).replace(".", ",");
}

function parseMoney(value) {
    const raw = String(value ?? "").trim().replace(/[^\d,.-]/g, "");
    if (!raw) return null;

    const normalized = raw.includes(",")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw;

    const parsed = Number(normalized);

    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function splitList(value) {
    const seen = new Set();

    return String(value ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item) => {
            const key = item.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

const PERFIL_FORMS = {
    personal: {
        form: document.getElementById("formPersonal"),
        feedback: document.getElementById("personalFeedback"),
        request: updatePersonalProfile,
        validate(form) {
            const fullName = form.elements.fullName.value.trim();
            if (!fullName) return { field: "fullName", message: "Informe seu nome completo." };

            const bio = form.elements.bio.value.trim();
            if (!bio) return { field: "bio", message: "Preencha a bio — ela aparece no seu perfil." };

            return null;
        },
        build(form) {
            return {
                fullName: form.elements.fullName.value.trim(),
                bio: form.elements.bio.value.trim(),
            };
        },
    },

    student: {
        form: document.getElementById("formStudent"),
        feedback: document.getElementById("studentFeedback"),
        request: updateStudentProfile,
        validate(form) {
            if (!form.elements.educationLevel.value.trim()) {
                return { field: "educationLevel", message: "Informe seu nível de ensino." };
            }
            return null;
        },
        build(form) {
            return {
                educationLevel: form.elements.educationLevel.value.trim(),
                city: form.elements.city.value.trim() || null,
            };
        },
    },

    teacher: {
        form: document.getElementById("formTeacher"),
        feedback: document.getElementById("teacherFeedback"),
        request: updateTeacherProfile,
        validate(form) {
            const required = [
                ["university", "Informe a universidade."],
                ["course", "Informe o curso."],
                ["period", "Informe o período."],
            ];

            for (const [name, message] of required) {
                if (!form.elements[name].value.trim()) return { field: name, message };
            }

            if (parseMoney(form.elements.hourlyRate.value) === null) {
                return {
                    field: "hourlyRate",
                    message: "Informe um valor por hora válido (ex: 60 ou 60,50).",
                };
            }

            if (splitList(form.elements.subjects.value).length === 0) {
                return {
                    field: "subjects",
                    message: "Informe pelo menos uma matéria (separe por vírgula).",
                };
            }

            return null;
        },
        build(form) {
            return {
                university: form.elements.university.value.trim(),
                course: form.elements.course.value.trim(),
                period: form.elements.period.value.trim(),
                hourlyRate: parseMoney(form.elements.hourlyRate.value),
                subjects: splitList(form.elements.subjects.value),
                city: form.elements.city.value.trim() || null,
            };
        },
    },

    company: {
        form: document.getElementById("formCompany"),
        feedback: document.getElementById("companyFeedback"),
        request: updateCompanyProfile,
        validate(form) {
            if (!form.elements.companyName.value.trim()) {
                return { field: "companyName", message: "Informe o nome da empresa." };
            }

            if (onlyDigits(form.elements.cnpj.value).length !== 14) {
                return { field: "cnpj", message: "Informe um CNPJ com 14 dígitos." };
            }

            if (!form.elements.sector.value.trim()) {
                return { field: "sector", message: "Informe o setor." };
            }

            if (!form.elements.companySize.value.trim()) {
                return { field: "companySize", message: "Informe o tamanho da empresa." };
            }

            if (!form.elements.bio.value.trim()) {
                return { field: "bio", message: "Preencha o sobre a empresa." };
            }

            return null;
        },
        build(form) {
            return {
                companyName: form.elements.companyName.value.trim(),
                cnpj: onlyDigits(form.elements.cnpj.value),
                sector: form.elements.sector.value.trim(),
                website: form.elements.website.value.trim() || null,
                companySize: form.elements.companySize.value.trim(),
                bio: form.elements.bio.value.trim(),
                city: form.elements.city.value.trim() || null,
            };
        },
    },
};

function showRequestError(form, feedback, error) {
    if (error instanceof ApiError && error.status === 401) {
        redirectToLogin({ expired: true });
        return true;
    }

    if (error instanceof ApiError && error.status === 400 && form) {
        applyServerErrors(form, feedback, error.validationErrors);
    } else if (error instanceof ApiError) {
        setFeedback(feedback, error.message, "error");
    } else {
        setFeedback(
            feedback,
            "Não foi possível conectar à API. Ela está rodando em localhost:8080?",
            "error"
        );
    }

    return false;
}

async function handleFormSubmit(event, config) {
    event.preventDefault();

    const { form, feedback } = config;

    clearInvalid(form);
    clearFeedback(feedback);

    const problem = config.validate(form);
    if (problem) {
        markInvalid(form, problem.field);
        setFeedback(feedback, problem.message, "error");
        return;
    }

    const button = form.querySelector('button[type="submit"]');
    const originalHtml = button.innerHTML;

    button.disabled = true;
    button.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Salvando...";

    try {
        await config.request(config.build(form));
        setFeedback(feedback, "Dados salvos com sucesso.", "success");
        dirtyForms.delete(form);
        await refreshUser();
    } catch (error) {
        if (showRequestError(form, feedback, error)) return;
    } finally {
        button.disabled = false;
        button.innerHTML = originalHtml;
    }
}

function renderTeacherModes(user) {
    const subjects = user?.teacherProfile?.subjects ?? [];
    teacherModesList.textContent = "";

    subjects.forEach((subject) => {
        const row = document.createElement("div");
        row.className = "perfil-mode-row";
        row.dataset.subjectId = subject.id;

        const name = document.createElement("strong");
        name.className = "perfil-mode-name";
        name.textContent = subject.subject ?? "";
        row.appendChild(name);

        const options = document.createElement("div");
        options.className = "perfil-mode-options";

        [
            ["ONLINE", "Online"],
            ["IN_PERSON", "Presencial"],
        ].forEach(([value, label]) => {
            const option = document.createElement("label");
            option.className = "perfil-mode-option";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = value;
            checkbox.checked = (subject.teachingModes ?? []).includes(value);

            option.appendChild(checkbox);
            option.appendChild(document.createTextNode(label));
            options.appendChild(option);
        });

        row.appendChild(options);
        teacherModesList.appendChild(row);
    });
}

async function handleTeacherModesSubmit(event) {
    event.preventDefault();

    clearFeedback(teacherModesFeedback);

    const rows = Array.from(teacherModesList.querySelectorAll(".perfil-mode-row"));

    if (!rows.length) {
        setFeedback(teacherModesFeedback, "Não há matérias para configurar.", "error");
        return;
    }

    const subjects = [];

    for (const row of rows) {
        const teachingModes = Array.from(row.querySelectorAll("input:checked")).map(
            (input) => input.value
        );

        if (!teachingModes.length) {
            const name = row.querySelector(".perfil-mode-name").textContent;
            setFeedback(
                teacherModesFeedback,
                `Escolha ao menos uma modalidade para "${name}".`,
                "error"
            );
            return;
        }

        subjects.push({ id: row.dataset.subjectId, teachingModes });
    }

    const button = teacherSetupForm.querySelector('button[type="submit"]');
    const originalHtml = button.innerHTML;

    button.disabled = true;
    button.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Salvando...";

    try {
        await saveTeacherSubjectModes(subjects);
        setFeedback(teacherModesFeedback, "Modalidades salvas.", "success");
        await refreshUser();

        if (window.location.hash === "#teacherSetup") {
            teacherSetupForm.scrollIntoView({ block: "start" });
        }
    } catch (error) {
        if (showRequestError(null, teacherModesFeedback, error)) return;
    } finally {
        button.disabled = false;
        button.innerHTML = originalHtml;
    }
}

function bindForms() {
    Object.values(PERFIL_FORMS).forEach((config) => {
        teacherSetupForm.addEventListener("submit", handleTeacherModesSubmit);
        config.form.addEventListener("submit", (event) => handleFormSubmit(event, config));
    });

    const watched = [
        ...Object.values(PERFIL_FORMS).map((config) => config.form),
        document.getElementById("formBecomeTeacher"),
        document.getElementById("formBecomeStudent"),
    ];

    watched.forEach((form) => {
        if (!form) return;
        form.addEventListener("input", () => dirtyForms.add(form));
    });
}

const hybridState = { mode: null };

function hybridPanel(mode) {
    return document.getElementById(mode === "teacher" ? "hybridTeacherPanel" : "hybridStudentPanel");
}

function hybridFeedback(mode) {
    return document.getElementById(mode === "teacher" ? "becomeTeacherFeedback" : "becomeStudentFeedback");
}

function renderHybrid(user) {
    const card = document.getElementById("hybridCard");
    const cta = document.getElementById("hybridCta");
    const teacherPanel = document.getElementById("hybridTeacherPanel");
    const studentPanel = document.getElementById("hybridStudentPanel");
    const manage = document.getElementById("hybridManage");
    const start = document.getElementById("hybridStart");

    hybridState.mode = null;
    card.hidden = true;
    cta.hidden = true;
    teacherPanel.hidden = true;
    studentPanel.hidden = true;
    manage.hidden = true;

    if (user.role === "STUDENT") {
        hybridState.mode = "teacher";
        card.hidden = false;
        cta.hidden = false;

        document.getElementById("hybridTitle").textContent = "Quero ensinar também";
        document.getElementById("hybridSubtitle").textContent =
            "Sua conta é de aluno. Crie também um perfil de professor e comece a dar aulas na UniLink.";
        document.getElementById("hybridStartLabel").textContent = "Criar perfil de professor";

        start.setAttribute("aria-controls", "hybridTeacherPanel");
        start.setAttribute("aria-expanded", "false");
        return;
    }

    if (user.role === "TEACHER") {
        hybridState.mode = "student";
        card.hidden = false;
        cta.hidden = false;

        document.getElementById("hybridTitle").textContent = "Quero estudar também";
        document.getElementById("hybridSubtitle").textContent =
            "Sua conta é de professor. Crie também um perfil de aluno e contrate professores na UniLink.";
        document.getElementById("hybridStartLabel").textContent = "Criar perfil de aluno";

        start.setAttribute("aria-controls", "hybridStudentPanel");
        start.setAttribute("aria-expanded", "false");
        return;
    }

    if (user.role === "STUDENT_TEACHER") {
        card.hidden = false;
        manage.hidden = false;

        const teacher = user.teacherProfile;
        const student = user.studentProfile;

        document.getElementById("hybridTeacherInfo").textContent = teacher
            ? `${teacher.course ?? "Curso"} · R$ ${formatMoney(teacher.hourlyRate)}/h · ${(teacher.subjects ?? []).length} matéria(s)`
            : "Perfil de professor ativo.";

        document.getElementById("hybridStudentInfo").textContent = student
            ? `${student.educationLevel ?? "Nível não informado"}${student.city ? " · " + student.city : ""}`
            : "Perfil de aluno ativo.";
    }
}

function openHybridForm() {
    if (!hybridState.mode) return;

    document.getElementById("hybridCta").hidden = true;

    const panel = hybridPanel(hybridState.mode);
    panel.hidden = false;

    const start = document.getElementById("hybridStart");
    start.setAttribute("aria-expanded", "true");

    const firstField = panel.querySelector("input");
    if (firstField) firstField.focus({ preventScroll: true });
}

function closeHybridForm() {
    if (!hybridState.mode) return;

    const panel = hybridPanel(hybridState.mode);
    const form = panel.querySelector("form");

    form.reset();
    clearInvalid(form);
    clearFeedback(hybridFeedback(hybridState.mode));

    form.querySelector('button[type="submit"]').disabled = false;

    panel.hidden = true;

    const cta = document.getElementById("hybridCta");
    cta.hidden = false;
    cta.scrollIntoView({ behavior: "smooth", block: "nearest" });

    document.getElementById("hybridStart").setAttribute("aria-expanded", "false");
}

async function handleRoleSubmit(event, config) {
    event.preventDefault();

    const { form, feedback, validate, build, request, loadingLabel } = config;

    clearInvalid(form);
    clearFeedback(feedback);

    const problem = validate(form);
    if (problem) {
        markInvalid(form, problem.field);
        setFeedback(feedback, problem.message, "error");
        return;
    }

    const button = form.querySelector('button[type="submit"]');
    const originalHtml = button.innerHTML;

    button.disabled = true;
    button.innerHTML = `<i class='bx bx-loader-alt bx-spin'></i> ${loadingLabel}`;

    try {
        await request(build(form));
        setFeedback(feedback, "Perfil criado! Atualizando sua conta...", "success");
        dirtyForms.delete(form);

        window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
        if (showRequestError(form, feedback, error)) return;

        button.disabled = false;
        button.innerHTML = originalHtml;
    }
}

async function handleRemoveProfile(button) {
    const kind = button.dataset.removeProfile;
    const feedback = document.getElementById("hybridFeedback");

    const isTeacher = kind === "teacher";

    const confirmed = await openConfirm({
        title: isTeacher ? "Deixar de ensinar?" : "Deixar de estudar?",
        message: isTeacher
            ? "Seu perfil de professor, suas matérias e seu valor por hora serão apagados. Sua conta continua ativa como aluno."
            : "Seu perfil de aluno será apagado. Sua conta continua ativa como professor.",
        confirmLabel: isTeacher ? "Deixar de ensinar" : "Deixar de estudar",
        danger: true,
    });

    if (!confirmed) return;

    clearFeedback(feedback);

    const originalHtml = button.innerHTML;
    button.disabled = true;
    button.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Removendo...";

    try {
        if (isTeacher) {
            await removeTeacherProfile();
        } else {
            await removeStudentProfile();
        }

        setFeedback(feedback, "Perfil removido. Atualizando sua conta...", "success");
        window.setTimeout(() => window.location.reload(), 700);
    } catch (error) {
        button.disabled = false;
        button.innerHTML = originalHtml;

        if (showRequestError(null, feedback, error)) return;
    }
}

function bindHybrid() {
    const becomeTeacher = document.getElementById("formBecomeTeacher");
    const becomeStudent = document.getElementById("formBecomeStudent");

    document.getElementById("hybridStart").addEventListener("click", openHybridForm);

    document.querySelectorAll("[data-hybrid-cancel]").forEach((button) => {
        button.addEventListener("click", closeHybridForm);
    });

    becomeTeacher.addEventListener("submit", (event) => handleRoleSubmit(event, {
        form: becomeTeacher,
        feedback: document.getElementById("becomeTeacherFeedback"),
        validate: PERFIL_FORMS.teacher.validate,
        build: PERFIL_FORMS.teacher.build,
        request: addTeacherProfile,
        loadingLabel: "Criando perfil...",
    }));

    becomeStudent.addEventListener("submit", (event) => handleRoleSubmit(event, {
        form: becomeStudent,
        feedback: document.getElementById("becomeStudentFeedback"),
        validate: PERFIL_FORMS.student.validate,
        build: PERFIL_FORMS.student.build,
        request: addStudentProfile,
        loadingLabel: "Criando perfil...",
    }));

    document.querySelectorAll("[data-remove-profile]").forEach((button) => {
        button.addEventListener("click", () => handleRemoveProfile(button));
    });
}

function fillForms(user) {
    const personal = user.personalProfile;
    if (personal) {
        const form = PERFIL_FORMS.personal.form;
        form.elements.fullName.value = personal.fullName ?? "";
        form.elements.bio.value = personal.bio ?? "";
    }

    const student = user.studentProfile;
    if (student) {
        const form = PERFIL_FORMS.student.form;
        form.elements.educationLevel.value = student.educationLevel ?? "";
        form.elements.city.value = student.city ?? "";
    }

    const teacher = user.teacherProfile;
    if (teacher) {
        const form = PERFIL_FORMS.teacher.form;
        form.elements.university.value = teacher.university ?? "";
        form.elements.course.value = teacher.course ?? "";
        form.elements.period.value = teacher.period ?? "";
        form.elements.hourlyRate.value = formatMoney(teacher.hourlyRate);
        form.elements.subjects.value = (teacher.subjects ?? [])
            .map((subject) => (typeof subject === "string" ? subject : subject?.subject))
            .filter(Boolean)
            .join(", ");
        form.elements.city.value = teacher.city ?? "";
    }

    const company = user.companyProfile;
    if (company) {
        const form = PERFIL_FORMS.company.form;
        form.elements.companyName.value = company.companyName ?? "";
        form.elements.cnpj.value = formatCnpj(company.cnpj);
        form.elements.sector.value = company.sector ?? "";
        form.elements.website.value = company.website ?? "";
        form.elements.companySize.value = company.companySize ?? "";
        form.elements.bio.value = company.bio ?? "";
        form.elements.city.value = company.city ?? "";
    }
}

function applyVisibility(user) {
    PERFIL_FORMS.personal.form.hidden = !user.personalProfile;
    PERFIL_FORMS.student.form.hidden = !user.studentProfile;
    PERFIL_FORMS.teacher.form.hidden = !user.teacherProfile;
    PERFIL_FORMS.company.form.hidden = !user.companyProfile;
    teacherSetupForm.hidden =
        !user.teacherProfile || (user.teacherProfile.subjects ?? []).length === 0;

    const hasAnyProfile = Boolean(
        user.personalProfile ||
        user.studentProfile ||
        user.teacherProfile ||
        user.companyProfile
    );

    document.getElementById("perfilEmpty").hidden = hasAnyProfile;
}

async function refreshUser() {
    try {
        perfilState.user = await getCurrentUser();
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            redirectToLogin({ expired: true });
            return;
        }

        console.error("Falha ao atualizar a sessão:", error);
        return;
    }

    await renderHeader(perfilState.user);
    applyVisibility(perfilState.user);
    renderHybrid(perfilState.user);
    renderTeacherModes(perfilState.user);

    if (window.location.hash === "#teacherSetup") {
        teacherSetupForm.scrollIntoView({ block: "start" });
    }
}

async function initPerfil() {
    const user = await loadSession();

    if (!user) {
        releasePanelGuard();
        return;
    }

    perfilState.user = user;
    await renderHeader(user);
    perfilState.photoUrl = await loadProfilePhoto();
    renderPhotoControls();

    renderShell(user);
    fillForms(user);
    applyVisibility(user);
    renderHybrid(user);
    renderTeacherModes(user);

    if (window.location.hash === "#teacherSetup") {
        teacherSetupForm.scrollIntoView({ block: "start" });
    }

    releasePanelGuard();
}

function renderPhotoControls() {
    const hasPhoto = Boolean(perfilState.photoUrl);
    document.getElementById("photoChangeLabel").textContent = hasPhoto ? "Trocar foto" : "Adicionar foto";
    document.getElementById("photoRemoveBtn").hidden = !hasPhoto;
}

function photoFeedback(message, type = "success") {
    const element = document.getElementById("photoFeedback");
    if (!element) return;

    if (!message) {
        clearFeedback(element);
        return;
    }

    setFeedback(element, message, type);
}

async function syncPhotoUI(photoUrl) {
    perfilState.photoUrl = photoUrl;
    await renderHeader(perfilState.user);
    renderPhotoControls();
}

function bindPhoto() {
    const input = document.getElementById("photoInput");
    const changeBtn = document.getElementById("photoChangeBtn");
    const removeBtn = document.getElementById("photoRemoveBtn");

    if (!input || !changeBtn || !removeBtn) return;

    changeBtn.addEventListener("click", () => input.click());

    input.addEventListener("change", async () => {
        const file = input.files?.[0];
        input.value = "";

        const invalid = validateProfilePhoto(file);
        if (invalid) {
            photoFeedback(invalid, "error");
            return;
        }

        changeBtn.disabled = true;
        removeBtn.disabled = true;
        photoFeedback("Enviando foto...");

        try {
            await saveProfilePhoto(file);
            await syncPhotoUI(await refreshProfilePhoto());
            photoFeedback("Foto atualizada.");
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                redirectToLogin({ expired: true });
                return;
            }
            photoFeedback(error.message || "Não foi possível salvar a foto.", "error");
        } finally {
            changeBtn.disabled = false;
            removeBtn.disabled = false;
        }
    });

    removeBtn.addEventListener("click", async () => {
        const confirmed = await openConfirm({
            title: "Remover foto?",
            message: "Seu avatar voltará a mostrar as iniciais. Você pode adicionar outra depois.",
            confirmLabel: "Remover foto",
            cancelLabel: "Cancelar",
            danger: true,
            icon: "bx-trash",
        });
        if (!confirmed) return;

        changeBtn.disabled = true;
        removeBtn.disabled = true;

        try {
            await deleteProfilePhoto();
            await syncPhotoUI(await refreshProfilePhoto());
            photoFeedback("Foto removida.");
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                redirectToLogin({ expired: true });
                return;
            }
            photoFeedback(error.message || "Não foi possível remover a foto.", "error");
        } finally {
            changeBtn.disabled = false;
            removeBtn.disabled = false;
        }
    });
}

bindForms();
bindHybrid();
bindPhoto();
initPerfil();

window.addEventListener("beforeunload", (event) => {
    if (dirtyForms.size === 0) return;

    event.preventDefault();
    event.returnValue = "";
});