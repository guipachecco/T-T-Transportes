import { getToken } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db, messaging } from "./firebase-init.js";

const VAPID_KEY = "BK_3vIOXAN9QsojUOvGwmFsouoL0igFXPYnPAZaJUJjhLPk5O-829e_qj2q-p5BBZuQYMcTIllcmw4rtSjsaP2A";

export async function solicitarPermissaoNotificacoes(user) {
  if (!VAPID_KEY || !('Notification' in window)) return;

  // Se o usuário já bloqueou as notificações no navegador, ignora silenciosamente
  if (Notification.permission === 'denied') {
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token && user) {
        await setDoc(doc(db, "usuarios", user.uid), { fcmToken: token }, { merge: true });
      }
    }
  } catch (error) {
    // Trata o erro no console sem abrir pop-ups na tela do usuário
    console.warn("Permissão de notificações não concedida:", error.message);
  }
}