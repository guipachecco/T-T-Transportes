import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js";
import { firebaseConfig, appCheckSiteKey } from "./firebase-config.js";

// Inicializa o Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
export const messaging = getMessaging(app);
export let appCheckConfigured = Boolean(appCheckSiteKey?.trim());
export let appCheck = null;

if (appCheckConfigured) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey.trim()),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    appCheckConfigured = false;
    console.error('Não foi possível iniciar o Firebase App Check:', error);
  }
}
