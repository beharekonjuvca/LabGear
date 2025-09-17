export function setAuth({ accessToken, user }) {
  if (accessToken) localStorage.setItem("accessToken", accessToken);
  if (user) localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function isStaffOrAdmin() {
  const u = getUser();
  return u && (u.role === "STAFF" || u.role === "ADMIN");
}
