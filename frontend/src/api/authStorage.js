/**
 * Phiên đăng nhập theo tab (sessionStorage), không chia sẻ giữa các tab.
 * localStorage trước đây khiến mọi tab cùng origin ghi đè token/role khi reload hoặc đăng nhập tab khác.
 */

const K = {
  token: 'token',
  role: 'role',
  username: 'username',
};

function session() {
  if (typeof sessionStorage === 'undefined') return null;
  return sessionStorage;
}

/** Gỡ bản ghi cũ trên localStorage (tránh tab chưa refresh vẫn thấy token chung). */
function clearLegacyLocal() {
  try {
    localStorage.removeItem(K.token);
    localStorage.removeItem(K.role);
    localStorage.removeItem(K.username);
  } catch {
    /* ignore */
  }
}

export function getToken() {
  return session()?.getItem(K.token) ?? null;
}

export function getRole() {
  return session()?.getItem(K.role) ?? '';
}

export function getUsername() {
  return session()?.getItem(K.username) ?? '';
}

/** Ghi nhận đăng nhập thành công (chỉ tab hiện tại). */
export function setSessionFromLogin({ token, role, username }) {
  const s = session();
  if (!s || !token) return;
  s.setItem(K.token, token);
  s.setItem(K.role, (role || '').toString());
  if (username) s.setItem(K.username, username);
  else s.removeItem(K.username);
  clearLegacyLocal();
}

/** Đăng xuất tab hiện tại. */
export function clearSession() {
  const s = session();
  if (s) {
    s.removeItem(K.token);
    s.removeItem(K.role);
    s.removeItem(K.username);
  }
  clearLegacyLocal();
}
