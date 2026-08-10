let eventoInstalacao = null;

const botaoInstalar = document.getElementById('install-app-button');
const statusConexao = document.getElementById('network-status');

function estaExecutandoComoAplicativo() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function dispositivoIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function atualizarStatusConexao() {
  if (!statusConexao) return;
  const offline = !window.navigator.onLine;
  statusConexao.classList.toggle('visible', offline);
  statusConexao.setAttribute('aria-hidden', String(!offline));
}

function atualizarBotaoInstalacao() {
  if (!botaoInstalar) return;
  const podeOrientarIos = dispositivoIos() && !estaExecutandoComoAplicativo();
  botaoInstalar.classList.toggle('hidden', estaExecutandoComoAplicativo() || (!eventoInstalacao && !podeOrientarIos));
}

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  eventoInstalacao = event;
  atualizarBotaoInstalacao();
});

window.addEventListener('appinstalled', () => {
  eventoInstalacao = null;
  atualizarBotaoInstalacao();
});

window.addEventListener('online', atualizarStatusConexao);
window.addEventListener('offline', atualizarStatusConexao);

if (botaoInstalar) {
  botaoInstalar.addEventListener('click', async () => {
    if (eventoInstalacao) {
      eventoInstalacao.prompt();
      await eventoInstalacao.userChoice;
      eventoInstalacao = null;
      atualizarBotaoInstalacao();
      return;
    }

    if (dispositivoIos()) {
      Swal.fire({
        icon: 'info',
        title: 'Instalar no iPhone ou iPad',
        html: 'No Safari, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.',
        confirmButtonColor: '#0F172A'
      });
    }
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })
      .catch((error) => console.warn('Não foi possível preparar o aplicativo offline:', error.message));
  });
}

atualizarStatusConexao();
atualizarBotaoInstalacao();
