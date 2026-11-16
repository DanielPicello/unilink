const options = document.querySelectorAll(".register-option");
const stepIndicators = document.querySelectorAll(".register-step");
const panels = document.querySelectorAll(".register-panel");
const profileFieldGroups = document.querySelectorAll("[data-profile-fields]");

const step1Continue = document.querySelector("#step1-continue");
const nameLabel = document.querySelector('[data-field="name-label"]');
const nameInput = document.querySelector('[data-field="name-input"]');
const submitButton = document.querySelector("[data-submit]");
const backButtons = document.querySelectorAll("[data-back]");

const step3Title = document.getElementById("step3Title");
const step3Subtitle = document.getElementById("step3Subtitle");

const step2Feedback = document.getElementById("step2Feedback");
const registerFeedback = document.getElementById("registerFeedback");

let currentStep = 1;
let selectedType = "student";
let isSubmitting = false;
const PANEL_BY_TYPE = Object.freeze({
    student: "painel-aluno.html",
    teacher: "painel-professor.html",
    company: "painel-empresa.html",
});

const fields = {
    fullName: document.getElementById("fullName"),
    email: document.getElementById("email"),
    password: document.getElementById("password"),
    confirmPassword: document.getElementById("confirmPassword"),
    educationLevel: document.getElementById("educationLevel"),
    university: document.getElementById("university"),
    course: document.getElementById("course"),
    period: document.getElementById("period"),
    hourlyRate: document.getElementById("hourlyRate"),
    subjects: document.getElementById("subjects"),
    cnpj: document.getElementById("cnpj"),
    sector: document.getElementById("sector"),
    website: document.getElementById("website"),
    companySize: document.getElementById("companySize"),
    city: document.getElementById("city"),
    bio: document.getElementById("bio"),
};

function showFeedback(element, message) {
    element.textContent = message;
    element.className = "auth-feedback error";
    element.hidden = false;
}

function clearFeedback(element) {
    element.hidden = true;
    element.textContent = "";
}

function markInvalid(element) {
    if (element) element.classList.add("invalid");
}

function clearInvalid() {
    document.querySelectorAll(".invalid").forEach((element) => {
        element.classList.remove("invalid");
    });
}

function clearAllFeedback() {
    clearFeedback(step2Feedback);
    clearFeedback(registerFeedback);
    clearInvalid();
}

function fail(element, message, field) {
    if (field) {
        markInvalid(field);
        field.focus();
    }
    showFeedback(element, message);
    return false;
}

function normalizeCnpj(value) {
    return String(value).replace(/\D/g, "");
}

function parseHourlyRate(value) {
    const raw = String(value).trim().replace(/[^\d,.-]/g, "");

    if (!raw) return null;

    const normalized = raw.includes(",")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw;

    const parsed = Number(normalized);

    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function splitSubjects(value) {
    const seen = new Set();

    return String(value)
        .split(",")
        .map((subject) => subject.trim())
        .filter(Boolean)
        .filter((subject) => {
            const key = subject.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

function validateStep2() {
    clearFeedback(step2Feedback);
    clearInvalid();

    const isCompany = selectedType === "company";
    const name = fields.fullName.value.trim();
    const email = fields.email.value.trim();
    const password = fields.password.value;
    const confirmPassword = fields.confirmPassword.value;

    if (!name) {
        return fail(
            step2Feedback,
            isCompany ? "Informe o nome da empresa." : "Informe seu nome completo.",
            fields.fullName
        );
    }

    if (!email) {
        return fail(step2Feedback, "Informe seu e-mail.", fields.email);
    }

    if (!fields.email.checkValidity()) {
        return fail(step2Feedback, "Informe um e-mail válido.", fields.email);
    }

    if (!password) {
        return fail(step2Feedback, "Crie uma senha.", fields.password);
    }

    if (password.length < 8) {
        return fail(step2Feedback, "A senha precisa ter no mínimo 8 caracteres.", fields.password);
    }

    if (confirmPassword !== password) {
        return fail(step2Feedback, "As senhas não conferem.", fields.confirmPassword);
    }

    return true;
}

function validateStep3() {
    clearFeedback(registerFeedback);
    clearInvalid();

    if (!fields.bio.value.trim()) {
        return fail(registerFeedback, "Preencha a bio / sobre.", fields.bio);
    }

    if (selectedType === "student") {
        if (!fields.educationLevel.value.trim()) {
            return fail(
                registerFeedback,
                "Informe seu nível de ensino.",
                fields.educationLevel
            );
        }
    }

    if (selectedType === "teacher") {
        if (!fields.university.value.trim()) {
            return fail(registerFeedback, "Informe a universidade.", fields.university);
        }
        if (!fields.course.value.trim()) {
            return fail(registerFeedback, "Informe o curso.", fields.course);
        }
        if (!fields.period.value.trim()) {
            return fail(registerFeedback, "Informe o período.", fields.period);
        }
        if (parseHourlyRate(fields.hourlyRate.value) === null) {
            return fail(
                registerFeedback,
                "Informe um valor por hora válido (ex: 60 ou 60,50).",
                fields.hourlyRate
            );
        }
        if (splitSubjects(fields.subjects.value).length === 0) {
            return fail(
                registerFeedback,
                "Informe pelo menos uma matéria (separe por vírgula).",
                fields.subjects
            );
        }
    }

    if (selectedType === "company") {
        if (normalizeCnpj(fields.cnpj.value).length !== 14) {
            return fail(registerFeedback, "Informe um CNPJ com 14 dígitos.", fields.cnpj);
        }
        if (!fields.sector.value.trim()) {
            return fail(registerFeedback, "Informe o setor.", fields.sector);
        }
        if (!fields.companySize.value.trim()) {
            return fail(registerFeedback, "Informe o tamanho da empresa.", fields.companySize);
        }
    }

    return true;
}

function buildPayload() {
    const email = fields.email.value.trim();
    const password = fields.password.value;
    const bio = fields.bio.value.trim();
    const city = fields.city.value.trim() || null;

    if (selectedType === "student") {
        return {
            email,
            password,
            fullName: fields.fullName.value.trim(),
            bio,
            educationLevel: fields.educationLevel.value.trim(),
            city,
        };
    }

    if (selectedType === "teacher") {
        return {
            email,
            password,
            fullName: fields.fullName.value.trim(),
            bio,
            university: fields.university.value.trim(),
            course: fields.course.value.trim(),
            period: fields.period.value.trim(),
            hourlyRate: parseHourlyRate(fields.hourlyRate.value),
            subjects: splitSubjects(fields.subjects.value),
            city,
        };
    }

    return {
        companyName: fields.fullName.value.trim(),
        email,
        password,
        cnpj: normalizeCnpj(fields.cnpj.value),
        sector: fields.sector.value.trim(),
        website: fields.website.value.trim(),
        companySize: fields.companySize.value.trim(),
        bio,
        city,
    };
}

function registerByType(payload) {
    if (selectedType === "student") return registerStudent(payload);
    if (selectedType === "teacher") return registerTeacher(payload);
    return registerCompany(payload);
}

const serverFieldMap = {
    email: "email",
    password: "password",
    fullName: "fullName",
    companyName: "fullName",
    bio: "bio",
    educationLevel: "educationLevel",
    city: "city",
    university: "university",
    course: "course",
    period: "period",
    hourlyRate: "hourlyRate",
    subjects: "subjects",
    cnpj: "cnpj",
    sector: "sector",
    website: "website",
    companySize: "companySize",
};

function applyServerValidationErrors(validationErrors) {
    const entries = Object.entries(validationErrors ?? {});

    entries.forEach(([field]) => {
        const key = serverFieldMap[field];
        if (key && fields[key]) markInvalid(fields[key]);
    });

    showFeedback(
        registerFeedback,
        entries[0]?.[1] ?? "Confira os dados enviados e tente novamente."
    );
}

function goToStep(step) {
    currentStep = step;

    panels.forEach((panel) => {
        const panelStep = Number(panel.dataset.stepPanel);
        panel.style.display = panelStep === step ? "block" : "none";
    });

    stepIndicators.forEach((indicator) => {
        const indicatorStep = Number(indicator.dataset.step);
        indicator.classList.remove("active", "completed");

        if (indicatorStep < step) {
            indicator.classList.add("completed");
        } else if (indicatorStep === step) {
            indicator.classList.add("active");
        }
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function applyTypeToStep2() {
    if (selectedType === "company") {
        nameLabel.textContent = "Nome da empresa";
        nameInput.placeholder = "Ex: Innovate";
    } else {
        nameLabel.textContent = "Nome completo";
        nameInput.placeholder = "Ex: Maria Silva";
    }
}

function applyTypeToStep3() {
    profileFieldGroups.forEach((group) => {
        group.style.display =
            group.dataset.profileFields === selectedType ? "grid" : "none";
    });

    if (selectedType === "company") {
        step3Title.textContent = "Sobre sua empresa";
        step3Subtitle.textContent =
            "Conte um pouco sobre a empresa para personalizar o perfil.";
        fields.bio.placeholder =
            "Conte o que a empresa faz e que tipo de talento procura...";
        submitButton.innerHTML = "<i class='bx bx-check'></i> Criar conta da empresa";
    } else {
        step3Title.textContent = "Sobre você";
        step3Subtitle.textContent =
            "Conte um pouco para personalizar seu perfil.";
        fields.bio.placeholder =
            "Conte um pouco sobre você...";
        submitButton.innerHTML = "<i class='bx bx-check'></i> Criar conta";
    }
}

options.forEach((option) => {
    option.addEventListener("click", () => {
        options.forEach((item) => item.classList.remove("selected"));
        option.classList.add("selected");
        selectedType = option.dataset.type;
        step1Continue.disabled = false;
        clearAllFeedback();
    });
});

step1Continue.addEventListener("click", () => {
    if (step1Continue.disabled) return;
    applyTypeToStep2();
    clearAllFeedback();
    goToStep(2);
});

document.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => {
        const nextStep = Number(button.dataset.next);

        if (nextStep === 3 && !validateStep2()) return;

        if (nextStep === 3) applyTypeToStep3();
        goToStep(nextStep);
    });
});

backButtons.forEach((button) => {
    button.addEventListener("click", () => {
        clearAllFeedback();
        goToStep(currentStep - 1);
    });
});

async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;
    if (!validateStep3()) return;

    const email = fields.email.value.trim();
    const password = fields.password.value;
    const originalHtml = submitButton.innerHTML;

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.innerHTML = "<i class='bx bx-loader-alt bx-spin'></i> Criando conta...";

    try {
        await registerByType(buildPayload());
    } catch (error) {
        if (error instanceof ApiError) {
            if (error.status === 400) {
                applyServerValidationErrors(error.validationErrors);
            } else {
                showFeedback(registerFeedback, error.message);
            }
        } else {
            showFeedback(
                registerFeedback,
                "Não foi possível conectar à API. Ela está rodando em localhost:8080?"
            );
        }

        isSubmitting = false;
        submitButton.disabled = false;
        submitButton.innerHTML = originalHtml;
        return;
    }
    try {
        await login(email, password);
    } catch (loginError) {
        console.error("Cadastro concluído, mas o login automático falhou:", loginError);
        writeLoginFlag(LOGIN_REGISTERED_KEY, "1");
        window.location.href = "login.html";
        return;
    }

    window.location.replace(PANEL_BY_TYPE[selectedType] ?? "dashboard.html");
}

if (submitButton) {
    submitButton.addEventListener("click", handleSubmit);
}