import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  deleteUser as deleteAuthUser,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db, getSecondaryAuth } from "../firebase";

const USERS_COLLECTION = "usuarios";
// Marca contas excluídas pelo admin; o próprio usuário apaga sua credencial do Auth no próximo acesso.
const REMOVED_COLLECTION = "usuarios_removidos";
const REMOVED_MESSAGE = "Esta conta foi removida pelo administrador e não tem mais acesso ao Movi60.";

// Se o perfil não existe mas há marcação de remoção, apaga a credencial do Auth.
async function purgeIfRemoved(firebaseUser) {
  try {
    const tomb = await getDoc(doc(db, REMOVED_COLLECTION, firebaseUser.uid));
    if (!tomb.exists()) return false;
    await deleteDoc(doc(db, REMOVED_COLLECTION, firebaseUser.uid));
    await deleteAuthUser(firebaseUser);
    return true;
  } catch (error) {
    console.warn("Não foi possível concluir a remoção da conta:", error);
    return false;
  }
}

/** Aguarda o Firebase Auth restaurar a sessão salva e devolve o perfil, se houver. */
export function restoreSession() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe();
      if (!firebaseUser) return resolve(null);
      try {
        const snapshot = await getDoc(doc(db, USERS_COLLECTION, firebaseUser.uid));
        if (snapshot.exists()) return resolve({ user: { id: snapshot.id, ...snapshot.data() } });
        const removed = await purgeIfRemoved(firebaseUser);
        try { await signOut(auth); } catch {}
        resolve(removed ? { message: REMOVED_MESSAGE } : null);
      } catch (error) {
        console.warn("Não foi possível restaurar a sessão:", error);
        resolve(null);
      }
    }, () => resolve(null));
  });
}

const clean = (user) => {
  if (!user) return null;
  const { passwordHash, passwordSalt, ...profile } = user;
  return profile;
};

function firebaseMessage(error) {
  const code = error?.code || "";
  if (code.includes("email-already-in-use")) return "Este e-mail já possui uma conta.";
  if (code.includes("invalid-email")) return "O endereço de e-mail é inválido.";
  if (code.includes("weak-password")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) return "E-mail ou senha incorretos.";
  if (code.includes("too-many-requests")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (code.includes("network-request-failed")) return "Falha de conexão. Verifique sua internet.";
  if (code.includes("permission-denied")) return "O Firebase recusou a operação. Verifique as regras do Firestore e se sua conta tem permissão.";
  return error?.message || "Não foi possível concluir a operação. Tente novamente.";
}

async function getCurrentProfile() {
  if (!auth.currentUser) return null;
  const snapshot = await getDoc(doc(db, USERS_COLLECTION, auth.currentUser.uid));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

// Guarda o último erro ao carregar usuários para a tela poder mostrar o motivo
// (antes o erro era engolido e a lista simplesmente aparecia vazia).
let usersLoadError = "";
export function getUsersLoadError() {
  return usersLoadError;
}

export async function allUsers() {
  usersLoadError = "";
  const current = auth.currentUser;
  if (!current) return [];

  let ownProfile = null;
  try {
    ownProfile = await getCurrentProfile();
  } catch (error) {
    console.warn("Não foi possível carregar o próprio perfil no Firestore:", error);
    usersLoadError = firebaseMessage(error);
    return [];
  }
  if (!ownProfile) {
    usersLoadError = "Seu perfil não foi encontrado na coleção 'usuarios' do Firestore.";
    return [];
  }

  try {
    let remoteUsers = [ownProfile];
    if (ownProfile.role === "admin") {
      const snapshot = await getDocs(collection(db, USERS_COLLECTION));
      remoteUsers = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    } else if (ownProfile.role === "instructor") {
      const assigned = await getDocs(
        query(
          collection(db, USERS_COLLECTION),
          where("role", "==", "student"),
          where("instructorId", "==", current.uid)
        )
      );
      remoteUsers = [ownProfile, ...assigned.docs.map((item) => ({ id: item.id, ...item.data() }))];
    }

    // Garante campos de texto para a busca por nome/e-mail não quebrar.
    return remoteUsers.map((item) => ({ ...item, name: item.name || "", email: item.email || "" }));
  } catch (error) {
    console.warn("Não foi possível carregar os usuários do Firestore:", error);
    usersLoadError = firebaseMessage(error);
    return [ownProfile];
  }
}

export async function signIn(email, password) {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized || !password) return { message: "Informe seu e-mail e senha." };

  try {
    const credential = await signInWithEmailAndPassword(auth, normalized, password);
    const snapshot = await getDoc(doc(db, USERS_COLLECTION, credential.user.uid));
    if (!snapshot.exists()) {
      const removed = await purgeIfRemoved(credential.user);
      try { await signOut(auth); } catch {}
      if (removed) return { message: REMOVED_MESSAGE };
      return { message: "Sua conta foi autenticada, mas o perfil do Movi60 não foi encontrado. Procure o administrador." };
    }
    // Registra o acesso no perfil (não bloqueia o login se falhar).
    try {
      await updateDoc(doc(db, USERS_COLLECTION, credential.user.uid), {
        ultimoLogin: serverTimestamp(),
        totalLogins: increment(1),
      });
    } catch (logError) {
      console.warn("Não foi possível registrar o login no Firestore:", logError);
    }
    return { user: { id: snapshot.id, ...snapshot.data() } };
  } catch (error) {
    return { message: firebaseMessage(error) };
  }
}

export async function signUp(input) {
  const name = (input.name || "").trim();
  const email = (input.email || "").trim().toLowerCase();
  const password = input.password || "";
  const role = input.role || "student";

  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 6) {
    return { message: "Informe nome, e-mail válido e senha com ao menos 6 caracteres." };
  }
  if (role === "admin") {
    return { message: "Não é permitido criar administradores pelo cadastro do aplicativo." };
  }

  let secondaryAuth = null;
  let createdCredential = null;

  try {
    const currentProfile = await getCurrentProfile();
    const isAdminCreating = Boolean(input.adminCreate && auth.currentUser && currentProfile?.role === "admin");

    if (input.adminCreate && !isAdminCreating) {
      return { message: "Para cadastrar usuários pela gestão, entre com uma conta de administrador autenticada pelo Firebase." };
    }

    if (isAdminCreating) {
      secondaryAuth = getSecondaryAuth();
      createdCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    } else {
      if (auth.currentUser) {
        return { message: "Encerre a sessão atual antes de criar uma nova conta." };
      }
      createdCredential = await createUserWithEmailAndPassword(auth, email, password);
    }

    const profile = {
      id: createdCredential.user.uid,
      name,
      email,
      role,
      birthDate: input.birthDate || "",
      instructorId: input.instructorId || "",
      totalLogins: 0,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, USERS_COLLECTION, createdCredential.user.uid), profile);

    if (secondaryAuth) {
      await signOut(secondaryAuth);
    }

    return { user: { ...profile, createdAt: new Date().toISOString() } };
  } catch (error) {
    if (createdCredential?.user) {
      try { await deleteAuthUser(createdCredential.user); } catch {}
    }
    if (secondaryAuth) {
      try { await signOut(secondaryAuth); } catch {}
    } else if (createdCredential?.user && auth.currentUser?.uid === createdCredential.user.uid) {
      try { await signOut(auth); } catch {}
    }
    return { message: firebaseMessage(error) };
  }
}

export async function resetPassword(email) {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized) return { message: "Digite o e-mail para recuperar o acesso." };

  try {
    await sendPasswordResetEmail(auth, normalized);
    return { message: "Enviamos um link de redefinição de senha para seu e-mail. Verifique também a caixa de spam." };
  } catch (error) {
    return { message: firebaseMessage(error) };
  }
}

export async function updateUser(next) {
  try {
    // Campos controlados pelo sistema não são reenviados na edição do perfil.
    const { id, createdAt, ultimoLogin, totalLogins, ...updates } = next;
    const ref = doc(db, USERS_COLLECTION, id);
    await updateDoc(ref, updates);
    const snapshot = await getDoc(ref);
    return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
  } catch (error) {
    console.warn("Erro ao atualizar perfil:", error);
    throw new Error(firebaseMessage(error));
  }
}

export async function deleteUser(id) {
  try {
    const profileRef = doc(db, USERS_COLLECTION, id);
    const profile = await getDoc(profileRef);
    // 1) Marca a conta como removida (bloqueia o acesso e apaga o login no próximo acesso).
    await setDoc(doc(db, REMOVED_COLLECTION, id), {
      email: profile.exists() ? profile.data().email || "" : "",
      removidoPor: auth.currentUser?.uid || "",
      removidoEm: serverTimestamp(),
    });
    // 2) Remove os treinos agendados do aluno.
    const workouts = await getDocs(query(collection(db, "treinos"), where("studentId", "==", id)));
    await Promise.all(workouts.docs.map((item) => deleteDoc(item.ref)));
    // 3) Remove o perfil.
    await deleteDoc(profileRef);
    return {
      message: "Usuário excluído. O acesso foi bloqueado e o login será apagado do Firebase Authentication automaticamente.",
    };
  } catch (error) {
    return { message: firebaseMessage(error) };
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn("Erro ao encerrar sessão:", error);
  }
}
