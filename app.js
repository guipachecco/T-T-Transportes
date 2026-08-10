// =============================================================
// APP.JS - CONTROLADOR DE INTERFACE E REGRAS DE NEGÓCIO
// =============================================================

import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updatePassword
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  arrayUnion, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  where, 
  onSnapshot, 
  serverTimestamp,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Módulos Locais
import { auth, db } from "./firebase-init.js";
import { solicitarPermissaoNotificacoes, exibirNotificacaoLocal } from "./notificacoes.js";
import { fazerUploadImagens } from "./imagens.js";

// Constantes Globais
const PRECO_REFEICAO = 4.00;
const PRAZO_RETIRADA_EPI_DIAS = 5;
const INTERVALO_SOLICITACAO_EPI_DIAS = 60;
const ESTOQUE_EPI_INICIAL = [
  { id: 'polo-cinza-p', produtoId: 'polo-cinza', nome: 'Camisa polo cinza', variacao: 'P', quantidade: 0, ordem: 10, icone: 'camisa' },
  { id: 'polo-cinza-m', produtoId: 'polo-cinza', nome: 'Camisa polo cinza', variacao: 'M', quantidade: 8, ordem: 11, icone: 'camisa' },
  { id: 'polo-cinza-g', produtoId: 'polo-cinza', nome: 'Camisa polo cinza', variacao: 'G', quantidade: 25, ordem: 12, icone: 'camisa' },
  { id: 'polo-cinza-gg', produtoId: 'polo-cinza', nome: 'Camisa polo cinza', variacao: 'GG', quantidade: 0, ordem: 13, icone: 'camisa' },
  { id: 'polo-cinza-g1', produtoId: 'polo-cinza', nome: 'Camisa polo cinza', variacao: 'G1', quantidade: 6, ordem: 14, icone: 'camisa' },
  { id: 'polo-cinza-g2', produtoId: 'polo-cinza', nome: 'Camisa polo cinza', variacao: 'G2', quantidade: 7, ordem: 15, icone: 'camisa' },
  { id: 'polo-cinza-g3', produtoId: 'polo-cinza', nome: 'Camisa polo cinza', variacao: 'G3', quantidade: 0, ordem: 16, icone: 'camisa' },
  { id: 'polo-cinza-g4', produtoId: 'polo-cinza', nome: 'Camisa polo cinza', variacao: 'G4', quantidade: 6, ordem: 17, icone: 'camisa' },
  { id: 'polo-preta-p', produtoId: 'polo-preta', nome: 'Camisa polo preta', variacao: 'P', quantidade: 0, ordem: 20, icone: 'camisa', restricao: 'motorista-administrativo' },
  { id: 'polo-preta-m', produtoId: 'polo-preta', nome: 'Camisa polo preta', variacao: 'M', quantidade: 0, ordem: 21, icone: 'camisa', restricao: 'motorista-administrativo' },
  { id: 'polo-preta-g', produtoId: 'polo-preta', nome: 'Camisa polo preta', variacao: 'G', quantidade: 0, ordem: 22, icone: 'camisa', restricao: 'motorista-administrativo' },
  { id: 'polo-preta-gg', produtoId: 'polo-preta', nome: 'Camisa polo preta', variacao: 'GG', quantidade: 6, ordem: 23, icone: 'camisa', restricao: 'motorista-administrativo' },
  { id: 'polo-preta-g1', produtoId: 'polo-preta', nome: 'Camisa polo preta', variacao: 'G1', quantidade: 0, ordem: 24, icone: 'camisa', restricao: 'motorista-administrativo' },
  { id: 'polo-preta-g2', produtoId: 'polo-preta', nome: 'Camisa polo preta', variacao: 'G2', quantidade: 0, ordem: 25, icone: 'camisa', restricao: 'motorista-administrativo' },
  { id: 'polo-preta-g3', produtoId: 'polo-preta', nome: 'Camisa polo preta', variacao: 'G3', quantidade: 0, ordem: 26, icone: 'camisa', restricao: 'motorista-administrativo' },
  { id: 'polo-preta-g4', produtoId: 'polo-preta', nome: 'Camisa polo preta', variacao: 'G4', quantidade: 0, ordem: 27, icone: 'camisa', restricao: 'motorista-administrativo' },
  { id: 'luva-unico', produtoId: 'luva', nome: 'Luva', variacao: 'Único', quantidade: 9, ordem: 30, icone: 'luva' },
  { id: 'protetor-solar-fps30', produtoId: 'protetor-solar', nome: 'Protetor solar FPS 30', variacao: 'Único', quantidade: 2, ordem: 40, icone: 'frasco' },
  { id: 'repelente-unico', produtoId: 'repelente', nome: 'Repelente', variacao: 'Único', quantidade: 6, ordem: 50, icone: 'frasco' },
  { id: 'oculos-escuro', produtoId: 'oculos-escuro', nome: 'Óculos escuro', variacao: 'Único', quantidade: 4, ordem: 60, icone: 'oculos' },
  { id: 'oculos-protecao', produtoId: 'oculos-protecao', nome: 'Óculos de proteção', variacao: 'Único', quantidade: 2, ordem: 70, icone: 'oculos' },
  { id: 'bota-38', produtoId: 'bota', nome: 'Bota de segurança', variacao: '38', quantidade: 2, ordem: 80, icone: 'bota' },
  { id: 'bota-39', produtoId: 'bota', nome: 'Bota de segurança', variacao: '39', quantidade: 3, ordem: 81, icone: 'bota' },
  { id: 'bota-40', produtoId: 'bota', nome: 'Bota de segurança', variacao: '40', quantidade: 4, ordem: 82, icone: 'bota' },
  { id: 'bota-41', produtoId: 'bota', nome: 'Bota de segurança', variacao: '41', quantidade: 1, ordem: 83, icone: 'bota' },
  { id: 'bota-42', produtoId: 'bota', nome: 'Bota de segurança', variacao: '42', quantidade: 0, ordem: 84, icone: 'bota' },
  { id: 'bota-43', produtoId: 'bota', nome: 'Bota de segurança', variacao: '43', quantidade: 1, ordem: 85, icone: 'bota' },
  { id: 'bota-44', produtoId: 'bota', nome: 'Bota de segurança', variacao: '44', quantidade: 2, ordem: 86, icone: 'bota' },
  { id: 'bota-45', produtoId: 'bota', nome: 'Bota de segurança', variacao: '45', quantidade: 0, ordem: 87, icone: 'bota' },
  { id: 'bota-46', produtoId: 'bota', nome: 'Bota de segurança', variacao: '46', quantidade: 0, ordem: 88, icone: 'bota' },
  { id: 'capa-chuva-unico', produtoId: 'capa-chuva', nome: 'Capa de chuva', variacao: 'Único', quantidade: 4, ordem: 90, icone: 'capa' },
  { id: 'colete-unico', produtoId: 'colete', nome: 'Colete', variacao: 'Único', quantidade: 3, ordem: 100, icone: 'colete' },
  { id: 'capacete-unico', produtoId: 'capacete', nome: 'Capacete', variacao: 'Único', quantidade: 3, ordem: 110, icone: 'capacete' }
];

// -------------------------------------------------------------
// SELEÇÃO DE ELEMENTOS DO DOM
// -------------------------------------------------------------
const loginScreen = document.getElementById("login-screen");
const passwordResetScreen = document.getElementById("password-reset-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const loginForm = document.getElementById("login-form");
const passwordResetForm = document.getElementById("password-reset-form");
const btnCancelPasswordReset = document.getElementById("btn-cancel-password-reset");

const userGreeting = document.getElementById("user-greeting");
const sidebarUserName = document.getElementById("sidebar-user-name");
const sidebarUserRole = document.getElementById("sidebar-user-role");

const btnHamburger = document.getElementById("btn-hamburger");
const btnCloseSidebar = document.getElementById("btn-close-sidebar");
const sidebarMenu = document.getElementById("sidebar-menu");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const btnLogoutSidebar = document.getElementById("btn-logout-sidebar");

const adminPanel = document.getElementById("admin-panel");
const adminMenuPanel = document.getElementById("admin-menu-panel");

const noticeForm = document.getElementById("notice-form");
const avisosList = document.getElementById("notices-list"); // Garantindo padronização correta do ID
const noticeImageInput = document.getElementById("notice-image");
const noticeImagePreviewWrapper = document.getElementById("notice-image-preview-wrapper");
const noticeImagePreview = document.getElementById("notice-image-preview");
const btnRemoveNoticeImage = document.getElementById("btn-remove-notice-image");
const manutencoesList = document.getElementById("manutencoes-list");
const totalManutencoesElement = document.getElementById("total-manutencoes");
const marketplaceList = document.getElementById("marketplace-list");

const lunchList = document.getElementById("lunch-list");
const totalLunchesElement = document.getElementById("total-lunches");
const totalAlmoco = document.getElementById("total-almoco");
const totalJanta = document.getElementById("total-janta");
const personalMealKpis = document.getElementById("personal-meal-kpis");

const menuForm = document.getElementById("menu-form");
const calendarPicker = document.getElementById("calendar-picker");
const dailyMenuDisplay = document.getElementById("daily-menu-display");
const weeklyMenuList = document.getElementById("weekly-menu-list");
const fixedMealForm = document.getElementById("fixed-meal-form");
const fixedMealUser = document.getElementById("fixed-meal-user");
const fixedMealLunch = document.getElementById("fixed-meal-lunch");
const fixedMealDinner = document.getElementById("fixed-meal-dinner");
const fixedMealsList = document.getElementById("fixed-meals-list");
const monthlyMealMonth = document.getElementById("monthly-meal-month");
const monthlyMealUser = document.getElementById("monthly-meal-user");
const monthlyMealLunches = document.getElementById("monthly-meal-lunches");
const monthlyMealDinners = document.getElementById("monthly-meal-dinners");
const monthlyMealsList = document.getElementById("monthly-meals-list");

const epiAdminPanel = document.getElementById("epi-admin-panel");
const epiUserRole = document.getElementById("epi-user-role");
const epiRequestLock = document.getElementById("epi-request-lock");
const epiCatalogGrid = document.getElementById("epi-catalog-grid");
const epiCartPanel = document.getElementById("epi-cart-panel");
const epiCartList = document.getElementById("epi-cart-list");
const epiCartCount = document.getElementById("epi-cart-count");
const epiClearCart = document.getElementById("epi-clear-cart");
const epiRequestNote = document.getElementById("epi-request-note");
const epiSubmitRequest = document.getElementById("epi-submit-request");
const epiMyRequestsList = document.getElementById("epi-my-requests-list");
const epiMovementForm = document.getElementById("epi-movement-form");
const epiMovementItem = document.getElementById("epi-movement-item");
const epiMovementVariantWrapper = document.getElementById("epi-movement-variant-wrapper");
const epiMovementVariant = document.getElementById("epi-movement-variant");
const epiMovementType = document.getElementById("epi-movement-type");
const epiMovementQuantity = document.getElementById("epi-movement-quantity");
const epiMovementReason = document.getElementById("epi-movement-reason");
const epiStockList = document.getElementById("epi-stock-list");
const epiTotalStock = document.getElementById("epi-total-stock");
const epiLowStock = document.getElementById("epi-low-stock");
const epiPendingCount = document.getElementById("epi-pending-count");
const epiRequestStatusFilter = document.getElementById("epi-request-status-filter");
const epiAdminRequestsList = document.getElementById("epi-admin-requests-list");
const epiMovementsList = document.getElementById("epi-movements-list");

// Estado Global da Aplicação
let currentUserData = null;
let currentUserDocRef = null;
let datasReservadasUsuario = new Set();
let datasDesconsideradasUsuario = new Set();
let reservasUsuarioCache = [];
let cardapiosSemanaisCache = [];
let usuariosRefeicoesCache = [];
let reservasHojeCache = [];
let excecoesHojeCache = [];
let reservasMesAdminCache = [];
let excecoesMesAdminCache = [];
let canceladoresOuvintesUsuario = [];
let canceladoresOuvintesAdmin = [];
let canceladoresPainelMensal = [];
let reservasUsuarioCarregadas = false;
let excecoesUsuarioCarregadas = false;
let timerLembreteAlmoco = null;
let lembreteAlmocoEmProcessamento = false;
let estoqueEpiCache = [];
let minhasSolicitacoesEpiCache = [];
let solicitacoesEpiAdminCache = [];
let movimentacoesEpiCache = [];
let canceladoresOuvintesEpi = [];
let carrinhoEpi = new Map();
let selecoesEpi = new Map();
let produtosEpiAbertos = new Set();
let processandoExpiracoesEpi = false;
let avisoAprovacaoEpiEmExibicao = false;
let timerExpiracaoEpi = null;

// Configuração do Toast do SweetAlert2
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true
});

// -------------------------------------------------------------
// CONTROLE DE NAVEGAÇÃO E SIDEBAR (EXPOSTO GLOBALMENTE)
// -------------------------------------------------------------
window.abrirMenuSidebar = function() {
  const menu = document.getElementById("sidebar-menu");
  const overlay = document.getElementById("sidebar-overlay");
  if (menu) {
    menu.classList.add("open");
    menu.classList.add("active");
  }
  if (overlay) {
    overlay.classList.add("open");
    overlay.classList.add("active");
  }
};

window.fecharMenuSidebar = function() {
  const menu = document.getElementById("sidebar-menu");
  const overlay = document.getElementById("sidebar-overlay");
  if (menu) {
    menu.classList.remove("open");
    menu.classList.remove("active");
  }
  if (overlay) {
    overlay.classList.remove("open");
    overlay.classList.remove("active");
  }
};

if (btnHamburger) btnHamburger.addEventListener("click", window.abrirMenuSidebar);
if (btnCloseSidebar) btnCloseSidebar.addEventListener("click", window.fecharMenuSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener("click", window.fecharMenuSidebar);

window.mostrarSecao = (secaoId) => {
  const secoes = document.querySelectorAll(".dashboard-section");
  secoes.forEach(sec => {
    sec.classList.remove("active-section");
    sec.classList.add("hidden-section");
  });

  const secaoAlvo = document.getElementById(`sec-${secaoId}`);
  if (secaoAlvo) {
    secaoAlvo.classList.remove("hidden-section");
    secaoAlvo.classList.add("active-section");
  }

  window.fecharMenuSidebar();
};

window.irParaMural = function() {
  window.mostrarSecao('mural');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// -------------------------------------------------------------
// CONTROLE DE AUTENTICAÇÃO
// -------------------------------------------------------------
function mostrarTelaAutenticacao(telaAtiva) {
  [loginScreen, passwordResetScreen, dashboardScreen].forEach((tela) => {
    if (tela) tela.classList.toggle("active", tela === telaAtiva);
  });
}

function acessarDashboard(user) {
  if (userGreeting) userGreeting.textContent = `Olá, ${currentUserData.nome || 'Colaborador'}`;
  if (sidebarUserName) sidebarUserName.textContent = currentUserData.nome || currentUserData.email;
  if (sidebarUserRole) sidebarUserRole.textContent = currentUserData.role === 'admin' ? 'Administrador' : 'Colaborador';

  const isAdmin = currentUserData.role === "admin";
  if (adminPanel) adminPanel.style.display = isAdmin ? "block" : "none";
  if (adminMenuPanel) adminMenuPanel.style.display = isAdmin ? "block" : "none";
  if (personalMealKpis) personalMealKpis.style.display = "grid";
  if (epiAdminPanel) epiAdminPanel.classList.toggle('hidden', !isAdmin);
  if (epiUserRole && ['motorista', 'administrativo', 'operacional'].includes(currentUserData.cargoEpi)) {
    epiUserRole.value = currentUserData.cargoEpi;
  }

  mostrarTelaAutenticacao(dashboardScreen);
  iniciarOuvintesTempoReal();
  solicitarPermissaoNotificacoes(user).finally(agendarLembreteAlmoco);

  const secaoSolicitada = new URLSearchParams(window.location.search).get('secao');
  if (secaoSolicitada === 'refeicoes') {
    window.mostrarSecao('refeicoes');
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDocRef = doc(db, "usuarios", user.uid);
      const userDoc = await getDoc(userDocRef);
      currentUserDocRef = userDocRef;

      if (userDoc.exists()) {
        currentUserData = { uid: user.uid, ...userDoc.data() };
      } else {
        currentUserData = {
          uid: user.uid,
          email: user.email,
          nome: user.email?.split('@')[0] || 'Colaborador',
          role: "colaborador",
          primeiroAcesso: true
        };

        await setDoc(userDocRef, {
          email: user.email,
          nome: currentUserData.nome,
          role: currentUserData.role,
          primeiroAcesso: true,
          criadoEm: serverTimestamp()
        });
      }

      // Perfis antigos ainda não têm a marca. Na primeira entrada após esta
      // atualização, eles também precisam definir uma senha pessoal.
      if (currentUserData.primeiroAcesso !== false) {
        mostrarTelaAutenticacao(passwordResetScreen);
        return;
      }

      acessarDashboard(user);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      await signOut(auth);
      Swal.fire({
        icon: 'error',
        title: 'Não foi possível acessar sua conta',
        text: 'Tente entrar novamente. Se o problema continuar, fale com o administrador.',
        confirmButtonColor: '#0284C7'
      });
    }
  } else {
    cancelarLembreteAlmoco();
    encerrarOuvintesEpi();
    encerrarOuvintesRefeicoesUsuario();
    encerrarOuvintesRefeicoesAdmin();
    currentUserData = null;
    currentUserDocRef = null;
    datasReservadasUsuario = new Set();
    datasDesconsideradasUsuario = new Set();
    reservasUsuarioCache = [];
    cardapiosSemanaisCache = [];
    usuariosRefeicoesCache = [];
    reservasHojeCache = [];
    excecoesHojeCache = [];
    reservasMesAdminCache = [];
    excecoesMesAdminCache = [];
    reservasUsuarioCarregadas = false;
    excecoesUsuarioCarregadas = false;
    estoqueEpiCache = [];
    minhasSolicitacoesEpiCache = [];
    solicitacoesEpiAdminCache = [];
    movimentacoesEpiCache = [];
    carrinhoEpi.clear();
    selecoesEpi.clear();
    produtosEpiAbertos.clear();
    processandoExpiracoesEpi = false;
    avisoAprovacaoEpiEmExibicao = false;
    if (timerExpiracaoEpi) window.clearTimeout(timerExpiracaoEpi);
    timerExpiracaoEpi = null;
    if (loginForm) loginForm.reset();
    if (passwordResetForm) passwordResetForm.reset();
    mostrarTelaAutenticacao(loginScreen);
  }
});

// Form de Login
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      Toast.fire({ icon: 'success', title: 'Login efetuado com sucesso!' });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Falha no login',
        text: 'E-mail ou senha inválidos.',
        confirmButtonColor: '#0284C7'
      });
    }
  });
}

// Troca obrigatória da senha no primeiro acesso
if (passwordResetForm) {
  passwordResetForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById("new-password").value;
    const confirmNewPassword = document.getElementById("confirm-new-password").value;
    const submitButton = document.getElementById("btn-save-new-password");

    if (newPassword.length < 8) {
      Swal.fire({
        icon: 'warning',
        title: 'Senha muito curta',
        text: 'A nova senha precisa ter pelo menos 8 caracteres.',
        confirmButtonColor: '#0284C7'
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'As senhas não coincidem',
        text: 'Digite a mesma senha nos dois campos.',
        confirmButtonColor: '#0284C7'
      });
      return;
    }

    if (!auth.currentUser || !currentUserDocRef || !currentUserData) {
      await signOut(auth);
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = 'SALVANDO...';
    let passwordUpdated = false;

    try {
      await updatePassword(auth.currentUser, newPassword);
      passwordUpdated = true;
      await setDoc(currentUserDocRef, {
        primeiroAcesso: false,
        senhaAlteradaEm: serverTimestamp()
      }, { merge: true });

      currentUserData.primeiroAcesso = false;
      passwordResetForm.reset();
      acessarDashboard(auth.currentUser);
      Toast.fire({ icon: 'success', title: 'Nova senha salva com sucesso!' });
    } catch (error) {
      console.error("Erro ao trocar a senha:", error);

      if (passwordUpdated) {
        Swal.fire({
          icon: 'warning',
          title: 'Senha alterada, mas falta concluir',
          text: 'Sua nova senha já foi definida, mas não foi possível atualizar seu perfil. Tente salvar novamente ou fale com o administrador.',
          confirmButtonColor: '#0284C7'
        });
      } else if (error.code === 'auth/requires-recent-login') {
        await signOut(auth);
        Swal.fire({
          icon: 'info',
          title: 'Entre novamente',
          text: 'Sua sessão expirou. Faça login novamente com sua senha atual para concluir a troca.',
          confirmButtonColor: '#0284C7'
        });
      } else if (['auth/weak-password', 'auth/password-does-not-meet-requirements'].includes(error.code)) {
        Swal.fire({
          icon: 'warning',
          title: 'Escolha uma senha mais forte',
          text: 'A senha não atende aos requisitos de segurança configurados. Tente combinar letras, números e símbolos.',
          confirmButtonColor: '#0284C7'
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Não foi possível trocar a senha',
          text: 'Tente uma senha diferente ou fale com o administrador.',
          confirmButtonColor: '#0284C7'
        });
      }
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'SALVAR NOVA SENHA';
    }
  });
}

if (btnCancelPasswordReset) {
  btnCancelPasswordReset.addEventListener("click", () => signOut(auth));
}

// Botão de Logout
if (btnLogoutSidebar) {
  btnLogoutSidebar.addEventListener("click", () => {
    signOut(auth);
    window.fecharMenuSidebar();
  });
}

// -------------------------------------------------------------
// OUVINTES TEMPO REAL DO FIRESTORE
// -------------------------------------------------------------
function iniciarOuvintesTempoReal() {
  ouvirAvisos();
  ouvirManutencoes();
  ouvirMarketplace();
  ouvirReservasDoUsuario();
  ouvirCardapioSemanal();
  ouvirRefeicoesDoMes();
  iniciarModuloEpi();

  if (currentUserData?.role === 'admin') {
    iniciarGestaoAdminRefeicoes();
  } else {
    encerrarOuvintesRefeicoesAdmin();
  }
}

// --- MURAL DE AVISOS ---
let noticePreviewUrl = null;

function limparFotoAviso() {
  if (noticePreviewUrl) {
    URL.revokeObjectURL(noticePreviewUrl);
    noticePreviewUrl = null;
  }

  if (noticeImageInput) noticeImageInput.value = "";
  if (noticeImagePreview) noticeImagePreview.removeAttribute("src");
  if (noticeImagePreviewWrapper) noticeImagePreviewWrapper.classList.add("hidden");
}

if (noticeImageInput) {
  noticeImageInput.addEventListener("change", () => {
    const file = noticeImageInput.files?.[0];
    if (!file) {
      limparFotoAviso();
      return;
    }

    if (!file.type.startsWith("image/")) {
      limparFotoAviso();
      Swal.fire({
        icon: 'warning',
        title: 'Arquivo inválido',
        text: 'Selecione um arquivo de imagem.',
        confirmButtonColor: '#0284C7'
      });
      return;
    }

    if (noticePreviewUrl) URL.revokeObjectURL(noticePreviewUrl);
    noticePreviewUrl = URL.createObjectURL(file);
    noticeImagePreview.src = noticePreviewUrl;
    noticeImagePreviewWrapper.classList.remove("hidden");
  });
}

if (btnRemoveNoticeImage) {
  btnRemoveNoticeImage.addEventListener("click", limparFotoAviso);
}

if (noticeForm) {
  noticeForm.addEventListener("reset", limparFotoAviso);
}

if (noticeForm) {
  noticeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const titulo = document.getElementById("notice-title").value;
    const conteudo = document.getElementById("notice-content").value;
    const selectedImage = noticeImageInput?.files?.[0] || null;
    const publishButton = document.getElementById("btn-publish-notice");

    publishButton.disabled = true;
    publishButton.textContent = selectedImage ? "ENVIANDO FOTO..." : "PUBLICANDO...";

    try {
      let imagemUrl = null;
      if (selectedImage) {
        const uploadedImages = await fazerUploadImagens([selectedImage]);
        imagemUrl = uploadedImages[0] || null;

        if (!imagemUrl) {
          throw new Error("Não foi possível enviar a foto. Verifique sua conexão e tente novamente.");
        }
      }

      await addDoc(collection(db, "avisos"), {
        titulo,
        conteudo,
        imagemUrl,
        imagens: imagemUrl ? [imagemUrl] : [],
        autorUid: currentUserData.uid,
        autorNome: currentUserData.nome || currentUserData.email,
        criadoEm: serverTimestamp()
      });

      noticeForm.reset();
      Toast.fire({ icon: 'success', title: 'Aviso publicado com sucesso!' });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Erro ao publicar aviso', text: error.message });
    } finally {
      publishButton.disabled = false;
      publishButton.textContent = "Publicar Aviso";
    }
  });
}

function obterImagemAviso(item) {
  const imagensEmLista = [
    ...(Array.isArray(item.imagens) ? item.imagens : []),
    ...(Array.isArray(item.fotos) ? item.fotos : [])
  ];

  const possibilidades = [
    item.imagemUrl,
    item.imagem,
    item.fotoUrl,
    item.foto,
    ...imagensEmLista
  ];

  const imagemValida = possibilidades.find((valor) =>
    typeof valor === "string" && valor.trim().length > 0
  );

  return imagemValida?.trim() || null;
}

function ouvirAvisos() {
  if (!avisosList) return;
  const q = query(collection(db, "avisos"), orderBy("criadoEm", "desc"));

  onSnapshot(q, (snapshot) => {
    avisosList.innerHTML = "";
    if (snapshot.empty) {
      avisosList.innerHTML = `<p class="text-muted-small">Nenhum aviso no momento.</p>`;
      return;
    }

    const avisosPorDia = {};

    snapshot.forEach((docSnap) => {
      const item = { id: docSnap.id, ...docSnap.data() };
      
      let dataFormatada = "Hoje / Recente";
      if (item.criadoEm && typeof item.criadoEm.toDate === 'function') {
        const dataObj = item.criadoEm.toDate();
        const dia = dataObj.toLocaleDateString('pt-BR');
        const hora = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        dataFormatada = `${dia} às ${hora}`;
      }

      if (!avisosPorDia[dataFormatada]) {
        avisosPorDia[dataFormatada] = [];
      }
      avisosPorDia[dataFormatada].push(item);
    });

    Object.keys(avisosPorDia).forEach((data) => {
      const grupoDiv = document.createElement("div");
      grupoDiv.className = "aviso-grupo-dia";
      grupoDiv.style.cssText = "margin-bottom: 20px;";
      
      grupoDiv.innerHTML = `
        <div class="aviso-data-header" style="font-weight: 600; font-size: 0.95rem; margin-bottom: 8px; color: #0284C7; display: flex; align-items: center; gap: 6px;">
          <span>📅</span> ${data}
        </div>
      `;

      avisosPorDia[data].forEach((item) => {
        const isAdmin = currentUserData?.role === 'admin';
        const currentUid = currentUserData?.uid;
        // A foto pertence ao aviso e deve ser exibida para todos os perfis.
        const imagemAviso = obterImagemAviso(item);
        
        const listaLeituras = item.leituras || [];
        const jaLeu = listaLeituras.some(leitor => 
          (typeof leitor === 'string' && leitor === currentUid) || 
          (typeof leitor === 'object' && (leitor.uid === currentUid || leitor.id === currentUid))
        );

        let leitoresHtml = '';
        if (isAdmin) {
          if (listaLeituras.length > 0) {
            leitoresHtml = `
              <div class="aviso-leitores-admin" style="margin-top: 12px; font-size: 0.8rem; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <strong style="color: #334155; display: block; margin-bottom: 4px;">👁️ Leitores (${listaLeituras.length}):</strong>
                <ul style="margin: 0; padding-left: 16px; color: #475569;">
                  ${listaLeituras.map(leitor => {
                    const nomeLeitor = typeof leitor === 'object' ? (leitor.nome || leitor.email || leitor.uid) : leitor;
                    let dataLeituraStr = '';
                    if (typeof leitor === 'object' && leitor.data) {
                      const dLeitura = leitor.data.toDate ? leitor.data.toDate() : new Date(leitor.data);
                      if (!isNaN(dLeitura)) {
                        dataLeituraStr = ` - <span style="color: #64748B;">${dLeitura.toLocaleDateString('pt-BR')} às ${dLeitura.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>`;
                      }
                    }
                    return `<li style="margin-bottom: 2px;">${nomeLeitor}${dataLeituraStr}</li>`;
                  }).join('')}
                </ul>
              </div>
            `;
          } else {
            leitoresHtml = `
              <div class="aviso-leitores-admin" style="margin-top: 12px; font-size: 0.8rem; background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; color: #64748B;">
                👁️ Nenhuma leitura registrada ainda.
              </div>
            `;
          }
        }

        const card = document.createElement("div");
        card.className = "aviso-card";
        card.style.cssText = "background: #ffffff; border-radius: 8px; padding: 14px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;";
        
        card.innerHTML = `
          <h4 style="margin: 0 0 6px 0; color: #1e293b; font-size: 1.05rem; font-weight: 600;">${item.titulo || 'Aviso'}</h4>
          
          <!-- white-space: pre-line garante que os parágrafos e quebras de linha fiquem corretos -->
          <p style="margin: 0 0 12px 0; color: #334155; font-size: 0.9rem; white-space: pre-line; line-height: 1.5;">${item.conteudo || item.descricao || item.texto || ''}</p>

          ${imagemAviso ? `
            <div class="aviso-imagem-wrapper">
              <img src="${imagemAviso}" alt="Foto do aviso: ${item.titulo || 'Aviso'}" class="aviso-imagem">
            </div>
          ` : ''}
          
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #64748B; border-top: 1px solid #f1f5f9; padding-top: 10px; flex-wrap: wrap; gap: 8px;">
            <span>Por: ${item.autorNome || 'Admin'}</span>
            
            <div style="display: flex; gap: 8px; align-items: center;">
              ${!isAdmin && !jaLeu ? `<button onclick="confirmarLeituraAviso('${item.id}')" class="btn btn-sm btn-primary" style="font-size: 0.8rem; padding: 6px 12px; font-weight: 600;">Marcar como Lido</button>` : ''}
              ${!isAdmin && jaLeu ? `<span style="color: #10b981; font-weight: 600; font-size: 0.8rem; background: #ecfdf5; padding: 4px 8px; border-radius: 4px;">✓ Lido</span>` : ''}
              ${isAdmin ? `<button onclick="excluirAviso('${item.id}')" class="btn btn-sm btn-danger" style="font-size: 0.75rem; padding: 4px 10px;">Excluir Aviso</button>` : ''}
            </div>
          </div>
          ${leitoresHtml}
        `;
        
        grupoDiv.appendChild(card);
      });

      avisosList.appendChild(grupoDiv);
    });
  });
}

window.excluirAviso = async (anuncioId) => {
  const result = await Swal.fire({
    title: 'Excluir Aviso?',
    text: 'Esta ação não poderá ser desfeita.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  });

  if (result.isConfirmed) {
    try {
      await deleteDoc(doc(db, "avisos", anuncioId));
      Toast.fire({ icon: 'success', title: 'Aviso excluído com sucesso!' });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Erro ao excluir', text: error.message });
    }
  }
};

window.confirmarLeituraAviso = async (anuncioId) => {
  if (!currentUserData) return;
  try {
    await updateDoc(doc(db, "avisos", anuncioId), {
      leituras: arrayUnion({
        uid: currentUserData.uid,
        nome: currentUserData.nome || currentUserData.email,
        data: new Date().toISOString()
      })
    });
    Toast.fire({ icon: 'success', title: 'Leitura confirmada!' });
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Erro ao confirmar leitura', text: error.message });
  }
};

// Mantém retrocompatibilidade caso alguma outra parte chame confirmarLeitura
window.confirmarLeitura = window.confirmarLeituraAviso;

// =============================================================
// GESTÃO DE MANUTENÇÃO / SOS
// =============================================================

// Número padrão para recebimento dos chamados de manutenção via WhatsApp
const NUMERO_WHATSAPP_MANUTENCAO = "554792887603";

function configurarSeletorFotos({ inputId, previewId, countId, limite = 10 }) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);
  const count = document.getElementById(countId);
  let previewUrls = [];

  if (!input || !preview || !count) return () => {};

  const limparUrls = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    previewUrls = [];
  };

  const atualizarPrevia = () => {
    limparUrls();
    preview.replaceChildren();

    const files = Array.from(input.files || []);
    count.classList.toggle("error", files.length > limite);
    count.textContent = files.length === 0
      ? "Nenhuma foto selecionada"
      : `${files.length} foto${files.length > 1 ? 's' : ''} selecionada${files.length > 1 ? 's' : ''}${files.length > limite ? ` — máximo de ${limite}` : ''}`;

    files.slice(0, limite).forEach((file, index) => {
      if (!file.type.startsWith("image/")) return;

      const url = URL.createObjectURL(file);
      previewUrls.push(url);

      const item = document.createElement("div");
      item.className = "photo-preview-item";
      item.title = file.name;

      const image = document.createElement("img");
      image.src = url;
      image.alt = `Prévia da foto ${index + 1}`;

      const badge = document.createElement("span");
      badge.textContent = index + 1;

      item.append(image, badge);
      preview.appendChild(item);
    });
  };

  input.addEventListener("change", atualizarPrevia);

  return () => {
    input.removeEventListener("change", atualizarPrevia);
    limparUrls();
  };
}

// Função para abrir o modal de reporte de manutenção/SOS (Exposta no window)
window.abrirReporteManutencao = () => {
  // Fecha a barra lateral ao abrir o formulário
  if (typeof window.fecharMenuSidebar === "function") {
    window.fecharMenuSidebar();
  }

  let limparPreviewManutencao = () => {};

  Swal.fire({
    html: `
      <div class="form-modal">
        <header class="form-modal-header">
          <span class="form-modal-icon form-modal-icon-maintenance" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14.7 6.3a4 4 0 0 0-5-5L7.2 3.8l3 3L7 10 4 7l-2.5 2.5a4 4 0 0 0 5 5L14 7"/>
              <path d="m13 11 8 8-2 2-8-8"/>
            </svg>
          </span>
          <div class="form-modal-heading">
            <h2>Reportar manutenção / SOS</h2>
            <p>Registre o problema do veículo para atendimento da equipe responsável.</p>
          </div>
        </header>

        <div class="form-modal-body">
          <div class="form-modal-row form-modal-row-vehicle">
            <div class="form-modal-field form-modal-field-wide">
              <label class="form-modal-label" for="swal-veiculo">Veículo / frota <span>*</span></label>
              <input id="swal-veiculo" class="form-modal-control" placeholder="Ex.: Caminhão Volvo FH 540" autocomplete="off">
            </div>
            <div class="form-modal-field form-modal-field-plate">
              <label class="form-modal-label" for="swal-placa">Placa <span>*</span></label>
              <input id="swal-placa" class="form-modal-control form-modal-uppercase" placeholder="ABC-1D23" autocomplete="off">
            </div>
          </div>

          <div class="form-modal-row">
            <div class="form-modal-field">
              <label class="form-modal-label" for="swal-tipo">Tipo de problema <span>*</span></label>
              <select id="swal-tipo" class="form-modal-control">
                <option value="Mecânica">Mecânica</option>
                <option value="Elétrica">Elétrica</option>
                <option value="Pneus">Pneus</option>
                <option value="Funilaria / Pintura">Funilaria / Pintura</option>
                <option value="Outros / Emergência SOS">Outros / Emergência SOS</option>
              </select>
            </div>
            <div class="form-modal-field">
              <label class="form-modal-label" for="swal-prioridade">Prioridade <span>*</span></label>
              <select id="swal-prioridade" class="form-modal-control">
                <option value="Baixa">Baixa</option>
                <option value="Média" selected>Média</option>
                <option value="Alta">Alta (urgente / SOS)</option>
              </select>
            </div>
          </div>

          <div class="form-modal-field">
            <label class="form-modal-label" for="swal-descricao">Descrição do problema <span>*</span></label>
            <textarea id="swal-descricao" class="form-modal-control form-modal-textarea" placeholder="Descreva o que está acontecendo e informe onde o veículo está."></textarea>
          </div>

          <div class="form-modal-photo-section">
            <div class="form-modal-photo-copy">
              <span class="form-modal-label">Fotos do problema <small>Opcional</small></span>
              <p>Adicione imagens que ajudem a identificar o defeito.</p>
            </div>
            <div class="photo-picker">
              <input type="file" id="swal-fotos" multiple accept="image/*" class="photo-picker-input">
              <label for="swal-fotos" class="photo-picker-button photo-picker-button-danger">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3 7.2 5H4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3h-3.2L15 3H9Zm3 15.2A5.2 5.2 0 1 1 12 7.8a5.2 5.2 0 0 1 0 10.4Zm0-2A3.2 3.2 0 1 0 12 9.8a3.2 3.2 0 0 0 0 6.4Z"/></svg>
                <span>Selecionar fotos</span>
              </label>
              <span id="swal-fotos-count" class="photo-picker-count">Nenhuma foto selecionada</span>
              <div id="swal-fotos-preview" class="photo-preview-grid" aria-live="polite"></div>
            </div>
          </div>
        </div>
      </div>
    `,
    width: 640,
    padding: 0,
    showCloseButton: true,
    showCancelButton: true,
    confirmButtonText: 'Enviar Chamado',
    cancelButtonText: 'Cancelar',
    buttonsStyling: false,
    customClass: {
      popup: 'form-modal-popup form-modal-popup-maintenance',
      htmlContainer: 'form-modal-html',
      actions: 'form-modal-actions',
      confirmButton: 'form-modal-submit form-modal-submit-maintenance',
      cancelButton: 'form-modal-cancel',
      validationMessage: 'form-modal-validation'
    },
    focusConfirm: false,
    didOpen: () => {
      limparPreviewManutencao = configurarSeletorFotos({
        inputId: 'swal-fotos',
        previewId: 'swal-fotos-preview',
        countId: 'swal-fotos-count',
        limite: 10
      });
    },
    willClose: () => limparPreviewManutencao(),
    preConfirm: () => {
      const veiculo = document.getElementById('swal-veiculo').value.trim();
      const placa = document.getElementById('swal-placa').value.trim();
      const tipo = document.getElementById('swal-tipo').value;
      const prioridade = document.getElementById('swal-prioridade').value;
      const descricao = document.getElementById('swal-descricao').value.trim();
      const fotosInput = document.getElementById('swal-fotos');

      if (!veiculo || !placa || !descricao) {
        Swal.showValidationMessage('Por favor, preencha Veículo, Placa e Descrição.');
        return false;
      }

      if (fotosInput && fotosInput.files.length > 10) {
        Swal.showValidationMessage('Você pode selecionar no máximo 10 fotos.');
        return false;
      }

      return { 
        veiculo, 
        placa, 
        tipo, 
        prioridade, 
        descricao, 
        files: fotosInput ? Array.from(fotosInput.files) : []
      };
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      const { veiculo, placa, tipo, prioridade, descricao, files } = result.value;

      Swal.fire({
        title: 'Enviando chamado...',
        text: 'Otimizando imagens e salvando dados.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      try {
        let fotosUrls = [];
        if (files && files.length > 0) {
          fotosUrls = await fazerUploadImagens(files);
        }

        const agora = new Date();
        const dataFormatada = agora.toLocaleDateString('pt-BR');
        const horaFormatada = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        // 1. Salva no Firestore
        await addDoc(collection(db, "manutencoes"), {
          veiculo,
          placa,
          tipo,
          prioridade,
          descricao,
          fotos: fotosUrls,
          status: "Pendente",
          colaboradorUid: currentUserData?.uid || "",
          colaboradorNome: currentUserData?.nome || currentUserData?.email || "Colaborador",
          criadoEm: serverTimestamp(),
          dataTexto: `${dataFormatada} às ${horaFormatada}`
        });

        // 2. Formata mensagem para o WhatsApp
        let mensagemWhats = `🛠️ *NOVO CHAMADO DE MANUTENÇÃO*\n\n`;
        mensagemWhats += `👤 *Solicitante:* ${currentUserData?.nome || currentUserData?.email || 'Colaborador'}\n`;
        mensagemWhats += `🚚 *Veículo:* ${veiculo} (Placa: ${placa})\n`;
        mensagemWhats += `🏷️ *Tipo:* ${tipo}\n`;
        mensagemWhats += `⚠️ *Prioridade:* ${prioridade}\n`;
        mensagemWhats += `📅 *Data/Hora:* ${dataFormatada} às ${horaFormatada}\n\n`;
        mensagemWhats += `📝 *Descrição:* ${descricao}\n`;

        if (fotosUrls.length > 0) {
          mensagemWhats += `\n🖼️ *Fotos do problema:*\n` + fotosUrls.join('\n');
        }

        // 3. Abre o WhatsApp diretamente
        const urlWhats = `https://wa.me/${NUMERO_WHATSAPP_MANUTENCAO}?text=${encodeURIComponent(mensagemWhats)}`;

        await Swal.fire({
          icon: 'success',
          title: 'Manutenção Registrada!',
          text: 'O chamado foi salvo no painel e agora será aberto o WhatsApp para envio direto.',
          confirmButtonText: 'Abrir WhatsApp',
          confirmButtonColor: '#25D366'
        });

        window.open(urlWhats, '_blank');

      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Erro ao enviar chamado',
          text: error.message,
          confirmButtonColor: '#0284C7'
        });
      }
    }
  });
};
// -------------------------------------------------------------
// LISTAGEM DE MANUTENÇÕES (PENDENTES NO PAINEL PRINCIPAL)
// -------------------------------------------------------------
function ouvirManutencoes() {
  if (!manutencoesList) return;

  // Busca apenas pendentes direto do banco (requer o índice gerado no Firebase)
  const q = query(
    collection(db, "manutencoes"), 
    where("status", "==", "Pendente"),
    orderBy("criadoEm", "desc")
  );

  onSnapshot(q, (snapshot) => {
    manutencoesList.innerHTML = "";

    if (totalManutencoesElement) {
      totalManutencoesElement.textContent = `${snapshot.size} chamada(s) pendente(s)`;
    }

    if (snapshot.empty) {
      manutencoesList.innerHTML = `<p class="text-muted-small" style="grid-column: 1/-1; text-align: center; padding: 20px;">Nenhuma manutenção pendente no momento. 🎉</p>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const card = criarCardManutencao(docSnap.id, docSnap.data(), false);
      manutencoesList.appendChild(card);
    });
  });
}

// Função auxiliar para criar os cards de manutenção
function criarCardManutencao(id, item, eHistorico = false) {
  const card = document.createElement("div");
  card.className = "card-kpi";
  card.style.textAlign = "left";

  const dataHora = item.criadoEm?.toDate 
    ? item.criadoEm.toDate().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : (item.dataTexto || 'Data não registrada');

  const prioridadeCor = item.prioridade === 'Alta' ? '#EF4444' : item.prioridade === 'Média' ? '#F59E0B' : '#10B981';

  let fotosHtml = '';
  if (item.fotos && item.fotos.length > 0) {
    fotosHtml = `
      <div style="display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap;">
        ${item.fotos.map(url => `<a href="${url}" target="_blank"><img src="${url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #CBD5E1;"></a>`).join('')}
      </div>
    `;
  }

  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <span class="kpi-label" style="font-weight: 600; color: #64748B;">🕒 ${dataHora}</span>
      <span style="background: ${prioridadeCor}; color: #fff; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${item.prioridade}</span>
    </div>
    <h4 style="margin: 6px 0; color: #0F172A;">${item.veiculo} - <span style="color: #0284C7;">${item.placa}</span></h4>
    <p style="font-size: 0.85rem; color: #334155; margin: 4px 0;"><strong>Tipo:</strong> ${item.tipo}</p>
    <p style="font-size: 0.85rem; color: #475569; margin: 4px 0;"><strong>Solicitante:</strong> ${item.colaboradorNome || 'Não informado'}</p>
    <p style="font-size: 0.85rem; color: #475569; margin: 6px 0;">${item.descricao}</p>
    ${fotosHtml}

    ${!eHistorico ? `
      <div style="margin-top: 12px; display: flex; gap: 8px;">
        <button onclick="marcarManutencaoConcluida('${id}')" class="btn" style="background: #10B981; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; cursor: pointer; flex: 1;">
          ✓ Marcar como Concluído
        </button>
      </div>
    ` : `
      <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #E2E8F0; color: #10B981; font-weight: 600; font-size: 0.85rem;">
        ✅ Concluído
      </div>
    `}
  `;

  return card;
}

// -------------------------------------------------------------
// HISTÓRICO DE MANUTENÇÕES CONCLUÍDAS
// -------------------------------------------------------------
window.abrirHistoricoManutencoes = async () => {
  const modal = document.getElementById("modal-historico-manutencao");
  const listaHistorico = document.getElementById("historico-manutencoes-list");
  if (!modal || !listaHistorico) return;

  modal.style.display = "flex";
  listaHistorico.innerHTML = "<p style='text-align: center; color: #64748B;'>Carregando histórico...</p>";

  try {
    const q = query(collection(db, "manutencoes"), where("status", "==", "Concluído"), orderBy("criadoEm", "desc"));
    const snapshot = await getDocs(q);

    listaHistorico.innerHTML = "";

    if (snapshot.empty) {
      listaHistorico.innerHTML = "<p style='text-align: center; color: #64748B; padding: 20px;'>Nenhuma manutenção concluída até o momento.</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      const id = docSnap.id;
      const card = criarCardManutencao(id, item, true);
      listaHistorico.appendChild(card);
    });

  } catch (error) {
    listaHistorico.innerHTML = `<p style='color: #EF4444; text-align: center;'>Erro ao carregar histórico: ${error.message}</p>`;
  }
};

window.fecharHistoricoManutencoes = () => {
  const modal = document.getElementById("modal-historico-manutencao");
  if (modal) modal.style.display = "none";
};

// Concluir chamado de manutenção
window.marcarManutencaoConcluida = async (id) => {
  const confirm = await Swal.fire({
    title: 'Concluir Manutenção?',
    text: 'Esta manutenção será movida para o histórico de concluídos.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sim, concluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#10B981'
  });

  if (!confirm.isConfirmed) return;

  try {
    await updateDoc(doc(db, "manutencoes", id), {
      status: "Concluído",
      concluidoEm: serverTimestamp()
    });

    Swal.fire({
      icon: 'success',
      title: 'Concluído!',
      text: 'A manutenção foi movida para o histórico.',
      timer: 1500,
      showConfirmButton: false
    });
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Erro', text: error.message });
  }
};
// --- MARKETPLACE / FEIRINHA ---
window.abrirModalNovoAnuncioMarketplace = async () => {
  let limparPreviewMarketplace = () => {};

  const { value: formValues } = await Swal.fire({
    html: `
      <div class="form-modal">
        <header class="form-modal-header">
          <span class="form-modal-icon form-modal-icon-marketplace" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 8h16l-1-5H5L4 8Z"/>
              <path d="M5 11v9h14v-9M9 20v-5h6v5"/>
              <path d="M4 8v1a2 2 0 0 0 4 0V8v1a2 2 0 0 0 4 0V8v1a2 2 0 0 0 4 0V8v1a2 2 0 0 0 4 0V8"/>
            </svg>
          </span>
          <div class="form-modal-heading">
            <h2>Novo anúncio</h2>
            <p>Publique um produto ou serviço para os colaboradores da T&amp;T.</p>
          </div>
        </header>

        <div class="form-modal-body">
          <div class="form-modal-field">
            <label class="form-modal-label" for="swal-mk-titulo">Título do produto ou serviço <span>*</span></label>
            <input id="swal-mk-titulo" class="form-modal-control" placeholder="Ex.: Bicicleta aro 29" autocomplete="off">
          </div>

          <div class="form-modal-row form-modal-row-contact">
            <div class="form-modal-field form-modal-field-price">
              <label class="form-modal-label" for="swal-mk-preco">Preço <span>*</span></label>
              <div class="form-modal-control-group">
                <span>R$</span>
                <input id="swal-mk-preco" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0,00">
              </div>
            </div>
            <div class="form-modal-field form-modal-field-wide">
              <label class="form-modal-label" for="swal-mk-whats">WhatsApp com DDD <span>*</span></label>
              <input id="swal-mk-whats" class="form-modal-control" inputmode="tel" placeholder="(47) 99999-9999" maxlength="15" autocomplete="tel">
            </div>
          </div>

          <div class="form-modal-field">
            <label class="form-modal-label" for="swal-mk-desc">Descrição <small>Opcional</small></label>
            <textarea id="swal-mk-desc" class="form-modal-control form-modal-textarea" placeholder="Descreva o estado, os detalhes e as condições do produto ou serviço."></textarea>
          </div>

          <div class="form-modal-photo-section">
            <div class="form-modal-photo-copy">
              <span class="form-modal-label">Fotos do anúncio <small>Até 10 imagens</small></span>
              <p>A primeira foto será usada como capa do anúncio.</p>
            </div>
            <div class="photo-picker photo-picker-marketplace">
              <input type="file" id="swal-mk-fotos" class="photo-picker-input" accept="image/*" multiple>
              <label for="swal-mk-fotos" class="photo-picker-button photo-picker-button-marketplace">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3 7.2 5H4a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h16a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3h-3.2L15 3H9Zm3 15.2A5.2 5.2 0 1 1 12 7.8a5.2 5.2 0 0 1 0 10.4Zm0-2A3.2 3.2 0 1 0 12 9.8a3.2 3.2 0 0 0 0 6.4Z"/></svg>
                <span>Selecionar fotos</span>
              </label>
              <span id="swal-mk-fotos-count" class="photo-picker-count">Nenhuma foto selecionada</span>
              <div id="swal-mk-fotos-preview" class="photo-preview-grid" aria-live="polite"></div>
            </div>
          </div>
        </div>
      </div>
    `,
    width: 620,
    padding: 0,
    showCloseButton: true,
    showCancelButton: true,
    confirmButtonText: 'Publicar Anúncio',
    cancelButtonText: 'Cancelar',
    buttonsStyling: false,
    customClass: {
      popup: 'form-modal-popup form-modal-popup-marketplace',
      htmlContainer: 'form-modal-html',
      actions: 'form-modal-actions',
      confirmButton: 'form-modal-submit form-modal-submit-marketplace',
      cancelButton: 'form-modal-cancel',
      validationMessage: 'form-modal-validation'
    },
    focusConfirm: false,
    didOpen: () => {
      limparPreviewMarketplace = configurarSeletorFotos({
        inputId: 'swal-mk-fotos',
        previewId: 'swal-mk-fotos-preview',
        countId: 'swal-mk-fotos-count',
        limite: 10
      });

      const whatsInput = document.getElementById('swal-mk-whats');
      whatsInput.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 11) v = v.slice(0, 11);
        
        if (v.length > 10) {
          v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
        } else if (v.length > 6) {
          v = v.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
        } else if (v.length > 2) {
          v = v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
        } else if (v.length > 0) {
          v = v.replace(/^(\d*)$/, '($1');
        }
        e.target.value = v;
      });
    },
    willClose: () => limparPreviewMarketplace(),
    preConfirm: () => {
      const titulo = document.getElementById('swal-mk-titulo').value;
      const preco = document.getElementById('swal-mk-preco').value;
      const whatsapp = document.getElementById('swal-mk-whats').value;
      const descricao = document.getElementById('swal-mk-desc').value;
      const fotosInput = document.getElementById('swal-mk-fotos');

      const whatsApenasNumeros = whatsapp.replace(/\D/g, '');

      if (!titulo || !preco || !whatsapp) {
        Swal.showValidationMessage('Preencha título, preço e WhatsApp.');
        return false;
      }

      if (whatsApenasNumeros.length < 10 || whatsApenasNumeros.length > 11) {
        Swal.showValidationMessage('Digite um WhatsApp válido com DDD (Ex: 47 99999-9999).');
        return false;
      }

      if (fotosInput.files.length > 10) {
        Swal.showValidationMessage('Você pode selecionar no máximo 10 fotos.');
        return false;
      }

      return { 
        titulo, 
        preco: parseFloat(preco), 
        whatsapp: whatsApenasNumeros, 
        descricao, 
        files: Array.from(fotosInput.files) 
      };
    }
  });

  if (formValues) {
    try {
      let fotosUrls = [];
      if (formValues.files && formValues.files.length > 0) {
        Toast.fire({ icon: 'info', title: 'A enviar imagem(ns)...' });
        fotosUrls = await fazerUploadImagens(formValues.files);
      }

      await addDoc(collection(db, "marketplace"), {
        titulo: formValues.titulo,
        preco: formValues.preco,
        whatsapp: formValues.whatsapp,
        descricao: formValues.descricao,
        imagens: fotosUrls,
        imagemUrl: fotosUrls[0] || null,
        vendedorUid: currentUserData.uid,
        colaboradorUid: currentUserData.uid,
        vendedorNome: currentUserData.nome || currentUserData.email,
        criadoEm: serverTimestamp()
      });

      Toast.fire({ icon: 'success', title: 'Anúncio publicado no Marketplace!' });
    } catch (error) {
      console.error("Erro ao criar anúncio:", error);
      Swal.fire({ icon: 'error', title: 'Erro ao criar anúncio', text: error.message });
    }
  }
};

window.abrirGaleriaFotos = function(imagens, indexInicial = 0) {
  if (!imagens || imagens.length === 0) return;
  let indexAtual = indexInicial;

  function renderizarModal() {
    Swal.fire({
      title: `Foto ${indexAtual + 1} de ${imagens.length}`,
      html: `
        <div style="display: flex; justify-content: center; align-items: center; min-height: 250px;">
          <img src="${imagens[indexAtual]}" style="max-width: 100%; max-height: 60vh; border-radius: 8px; object-fit: contain;">
        </div>
      `,
      showCancelButton: imagens.length > 1,
      showConfirmButton: imagens.length > 1,
      confirmButtonText: 'Próxima ➔',
      cancelButtonText: '⬅ Anterior',
      reverseButtons: true,
      showCloseButton: true,
      focusConfirm: false,
      confirmButtonColor: '#0284C7',
      cancelButtonColor: '#64748B'
    }).then((result) => {
      if (result.isConfirmed) {
        indexAtual = (indexAtual + 1) % imagens.length;
        renderizarModal();
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        indexAtual = (indexAtual - 1 + imagens.length) % imagens.length;
        renderizarModal();
      }
    });
  }

  renderizarModal();
};

function ouvirMarketplace() {
  if (!marketplaceList) return;
  const q = query(collection(db, "marketplace"), orderBy("criadoEm", "desc"));

  onSnapshot(q, (snapshot) => {
    marketplaceList.innerHTML = "";
    if (snapshot.empty) {
      marketplaceList.innerHTML = `<p class="text-muted-small">Nenhum anúncio ativo no momento.</p>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      const currentUid = currentUserData?.uid;

      const isOwner = Boolean(
        currentUid && (
          item.vendedorUid === currentUid || 
          item.colaboradorUid === currentUid || 
          item.userId === currentUid
        )
      );

      const isAdmin = currentUserData?.role === 'admin';

      const listaFotos = item.imagens && item.imagens.length > 0 
        ? item.imagens 
        : (item.imagemUrl ? [item.imagemUrl] : []);

      const jsonFotos = JSON.stringify(listaFotos).replace(/"/g, '&quot;');

      const card = document.createElement("div");
      card.className = "marketplace-card";
      card.innerHTML = `
        ${listaFotos.length > 0 ? `
          <div class="mk-cover-container" onclick="abrirGaleriaFotos(${jsonFotos}, 0)" style="cursor: pointer;">
            <img src="${listaFotos[0]}" class="mk-main-image" alt="${item.titulo}">
            ${listaFotos.length > 1 ? `<span class="mk-photo-badge">📷 1/${listaFotos.length} (Ver todas)</span>` : ''}
          </div>
          ${listaFotos.length > 1 ? `
            <div class="mk-thumbnails-strip">
              ${listaFotos.map((url, idx) => `
                <img src="${url}" class="mk-thumb-img" onclick="event.stopPropagation(); abrirGaleriaFotos(${jsonFotos}, ${idx})" alt="Foto ${idx + 1}">
              `).join('')}
            </div>
          ` : ''}
        ` : ''}
        <div class="mk-content">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <h4 class="mk-title">${item.titulo}</h4>
            <strong class="mk-price-tag">R$ ${Number(item.preco).toFixed(2)}</strong>
          </div>
          <p class="mk-description">${item.descricao || ''}</p>
          <small class="text-muted-small">Vendedor: ${item.vendedorNome}</small>
          <div class="mk-actions" style="margin-top: 10px;">
            <a href="https://wa.me/55${item.whatsapp.replace(/\D/g,'')}" target="_blank" class="btn btn-sm btn-primary">Contatar WhatsApp</a>
            ${(isOwner || isAdmin) ? `<button onclick="excluirAnuncioMarketplace('${docSnap.id}')" class="btn btn-sm btn-danger">Excluir</button>` : ''}
          </div>
        </div>
      `;
      marketplaceList.appendChild(card);
    });
  });
}

window.excluirAnuncioMarketplace = async (id) => {
  const confirmacao = await Swal.fire({
    title: 'Excluir anúncio?',
    text: 'Esta ação não poderá ser desfeita.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#ef4444'
  });

  if (confirmacao.isConfirmed) {
    try {
      await deleteDoc(doc(db, "marketplace", id));
      Toast.fire({ icon: 'success', title: 'Anúncio excluído com sucesso!' });
    } catch (error) {
      console.error("Erro ao excluir anúncio:", error);
      Swal.fire({ icon: 'error', title: 'Erro ao excluir', text: error.message });
    }
  }
};

// =============================================================
// ESTOQUE E SOLICITAÇÕES DE EQUIPAMENTOS / EPIs
// =============================================================

function encerrarOuvintesEpi() {
  canceladoresOuvintesEpi.forEach((cancelar) => cancelar());
  canceladoresOuvintesEpi = [];
  if (timerExpiracaoEpi) window.clearTimeout(timerExpiracaoEpi);
  timerExpiracaoEpi = null;
}

function cargoPodeSolicitarPoloPreta(cargo) {
  return cargo === 'motorista' || cargo === 'administrativo';
}

function obterRotuloCargoEpi(cargo) {
  return {
    motorista: 'Motorista',
    administrativo: 'Administrativo',
    operacional: 'Operacional / Outros'
  }[cargo] || 'Não informado';
}

function obterStatusEpi(status) {
  return {
    pendente: { rotulo: 'Pendente', classe: 'pending' },
    aprovado: { rotulo: 'Aguardando retirada', classe: 'approved' },
    retirado: { rotulo: 'Retirado', classe: 'withdrawn' },
    atendido: { rotulo: 'Retirado', classe: 'withdrawn' },
    expirado: { rotulo: 'Prazo expirado', classe: 'expired' },
    recusado: { rotulo: 'Recusado', classe: 'rejected' },
    cancelado: { rotulo: 'Cancelado', classe: 'cancelled' }
  }[status] || { rotulo: status || 'Pendente', classe: 'pending' };
}

function obterStatusSolicitacaoEpi(solicitacao) {
  const prazo = obterDataOpcionalEpi(solicitacao?.prazoRetirada);
  if (solicitacao?.status === 'aprovado' && prazo && prazo.getTime() <= Date.now()) {
    return { rotulo: 'Prazo expirado', classe: 'expired' };
  }
  return obterStatusEpi(solicitacao?.status);
}

function obterIconeEpi(tipo) {
  const icones = {
    camisa: '<path d="M8 4 4.5 5.5 2 10l3 1.5V21h14v-9.5l3-1.5-2.5-4.5L16 4c-.7 1.3-2 2-4 2S8.7 5.3 8 4Z"/><path d="M9 4c.5 1 1.5 1.5 3 1.5S14.5 5 15 4"/>',
    luva: '<path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V11M10 10V4.5a1.5 1.5 0 0 1 3 0V10M13 10V5.5a1.5 1.5 0 0 1 3 0V11M16 11V8a1.5 1.5 0 0 1 3 0v6c0 4.5-2.5 7-7 7s-7-3-7-7v-2a1.5 1.5 0 0 1 3 0v2"/>',
    frasco: '<path d="M9 3h6M10 3v4l-3 3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9l-3-3V3"/><path d="M7 12h10M10 16h4"/>',
    oculos: '<path d="m3 11 2-5M21 11l-2-5M8.5 11h7"/><path d="M3 11h6v3a3 3 0 0 1-6 0v-3ZM15 11h6v3a3 3 0 0 1-6 0v-3Z"/>',
    bota: '<path d="M7 3h7v9c1.5 1.8 3.8 2.8 7 3v5H7a4 4 0 0 1-4-4v-2h4V3Z"/><path d="M7 12h7M7 16H3"/>',
    capa: '<path d="M9 4h6l4 5-2 3v9H7v-9L5 9l4-5Z"/><path d="M9 4c.5 1.3 1.5 2 3 2s2.5-.7 3-2M12 6v15"/>',
    colete: '<path d="M8 3h3l1 4 1-4h3l4 5-3 3v10H7V11L4 8l4-5Z"/><path d="M12 7v14M7 14h10"/>',
    capacete: '<path d="M4 15a8 8 0 0 1 16 0M3 15h18v3H3z"/><path d="M9 7v5M15 7v5"/>'
  };

  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icones[tipo] || icones.capacete}</svg>`;
}

function obterDataRegistroEpi(valor) {
  if (valor?.toDate) return valor.toDate();
  if (valor instanceof Date) return valor;
  if (typeof valor === 'string' || typeof valor === 'number') return new Date(valor);
  return new Date();
}

function obterDataOpcionalEpi(valor) {
  if (!valor) return null;
  const data = valor?.toDate ? valor.toDate() : (valor instanceof Date ? valor : new Date(valor));
  return Number.isNaN(data.getTime()) ? null : data;
}

function adicionarDiasEpi(dataBase, quantidadeDias) {
  const data = new Date(dataBase);
  data.setDate(data.getDate() + quantidadeDias);
  return data;
}

function formatarDataHoraEpi(valor) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(obterDataRegistroEpi(valor));
}

function ordenarRegistrosEpi(registros) {
  return [...registros].sort((a, b) =>
    obterDataRegistroEpi(b.criadoEm).getTime() - obterDataRegistroEpi(a.criadoEm).getTime()
  );
}

function obterBloqueioSolicitacaoEpi() {
  const solicitacaoAtiva = ordenarRegistrosEpi(minhasSolicitacoesEpiCache)
    .find((solicitacao) => ['pendente', 'aprovado'].includes(solicitacao.status));

  if (solicitacaoAtiva) {
    return { tipo: 'solicitacao-ativa', solicitacao: solicitacaoAtiva };
  }

  const ultimaRetirada = obterDataOpcionalEpi(currentUserData?.ultimaRetiradaEpiEm);
  const proximaData = ultimaRetirada
    ? obterDataOpcionalEpi(currentUserData?.proximaSolicitacaoEpiEm)
    : null;
  if (!proximaData || proximaData.getTime() <= Date.now()) return null;
  return { tipo: 'prazo', data: proximaData };
}

function renderizarBloqueioSolicitacaoEpi() {
  if (!epiRequestLock || !epiSubmitRequest) return;
  const bloqueio = obterBloqueioSolicitacaoEpi();
  epiRequestLock.classList.toggle('hidden', !bloqueio);

  if (bloqueio) {
    const aguardandoRetirada = bloqueio.tipo === 'solicitacao-ativa' && bloqueio.solicitacao.status === 'aprovado';
    const prazoRetirada = aguardandoRetirada
      ? obterDataOpcionalEpi(bloqueio.solicitacao.prazoRetirada)
      : null;
    const titulo = bloqueio.tipo === 'prazo'
      ? 'Intervalo entre retiradas'
      : (aguardandoRetirada ? 'Pedido aguardando retirada' : 'Pedido em análise');
    const mensagem = bloqueio.tipo === 'prazo'
      ? `Você poderá enviar um novo pedido a partir de <b>${formatarDataHoraEpi(bloqueio.data)}</b>.`
      : (aguardandoRetirada
        ? `Seu pedido foi aprovado e deve ser retirado${prazoRetirada ? ` até <b>${formatarDataHoraEpi(prazoRetirada)}</b>` : ''}.`
        : 'Você já possui uma solicitação aguardando a análise do administrador.');

    epiRequestLock.innerHTML = `
      <span class="epi-request-lock-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
      </span>
      <div>
        <strong>${titulo}</strong>
        <p>${mensagem}</p>
      </div>
    `;
    epiSubmitRequest.disabled = true;
    epiSubmitRequest.textContent = bloqueio.tipo === 'prazo'
      ? 'Aguardando prazo de 60 dias'
      : 'Solicitação em andamento';
  } else {
    epiSubmitRequest.disabled = false;
    epiSubmitRequest.textContent = 'Enviar solicitação';
  }
}

function agruparEstoqueEpi() {
  const grupos = new Map();

  estoqueEpiCache.forEach((item) => {
    if (!grupos.has(item.produtoId)) {
      grupos.set(item.produtoId, {
        produtoId: item.produtoId,
        nome: item.nome,
        icone: item.icone,
        restricao: item.restricao || null,
        ordem: Number(item.ordem) || 999,
        itens: []
      });
    }
    grupos.get(item.produtoId).itens.push(item);
  });

  return [...grupos.values()]
    .map((grupo) => ({
      ...grupo,
      itens: grupo.itens.sort((a, b) => (Number(a.ordem) || 999) - (Number(b.ordem) || 999))
    }))
    .sort((a, b) => a.ordem - b.ordem);
}

async function garantirEstoqueInicialEpi() {
  if (currentUserData?.role !== 'admin') return;

  try {
    const snapshot = await getDocs(collection(db, 'estoque_epi'));
    const idsExistentes = new Set(snapshot.docs.map((docSnap) => docSnap.id));

    await Promise.all(ESTOQUE_EPI_INICIAL.map((item) => {
      const referencia = doc(db, 'estoque_epi', item.id);
      const dadosCatalogo = {
        produtoId: item.produtoId,
        nome: item.nome,
        variacao: item.variacao,
        ordem: item.ordem,
        icone: item.icone,
        restricao: item.restricao || null,
        atualizadoEm: serverTimestamp()
      };

      if (idsExistentes.has(item.id)) {
        return setDoc(referencia, dadosCatalogo, { merge: true });
      }

      return setDoc(referencia, {
        ...dadosCatalogo,
        quantidade: item.quantidade,
        estoqueInicial: item.quantidade,
        criadoEm: serverTimestamp(),
        inicializadoPor: currentUserData.uid
      });
    }));
  } catch (error) {
    console.error('Erro ao preparar estoque inicial de EPIs:', error);
    if (estoqueEpiCache.length === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Não foi possível preparar o estoque',
        text: 'Verifique as permissões do banco de dados e tente novamente.',
        confirmButtonColor: '#0F172A'
      });
    }
  }
}

function iniciarModuloEpi() {
  if (!currentUserData?.uid) return;

  encerrarOuvintesEpi();

  const qEstoque = query(collection(db, 'estoque_epi'), orderBy('ordem', 'asc'));
  const cancelarEstoque = onSnapshot(qEstoque, (snapshot) => {
    const catalogoBase = new Map(ESTOQUE_EPI_INICIAL.map((item) => [item.id, item]));
    estoqueEpiCache = snapshot.docs.map((docSnap) => ({
      ...(catalogoBase.get(docSnap.id) || {}),
      id: docSnap.id,
      ...docSnap.data(),
      quantidade: Math.max(0, Number(docSnap.data().quantidade) || 0)
    }));
    renderizarModuloEpi();
  }, (error) => {
    console.error('Erro ao acompanhar estoque de EPIs:', error);
    if (epiCatalogGrid) epiCatalogGrid.innerHTML = '<p class="epi-empty-state">Não foi possível carregar os equipamentos.</p>';
  });

  const qMinhasSolicitacoes = query(
    collection(db, 'solicitacoes_epi'),
    where('colaboradorUid', '==', currentUserData.uid)
  );
  const cancelarMinhasSolicitacoes = onSnapshot(qMinhasSolicitacoes, (snapshot) => {
    minhasSolicitacoesEpiCache = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    renderizarMinhasSolicitacoesEpi();
    renderizarBloqueioSolicitacaoEpi();
    verificarAvisoAprovacaoEpi();
  }, (error) => console.error('Erro ao acompanhar solicitações de EPI do usuário:', error));

  canceladoresOuvintesEpi.push(cancelarEstoque, cancelarMinhasSolicitacoes);

  if (currentUserData.role === 'admin') {
    garantirEstoqueInicialEpi();

    const qSolicitacoesAdmin = query(collection(db, 'solicitacoes_epi'), orderBy('criadoEm', 'desc'));
    const cancelarSolicitacoesAdmin = onSnapshot(qSolicitacoesAdmin, (snapshot) => {
      solicitacoesEpiAdminCache = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      renderizarSolicitacoesEpiAdmin();
      atualizarKpisEpiAdmin();
      processarSolicitacoesEpiExpiradas();
      agendarProcessamentoExpiracoesEpi();
    }, (error) => console.error('Erro ao acompanhar solicitações de EPI:', error));

    const qMovimentacoes = query(collection(db, 'movimentacoes_epi'), orderBy('criadoEm', 'desc'));
    const cancelarMovimentacoes = onSnapshot(qMovimentacoes, (snapshot) => {
      movimentacoesEpiCache = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      renderizarMovimentacoesEpi();
    }, (error) => console.error('Erro ao acompanhar movimentações de EPI:', error));

    canceladoresOuvintesEpi.push(cancelarSolicitacoesAdmin, cancelarMovimentacoes);
  }
}

function renderizarModuloEpi() {
  renderizarBloqueioSolicitacaoEpi();
  renderizarCatalogoEpi();
  renderizarCarrinhoEpi();

  if (currentUserData?.role === 'admin') {
    renderizarEstoqueEpiAdmin();
    preencherSelectMovimentoEpi();
    atualizarKpisEpiAdmin();
  }
}

function renderizarCatalogoEpi() {
  if (!epiCatalogGrid) return;

  const grupos = agruparEstoqueEpi();
  if (grupos.length === 0) {
    epiCatalogGrid.innerHTML = `<p class="epi-empty-state">${currentUserData?.role === 'admin' ? 'Preparando o estoque inicial...' : 'O catálogo ainda está sendo preparado pelo administrador.'}</p>`;
    return;
  }

  const cargo = epiUserRole?.value || '';
  const solicitacaoBloqueada = Boolean(obterBloqueioSolicitacaoEpi());
  epiCatalogGrid.innerHTML = grupos.map((grupo) => {
    const aberto = produtosEpiAbertos.has(grupo.produtoId);
    const restrito = grupo.restricao === 'motorista-administrativo';
    const permitido = !restrito || cargoPodeSolicitarPoloPreta(cargo);
    const totalDisponivel = grupo.itens.reduce((total, item) => total + item.quantidade, 0);
    const itemSelecionado = selecoesEpi.get(grupo.produtoId);
    const semEstoque = totalDisponivel <= 0;

    const opcoes = grupo.itens.map((item) => {
      const selecionado = itemSelecionado === item.id;
      const indisponivel = item.quantidade <= 0 || !permitido;
      const variacao = item.variacao === 'Único' ? 'Tamanho único' : item.variacao;
      return `
        <button type="button" class="epi-variant-option ${selecionado ? 'selected' : ''}" onclick="selecionarVariacaoEpi('${grupo.produtoId}', '${item.id}')" ${indisponivel ? 'disabled' : ''}>
          <span>${escaparHtml(variacao)}</span>
          <small>${item.quantidade > 0 ? `${item.quantidade} disponível(is)` : 'Sem estoque'}</small>
        </button>
      `;
    }).join('');

    return `
      <article class="epi-product-card ${aberto ? 'open' : ''} ${restrito && !permitido ? 'restricted' : ''}">
        <button type="button" class="epi-product-toggle" onclick="alternarProdutoEpi('${grupo.produtoId}')" aria-expanded="${aberto}">
          <span class="epi-product-icon">${obterIconeEpi(grupo.icone)}</span>
          <span class="epi-product-copy">
            <strong>${escaparHtml(grupo.nome)}</strong>
            <small>${semEstoque ? 'Indisponível' : `${totalDisponivel} unidade(s) no estoque`}</small>
          </span>
          <span class="epi-product-chevron" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
          </span>
        </button>
        <div class="epi-product-options">
          ${restrito && !permitido ? `
            <div class="epi-restriction-note">
              ${cargo ? 'Disponível somente para motoristas e equipe administrativa.' : 'Informe sua área acima para verificar a disponibilidade.'}
            </div>
          ` : `
            <p>Escolha ${grupo.itens.length > 1 ? 'o tamanho' : 'a opção'}:</p>
            <div class="epi-variant-grid">${opcoes}</div>
            <button type="button" class="epi-add-button" onclick="adicionarProdutoEpi('${grupo.produtoId}')" ${!cargo || semEstoque || solicitacaoBloqueada ? 'disabled' : ''}>
              Adicionar ao pedido
            </button>
          `}
        </div>
      </article>
    `;
  }).join('');
}

window.alternarProdutoEpi = (produtoId) => {
  if (produtosEpiAbertos.has(produtoId)) {
    produtosEpiAbertos.delete(produtoId);
  } else {
    produtosEpiAbertos.add(produtoId);
    const grupo = agruparEstoqueEpi().find((item) => item.produtoId === produtoId);
    if (grupo?.itens.length === 1 && grupo.itens[0].quantidade > 0) {
      selecoesEpi.set(produtoId, grupo.itens[0].id);
    }
  }
  renderizarCatalogoEpi();
};

window.selecionarVariacaoEpi = (produtoId, itemId) => {
  const item = estoqueEpiCache.find((registro) => registro.id === itemId);
  if (!item || item.quantidade <= 0) return;
  if (item.restricao === 'motorista-administrativo' && !cargoPodeSolicitarPoloPreta(epiUserRole?.value)) return;

  selecoesEpi.set(produtoId, itemId);
  produtosEpiAbertos.add(produtoId);
  renderizarCatalogoEpi();
};

window.adicionarProdutoEpi = (produtoId) => {
  const bloqueio = obterBloqueioSolicitacaoEpi();
  if (bloqueio) {
    const mensagem = bloqueio.tipo === 'prazo'
      ? `Novo pedido disponível em ${formatarDataHoraEpi(bloqueio.data)}.`
      : 'Você já possui uma solicitação em andamento.';
    Toast.fire({ icon: 'warning', title: mensagem });
    return;
  }

  if (!epiUserRole?.value) {
    Toast.fire({ icon: 'warning', title: 'Informe sua área ou função.' });
    epiUserRole?.focus();
    return;
  }

  const grupo = agruparEstoqueEpi().find((item) => item.produtoId === produtoId);
  let itemId = selecoesEpi.get(produtoId);
  if (!itemId && grupo?.itens.length === 1) itemId = grupo.itens[0].id;

  const item = estoqueEpiCache.find((registro) => registro.id === itemId);
  if (!item) {
    Toast.fire({ icon: 'warning', title: 'Escolha um tamanho ou opção.' });
    return;
  }
  if (item.restricao === 'motorista-administrativo' && !cargoPodeSolicitarPoloPreta(epiUserRole.value)) {
    Toast.fire({ icon: 'warning', title: 'A polo preta é restrita à função informada.' });
    return;
  }

  const quantidadeAtual = carrinhoEpi.get(item.id) || 0;
  if (quantidadeAtual >= item.quantidade) {
    Toast.fire({ icon: 'warning', title: 'Quantidade máxima disponível atingida.' });
    return;
  }

  carrinhoEpi.set(item.id, quantidadeAtual + 1);
  renderizarCarrinhoEpi();
  Toast.fire({ icon: 'success', title: `${item.nome} adicionado ao pedido.` });
};

function renderizarCarrinhoEpi() {
  if (!epiCartPanel || !epiCartList || !epiCartCount) return;

  const itens = [];
  carrinhoEpi.forEach((quantidade, itemId) => {
    const item = estoqueEpiCache.find((registro) => registro.id === itemId);
    if (!item || item.quantidade <= 0) {
      carrinhoEpi.delete(itemId);
      return;
    }
    const quantidadeValida = Math.min(quantidade, item.quantidade);
    carrinhoEpi.set(itemId, quantidadeValida);
    itens.push({ item, quantidade: quantidadeValida });
  });

  const totalItens = itens.reduce((total, registro) => total + registro.quantidade, 0);
  epiCartCount.textContent = `${totalItens} ${totalItens === 1 ? 'item' : 'itens'}`;
  epiCartPanel.classList.toggle('hidden', itens.length === 0);

  epiCartList.innerHTML = itens.map(({ item, quantidade }) => `
    <div class="epi-cart-row">
      <div>
        <strong>${escaparHtml(item.nome)}</strong>
        <small>${item.variacao === 'Único' ? 'Tamanho único' : `Tamanho ${escaparHtml(item.variacao)}`}</small>
      </div>
      <div class="epi-quantity-control" aria-label="Quantidade de ${escaparHtml(item.nome)}">
        <button type="button" onclick="alterarQuantidadeEpi('${item.id}', -1)" aria-label="Diminuir quantidade">−</button>
        <span>${quantidade}</span>
        <button type="button" onclick="alterarQuantidadeEpi('${item.id}', 1)" aria-label="Aumentar quantidade" ${quantidade >= item.quantidade ? 'disabled' : ''}>+</button>
      </div>
      <button type="button" class="epi-remove-item" onclick="removerItemEpi('${item.id}')" aria-label="Remover ${escaparHtml(item.nome)}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v6M14 11v6"/></svg>
      </button>
    </div>
  `).join('');
}

window.alterarQuantidadeEpi = (itemId, diferenca) => {
  const item = estoqueEpiCache.find((registro) => registro.id === itemId);
  if (!item) return;

  const novaQuantidade = (carrinhoEpi.get(itemId) || 0) + diferenca;
  if (novaQuantidade <= 0) carrinhoEpi.delete(itemId);
  else carrinhoEpi.set(itemId, Math.min(novaQuantidade, item.quantidade));
  renderizarCarrinhoEpi();
};

window.removerItemEpi = (itemId) => {
  carrinhoEpi.delete(itemId);
  renderizarCarrinhoEpi();
};

function limparCarrinhoEpi() {
  carrinhoEpi.clear();
  selecoesEpi.clear();
  produtosEpiAbertos.clear();
  if (epiRequestNote) epiRequestNote.value = '';
  renderizarCatalogoEpi();
  renderizarCarrinhoEpi();
}

async function enviarSolicitacaoEpi() {
  const bloqueioAtual = obterBloqueioSolicitacaoEpi();
  if (bloqueioAtual) {
    const prazoAtivo = bloqueioAtual.tipo === 'prazo';
    Swal.fire({
      icon: 'info',
      title: prazoAtivo ? 'Intervalo entre retiradas' : 'Solicitação em andamento',
      text: prazoAtivo
        ? `Você poderá enviar um novo pedido a partir de ${formatarDataHoraEpi(bloqueioAtual.data)}.`
        : 'Aguarde a análise ou a retirada do pedido atual antes de fazer uma nova solicitação.',
      confirmButtonColor: '#0F172A'
    });
    return;
  }

  if (!currentUserData?.uid || !epiUserRole?.value || carrinhoEpi.size === 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Complete sua solicitação',
      text: 'Informe sua área e adicione pelo menos um equipamento.',
      confirmButtonColor: '#0F172A'
    });
    return;
  }

  const cargo = epiUserRole.value;
  const itens = [];
  for (const [itemId, quantidade] of carrinhoEpi.entries()) {
    const item = estoqueEpiCache.find((registro) => registro.id === itemId);
    if (!item || item.quantidade < quantidade) {
      Swal.fire({
        icon: 'warning',
        title: 'Estoque atualizado',
        text: 'Um dos itens não possui mais a quantidade escolhida. Revise o pedido.',
        confirmButtonColor: '#0F172A'
      });
      renderizarCarrinhoEpi();
      return;
    }
    if (item.restricao === 'motorista-administrativo' && !cargoPodeSolicitarPoloPreta(cargo)) {
      Swal.fire({
        icon: 'warning',
        title: 'Item não permitido',
        text: 'A camisa polo preta é exclusiva para motoristas e equipe administrativa.',
        confirmButtonColor: '#0F172A'
      });
      return;
    }

    itens.push({
      itemId: item.id,
      produtoId: item.produtoId,
      nome: item.nome,
      variacao: item.variacao,
      quantidade
    });
  }

  epiSubmitRequest.disabled = true;
  epiSubmitRequest.textContent = 'Enviando...';

  try {
    if (!currentUserDocRef) throw new Error('Perfil do colaborador não encontrado.');

    const referenciaSolicitacao = doc(collection(db, 'solicitacoes_epi'));

    await runTransaction(db, async (transacao) => {
      const snapshotPerfil = await transacao.get(currentUserDocRef);
      if (!snapshotPerfil.exists()) throw new Error('Perfil do colaborador não encontrado.');

      const dadosPerfil = snapshotPerfil.data();
      const ultimaRetiradaRegistrada = obterDataOpcionalEpi(dadosPerfil.ultimaRetiradaEpiEm);
      const proximaDataRegistrada = ultimaRetiradaRegistrada
        ? obterDataOpcionalEpi(dadosPerfil.proximaSolicitacaoEpiEm)
        : null;
      if (proximaDataRegistrada && proximaDataRegistrada.getTime() > Date.now()) {
        throw new Error(`Um novo pedido estará disponível em ${formatarDataHoraEpi(proximaDataRegistrada)}.`);
      }

      transacao.set(referenciaSolicitacao, {
        colaboradorUid: currentUserData.uid,
        colaboradorNome: currentUserData.nome || currentUserData.email,
        colaboradorEmail: currentUserData.email || '',
        cargoDeclarado: cargo,
        itens,
        totalItens: itens.reduce((total, item) => total + item.quantidade, 0),
        observacao: epiRequestNote?.value.trim() || '',
        status: 'pendente',
        criadoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp()
      });
    });

    await setDoc(currentUserDocRef, { cargoEpi: cargo }, { merge: true });

    currentUserData.cargoEpi = cargo;

    limparCarrinhoEpi();
    renderizarBloqueioSolicitacaoEpi();
    Swal.fire({
      icon: 'success',
      title: 'Solicitação enviada',
      text: 'O administrador analisará o pedido. O prazo de 60 dias começará somente quando a retirada for confirmada.',
      confirmButtonColor: '#0F172A'
    });
  } catch (error) {
    console.error('Erro ao enviar solicitação de EPI:', error);
    Swal.fire({ icon: 'error', title: 'Não foi possível enviar', text: error.message, confirmButtonColor: '#0F172A' });
  } finally {
    renderizarBloqueioSolicitacaoEpi();
  }
}

function renderizarMinhasSolicitacoesEpi() {
  if (!epiMyRequestsList) return;

  const solicitacoes = ordenarRegistrosEpi(minhasSolicitacoesEpiCache).slice(0, 8);
  if (solicitacoes.length === 0) {
    epiMyRequestsList.innerHTML = '<p class="epi-empty-state">Nenhuma solicitação enviada.</p>';
    return;
  }

  epiMyRequestsList.innerHTML = solicitacoes.map((solicitacao) => {
    const status = obterStatusSolicitacaoEpi(solicitacao);
    const prazoRetirada = obterDataOpcionalEpi(solicitacao.prazoRetirada);
    const itens = (solicitacao.itens || []).map((item) => {
      const variacao = item.variacao && item.variacao !== 'Único' ? ` · ${escaparHtml(item.variacao)}` : '';
      return `<li><span>${escaparHtml(item.nome)}${variacao}</span><strong>${Number(item.quantidade) || 1}x</strong></li>`;
    }).join('');

    return `
      <article class="epi-request-card">
        <div class="epi-request-card-top">
          <time>${formatarDataHoraEpi(solicitacao.criadoEm)}</time>
          <span class="epi-status ${status.classe}">${status.rotulo}</span>
        </div>
        <ul>${itens}</ul>
        ${solicitacao.status === 'aprovado' && prazoRetirada ? `
          <p class="epi-withdrawal-deadline"><strong>Retirar até:</strong> ${formatarDataHoraEpi(prazoRetirada)}</p>
        ` : ''}
        ${solicitacao.motivoRecusa ? `<p class="epi-request-feedback"><strong>Motivo:</strong> ${escaparHtml(solicitacao.motivoRecusa)}</p>` : ''}
        ${solicitacao.status === 'pendente' ? `<button type="button" class="epi-cancel-request" onclick="cancelarSolicitacaoEpi('${solicitacao.id}')">Cancelar solicitação</button>` : ''}
      </article>
    `;
  }).join('');
}

async function verificarAvisoAprovacaoEpi() {
  if (avisoAprovacaoEpiEmExibicao || !currentUserData?.uid) return;

  const solicitacao = ordenarRegistrosEpi(minhasSolicitacoesEpiCache).find((item) => {
    const prazo = obterDataOpcionalEpi(item.prazoRetirada);
    return item.status === 'aprovado'
      && prazo
      && prazo.getTime() > Date.now()
      && !item.avisoAprovacaoVisualizadoEm;
  });
  if (!solicitacao) return;

  avisoAprovacaoEpiEmExibicao = true;
  const prazo = obterDataOpcionalEpi(solicitacao.prazoRetirada);
  const resumoItens = (solicitacao.itens || [])
    .map((item) => `${Number(item.quantidade) || 1}x ${item.nome}${item.variacao && item.variacao !== 'Único' ? ` (${item.variacao})` : ''}`)
    .join(', ');

  try {
    await Swal.fire({
      icon: 'success',
      title: 'Sua solicitação de EPI foi aprovada',
      html: `
        <p class="epi-approval-alert-text">Você tem <strong>${PRAZO_RETIRADA_EPI_DIAS} dias para retirar</strong> os equipamentos.</p>
        <div class="epi-approval-alert-deadline">Retire até <strong>${formatarDataHoraEpi(prazo)}</strong></div>
        <p class="epi-approval-alert-items">${escaparHtml(resumoItens)}</p>
        <small class="epi-approval-alert-warning">Depois desse prazo, a solicitação expirará e será necessário realizar um novo pedido quando o intervalo de 60 dias permitir.</small>
      `,
      confirmButtonText: 'Entendi',
      confirmButtonColor: '#15803D'
    });

    solicitacao.avisoAprovacaoVisualizadoEm = new Date();
    await updateDoc(doc(db, 'solicitacoes_epi', solicitacao.id), {
      avisoAprovacaoVisualizadoEm: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao registrar visualização do aviso de aprovação:', error);
  } finally {
    avisoAprovacaoEpiEmExibicao = false;
  }
}

window.cancelarSolicitacaoEpi = async (solicitacaoId) => {
  const confirmacao = await Swal.fire({
    icon: 'question',
    title: 'Cancelar solicitação?',
    text: 'Ela será retirada da fila de atendimento.',
    showCancelButton: true,
    confirmButtonText: 'Sim, cancelar',
    cancelButtonText: 'Voltar',
    confirmButtonColor: '#B91C1C',
    cancelButtonColor: '#64748B'
  });
  if (!confirmacao.isConfirmed) return;

  try {
    await runTransaction(db, async (transacao) => {
      const referencia = doc(db, 'solicitacoes_epi', solicitacaoId);
      const snapshot = await transacao.get(referencia);
      if (!snapshot.exists()) throw new Error('Solicitação não encontrada.');
      const dados = snapshot.data();
      if (dados.colaboradorUid !== currentUserData?.uid) throw new Error('Você não pode cancelar esta solicitação.');
      if (dados.status !== 'pendente') throw new Error('Esta solicitação já foi processada.');

      transacao.update(referencia, {
        status: 'cancelado',
        canceladoEm: serverTimestamp(),
        atualizadoEm: serverTimestamp()
      });
    });
    Toast.fire({ icon: 'success', title: 'Solicitação cancelada.' });
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Não foi possível cancelar', text: error.message, confirmButtonColor: '#0F172A' });
  }
};

function preencherSelectMovimentoEpi() {
  if (!epiMovementItem) return;
  const valorAtual = epiMovementItem.value;
  const grupos = agruparEstoqueEpi();
  epiMovementItem.innerHTML = '<option value="">Selecione um equipamento</option>' + grupos.map((grupo) => {
    const total = grupo.itens.reduce((soma, item) => soma + item.quantidade, 0);
    return `<option value="${grupo.produtoId}">${escaparHtml(grupo.nome)} (${total} no estoque)</option>`;
  }).join('');
  if (grupos.some((grupo) => grupo.produtoId === valorAtual)) epiMovementItem.value = valorAtual;
  sincronizarVariacoesMovimentoEpi();
}

function sincronizarVariacoesMovimentoEpi() {
  if (!epiMovementItem || !epiMovementVariant || !epiMovementVariantWrapper) return;

  const grupo = agruparEstoqueEpi().find((item) => item.produtoId === epiMovementItem.value);
  const valorAtual = epiMovementVariant.value;
  const temTamanho = Boolean(grupo?.itens.some((item) => item.variacao !== 'Único'));

  epiMovementVariantWrapper.classList.toggle('hidden', !temTamanho);
  epiMovementVariant.required = temTamanho;

  if (!grupo || !temTamanho) {
    epiMovementVariant.innerHTML = '<option value="">Não se aplica</option>';
    epiMovementVariant.value = '';
    return;
  }

  epiMovementVariant.innerHTML = '<option value="">Selecione o tamanho</option>' + grupo.itens.map((item) => (
    `<option value="${item.id}">Tamanho ${escaparHtml(item.variacao)} (${item.quantidade} no estoque)</option>`
  )).join('');

  if (grupo.itens.some((item) => item.id === valorAtual)) epiMovementVariant.value = valorAtual;
}

function atualizarKpisEpiAdmin() {
  if (currentUserData?.role !== 'admin') return;
  const total = estoqueEpiCache.reduce((soma, item) => soma + item.quantidade, 0);
  const estoqueBaixo = estoqueEpiCache.filter((item) => item.quantidade <= 2).length;
  const pendentes = solicitacoesEpiAdminCache.filter((item) => item.status === 'pendente').length;
  if (epiTotalStock) epiTotalStock.textContent = total;
  if (epiLowStock) epiLowStock.textContent = estoqueBaixo;
  if (epiPendingCount) epiPendingCount.textContent = pendentes;
}

function renderizarEstoqueEpiAdmin() {
  if (!epiStockList) return;
  const grupos = agruparEstoqueEpi();
  if (grupos.length === 0) {
    epiStockList.innerHTML = '<p class="epi-empty-state">Preparando estoque...</p>';
    return;
  }

  epiStockList.innerHTML = grupos.map((grupo, indice) => {
    const total = grupo.itens.reduce((soma, item) => soma + item.quantidade, 0);
    const linhas = grupo.itens.map((item) => `
      <div class="epi-stock-row">
        <span>${item.variacao === 'Único' ? 'Sem variação' : escaparHtml(item.variacao)}</span>
        <strong class="${item.quantidade <= 2 ? 'low' : ''}">${item.quantidade}</strong>
      </div>
    `).join('');

    return `
      <details class="epi-stock-group" ${indice < 2 ? 'open' : ''}>
        <summary>
          <span class="epi-stock-summary-name">${obterIconeEpi(grupo.icone)}<strong>${escaparHtml(grupo.nome)}</strong></span>
          <span>${total} un.</span>
        </summary>
        <div class="epi-stock-variants">${linhas}</div>
      </details>
    `;
  }).join('');
}

async function registrarMovimentacaoEpi(event) {
  event.preventDefault();
  if (currentUserData?.role !== 'admin') return;

  const grupo = agruparEstoqueEpi().find((item) => item.produtoId === epiMovementItem.value);
  const temTamanho = Boolean(grupo?.itens.some((item) => item.variacao !== 'Único'));
  const itemId = temTamanho ? epiMovementVariant?.value : grupo?.itens[0]?.id;
  const tipo = epiMovementType.value;
  const quantidade = Number(epiMovementQuantity.value);
  const motivo = epiMovementReason.value.trim();
  if (!itemId || !['entrada', 'saida'].includes(tipo) || !Number.isInteger(quantidade) || quantidade < 1 || !motivo) return;

  const botao = epiMovementForm.querySelector('button[type="submit"]');
  botao.disabled = true;
  botao.textContent = 'Registrando...';

  try {
    await runTransaction(db, async (transacao) => {
      const referenciaEstoque = doc(db, 'estoque_epi', itemId);
      const snapshot = await transacao.get(referenciaEstoque);
      if (!snapshot.exists()) throw new Error('Item de estoque não encontrado.');

      const dados = snapshot.data();
      const estoqueAnterior = Math.max(0, Number(dados.quantidade) || 0);
      const estoqueAtual = tipo === 'entrada' ? estoqueAnterior + quantidade : estoqueAnterior - quantidade;
      if (estoqueAtual < 0) throw new Error(`Saída maior que o estoque disponível (${estoqueAnterior}).`);

      transacao.update(referenciaEstoque, {
        quantidade: estoqueAtual,
        atualizadoEm: serverTimestamp(),
        atualizadoPorUid: currentUserData.uid,
        atualizadoPorNome: currentUserData.nome || currentUserData.email
      });

      transacao.set(doc(collection(db, 'movimentacoes_epi')), {
        itemId,
        produtoId: dados.produtoId,
        nome: dados.nome,
        variacao: dados.variacao,
        tipo,
        quantidade,
        estoqueAnterior,
        estoqueAtual,
        motivo,
        responsavelUid: currentUserData.uid,
        responsavelNome: currentUserData.nome || currentUserData.email,
        criadoEm: serverTimestamp()
      });
    });

    epiMovementForm.reset();
    epiMovementQuantity.value = 1;
    sincronizarVariacoesMovimentoEpi();
    Toast.fire({ icon: 'success', title: `${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso.` });
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Movimentação não realizada', text: error.message, confirmButtonColor: '#0F172A' });
  } finally {
    botao.disabled = false;
    botao.textContent = 'Registrar movimentação';
  }
}

function renderizarSolicitacoesEpiAdmin() {
  if (!epiAdminRequestsList || currentUserData?.role !== 'admin') return;

  const filtro = epiRequestStatusFilter?.value || 'pendente';
  const solicitacoes = solicitacoesEpiAdminCache.filter((item) => filtro === 'todos' || item.status === filtro);
  if (solicitacoes.length === 0) {
    epiAdminRequestsList.innerHTML = '<p class="epi-empty-state">Nenhuma solicitação neste filtro.</p>';
    return;
  }

  epiAdminRequestsList.innerHTML = solicitacoes.map((solicitacao) => {
    const status = obterStatusSolicitacaoEpi(solicitacao);
    const prazoRetirada = obterDataOpcionalEpi(solicitacao.prazoRetirada);
    const itens = (solicitacao.itens || []).map((item) => {
      const variacao = item.variacao && item.variacao !== 'Único' ? ` · ${escaparHtml(item.variacao)}` : '';
      return `<li><span>${escaparHtml(item.nome)}${variacao}</span><strong>${Number(item.quantidade) || 1}x</strong></li>`;
    }).join('');

    return `
      <article class="epi-admin-request-card">
        <div class="epi-admin-request-heading">
          <div>
            <strong>${escaparHtml(solicitacao.colaboradorNome || 'Colaborador')}</strong>
            <small>${escaparHtml(obterRotuloCargoEpi(solicitacao.cargoDeclarado))} · ${formatarDataHoraEpi(solicitacao.criadoEm)}</small>
          </div>
          <span class="epi-status ${status.classe}">${status.rotulo}</span>
        </div>
        <ul>${itens}</ul>
        ${solicitacao.status === 'aprovado' && prazoRetirada ? `
          <p class="epi-withdrawal-deadline"><strong>Prazo para retirada:</strong> ${formatarDataHoraEpi(prazoRetirada)}</p>
        ` : ''}
        ${solicitacao.observacao ? `<p class="epi-admin-request-note">${escaparHtml(solicitacao.observacao)}</p>` : ''}
        ${solicitacao.motivoRecusa ? `<p class="epi-request-feedback"><strong>Motivo:</strong> ${escaparHtml(solicitacao.motivoRecusa)}</p>` : ''}
        ${solicitacao.status === 'pendente' ? `
          <div class="epi-admin-request-actions">
            <button type="button" class="epi-approve-button" onclick="atenderSolicitacaoEpi('${solicitacao.id}')">Aprovar solicitação</button>
            <button type="button" class="epi-reject-button" onclick="recusarSolicitacaoEpi('${solicitacao.id}')">Recusar</button>
          </div>
        ` : ''}
        ${solicitacao.status === 'aprovado' && prazoRetirada && prazoRetirada.getTime() > Date.now() ? `
          <div class="epi-admin-request-actions single">
            <button type="button" class="epi-withdraw-button" onclick="confirmarRetiradaEpi('${solicitacao.id}')">Retirado</button>
          </div>
        ` : ''}
      </article>
    `;
  }).join('');
}

window.atenderSolicitacaoEpi = async (solicitacaoId) => {
  if (currentUserData?.role !== 'admin') return;
  const solicitacao = solicitacoesEpiAdminCache.find((item) => item.id === solicitacaoId);
  if (!solicitacao) return;

  const confirmacao = await Swal.fire({
    icon: 'question',
    title: 'Aprovar solicitação?',
    text: `Os itens ficarão reservados para ${solicitacao.colaboradorNome || 'o colaborador'}, que terá ${PRAZO_RETIRADA_EPI_DIAS} dias para retirá-los.`,
    showCancelButton: true,
    confirmButtonText: 'Sim, aprovar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#15803D',
    cancelButtonColor: '#64748B'
  });
  if (!confirmacao.isConfirmed) return;

  try {
    const prazoRetirada = adicionarDiasEpi(new Date(), PRAZO_RETIRADA_EPI_DIAS);
    await runTransaction(db, async (transacao) => {
      const referenciaSolicitacao = doc(db, 'solicitacoes_epi', solicitacaoId);
      const snapshotSolicitacao = await transacao.get(referenciaSolicitacao);
      if (!snapshotSolicitacao.exists()) throw new Error('Solicitação não encontrada.');
      const dadosSolicitacao = snapshotSolicitacao.data();
      if (dadosSolicitacao.status !== 'pendente') throw new Error('Esta solicitação já foi processada.');

      const leiturasEstoque = [];
      for (const itemPedido of dadosSolicitacao.itens || []) {
        const referenciaEstoque = doc(db, 'estoque_epi', itemPedido.itemId);
        const snapshotEstoque = await transacao.get(referenciaEstoque);
        if (!snapshotEstoque.exists()) throw new Error(`${itemPedido.nome} não foi encontrado no estoque.`);
        leiturasEstoque.push({ itemPedido, referenciaEstoque, dadosEstoque: snapshotEstoque.data() });
      }

      leiturasEstoque.forEach(({ itemPedido, referenciaEstoque, dadosEstoque }) => {
        const quantidadeSolicitada = Math.max(1, Number(itemPedido.quantidade) || 1);
        const estoqueAnterior = Math.max(0, Number(dadosEstoque.quantidade) || 0);
        const estoqueAtual = estoqueAnterior - quantidadeSolicitada;
        if (estoqueAtual < 0) {
          const tamanho = itemPedido.variacao && itemPedido.variacao !== 'Único' ? ` ${itemPedido.variacao}` : '';
          throw new Error(`Estoque insuficiente para ${itemPedido.nome}${tamanho}. Disponível: ${estoqueAnterior}.`);
        }

        transacao.update(referenciaEstoque, {
          quantidade: estoqueAtual,
          atualizadoEm: serverTimestamp(),
          atualizadoPorUid: currentUserData.uid,
          atualizadoPorNome: currentUserData.nome || currentUserData.email
        });

        transacao.set(doc(collection(db, 'movimentacoes_epi')), {
          itemId: itemPedido.itemId,
          produtoId: itemPedido.produtoId,
          nome: itemPedido.nome,
          variacao: itemPedido.variacao,
          tipo: 'saida',
          quantidade: quantidadeSolicitada,
          estoqueAnterior,
          estoqueAtual,
          motivo: `Reserva aprovada para ${dadosSolicitacao.colaboradorNome || 'colaborador'}`,
          solicitacaoId,
          colaboradorUid: dadosSolicitacao.colaboradorUid,
          colaboradorNome: dadosSolicitacao.colaboradorNome,
          responsavelUid: currentUserData.uid,
          responsavelNome: currentUserData.nome || currentUserData.email,
          criadoEm: serverTimestamp()
        });
      });

      transacao.update(referenciaSolicitacao, {
        status: 'aprovado',
        aprovadoEm: serverTimestamp(),
        aprovadoPorUid: currentUserData.uid,
        aprovadoPorNome: currentUserData.nome || currentUserData.email,
        prazoRetirada,
        avisoAprovacaoVisualizadoEm: null,
        atualizadoEm: serverTimestamp()
      });
    });

    Toast.fire({ icon: 'success', title: `Solicitação aprovada. Prazo de retirada: ${PRAZO_RETIRADA_EPI_DIAS} dias.` });
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Não foi possível aprovar', text: error.message, confirmButtonColor: '#0F172A' });
  }
};

window.confirmarRetiradaEpi = async (solicitacaoId) => {
  if (currentUserData?.role !== 'admin') return;
  const solicitacao = solicitacoesEpiAdminCache.find((item) => item.id === solicitacaoId);
  if (!solicitacao) return;

  const confirmacao = await Swal.fire({
    icon: 'question',
    title: 'Confirmar retirada?',
    text: `Confirme que ${solicitacao.colaboradorNome || 'o colaborador'} recebeu todos os itens deste pedido.`,
    showCancelButton: true,
    confirmButtonText: 'Confirmar retirada',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#0F172A',
    cancelButtonColor: '#64748B'
  });
  if (!confirmacao.isConfirmed) return;

  try {
    const proximaSolicitacao = adicionarDiasEpi(new Date(), INTERVALO_SOLICITACAO_EPI_DIAS);
    await runTransaction(db, async (transacao) => {
      const referencia = doc(db, 'solicitacoes_epi', solicitacaoId);
      const snapshot = await transacao.get(referencia);
      if (!snapshot.exists()) throw new Error('Solicitação não encontrada.');
      const dados = snapshot.data();
      if (dados.status !== 'aprovado') throw new Error('Esta solicitação não está aguardando retirada.');

      const prazo = obterDataOpcionalEpi(dados.prazoRetirada);
      if (!prazo || prazo.getTime() <= Date.now()) {
        throw new Error('O prazo de retirada expirou. Atualize a página para devolver os itens ao estoque.');
      }

      transacao.update(referencia, {
        status: 'retirado',
        retiradoEm: serverTimestamp(),
        retiradaConfirmadaPorUid: currentUserData.uid,
        retiradaConfirmadaPorNome: currentUserData.nome || currentUserData.email,
        atualizadoEm: serverTimestamp()
      });

      transacao.set(doc(db, 'usuarios', dados.colaboradorUid), {
        ultimaRetiradaEpiEm: serverTimestamp(),
        proximaSolicitacaoEpiEm: proximaSolicitacao
      }, { merge: true });
    });

    Toast.fire({ icon: 'success', title: 'Retirada confirmada. Novo pedido liberado em 60 dias.' });
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Não foi possível confirmar', text: error.message, confirmButtonColor: '#0F172A' });
  }
};

async function expirarSolicitacaoEpi(solicitacaoId) {
  await runTransaction(db, async (transacao) => {
    const referenciaSolicitacao = doc(db, 'solicitacoes_epi', solicitacaoId);
    const snapshotSolicitacao = await transacao.get(referenciaSolicitacao);
    if (!snapshotSolicitacao.exists()) return;

    const dadosSolicitacao = snapshotSolicitacao.data();
    const prazo = obterDataOpcionalEpi(dadosSolicitacao.prazoRetirada);
    if (dadosSolicitacao.status !== 'aprovado' || !prazo || prazo.getTime() > Date.now()) return;

    const leiturasEstoque = [];
    for (const itemPedido of dadosSolicitacao.itens || []) {
      const referenciaEstoque = doc(db, 'estoque_epi', itemPedido.itemId);
      const snapshotEstoque = await transacao.get(referenciaEstoque);
      if (!snapshotEstoque.exists()) throw new Error(`${itemPedido.nome} não foi encontrado para devolução ao estoque.`);
      leiturasEstoque.push({ itemPedido, referenciaEstoque, dadosEstoque: snapshotEstoque.data() });
    }

    leiturasEstoque.forEach(({ itemPedido, referenciaEstoque, dadosEstoque }) => {
      const quantidade = Math.max(1, Number(itemPedido.quantidade) || 1);
      const estoqueAnterior = Math.max(0, Number(dadosEstoque.quantidade) || 0);
      const estoqueAtual = estoqueAnterior + quantidade;

      transacao.update(referenciaEstoque, {
        quantidade: estoqueAtual,
        atualizadoEm: serverTimestamp(),
        atualizadoPorUid: currentUserData.uid,
        atualizadoPorNome: currentUserData.nome || currentUserData.email
      });

      transacao.set(doc(collection(db, 'movimentacoes_epi')), {
        itemId: itemPedido.itemId,
        produtoId: itemPedido.produtoId,
        nome: itemPedido.nome,
        variacao: itemPedido.variacao,
        tipo: 'entrada',
        quantidade,
        estoqueAnterior,
        estoqueAtual,
        motivo: 'Retorno automático: prazo de retirada expirado',
        solicitacaoId,
        colaboradorUid: dadosSolicitacao.colaboradorUid,
        colaboradorNome: dadosSolicitacao.colaboradorNome,
        responsavelUid: currentUserData.uid,
        responsavelNome: currentUserData.nome || currentUserData.email,
        criadoEm: serverTimestamp()
      });
    });

    transacao.update(referenciaSolicitacao, {
      status: 'expirado',
      expiradoEm: serverTimestamp(),
      expiradoAutomaticamente: true,
      atualizadoEm: serverTimestamp()
    });
  });
}

async function processarSolicitacoesEpiExpiradas() {
  if (processandoExpiracoesEpi || currentUserData?.role !== 'admin') return;
  const expiradas = solicitacoesEpiAdminCache.filter((solicitacao) => {
    const prazo = obterDataOpcionalEpi(solicitacao.prazoRetirada);
    return solicitacao.status === 'aprovado' && prazo && prazo.getTime() <= Date.now();
  });
  if (expiradas.length === 0) return;

  processandoExpiracoesEpi = true;
  try {
    for (const solicitacao of expiradas) {
      try {
        await expirarSolicitacaoEpi(solicitacao.id);
      } catch (error) {
        console.error(`Erro ao expirar solicitação de EPI ${solicitacao.id}:`, error);
      }
    }
  } finally {
    processandoExpiracoesEpi = false;
  }
}

function agendarProcessamentoExpiracoesEpi() {
  if (timerExpiracaoEpi) window.clearTimeout(timerExpiracaoEpi);
  timerExpiracaoEpi = null;
  if (currentUserData?.role !== 'admin') return;

  const prazos = solicitacoesEpiAdminCache
    .filter((solicitacao) => solicitacao.status === 'aprovado')
    .map((solicitacao) => obterDataOpcionalEpi(solicitacao.prazoRetirada))
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());
  if (prazos.length === 0) return;

  const espera = prazos[0].getTime() <= Date.now()
    ? 2000
    : prazos[0].getTime() - Date.now() + 1000;

  timerExpiracaoEpi = window.setTimeout(async () => {
    await processarSolicitacoesEpiExpiradas();
    agendarProcessamentoExpiracoesEpi();
  }, espera);
}

window.recusarSolicitacaoEpi = async (solicitacaoId) => {
  if (currentUserData?.role !== 'admin') return;

  const resposta = await Swal.fire({
    icon: 'warning',
    title: 'Recusar solicitação',
    input: 'textarea',
    inputLabel: 'Motivo da recusa',
    inputPlaceholder: 'Informe o motivo para o colaborador.',
    inputAttributes: { maxlength: '200' },
    showCancelButton: true,
    confirmButtonText: 'Confirmar recusa',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#B91C1C',
    cancelButtonColor: '#64748B',
    inputValidator: (valor) => !valor?.trim() ? 'Informe o motivo da recusa.' : undefined
  });
  if (!resposta.isConfirmed) return;

  try {
    await runTransaction(db, async (transacao) => {
      const referencia = doc(db, 'solicitacoes_epi', solicitacaoId);
      const snapshot = await transacao.get(referencia);
      if (!snapshot.exists()) throw new Error('Solicitação não encontrada.');
      if (snapshot.data().status !== 'pendente') throw new Error('Esta solicitação já foi processada.');

      transacao.update(referencia, {
        status: 'recusado',
        motivoRecusa: resposta.value.trim(),
        recusadoEm: serverTimestamp(),
        recusadoPorUid: currentUserData.uid,
        recusadoPorNome: currentUserData.nome || currentUserData.email,
        atualizadoEm: serverTimestamp()
      });
    });
    Toast.fire({ icon: 'success', title: 'Solicitação recusada.' });
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Não foi possível recusar', text: error.message, confirmButtonColor: '#0F172A' });
  }
};

function renderizarMovimentacoesEpi() {
  if (!epiMovementsList || currentUserData?.role !== 'admin') return;
  const movimentacoes = ordenarRegistrosEpi(movimentacoesEpiCache).slice(0, 20);
  if (movimentacoes.length === 0) {
    epiMovementsList.innerHTML = '<p class="epi-empty-state">Nenhuma movimentação registrada.</p>';
    return;
  }

  epiMovementsList.innerHTML = movimentacoes.map((movimento) => {
    const entrada = movimento.tipo === 'entrada';
    const variacao = movimento.variacao && movimento.variacao !== 'Único' ? ` · ${escaparHtml(movimento.variacao)}` : '';
    return `
      <div class="epi-movement-row">
        <span class="epi-movement-sign ${entrada ? 'entry' : 'exit'}">${entrada ? '+' : '−'}${Number(movimento.quantidade) || 0}</span>
        <div>
          <strong>${escaparHtml(movimento.nome || 'Equipamento')}${variacao}</strong>
          <small>${escaparHtml(movimento.motivo || '')}</small>
          <time>${formatarDataHoraEpi(movimento.criadoEm)} · ${escaparHtml(movimento.responsavelNome || 'Admin')}</time>
        </div>
        <span class="epi-stock-change">${Number(movimento.estoqueAnterior) || 0} → ${Number(movimento.estoqueAtual) || 0}</span>
      </div>
    `;
  }).join('');
}

if (epiUserRole) {
  epiUserRole.addEventListener('change', () => {
    if (!cargoPodeSolicitarPoloPreta(epiUserRole.value)) {
      estoqueEpiCache
        .filter((item) => item.restricao === 'motorista-administrativo')
        .forEach((item) => carrinhoEpi.delete(item.id));
    }
    renderizarCatalogoEpi();
    renderizarCarrinhoEpi();
  });
}

if (epiClearCart) epiClearCart.addEventListener('click', limparCarrinhoEpi);
if (epiSubmitRequest) epiSubmitRequest.addEventListener('click', enviarSolicitacaoEpi);
if (epiMovementItem) epiMovementItem.addEventListener('change', sincronizarVariacoesMovimentoEpi);
if (epiMovementForm) epiMovementForm.addEventListener('submit', registrarMovimentacaoEpi);
if (epiRequestStatusFilter) epiRequestStatusFilter.addEventListener('change', renderizarSolicitacoesEpiAdmin);

function obterDataLocalIso(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function obterMesAtualIso() {
  return obterDataLocalIso().slice(0, 7);
}

function eDiaUtilRefeicao(dataIso) {
  const [ano, mes, dia] = String(dataIso || '').split('-').map(Number);
  if (!ano || !mes || !dia) return false;

  const diaDaSemana = new Date(ano, mes - 1, dia).getDay();
  return diaDaSemana !== 0 && diaDaSemana !== 6;
}

function cancelarLembreteAlmoco() {
  if (timerLembreteAlmoco) {
    window.clearTimeout(timerLembreteAlmoco);
    timerLembreteAlmoco = null;
  }
}

function obterHorarioRefeicao(dataBase, hora, minuto) {
  return new Date(
    dataBase.getFullYear(),
    dataBase.getMonth(),
    dataBase.getDate(),
    hora,
    minuto,
    0,
    0
  );
}

function obterProximoHorarioLembreteAlmoco(agora) {
  const hojeIso = obterDataLocalIso(agora);
  const inicioHoje = obterHorarioRefeicao(agora, 8, 0);
  const limiteHoje = obterHorarioRefeicao(agora, 8, 30);

  if (eDiaUtilRefeicao(hojeIso) && agora < inicioHoje) {
    return inicioHoje;
  }

  if (eDiaUtilRefeicao(hojeIso) && agora >= inicioHoje && agora < limiteHoje) {
    return agora;
  }

  const proximoDia = new Date(agora);
  proximoDia.setDate(proximoDia.getDate() + 1);

  while (!eDiaUtilRefeicao(obterDataLocalIso(proximoDia))) {
    proximoDia.setDate(proximoDia.getDate() + 1);
  }

  return obterHorarioRefeicao(proximoDia, 8, 0);
}

function usuarioPrecisaLembreteAlmoco(dataReserva) {
  if (!currentUserData?.uid || !eDiaUtilRefeicao(dataReserva)) return false;

  const chaveAlmoco = criarChaveReserva(dataReserva, 'almoco');
  return !datasReservadasUsuario.has(chaveAlmoco)
    && !datasDesconsideradasUsuario.has(chaveAlmoco)
    && !usuarioTemRefeicaoFixa(currentUserData, 'almoco', dataReserva);
}

async function verificarEEmitirLembreteAlmoco() {
  if (lembreteAlmocoEmProcessamento || !currentUserData?.uid) return;

  const agora = new Date();
  const dataHoje = obterDataLocalIso(agora);
  const inicioLembrete = obterHorarioRefeicao(agora, 8, 0);
  const limiteAlmoco = obterHorarioRefeicao(agora, 8, 30);

  if (agora < inicioLembrete || agora >= limiteAlmoco || !usuarioPrecisaLembreteAlmoco(dataHoje)) {
    return;
  }

  const chaveEnvio = `tt_lembrete_almoco_${currentUserData.uid}_${dataHoje}`;
  if (window.localStorage.getItem(chaveEnvio)) return;

  lembreteAlmocoEmProcessamento = true;
  try {
    const exibida = await exibirNotificacaoLocal({
      titulo: 'Reserva de almoço pendente',
      corpo: 'Os pedidos de almoço encerram às 08:30. Faça sua reserva agora.',
      tag: `lembrete-almoco-${currentUserData.uid}-${dataHoje}`,
      url: '/?secao=refeicoes'
    });

    if (exibida) window.localStorage.setItem(chaveEnvio, 'enviado');
  } finally {
    lembreteAlmocoEmProcessamento = false;
  }
}

function agendarLembreteAlmoco() {
  cancelarLembreteAlmoco();

  if (!currentUserData?.uid || !reservasUsuarioCarregadas || !excecoesUsuarioCarregadas) {
    return;
  }

  const agora = new Date();
  const dataHoje = obterDataLocalIso(agora);
  const inicioHoje = obterHorarioRefeicao(agora, 8, 0);
  const limiteHoje = obterHorarioRefeicao(agora, 8, 30);
  const dentroDaJanela = eDiaUtilRefeicao(dataHoje) && agora >= inicioHoje && agora < limiteHoje;

  if (dentroDaJanela) {
    verificarEEmitirLembreteAlmoco();
    timerLembreteAlmoco = window.setTimeout(agendarLembreteAlmoco, limiteHoje.getTime() - agora.getTime() + 1000);
    return;
  }

  const proximoHorario = obterProximoHorarioLembreteAlmoco(agora);
  const espera = Math.max(0, proximoHorario.getTime() - agora.getTime());
  timerLembreteAlmoco = window.setTimeout(async () => {
    await verificarEEmitirLembreteAlmoco();
    agendarLembreteAlmoco();
  }, espera);
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') agendarLembreteAlmoco();
});

window.addEventListener('focus', agendarLembreteAlmoco);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.tipo === 'ABRIR_SECAO' && event.data.secao === 'refeicoes' && currentUserData) {
      window.mostrarSecao('refeicoes');
    }
  });
}

function listarDatasDoMes(mesReferencia) {
  if (!/^\d{4}-\d{2}$/.test(mesReferencia || '')) return [];

  const [ano, mes] = mesReferencia.split('-').map(Number);
  const totalDias = new Date(ano, mes, 0).getDate();
  return Array.from({ length: totalDias }, (_, indice) =>
    `${ano}-${String(mes).padStart(2, '0')}-${String(indice + 1).padStart(2, '0')}`
  ).filter(eDiaUtilRefeicao);
}

function formatarDataRefeicao(dataIso, incluirSemana = false) {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  const data = new Date(ano, mes - 1, dia);
  const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    ...(incluirSemana ? { weekday: 'short' } : {})
  }).format(data);

  return dataFormatada.replace('.', '');
}

function escaparHtml(valor = '') {
  return String(valor)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function usuarioTemRefeicaoFixa(usuario, tipoRefeicao, dataReserva = null) {
  const tipo = normalizarTipoRefeicao(tipoRefeicao);
  const ativoAtualmente = Boolean(usuario?.refeicoesFixas?.[tipo]);
  if (!dataReserva) return ativoAtualmente;

  const periodos = usuario?.periodosRefeicoesFixas?.[tipo];
  if (!Array.isArray(periodos) || periodos.length === 0) {
    return ativoAtualmente;
  }

  return periodos.some((periodo) =>
    periodo?.inicio &&
    dataReserva >= periodo.inicio &&
    (!periodo.fim || dataReserva <= periodo.fim)
  );
}

function criarIdExcecaoRefeicao(colaboradorUid, dataReserva, tipoRefeicao) {
  return `${colaboradorUid}_${dataReserva}_${normalizarTipoRefeicao(tipoRefeicao)}`;
}

function atualizarKpisMesUsuario() {
  const elTotal = document.getElementById("total-refeicoes-mes");
  const elCusto = document.getElementById("custo-total-mes");
  if (!currentUserData?.uid || !elTotal || !elCusto) return;

  const mesAtual = obterMesAtualIso();
  const chaves = new Set(
    reservasUsuarioCache
      .filter((reserva) =>
        reserva.data?.startsWith(mesAtual) && eDiaUtilRefeicao(reserva.data)
      )
      .map((reserva) => criarChaveReserva(reserva.data, reserva.tipo))
  );

  listarDatasDoMes(mesAtual).forEach((dataReserva) => {
    ['almoco', 'janta'].forEach((tipo) => {
      if (usuarioTemRefeicaoFixa(currentUserData, tipo, dataReserva)) {
        chaves.add(criarChaveReserva(dataReserva, tipo));
      }
    });
  });

  datasDesconsideradasUsuario.forEach((chave) => chaves.delete(chave));

  elTotal.textContent = chaves.size;
  elCusto.textContent = `R$ ${(chaves.size * PRECO_REFEICAO).toFixed(2).replace('.', ',')}`;
}

function ouvirRefeicoesDoMes() {
  atualizarKpisMesUsuario();
}
// =============================================================
// REFEIÇÕES, CARDÁPIO E EXCLUSÃO PARA ADMIN
// =============================================================

function normalizarTipoRefeicao(tipo) {
  return tipo === 'janta' ? 'janta' : 'almoco';
}

function criarChaveReserva(dataReserva, tipo) {
  return `${dataReserva}|${normalizarTipoRefeicao(tipo)}`;
}

function criarBotaoReservaHtml(dataReserva, tipoRefeicao) {
  const tipo = normalizarTipoRefeicao(tipoRefeicao);
  const eJanta = tipo === 'janta';
  const refeicaoLabel = eJanta ? 'Janta' : 'Almoço';
  const limiteLabel = eJanta ? '14:00' : '08:30';
  const chaveReserva = criarChaveReserva(dataReserva, tipo);
  const refeicaoFixa = usuarioTemRefeicaoFixa(currentUserData, tipo, dataReserva);

  if (!eDiaUtilRefeicao(dataReserva)) {
    return `
      <button type="button" class="btn btn-refeicao-indisponivel btn-reserva-card" disabled aria-disabled="true">
        <span>Sem ${refeicaoLabel.toLowerCase()}</span>
        <small>Não servimos refeições aos fins de semana</small>
      </button>
    `;
  }

  if (datasDesconsideradasUsuario.has(chaveReserva)) {
    return `
      <button type="button" class="btn btn-refeicao-desconsiderada btn-reserva-card" disabled aria-disabled="true">
        <span>${refeicaoLabel} desconsiderad${eJanta ? 'a' : 'o'}</span>
        <small>Ajustado pelo administrador</small>
      </button>
    `;
  }

  if (datasReservadasUsuario.has(chaveReserva) || refeicaoFixa) {
    return `
      <button type="button" class="btn btn-reservado btn-reserva-card" disabled aria-disabled="true">
        <span>✓ ${refeicaoLabel} reservad${eJanta ? 'a' : 'o'}</span>
        <small>${refeicaoFixa ? 'Reserva permanente' : 'Reserva confirmada'} • R$ ${PRECO_REFEICAO.toFixed(2).replace('.', ',')}</small>
      </button>
    `;
  }

  return `
    <button type="button" onclick="reservarRefeicao('${dataReserva}', '${tipo}')" class="btn btn-reserva-card ${eJanta ? 'btn-reserva-janta' : 'btn-reserva-almoco'}">
      <span>Reservar ${refeicaoLabel.toLowerCase()}</span>
      <small>até ${limiteLabel} • R$ ${PRECO_REFEICAO.toFixed(2).replace('.', ',')}</small>
    </button>
  `;
}

function encerrarOuvintesRefeicoesUsuario() {
  canceladoresOuvintesUsuario.forEach((cancelar) => cancelar());
  canceladoresOuvintesUsuario = [];
}

function atualizarInterfaceReservasUsuario() {
  datasReservadasUsuario = new Set(
    reservasUsuarioCache
      .filter((reserva) => reserva.data)
      .map((reserva) => criarChaveReserva(reserva.data, reserva.tipo))
  );

  renderizarCardapiosSemanais();
  atualizarKpisMesUsuario();

  if (calendarPicker?.value) {
    buscarCardapioPorData(calendarPicker.value);
  }
}

function ouvirReservasDoUsuario() {
  if (!currentUserData?.uid) return;

  encerrarOuvintesRefeicoesUsuario();
  reservasUsuarioCarregadas = false;
  excecoesUsuarioCarregadas = false;

  const qReservas = query(
    collection(db, "reservas_refeicao"),
    where("colaboradorUid", "==", currentUserData.uid)
  );

  const cancelarReservas = onSnapshot(qReservas, (snapshot) => {
    reservasUsuarioCache = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    reservasUsuarioCarregadas = true;
    atualizarInterfaceReservasUsuario();
    agendarLembreteAlmoco();
  }, (error) => {
    console.error("Erro ao acompanhar reservas do usuário:", error);
  });

  const qExcecoes = query(
    collection(db, "excecoes_refeicao"),
    where("colaboradorUid", "==", currentUserData.uid)
  );

  const cancelarExcecoes = onSnapshot(qExcecoes, (snapshot) => {
    datasDesconsideradasUsuario = new Set(
      snapshot.docs
        .map((docSnap) => {
          const excecao = docSnap.data();
          return excecao.data
            ? criarChaveReserva(excecao.data, excecao.tipo)
            : null;
        })
        .filter(Boolean)
    );
    excecoesUsuarioCarregadas = true;
    atualizarInterfaceReservasUsuario();
    agendarLembreteAlmoco();
  }, (error) => {
    console.error("Erro ao acompanhar ajustes de refeição do usuário:", error);
  });

  const cancelarPerfil = onSnapshot(currentUserDocRef, (snapshot) => {
    if (!snapshot.exists() || !currentUserData) return;
    currentUserData = { uid: currentUserData.uid, ...snapshot.data() };
    atualizarInterfaceReservasUsuario();
    renderizarBloqueioSolicitacaoEpi();
    renderizarCatalogoEpi();
    agendarLembreteAlmoco();
  }, (error) => {
    console.error("Erro ao acompanhar configuração de refeições do usuário:", error);
  });

  canceladoresOuvintesUsuario.push(cancelarReservas, cancelarExcecoes, cancelarPerfil);
}

window.reservarRefeicao = async (dataOuTipo = 'almoco', tipoRefeicao = 'almoco') => {
  if (!currentUserData) return;

  const eData = typeof dataOuTipo === 'string' && dataOuTipo.includes('-');
  const dataReserva = eData ? dataOuTipo : obterDataLocalIso();
  const tipo = normalizarTipoRefeicao(eData ? tipoRefeicao : dataOuTipo);
  const eJanta = tipo === 'janta';
  const refeicaoLabel = eJanta ? 'janta' : 'almoço';
  const horaLimite = eJanta ? 14 : 8;
  const minutoLimite = eJanta ? 0 : 30;
  const horarioLimiteLabel = eJanta ? '14:00' : '08:30';

  const partesData = dataReserva.split("-");
  const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}/${partesData[0]}` : dataReserva;

  if (!eDiaUtilRefeicao(dataReserva)) {
    return Swal.fire({
      icon: 'info',
      title: 'Não há refeições nesta data',
      text: 'A empresa não serve almoço ou janta aos sábados e domingos.',
      confirmButtonColor: '#0284C7'
    });
  }

  const agora = new Date();
  const [ano, mes, dia] = dataReserva.split('-').map(Number);
  const dataDesejada = new Date(ano, mes - 1, dia);
  const hojeZerado = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());

  if (dataDesejada < hojeZerado) {
    return Swal.fire({
      icon: 'warning',
      title: 'Reserva Encerrada',
      text: 'Não é possível fazer reservas para datas passadas.',
      confirmButtonColor: '#0284C7'
    });
  }

  if (dataDesejada.getTime() === hojeZerado.getTime()) {
    const horaAtual = agora.getHours();
    const minutoAtual = agora.getMinutes();

    if (horaAtual > horaLimite || (horaAtual === horaLimite && minutoAtual > minutoLimite)) {
      return Swal.fire({
        icon: 'warning',
        title: 'Horário Limite Excedido',
        text: `As reservas de ${refeicaoLabel} para hoje encerram às ${horarioLimiteLabel}.`,
        confirmButtonColor: '#0284C7'
      });
    }
  }

  const confirmacao = await Swal.fire({
    title: 'Confirmar Reserva?',
    text: `Deseja confirmar a reserva de ${refeicaoLabel} para o dia ${dataFormatada}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#0284C7',
    cancelButtonColor: '#64748B',
    confirmButtonText: 'Sim, confirmar',
    cancelButtonText: 'Cancelar'
  });

  if (!confirmacao.isConfirmed) return;

  try {
    const excecaoDoc = await getDoc(doc(
      db,
      "excecoes_refeicao",
      criarIdExcecaoRefeicao(currentUserData.uid, dataReserva, tipo)
    ));

    if (excecaoDoc.exists()) {
      return Swal.fire({
        icon: 'info',
        title: 'Refeição desconsiderada',
        text: `O administrador desconsiderou esta ${refeicaoLabel} para o dia ${dataFormatada}.`,
        confirmButtonColor: '#0284C7'
      });
    }

    const qDuplicidade = query(
      collection(db, "reservas_refeicao"),
      where("colaboradorUid", "==", currentUserData.uid),
      where("data", "==", dataReserva)
    );

    const snapshotExistente = await getDocs(qDuplicidade);
    const reservaDoMesmoTipo = snapshotExistente.docs.some((docSnap) =>
      normalizarTipoRefeicao(docSnap.data().tipo) === tipo
    );

    if (reservaDoMesmoTipo) {
      datasReservadasUsuario.add(criarChaveReserva(dataReserva, tipo));
      renderizarCardapiosSemanais();
      if (calendarPicker?.value === dataReserva) {
        buscarCardapioPorData(dataReserva);
      }

      return Swal.fire({
        icon: 'info',
        title: 'Reserva já efetuada',
        text: `Você já possui uma reserva de ${refeicaoLabel} confirmada para o dia ${dataFormatada}.`,
        confirmButtonColor: '#0284C7'
      });
    }

    await addDoc(collection(db, "reservas_refeicao"), {
      colaboradorUid: currentUserData.uid,
      colaboradorNome: currentUserData.nome || currentUserData.email,
      tipo: tipo,
      data: dataReserva,
      valor: PRECO_REFEICAO,
      criadoEm: serverTimestamp()
    });

    datasReservadasUsuario.add(criarChaveReserva(dataReserva, tipo));
    renderizarCardapiosSemanais();
    if (calendarPicker?.value === dataReserva) {
      buscarCardapioPorData(dataReserva);
    }

    Swal.fire({
      icon: 'success',
      title: 'Reserva Confirmada!',
      text: `Sua reserva de ${refeicaoLabel} para o dia ${dataFormatada} foi registrada com sucesso.`,
      confirmButtonColor: '#0284C7'
    });

  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Erro ao reservar',
      text: error.message,
      confirmButtonColor: '#0284C7'
    });
  }
};

window.excluirCardapio = async (dataStr) => {
  const partes = dataStr.split("-");
  const dataFormatada = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataStr;

  const confirmacao = await Swal.fire({
    title: 'Excluir Cardápio?',
    text: `Deseja realmente apagar o cardápio do dia ${dataFormatada}?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#B91C1C',
    cancelButtonColor: '#64748B',
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar'
  });

  if (!confirmacao.isConfirmed) return;

  try {
    await deleteDoc(doc(db, "cardapio", dataStr));
    Swal.fire({
      icon: 'success',
      title: 'Cardápio Excluído',
      text: 'O cardápio foi removido com sucesso.',
      confirmButtonColor: '#0284C7'
    });
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Erro ao excluir',
      text: error.message,
      confirmButtonColor: '#0284C7'
    });
  }
};

function obterColaboradoresRefeicoes() {
  return [...usuariosRefeicoesCache]
    .sort((a, b) =>
      (a.nome || a.email || '').localeCompare(b.nome || b.email || '', 'pt-BR')
    );
}

function criarChaveAdminRefeicao(colaboradorUid, dataReserva, tipoRefeicao) {
  return `${colaboradorUid}|${dataReserva}|${normalizarTipoRefeicao(tipoRefeicao)}`;
}

function combinarRefeicoes(datas, reservas, excecoes) {
  const datasUteis = datas.filter(eDiaUtilRefeicao);
  const datasPermitidas = new Set(datasUteis);
  const excecoesPorChave = new Map(
    excecoes.map((excecao) => [
      criarChaveAdminRefeicao(excecao.colaboradorUid, excecao.data, excecao.tipo),
      excecao
    ])
  );
  const refeicoesPorChave = new Map();
  const usuariosPorUid = new Map(
    usuariosRefeicoesCache.map((usuario) => [usuario.uid, usuario])
  );

  reservas.forEach((reserva) => {
    if (!reserva.colaboradorUid || !datasPermitidas.has(reserva.data)) return;

    const tipo = normalizarTipoRefeicao(reserva.tipo);
    const chave = criarChaveAdminRefeicao(reserva.colaboradorUid, reserva.data, tipo);
    if (excecoesPorChave.has(chave)) return;

    const usuario = usuariosPorUid.get(reserva.colaboradorUid);
    const existente = refeicoesPorChave.get(chave);

    if (existente) {
      existente.reservaIds.push(reserva.id);
      return;
    }

    refeicoesPorChave.set(chave, {
      chave,
      colaboradorUid: reserva.colaboradorUid,
      colaboradorNome: usuario?.nome || reserva.colaboradorNome || usuario?.email || 'Colaborador',
      data: reserva.data,
      tipo,
      recorrente: usuarioTemRefeicaoFixa(usuario, tipo, reserva.data),
      reservaIds: [reserva.id],
      valor: Number(reserva.valor) || PRECO_REFEICAO
    });
  });

  obterColaboradoresRefeicoes().forEach((usuario) => {
    ['almoco', 'janta'].forEach((tipo) => {
      datasUteis.forEach((dataReserva) => {
        if (!usuarioTemRefeicaoFixa(usuario, tipo, dataReserva)) return;

        const chave = criarChaveAdminRefeicao(usuario.uid, dataReserva, tipo);
        if (excecoesPorChave.has(chave)) return;

        const existente = refeicoesPorChave.get(chave);
        if (existente) {
          existente.recorrente = true;
          return;
        }

        refeicoesPorChave.set(chave, {
          chave,
          colaboradorUid: usuario.uid,
          colaboradorNome: usuario.nome || usuario.email || 'Colaborador',
          data: dataReserva,
          tipo,
          recorrente: true,
          reservaIds: [],
          valor: PRECO_REFEICAO
        });
      });
    });
  });

  return Array.from(refeicoesPorChave.values());
}

function preencherSelectsColaboradores() {
  const colaboradores = obterColaboradoresRefeicoes();
  const valorFixoAtual = fixedMealUser?.value || '';
  const valorFiltroAtual = monthlyMealUser?.value || '';

  if (fixedMealUser) {
    fixedMealUser.innerHTML = '<option value="">Selecione um colaborador</option>';
    colaboradores.forEach((usuario) => {
      const option = document.createElement('option');
      option.value = usuario.uid;
      option.textContent = usuario.nome || usuario.email || 'Colaborador';
      fixedMealUser.appendChild(option);
    });
    fixedMealUser.value = colaboradores.some((usuario) => usuario.uid === valorFixoAtual)
      ? valorFixoAtual
      : '';
  }

  if (monthlyMealUser) {
    monthlyMealUser.innerHTML = '<option value="">Todos os colaboradores</option>';
    colaboradores.forEach((usuario) => {
      const option = document.createElement('option');
      option.value = usuario.uid;
      option.textContent = usuario.nome || usuario.email || 'Colaborador';
      monthlyMealUser.appendChild(option);
    });
    monthlyMealUser.value = colaboradores.some((usuario) => usuario.uid === valorFiltroAtual)
      ? valorFiltroAtual
      : '';
  }

  sincronizarFormularioRefeicaoFixa();
}

function sincronizarFormularioRefeicaoFixa() {
  if (!fixedMealUser || !fixedMealLunch || !fixedMealDinner) return;

  const usuario = usuariosRefeicoesCache.find((item) => item.uid === fixedMealUser.value);
  fixedMealLunch.checked = usuarioTemRefeicaoFixa(usuario, 'almoco');
  fixedMealDinner.checked = usuarioTemRefeicaoFixa(usuario, 'janta');
}

function renderizarListaRefeicoesFixas() {
  if (!fixedMealsList) return;

  const colaboradoresFixos = obterColaboradoresRefeicoes().filter((usuario) =>
    usuarioTemRefeicaoFixa(usuario, 'almoco') || usuarioTemRefeicaoFixa(usuario, 'janta')
  );

  fixedMealsList.replaceChildren();

  if (colaboradoresFixos.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'meal-admin-empty';
    vazio.textContent = 'Nenhum colaborador com refeição permanente.';
    fixedMealsList.appendChild(vazio);
    return;
  }

  colaboradoresFixos.forEach((usuario) => {
    const item = document.createElement('div');
    item.className = 'fixed-meal-person';

    const dados = document.createElement('div');
    dados.className = 'fixed-meal-person-data';

    const nome = document.createElement('strong');
    nome.textContent = usuario.nome || usuario.email || 'Colaborador';

    const tipos = document.createElement('div');
    tipos.className = 'fixed-meal-person-types';

    if (usuarioTemRefeicaoFixa(usuario, 'almoco')) {
      const badge = document.createElement('span');
      badge.className = 'meal-type-badge meal-type-lunch';
      badge.textContent = 'Almoço • seg. a sex.';
      tipos.appendChild(badge);
    }

    if (usuarioTemRefeicaoFixa(usuario, 'janta')) {
      const badge = document.createElement('span');
      badge.className = 'meal-type-badge meal-type-dinner';
      badge.textContent = 'Janta • seg. a sex.';
      tipos.appendChild(badge);
    }

    dados.append(nome, tipos);

    const editar = document.createElement('button');
    editar.type = 'button';
    editar.className = 'meal-row-action meal-row-action-edit';
    editar.setAttribute('aria-label', `Editar refeições permanentes de ${nome.textContent}`);
    editar.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
        <path d="m4 16-1 5 5-1L19 9l-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>
      </svg>
      <span>Editar</span>
    `;
    editar.addEventListener('click', () => {
      fixedMealUser.value = usuario.uid;
      sincronizarFormularioRefeicaoFixa();
      fixedMealForm?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    item.append(dados, editar);
    fixedMealsList.appendChild(item);
  });
}

function criarLinhaRefeicaoAdmin(item, desconsiderada = false) {
  const linha = document.createElement('div');
  linha.className = `monthly-meal-row${desconsiderada ? ' monthly-meal-row-removed' : ''}`;

  const dados = document.createElement('div');
  dados.className = 'monthly-meal-person';

  const nome = document.createElement('strong');
  nome.textContent = item.colaboradorNome || 'Colaborador';

  const metadados = document.createElement('div');
  metadados.className = 'monthly-meal-meta';

  const tipo = document.createElement('span');
  tipo.className = `meal-type-badge ${item.tipo === 'janta' ? 'meal-type-dinner' : 'meal-type-lunch'}`;
  tipo.textContent = item.tipo === 'janta' ? 'Janta' : 'Almoço';
  metadados.appendChild(tipo);

  const origem = document.createElement('span');
  origem.className = 'meal-origin-badge';
  origem.textContent = desconsiderada
    ? 'Desconsiderada'
    : (item.recorrente ? 'Permanente' : 'Reserva manual');
  metadados.appendChild(origem);

  dados.append(nome, metadados);

  const acao = document.createElement('button');
  acao.type = 'button';
  acao.className = `meal-row-action ${desconsiderada ? 'meal-row-action-restore' : 'meal-row-action-remove'}`;
  acao.innerHTML = desconsiderada
    ? `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>
        </svg>
        <span>Reconsiderar</span>
      `
    : `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
          <path d="M6 6l12 12M18 6 6 18"/>
        </svg>
        <span>Desconsiderar</span>
      `;

  if (desconsiderada) {
    acao.addEventListener('click', () => restaurarRefeicaoDesconsiderada(item));
  } else {
    acao.addEventListener('click', () => desconsiderarRefeicao(item));
  }

  linha.append(dados, acao);
  return linha;
}

function renderizarPainelMensalRefeicoes() {
  if (!monthlyMealsList) return;

  const mesReferencia = monthlyMealMonth?.value || obterMesAtualIso();
  const colaboradorFiltro = monthlyMealUser?.value || '';
  const datas = listarDatasDoMes(mesReferencia);
  let refeicoes = combinarRefeicoes(datas, reservasMesAdminCache, excecoesMesAdminCache);

  if (colaboradorFiltro) {
    refeicoes = refeicoes.filter((item) => item.colaboradorUid === colaboradorFiltro);
  }

  refeicoes.sort((a, b) =>
    a.data.localeCompare(b.data) ||
    a.colaboradorNome.localeCompare(b.colaboradorNome, 'pt-BR') ||
    a.tipo.localeCompare(b.tipo)
  );

  let desconsideradas = excecoesMesAdminCache
    .filter((excecao) => eDiaUtilRefeicao(excecao.data))
    .map((excecao) => {
    const usuario = usuariosRefeicoesCache.find((item) => item.uid === excecao.colaboradorUid);

    if (
      excecao.origem !== 'manual' &&
      !usuarioTemRefeicaoFixa(usuario, excecao.tipo, excecao.data)
    ) {
      return null;
    }

    return {
      ...excecao,
      colaboradorNome: usuario?.nome || excecao.colaboradorNome || usuario?.email || 'Colaborador',
      tipo: normalizarTipoRefeicao(excecao.tipo),
      recorrente: excecao.origem !== 'manual'
    };
  }).filter(Boolean);

  if (colaboradorFiltro) {
    desconsideradas = desconsideradas.filter((item) => item.colaboradorUid === colaboradorFiltro);
  }

  const almocos = refeicoes.filter((item) => item.tipo === 'almoco').length;
  const jantas = refeicoes.filter((item) => item.tipo === 'janta').length;

  if (monthlyMealLunches) monthlyMealLunches.textContent = almocos;
  if (monthlyMealDinners) monthlyMealDinners.textContent = jantas;

  monthlyMealsList.replaceChildren();

  const datasComRegistros = Array.from(new Set([
    ...refeicoes.map((item) => item.data),
    ...desconsideradas.map((item) => item.data)
  ])).sort();

  if (datasComRegistros.length === 0) {
    const vazio = document.createElement('div');
    vazio.className = 'meal-admin-empty meal-admin-empty-large';
    vazio.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
        <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>
      </svg>
      <strong>Nenhuma refeição encontrada</strong>
      <span>Altere o mês ou o filtro de colaborador.</span>
    `;
    monthlyMealsList.appendChild(vazio);
    return;
  }

  const hoje = obterDataLocalIso();

  datasComRegistros.forEach((dataReserva, indice) => {
    const refeicoesDoDia = refeicoes.filter((item) => item.data === dataReserva);
    const retiradasDoDia = desconsideradas.filter((item) => item.data === dataReserva);
    const almocosDoDia = refeicoesDoDia.filter((item) => item.tipo === 'almoco').length;
    const jantasDoDia = refeicoesDoDia.filter((item) => item.tipo === 'janta').length;

    const grupo = document.createElement('details');
    grupo.className = 'monthly-meal-day';
    grupo.open = dataReserva === hoje || (indice === 0 && !datasComRegistros.includes(hoje));

    const resumo = document.createElement('summary');
    resumo.innerHTML = `
      <span class="monthly-meal-day-date">
        <strong>${escaparHtml(formatarDataRefeicao(dataReserva, true))}</strong>
        <small>${refeicoesDoDia.length} refeição(ões)</small>
      </span>
      <span class="monthly-meal-day-totals">
        <span>${almocosDoDia} almoço</span>
        <span>${jantasDoDia} janta</span>
      </span>
    `;

    const conteudo = document.createElement('div');
    conteudo.className = 'monthly-meal-day-content';

    refeicoesDoDia.forEach((item) => conteudo.appendChild(criarLinhaRefeicaoAdmin(item)));
    retiradasDoDia.forEach((item) => conteudo.appendChild(criarLinhaRefeicaoAdmin(item, true)));

    grupo.append(resumo, conteudo);
    monthlyMealsList.appendChild(grupo);
  });
}

function renderizarRefeicoesHoje() {
  const hoje = obterDataLocalIso();
  const refeicoes = combinarRefeicoes([hoje], reservasHojeCache, excecoesHojeCache)
    .sort((a, b) =>
      a.colaboradorNome.localeCompare(b.colaboradorNome, 'pt-BR') || a.tipo.localeCompare(b.tipo)
    );
  const almocos = refeicoes.filter((item) => item.tipo === 'almoco').length;
  const jantas = refeicoes.filter((item) => item.tipo === 'janta').length;
  const total = almocos + jantas;

  if (totalAlmoco) totalAlmoco.textContent = almocos;
  if (totalJanta) totalJanta.textContent = jantas;
  if (totalLunchesElement) totalLunchesElement.textContent = `${total} refeição(ões) para hoje`;

  if (!lunchList) return;
  lunchList.replaceChildren();

  if (refeicoes.length === 0) {
    const vazio = document.createElement('li');
    vazio.className = 'meal-admin-empty';
    vazio.textContent = 'Nenhuma refeição para hoje.';
    lunchList.appendChild(vazio);
    return;
  }

  refeicoes.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'today-meal-row';
    li.appendChild(criarLinhaRefeicaoAdmin(item));
    lunchList.appendChild(li);
  });
}

async function desconsiderarRefeicao(item) {
  if (currentUserData?.role !== 'admin') return;

  const tipoLabel = item.tipo === 'janta' ? 'janta' : 'almoço';
  const confirmacao = await Swal.fire({
    title: 'Desconsiderar refeição?',
    text: `${item.colaboradorNome} não será contabilizado(a) no ${tipoLabel} de ${formatarDataRefeicao(item.data)}.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, desconsiderar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#B91C1C',
    cancelButtonColor: '#64748B'
  });

  if (!confirmacao.isConfirmed) return;

  try {
    const idExcecao = criarIdExcecaoRefeicao(item.colaboradorUid, item.data, item.tipo);
    await setDoc(doc(db, "excecoes_refeicao", idExcecao), {
      colaboradorUid: item.colaboradorUid,
      colaboradorNome: item.colaboradorNome,
      data: item.data,
      tipo: item.tipo,
      origem: item.recorrente ? 'fixa' : 'manual',
      valor: item.valor || PRECO_REFEICAO,
      desconsideradoPorUid: currentUserData.uid,
      desconsideradoPorNome: currentUserData.nome || currentUserData.email,
      desconsideradoEm: serverTimestamp()
    });

    await Promise.all(
      (item.reservaIds || []).map((reservaId) =>
        deleteDoc(doc(db, "reservas_refeicao", reservaId))
      )
    );

    Toast.fire({ icon: 'success', title: 'Refeição desconsiderada.' });
  } catch (error) {
    console.error("Erro ao desconsiderar refeição:", error);
    Swal.fire({
      icon: 'error',
      title: 'Não foi possível ajustar a refeição',
      text: error.message,
      confirmButtonColor: '#0284C7'
    });
  }
}

async function restaurarRefeicaoDesconsiderada(item) {
  if (currentUserData?.role !== 'admin') return;

  const tipoLabel = item.tipo === 'janta' ? 'janta' : 'almoço';
  const confirmacao = await Swal.fire({
    title: 'Reconsiderar refeição?',
    text: `${item.colaboradorNome} voltará a ser contabilizado(a) no ${tipoLabel} de ${formatarDataRefeicao(item.data)}.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sim, reconsiderar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#16A34A',
    cancelButtonColor: '#64748B'
  });

  if (!confirmacao.isConfirmed) return;

  try {
    if (item.origem === 'manual') {
      const qReservaExistente = query(
        collection(db, "reservas_refeicao"),
        where("colaboradorUid", "==", item.colaboradorUid),
        where("data", "==", item.data)
      );
      const reservasExistentes = await getDocs(qReservaExistente);
      const jaExiste = reservasExistentes.docs.some((docSnap) =>
        normalizarTipoRefeicao(docSnap.data().tipo) === item.tipo
      );

      if (!jaExiste) {
        await addDoc(collection(db, "reservas_refeicao"), {
          colaboradorUid: item.colaboradorUid,
          colaboradorNome: item.colaboradorNome,
          tipo: item.tipo,
          data: item.data,
          valor: Number(item.valor) || PRECO_REFEICAO,
          restauradoPorAdmin: true,
          criadoEm: serverTimestamp()
        });
      }
    }

    await deleteDoc(doc(
      db,
      "excecoes_refeicao",
      criarIdExcecaoRefeicao(item.colaboradorUid, item.data, item.tipo)
    ));

    Toast.fire({ icon: 'success', title: 'Refeição reconsiderada.' });
  } catch (error) {
    console.error("Erro ao reconsiderar refeição:", error);
    Swal.fire({
      icon: 'error',
      title: 'Não foi possível reconsiderar',
      text: error.message,
      confirmButtonColor: '#0284C7'
    });
  }
}

function ouvirUsuariosRefeicoes() {
  const cancelar = onSnapshot(collection(db, "usuarios"), (snapshot) => {
    usuariosRefeicoesCache = snapshot.docs.map((docSnap) => ({
      uid: docSnap.id,
      ...docSnap.data()
    }));

    preencherSelectsColaboradores();
    renderizarListaRefeicoesFixas();
    renderizarRefeicoesHoje();
    renderizarPainelMensalRefeicoes();
  }, (error) => {
    console.error("Erro ao carregar colaboradores:", error);
    if (fixedMealsList) {
      fixedMealsList.innerHTML = '<p class="meal-admin-empty">Não foi possível carregar os colaboradores.</p>';
    }
  });

  canceladoresOuvintesAdmin.push(cancelar);
}

function ouvirReservasRefeicoes() {
  const hoje = obterDataLocalIso();
  const qReservasHoje = query(
    collection(db, "reservas_refeicao"),
    where("data", "==", hoje)
  );
  const qExcecoesHoje = query(
    collection(db, "excecoes_refeicao"),
    where("data", "==", hoje)
  );

  const cancelarReservas = onSnapshot(qReservasHoje, (snapshot) => {
    reservasHojeCache = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    renderizarRefeicoesHoje();
  }, (error) => console.error("Erro ao acompanhar refeições de hoje:", error));

  const cancelarExcecoes = onSnapshot(qExcecoesHoje, (snapshot) => {
    excecoesHojeCache = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    renderizarRefeicoesHoje();
  }, (error) => console.error("Erro ao acompanhar ajustes de hoje:", error));

  canceladoresOuvintesAdmin.push(cancelarReservas, cancelarExcecoes);
}

function carregarPainelMensalRefeicoes(mesReferencia) {
  canceladoresPainelMensal.forEach((cancelar) => cancelar());
  canceladoresPainelMensal = [];
  reservasMesAdminCache = [];
  excecoesMesAdminCache = [];

  const mes = /^\d{4}-\d{2}$/.test(mesReferencia || '')
    ? mesReferencia
    : obterMesAtualIso();

  if (monthlyMealMonth) monthlyMealMonth.value = mes;

  const qReservasMes = query(
    collection(db, "reservas_refeicao"),
    where("data", ">=", `${mes}-01`),
    where("data", "<=", `${mes}-31`)
  );
  const qExcecoesMes = query(
    collection(db, "excecoes_refeicao"),
    where("data", ">=", `${mes}-01`),
    where("data", "<=", `${mes}-31`)
  );

  const cancelarReservas = onSnapshot(qReservasMes, (snapshot) => {
    reservasMesAdminCache = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    renderizarPainelMensalRefeicoes();
  }, (error) => {
    console.error("Erro ao carregar reservas mensais:", error);
    if (monthlyMealsList) monthlyMealsList.innerHTML = '<p class="meal-admin-empty">Não foi possível carregar as reservas deste mês.</p>';
  });

  const cancelarExcecoes = onSnapshot(qExcecoesMes, (snapshot) => {
    excecoesMesAdminCache = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    renderizarPainelMensalRefeicoes();
  }, (error) => console.error("Erro ao carregar refeições desconsideradas:", error));

  canceladoresPainelMensal.push(cancelarReservas, cancelarExcecoes);
}

function encerrarOuvintesRefeicoesAdmin() {
  canceladoresOuvintesAdmin.forEach((cancelar) => cancelar());
  canceladoresPainelMensal.forEach((cancelar) => cancelar());
  canceladoresOuvintesAdmin = [];
  canceladoresPainelMensal = [];
}

function iniciarGestaoAdminRefeicoes() {
  encerrarOuvintesRefeicoesAdmin();
  if (monthlyMealMonth && !monthlyMealMonth.value) {
    monthlyMealMonth.value = obterMesAtualIso();
  }

  ouvirUsuariosRefeicoes();
  ouvirReservasRefeicoes();
  carregarPainelMensalRefeicoes(monthlyMealMonth?.value || obterMesAtualIso());
}

function obterDataAnteriorIso(dataIso) {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  return obterDataLocalIso(new Date(ano, mes - 1, dia - 1));
}

function atualizarPeriodosRefeicaoFixa(usuario, tipoRefeicao, novoEstado) {
  const tipo = normalizarTipoRefeicao(tipoRefeicao);
  const estadoAtual = usuarioTemRefeicaoFixa(usuario, tipo);
  const hoje = obterDataLocalIso();
  const ontem = obterDataAnteriorIso(hoje);
  const periodosAtuais = Array.isArray(usuario?.periodosRefeicoesFixas?.[tipo])
    ? usuario.periodosRefeicoesFixas[tipo].map((periodo) => ({ ...periodo }))
    : [];

  if (estadoAtual === novoEstado) return periodosAtuais;

  if (novoEstado) {
    return [...periodosAtuais, { inicio: hoje, fim: null }];
  }

  if (periodosAtuais.length === 0) {
    return [{ inicio: '2000-01-01', fim: ontem }];
  }

  let indiceAberto = -1;
  for (let indice = periodosAtuais.length - 1; indice >= 0; indice--) {
    if (!periodosAtuais[indice].fim) {
      indiceAberto = indice;
      break;
    }
  }
  if (indiceAberto === -1) return periodosAtuais;

  if (periodosAtuais[indiceAberto].inicio === hoje) {
    periodosAtuais.splice(indiceAberto, 1);
  } else {
    periodosAtuais[indiceAberto].fim = ontem;
  }

  return periodosAtuais;
}

if (fixedMealUser) {
  fixedMealUser.addEventListener('change', sincronizarFormularioRefeicaoFixa);
}

if (fixedMealForm) {
  fixedMealForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (currentUserData?.role !== 'admin' || !fixedMealUser.value) return;

    const submitButton = fixedMealForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Salvando...';

    try {
      const usuarioSelecionado = usuariosRefeicoesCache.find((usuario) =>
        usuario.uid === fixedMealUser.value
      );
      const periodosAlmoco = atualizarPeriodosRefeicaoFixa(
        usuarioSelecionado,
        'almoco',
        fixedMealLunch.checked
      );
      const periodosJanta = atualizarPeriodosRefeicaoFixa(
        usuarioSelecionado,
        'janta',
        fixedMealDinner.checked
      );

      await setDoc(doc(db, "usuarios", fixedMealUser.value), {
        refeicoesFixas: {
          almoco: fixedMealLunch.checked,
          janta: fixedMealDinner.checked
        },
        periodosRefeicoesFixas: {
          almoco: periodosAlmoco,
          janta: periodosJanta
        },
        refeicoesFixasAtualizadasEm: serverTimestamp(),
        refeicoesFixasAtualizadasPor: currentUserData.uid
      }, { merge: true });

      Toast.fire({ icon: 'success', title: 'Refeições permanentes atualizadas.' });
    } catch (error) {
      console.error("Erro ao salvar refeições permanentes:", error);
      Swal.fire({
        icon: 'error',
        title: 'Não foi possível salvar',
        text: error.message,
        confirmButtonColor: '#0284C7'
      });
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Salvar configuração';
    }
  });
}

if (monthlyMealMonth) {
  monthlyMealMonth.addEventListener('change', () => {
    carregarPainelMensalRefeicoes(monthlyMealMonth.value);
  });
}

if (monthlyMealUser) {
  monthlyMealUser.addEventListener('change', renderizarPainelMensalRefeicoes);
}

// Submissão do Cardápio pelo Admin
if (menuForm) {
  menuForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dataCardapio = document.getElementById("menu-date").value;

    if (!eDiaUtilRefeicao(dataCardapio)) {
      Swal.fire({
        icon: 'warning',
        title: 'Data sem refeições',
        text: 'Não é possível cadastrar cardápio para sábado ou domingo.',
        confirmButtonColor: '#0284C7'
      });
      return;
    }

    const pratoPrincipal = document.getElementById("menu-main").value;
    const acompanhamento = document.getElementById("menu-side").value;
    const arrozFeijao = document.getElementById("menu-rice-beans").value;
    const saladaInput = document.getElementById("menu-salad");
    const salada = saladaInput ? saladaInput.value : "";
    const sobremesa = document.getElementById("menu-dessert").value;

    try {
      await setDoc(doc(db, "cardapio", dataCardapio), {
        pratoPrincipal,
        acompanhamento,
        arrozFeijao,
        salada,
        sobremesa,
        atualizadoEm: serverTimestamp()
      });

      menuForm.reset();
      Swal.fire({ icon: 'success', title: 'Cardápio salvo com sucesso!', confirmButtonColor: '#0284C7' });
      buscarCardapioPorData(dataCardapio);
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Erro ao salvar cardápio', text: error.message });
    }
  });
}

// Seleção de Data no Calendário
if (calendarPicker) {
  calendarPicker.addEventListener("change", (e) => {
    buscarCardapioPorData(e.target.value);
  });
}

async function buscarCardapioPorData(dataStr) {
  if (!dailyMenuDisplay || !dataStr) return;

  try {
    const docSnap = await getDoc(doc(db, "cardapio", dataStr));

    if (docSnap.exists()) {
      const cardapio = docSnap.data();
      const partesData = dataStr.split("-");
      const dataFormatada = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;
      const linhaArrozFeijao = cardapio.arrozFeijao
        ? `<p style="margin: 4px 0;"><strong>Arroz e feijão:</strong> ${escaparHtml(cardapio.arrozFeijao)}</p>`
        : '';

      dailyMenuDisplay.innerHTML = `
        <div class="notice-card" style="margin-top: 12px; padding: 16px;">
          <h4 style="margin-bottom: 8px; color: #0F172A;">Cardápio de ${dataFormatada}</h4>
          <p style="margin: 4px 0;"><strong>Prato Principal:</strong> ${escaparHtml(cardapio.pratoPrincipal)}</p>
          <p style="margin: 4px 0;"><strong>Acompanhamento:</strong> ${escaparHtml(cardapio.acompanhamento)}</p>
          ${linhaArrozFeijao}
          <p style="margin: 4px 0;"><strong>Salada:</strong> ${escaparHtml(cardapio.salada || 'Não informada')}</p>
          <p style="margin: 4px 0;"><strong>Sobremesa:</strong> ${escaparHtml(cardapio.sobremesa || 'Não informada')}</p>
          <div class="meal-reservation-actions" style="margin-top: 12px;">
            ${criarBotaoReservaHtml(dataStr, 'almoco')}
            ${criarBotaoReservaHtml(dataStr, 'janta')}
          </div>
        </div>
      `;
    } else {
      dailyMenuDisplay.innerHTML = `
        <div class="notice-card" style="margin-top: 12px; padding: 16px;">
          <p style="color: #64748B;">Nenhum cardápio cadastrado para esta data.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error("Erro ao buscar cardápio:", error);
  }
}

function ouvirCardapioSemanal() {
  if (!weeklyMenuList) return;
  const q = query(collection(db, "cardapio"), orderBy("atualizadoEm", "desc"));

  onSnapshot(q, (snapshot) => {
    cardapiosSemanaisCache = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      dados: docSnap.data()
    }));

    renderizarCardapiosSemanais();
  });
}

function renderizarCardapiosSemanais() {
  if (!weeklyMenuList) return;

  weeklyMenuList.innerHTML = "";
  if (cardapiosSemanaisCache.length === 0) {
    weeklyMenuList.innerHTML = `<p class="text-muted-small">Nenhum cardápio cadastrado.</p>`;
    return;
  }

  cardapiosSemanaisCache.forEach(({ id: dataStr, dados: cardapio }) => {
      const partes = dataStr.split("-");
      const dataFormatada = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataStr;

      // Verificação padronizada de Administrador
      const isAdmin = currentUserData?.role === 'admin';

      const card = document.createElement("div");
      card.className = "card-kpi";
      card.style.cssText = "text-align: left; background: #ffffff; border-radius: 8px; padding: 14px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;";
      const linhaArrozFeijao = cardapio.arrozFeijao
        ? `<p style="font-size: 0.85rem; color: #475569; margin: 2px 0;"><strong>Arroz e feijão:</strong> ${escaparHtml(cardapio.arrozFeijao)}</p>`
        : '';
      card.innerHTML = `
        <span class="kpi-label" style="font-weight: 600; color: #0284C7; font-size: 0.85rem;">📅 ${dataFormatada}</span>
        <h4 style="margin: 6px 0; font-size: 1rem; color: #0F172A; font-weight: 600;">${escaparHtml(cardapio.pratoPrincipal)}</h4>
        <p style="font-size: 0.85rem; color: #475569; margin: 2px 0;"><strong>Acompanhamento:</strong> ${escaparHtml(cardapio.acompanhamento)}</p>
        ${linhaArrozFeijao}
        <p style="font-size: 0.85rem; color: #475569; margin: 2px 0;"><strong>Salada:</strong> ${escaparHtml(cardapio.salada || 'Não informada')}</p>
        ${cardapio.sobremesa ? `<small style="color: #0284C7; display: block; margin-top: 4px;"><strong>Sobremesa:</strong> ${escaparHtml(cardapio.sobremesa)}</small>` : ''}
        
        <div class="meal-reservation-actions" style="margin-top: 10px;">
          ${criarBotaoReservaHtml(dataStr, 'almoco')}
          ${criarBotaoReservaHtml(dataStr, 'janta')}
          ${isAdmin ? `<button onclick="excluirCardapio('${dataStr}')" class="btn btn-sm btn-danger" style="background: #FEE2E2; color: #B91C1C; border: none; padding: 6px 10px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; font-weight: 600;">Excluir</button>` : ''}
        </div>
      `;
      weeklyMenuList.appendChild(card);
  });
}
