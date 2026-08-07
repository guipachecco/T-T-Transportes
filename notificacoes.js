import { getToken } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { db, messaging } from "./firebase-init.js";

const VAPID_KEY = "BK_3vIOXAN9QsojUOvGwmFsouoL0igFXPYnPAZaJUJjhLPk5O-829e_qj2q-p5BBZuQYMcTIllcmw4rtSjsaP2A";

async function obterRegistroNotificacoes() {
  if (!('serviceWorker' in navigator)) return null;

  return navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
}

export async function solicitarPermissaoNotificacoes(user) {
  if (!VAPID_KEY || !('Notification' in window)) return;

  // Se o usuário já bloqueou as notificações no navegador, ignora silenciosamente
  if (Notification.permission === 'denied') {
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const registro = await obterRegistroNotificacoes();
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        ...(registro ? { serviceWorkerRegistration: registro } : {})
      });
      if (token && user) {
        await setDoc(doc(db, "usuarios", user.uid), { fcmToken: token }, { merge: true });
      }
    }
  } catch (error) {
    // Trata o erro no console sem abrir pop-ups na tela do usuário
    console.warn("Permissão de notificações não concedida:", error.message);
  }
}

export async function exibirNotificacaoLocal({ titulo, corpo, tag, url = '/?secao=refeicoes' }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const opcoes = {
    body: corpo,
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag,
    renotify: false,
    data: { url, secao: 'refeicoes' }
  };

  try {
    const registro = await obterRegistroNotificacoes();
    if (registro) {
      await registro.showNotification(titulo, opcoes);
    } else {
      new Notification(titulo, opcoes);
    }

    return true;
  } catch (error) {
    console.warn("Não foi possível mostrar o lembrete de almoço:", error.message);
    return false;
  }
}
