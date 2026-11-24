const API_BASE = "http://localhost:8080/api/v1";

class ApiError extends Error {
    constructor(status, message, validationErrors = {}) {
        super(message);
        this.status = status;
        this.validationErrors = validationErrors;
    }
}

async function apiRequest(path, { method = "GET", body } = {}) {
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    const response = await fetch(`${API_BASE}${path}`, {
        method,
        credentials: "include",
        headers: body && !isFormData ? { "Content-Type": "application/json" } : undefined,
        body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new ApiError(
            response.status,
            data?.message ?? "Erro inesperado.",
            data?.validationErrors
        );
    }
    return data;
}

function login(email, password) {
    return apiRequest("/auth/login", {
        method: "POST",
        body: { email, password },
    });
}

function registerStudent(payload) {
    return apiRequest("/auth/register/student", {
        method: "POST",
        body: payload,
    });
}

function registerTeacher(payload) {
    return apiRequest("/auth/register/teacher", {
        method: "POST",
        body: payload,
    });
}

function registerCompany(payload) {
    return apiRequest("/auth/register/company", {
        method: "POST",
        body: payload,
    });
}

function getCurrentUser() {
    return apiRequest("/auth/me");
}

function getProfilePhoto() {
    return apiRequest("/profile/photo");
}

function saveProfilePhoto(file) {
    const formData = new FormData();
    formData.append("photo", file);
    return apiRequest("/profile/photo", { method: "PUT", body: formData });
}

function deleteProfilePhoto() {
    return apiRequest("/profile/photo", { method: "DELETE" });
}

function saveTeacherSubjectModes(subjects) {
    return apiRequest("/profile/teacher/subject-modes", {
        method: "PUT",
        body: { subjects },
    });
}

function saveTeacherVisibility(isPublic) {
    return apiRequest("/profile/teacher/visibility", {
        method: "PUT",
        body: { isPublic },
    });
}

function logout() {
    return apiRequest("/auth/logout", { method: "POST" });
}

function updatePersonalProfile(payload) {
    return apiRequest("/profile/personal", { method: "PUT", body: payload });
}

function updateStudentProfile(payload) {
    return apiRequest("/profile/student", { method: "PUT", body: payload });
}

function updateTeacherProfile(payload) {
    return apiRequest("/profile/teacher", { method: "PUT", body: payload });
}

function updateCompanyProfile(payload) {
    return apiRequest("/profile/company", { method: "PUT", body: payload });
}

function changePassword(payload) {
    return apiRequest("/auth/password", { method: "PATCH", body: payload });
}

function deleteAccount(payload) {
    return apiRequest("/auth/account", { method: "DELETE", body: payload });
}

function addTeacherProfile(payload) {
    return apiRequest("/profile/teacher", { method: "POST", body: payload });
}

function addStudentProfile(payload) {
    return apiRequest("/profile/student", { method: "POST", body: payload });
}

function removeTeacherProfile() {
    return apiRequest("/profile/teacher", { method: "DELETE" });
}

function removeStudentProfile() {
    return apiRequest("/profile/student", { method: "DELETE" });
}

async function getOptionalUser() {
    try {
        return await getCurrentUser();
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
    }
}

function searchTeachers(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
            query.set(key, value);
        }
    });

    return apiRequest(`/teachers?${query.toString()}`);
}

function getTeacher(teacherId) {
    return apiRequest(`/teachers/${encodeURIComponent(teacherId)}`);
}

function listFavoriteTeachers({ page = 0, size = 12 } = {}) {
    const query = new URLSearchParams({
        page: String(page),
        size: String(size),
    });

    return apiRequest(`/students/me/favorites?${query.toString()}`);
}

function getFavoriteTeacherStatus(teacherIds) {
    if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
        return Promise.resolve([]);
    }

    const query = new URLSearchParams();
    teacherIds.forEach((id) => query.append("teacherIds", id));

    return apiRequest(`/students/me/favorites/status?${query.toString()}`);
}

function addFavoriteTeacher(teacherId) {
    return apiRequest(
        `/students/me/favorites/${encodeURIComponent(teacherId)}`,
        { method: "POST" }
    );
}

function removeFavoriteTeacher(teacherId) {
    return apiRequest(
        `/students/me/favorites/${encodeURIComponent(teacherId)}`,
        { method: "DELETE" }
    );
}