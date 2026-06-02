const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const CLOUD_COLLECTION = import.meta.env.VITE_FIREBASE_COLLECTION || "accounting_ledgers";
const CLOUD_DOCUMENT_ID = import.meta.env.VITE_FIREBASE_DOCUMENT_ID || "senshu-hisaho-main";
const APP_CHECK_SITE_KEY = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY;
const configured = Object.values(firebaseConfig).every(Boolean);

let cloudContextPromise;

export function cloudStoreEnabled() {
  return configured;
}

async function cloudContext() {
  if (!configured) return null;
  if (!cloudContextPromise) {
    cloudContextPromise = (async () => {
      const [{ initializeApp }, { browserSessionPersistence, getAuth, onAuthStateChanged, setPersistence, signInWithEmailAndPassword, signOut }, { doc, getDoc, getFirestore, serverTimestamp, setDoc }] =
        await Promise.all([import("firebase/app"), import("firebase/auth"), import("firebase/firestore")]);
      const app = initializeApp(firebaseConfig);
      if (APP_CHECK_SITE_KEY) {
        const { initializeAppCheck, ReCaptchaV3Provider } = await import("firebase/app-check");
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(APP_CHECK_SITE_KEY),
          isTokenAutoRefreshEnabled: true,
        });
      }
      const auth = getAuth(app);
      const db = getFirestore(app);
      return { auth, browserSessionPersistence, db, doc, getDoc, onAuthStateChanged, serverTimestamp, setDoc, setPersistence, signInWithEmailAndPassword, signOut };
    })();
  }
  return cloudContextPromise;
}

export async function onCloudAuthState(callback) {
  const context = await cloudContext();
  if (!context) return () => {};
  return context.onAuthStateChanged(context.auth, callback);
}

export async function signInCloud(email, password) {
  const context = await cloudContext();
  if (!context) return null;
  await context.setPersistence(context.auth, context.browserSessionPersistence);
  const credential = await context.signInWithEmailAndPassword(context.auth, email, password);
  return credential.user;
}

export async function signOutCloud() {
  const context = await cloudContext();
  if (!context) return;
  await context.signOut(context.auth);
}

export async function loadCloudData() {
  const context = await cloudContext();
  if (!context) return null;
  if (!context.auth.currentUser) return null;
  const snapshot = await context.getDoc(context.doc(context.db, CLOUD_COLLECTION, CLOUD_DOCUMENT_ID));
  return snapshot.exists() ? snapshot.data().payload ?? null : null;
}

export async function saveCloudData(payload) {
  const context = await cloudContext();
  if (!context) return false;
  if (!context.auth.currentUser) return false;
  await context.setDoc(
    context.doc(context.db, CLOUD_COLLECTION, CLOUD_DOCUMENT_ID),
    {
      payload,
      updatedBy: context.auth.currentUser.email,
      updatedAt: context.serverTimestamp(),
    },
    { merge: true },
  );
  return true;
}
