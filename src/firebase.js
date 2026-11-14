import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  inMemoryPersistence,
} from "firebase/auth";
import {
  initializeAppCheck,
  getAppCheck,
  ReCaptchaEnterpriseProvider,
} from "firebase/app-check";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyBw1zewxCoXmIaB6aYOoKTgIq12OjP8oo8",
  authDomain: "movi60.firebaseapp.com",
  projectId: "movi60",
  storageBucket: "movi60.firebasestorage.app",
  messagingSenderId: "944649034369",
  appId: "1:944649034369:web:cfce00a35999507ebb0b80",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// App Check para a versão Web.
// No desenvolvimento local, usa o token de depuração do Firebase.
// Em produção Web, exige uma chave de site do reCAPTCHA Enterprise.
function initializeWebAppCheck() {
  if (Platform.OS !== "web") return null;

  const isDevelopment = typeof __DEV__ !== "undefined" && __DEV__;

  if (isDevelopment && typeof self !== "undefined") {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  const siteKey = isDevelopment
    ? "debug-placeholder"
    : process.env.EXPO_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;

  if (!siteKey) {
    console.error(
      "Firebase App Check não foi inicializado: configure EXPO_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY para builds Web de produção."
    );
    return null;
  }

  try {
    return initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    // Evita falha durante Fast Refresh caso o App Check já tenha sido iniciado.
    if (error?.code === "app-check/already-initialized") {
      return getAppCheck(app);
    }
    throw error;
  }
}

export const appCheck = initializeWebAppCheck();

let authInstance;

if (Platform.OS === "web") {
  authInstance = getAuth(app);
} else {
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
export const db = getFirestore(app);

export function getSecondaryAuth() {
  const secondaryName = "Movi60SecondaryAuth";
  const secondaryApp =
    getApps().find((item) => item.name === secondaryName) ||
    initializeApp(firebaseConfig, secondaryName);

  try {
    return initializeAuth(secondaryApp, {
      persistence: inMemoryPersistence,
    });
  } catch (error) {
    return getAuth(secondaryApp);
  }
}
