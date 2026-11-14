import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const EXERCISES = "exercicios";
const WORKOUTS = "treinos";
const HISTORY = "historico";
const PREFERENCES = "preferencias";
const COMPLETED_WORKOUTS = "treinos_concluidos";

function withId(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

// Remove campos undefined (o Firestore recusa documentos com undefined).
function cleanData(data) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

export async function loadExercises() {
  const snapshot = await getDocs(collection(db, EXERCISES));
  return withId(snapshot);
}

export async function loadWorkouts(user) {
  const ref = collection(db, WORKOUTS);
  let snapshot;

  if (user.role === "admin") {
    snapshot = await getDocs(ref);
  } else if (user.role === "instructor") {
    snapshot = await getDocs(query(ref, where("professionalId", "==", user.id)));
  } else {
    snapshot = await getDocs(query(ref, where("studentId", "==", user.id)));
  }

  return withId(snapshot);
}

export async function loadHistory(user) {
  const ref = collection(db, HISTORY);
  let snapshot;

  if (user.role === "admin") {
    snapshot = await getDocs(ref);
  } else if (user.role === "instructor") {
    snapshot = await getDocs(query(ref, where("instructorId", "==", user.id)));
  } else {
    snapshot = await getDocs(query(ref, where("userId", "==", user.id)));
  }

  return withId(snapshot);
}

export async function loadPreferences(userId) {
  const snapshot = await getDoc(doc(db, PREFERENCES, userId));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function saveExercise(exercise) {
  const { id, criadoEm, ...data } = exercise;
  await setDoc(doc(db, EXERCISES, id), cleanData({
    ...data,
    criadoEm: criadoEm || serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  }));
}

// Grava o catálogo inicial de exercícios quando a coleção ainda está vazia,
// para que os treinos apontem para exercícios que existem no banco.
export async function seedExercises(exercises) {
  await Promise.all(exercises.map((exercise) => saveExercise(exercise)));
}

export async function removeExercise(exerciseId) {
  await deleteDoc(doc(db, EXERCISES, exerciseId));
}

export async function saveWorkout(workout) {
  const { id, criadoEm, ...data } = workout;
  await setDoc(doc(db, WORKOUTS, id), cleanData({
    ...data,
    criadoEm: criadoEm || serverTimestamp(),
    atualizadoEm: serverTimestamp(),
  }));
}

export async function removeWorkout(workoutId) {
  await deleteDoc(doc(db, WORKOUTS, workoutId));
}

export async function saveHistory(record) {
  const { id, ...data } = record;
  await setDoc(doc(db, HISTORY, id), cleanData({ ...data, registradoEm: serverTimestamp() }));
}

// Registro de treino completo (todos os exercícios do dia concluídos).
export async function saveWorkoutCompletion(record) {
  const { id, ...data } = record;
  await setDoc(doc(db, COMPLETED_WORKOUTS, id), cleanData({ ...data, registradoEm: serverTimestamp() }));
}

export async function savePreferences(userId, preferences) {
  // merge: não apaga outros campos (ex.: onboardingConcluido) ao salvar a acessibilidade.
  await setDoc(doc(db, PREFERENCES, userId), cleanData(preferences), { merge: true });
}
