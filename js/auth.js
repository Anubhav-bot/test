function authenticate(email, password) {
  const user = getUserByEmail(email);
  if (!user) return null;
  if (user.password !== password) return null;
  setSession({ userId: user.id, role: user.role });
  return user;
}

function getCurrentUser() {
  const session = getSession();
  if (!session) return null;
  return getUserById(session.userId);
}

function getCurrentRole() {
  const session = getSession();
  return session ? session.role : "public";
}

function logout() {
  clearSession();
}
