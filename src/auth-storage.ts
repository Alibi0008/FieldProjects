const TOKEN_KEY = 'tf_token';
const USER_KEY = 'tf_user';

const migrateLegacySession = () => {
  const legacyToken = localStorage.getItem(TOKEN_KEY);
  const legacyUser = localStorage.getItem(USER_KEY);

  if (!sessionStorage.getItem(TOKEN_KEY) && legacyToken) {
    sessionStorage.setItem(TOKEN_KEY, legacyToken);
  }

  if (!sessionStorage.getItem(USER_KEY) && legacyUser) {
    sessionStorage.setItem(USER_KEY, legacyUser);
  }

  if (legacyToken) {
    localStorage.removeItem(TOKEN_KEY);
  }

  if (legacyUser) {
    localStorage.removeItem(USER_KEY);
  }
};

export const AuthStorage = {
  readToken() {
    migrateLegacySession();
    return sessionStorage.getItem(TOKEN_KEY);
  },
  readUser() {
    migrateLegacySession();
    return sessionStorage.getItem(USER_KEY);
  },
  writeSession(token: string, user: unknown) {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  writeUser(user: unknown) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.removeItem(USER_KEY);
  },
  clearSession() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
