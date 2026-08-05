// =============================================================
// APP.JS - CONTROLADOR DE INTERFACE E REGRAS DE NEGÓCIO
// =============================================================

import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
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
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Módulos Locais
import { auth, db } from "./firebase-init.js";
import { solicitarPermissaoNotificacoes } from "./notificacoes.js";
import { fazerUploadImagens } from "./imagens.js";

// Constantes Globais
const PRECO_REFEICAO = 4.00;

// -------------------------------------------------------------
// SELEÇÃO DE ELEMENTOS DO DOM
// -------------------------------------------------------------
const loginScreen = document.getElementById("login-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const loginForm = document.getElementById("login-form");

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
const noticesList = document.getElementById("notices-list");
const manutencoesList = document.getElementById("manutencoes-list");
const totalManutencoesElement = document.getElementById("total-manutencoes");
const marketplaceList = document.getElementById("marketplace-list");

const lunchList = document.getElementById("lunch-list");
const totalLunchesElement = document.getElementById("total-lunches");
const totalAlmoco = document.getElementById("total-almoco");
const totalJanta = document.getElementById("total-janta");
const totalRefeicoes = document.getElementById("total-refeicoes");
const custoTotal = document.getElementById("custo-total");

const menuForm = document.getElementById("menu-form");
const calendarPicker = document.getElementById("calendar-picker");
const dailyMenuDisplay = document.getElementById("daily-menu-display");
const weeklyMenuList = document.getElementById("weekly-menu-list");

// Estado Global da Aplicação
let currentUserData = null;

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

// -------------------------------------------------------------
// CONTROLE DE AUTENTICAÇÃO
// -------------------------------------------------------------
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDocRef = doc(db, "usuarios", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        currentUserData = { uid: user.uid, ...userDoc.data() };
      } else {
        currentUserData = {
          uid: user.uid,
          email: user.email,
          nome: user.email.split('@')[0],
          role: "colaborador"
        };
      }

      // Atualiza interface do usuário
      if (userGreeting) userGreeting.textContent = `Olá, ${currentUserData.nome || 'Colaborador'}`;
      if (sidebarUserName) sidebarUserName.textContent = currentUserData.nome || currentUserData.email;
      if (sidebarUserRole) sidebarUserRole.textContent = currentUserData.role === 'admin' ? 'Administrador' : 'Colaborador';

      // Controla exibições de painéis administrativos
      const isAdmin = currentUserData.role === "admin";
      if (adminPanel) adminPanel.style.display = isAdmin ? "block" : "none";
      if (adminMenuPanel) adminMenuPanel.style.display = isAdmin ? "block" : "none";

      // Troca de telas
      if (loginScreen) loginScreen.classList.remove("active");
      if (dashboardScreen) dashboardScreen.classList.add("active");

      // Ativa ouvintes em tempo real do Firestore
      iniciarOuvintesTempoReal();

      // Solicita permissão de notificações push
      solicitarPermissaoNotificacoes(user);
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    }
  } else {
    currentUserData = null;
    if (loginScreen) loginScreen.classList.add("active");
    if (dashboardScreen) dashboardScreen.classList.remove("active");
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
  ouvirReservasRefeicoes();
  ouvirCardapioSemanal();
}

// --- MURAL DE AVISOS ---
if (noticeForm) {
  noticeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const titulo = document.getElementById("notice-title").value;
    const conteudo = document.getElementById("notice-content").value;

    try {
      await addDoc(collection(db, "avisos"), {
        titulo,
        conteudo,
        autorUid: currentUserData.uid,
        autorNome: currentUserData.nome || currentUserData.email,
        criadoEm: serverTimestamp()
      });

      noticeForm.reset();
      Toast.fire({ icon: 'success', title: 'Aviso publicado com sucesso!' });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Erro ao publicar aviso', text: error.message });
    }
  });
}

function ouvirAvisos() {
  if (!noticesList) return;
  const q = query(collection(db, "avisos"), orderBy("criadoEm", "desc"));
  
  onSnapshot(q, (snapshot) => {
    noticesList.innerHTML = "";
    if (snapshot.empty) {
      noticesList.innerHTML = `<p class="text-muted-small">Nenhum aviso publicado no momento.</p>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const isRead = data.leituras?.some(l => l.uid === currentUserData?.uid);
      const isAdmin = currentUserData?.role === "admin";

      const card = document.createElement("div");
      card.className = "notice-card";
      card.innerHTML = `
        <div class="notice-header">
          <h4>${data.titulo}</h4>
          <small>${data.autorNome || 'Administração'}</small>
        </div>
        <p class="notice-body">${data.conteudo}</p>
        <div class="notice-footer">
          <button onclick="confirmarLeitura('${docSnap.id}')" class="btn btn-sm ${isRead ? 'btn-secondary' : 'btn-primary'}" ${isRead ? 'disabled' : ''}>
            ${isRead ? '✓ Lido' : 'Marcar como Lido'}
          </button>
          ${isAdmin ? `<button onclick="excluirAviso('${docSnap.id}')" class="btn btn-sm btn-danger">Excluir</button>` : ''}
        </div>
      `;
      noticesList.appendChild(card);
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

window.confirmarLeitura = async (anuncioId) => {
  if (!currentUserData) return;
  try {
    await updateDoc(doc(db, "avisos", anuncioId), {
      leituras: arrayUnion({
        uid: currentUserData.uid,
        nome: currentUserData.nome || currentUserData.email,
        dataHora: new Date().toISOString()
      })
    });
    Toast.fire({ icon: 'success', title: 'Leitura confirmada!' });
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Erro ao confirmar leitura', text: error.message });
  }
};

// --- ALERTAS DE MANUTENÇÃO & SOS ---
window.abrirReporteManutencao = async () => {
  const { value: formValues } = await Swal.fire({
    title: 'Reportar Manutenção / SOS',
    html: `
      <input id="swal-veiculo" class="swal2-input" placeholder="Veículo / Placa (Ex: Caminhão ABC-1234)">
      <textarea id="swal-descricao" class="swal2-textarea" placeholder="Descreva o problema ou emergência..."></textarea>
      <input type="file" id="swal-fotos" class="swal2-file" accept="image/*" multiple>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Enviar Alerta',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const veiculo = document.getElementById('swal-veiculo').value;
      const descricao = document.getElementById('swal-descricao').value;
      const fotosInput = document.getElementById('swal-fotos');
      if (!veiculo || !descricao) {
        Swal.showValidationMessage('Preencha o veículo e a descrição.');
        return false;
      }
      return { veiculo, descricao, files: Array.from(fotosInput.files) };
    }
  });

  if (formValues) {
    try {
      let fotosUrls = [];
      if (formValues.files && formValues.files.length > 0) {
        Toast.fire({ icon: 'info', title: 'A enviar imagens...' });
        fotosUrls = await fazerUploadImagens(formValues.files);
      }

      await addDoc(collection(db, "manutencoes"), {
        colaboradorUid: currentUserData.uid,
        colaboradorNome: currentUserData.nome || currentUserData.email,
        veiculo: formValues.veiculo,
        descricao: formValues.descricao,
        fotos: fotosUrls,
        status: "Pendente",
        criadoEm: serverTimestamp()
      });

      Toast.fire({ icon: 'success', title: 'Alerta enviado para a equipe de manutenção!' });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Erro ao enviar alerta', text: error.message });
    }
  }
};

function ouvirManutencoes() {
  if (!manutencoesList) return;
  const q = query(collection(db, "manutencoes"), orderBy("criadoEm", "desc"));

  onSnapshot(q, (snapshot) => {
    manutencoesList.innerHTML = "";
    if (totalManutencoesElement) totalManutencoesElement.textContent = `${snapshot.size} chamado(s) registrado(s)`;

    if (snapshot.empty) {
      manutencoesList.innerHTML = `<p class="text-muted-small">Nenhum chamado de manutenção no momento.</p>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      const div = document.createElement("div");
      div.className = "manutencao-card";
      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong>${item.veiculo}</strong>
          <span class="badge ${item.status === 'Concluído' ? 'badge-success' : 'badge-warning'}">${item.status}</span>
        </div>
        <p style="margin: 8px 0; font-size: 0.9rem;">${item.descricao}</p>
        <small class="text-muted-small">Por: ${item.colaboradorNome}</small>
        ${item.fotos && item.fotos.length > 0 ? `
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            ${item.fotos.map(url => `<img src="${url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">`).join('')}
          </div>
        ` : ''}
        ${currentUserData?.role === 'admin' && item.status !== 'Concluído' ? `
          <button onclick="concluirManutencao('${docSnap.id}')" class="btn btn-sm btn-dark" style="margin-top: 8px;">Concluir Chamado</button>
        ` : ''}
      `;
      manutencoesList.appendChild(div);
    });
  });
}

window.concluirManutencao = async (id) => {
  try {
    await updateDoc(doc(db, "manutencoes", id), { status: "Concluído" });
    Toast.fire({ icon: 'success', title: 'Chamado concluído!' });
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Erro ao atualizar', text: error.message });
  }
};

// --- MARKETPLACE / FEIRINHA ---
window.abrirModalNovoAnuncioMarketplace = async () => {
  const { value: formValues } = await Swal.fire({
    title: 'Criar Anúncio no Marketplace',
    html: `
      <input id="swal-mk-titulo" class="swal2-input" placeholder="Título do Produto / Serviço">
      <input id="swal-mk-preco" class="swal2-input" type="number" step="0.01" placeholder="Preço (R$)">
      <input id="swal-mk-whats" class="swal2-input" placeholder="WhatsApp para contato (Ex: 47999999999)">
      <textarea id="swal-mk-desc" class="swal2-textarea" placeholder="Descrição do produto..."></textarea>
      <input type="file" id="swal-mk-foto" class="swal2-file" accept="image/*">
    `,
    showCancelButton: true,
    confirmButtonText: 'Publicar Anúncio',
    cancelButtonText: 'Cancelar',
    preConfirm: () => {
      const titulo = document.getElementById('swal-mk-titulo').value;
      const preco = document.getElementById('swal-mk-preco').value;
      const whatsapp = document.getElementById('swal-mk-whats').value;
      const descricao = document.getElementById('swal-mk-desc').value;
      const fotoInput = document.getElementById('swal-mk-foto');

      if (!titulo || !preco || !whatsapp) {
        Swal.showValidationMessage('Preencha título, preço e WhatsApp.');
        return false;
      }
      return { titulo, preco: parseFloat(preco), whatsapp, descricao, file: fotoInput.files[0] };
    }
  });

  if (formValues) {
    try {
      let imagemUrl = null;
      if (formValues.file) {
        Toast.fire({ icon: 'info', title: 'A enviar imagem...' });
        const fotos = await fazerUploadImagens([formValues.file]);
        if (fotos.length > 0) imagemUrl = fotos[0];
      }

      await addDoc(collection(db, "marketplace"), {
        titulo: formValues.titulo,
        preco: formValues.preco,
        whatsapp: formValues.whatsapp,
        descricao: formValues.descricao,
        imagemUrl,
        vendedorUid: currentUserData.uid,
        vendedorNome: currentUserData.nome || currentUserData.email,
        criadoEm: serverTimestamp()
      });

      Toast.fire({ icon: 'success', title: 'Anúncio publicado no Marketplace!' });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Erro ao criar anúncio', text: error.message });
    }
  }
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
      const isOwner = item.vendedorUid === currentUserData?.uid;
      const isAdmin = currentUserData?.role === 'admin';

      const card = document.createElement("div");
      card.className = "marketplace-card";
      card.innerHTML = `
        ${item.imagemUrl ? `<img src="${item.imagemUrl}" class="mk-image" alt="${item.titulo}">` : ''}
        <div class="mk-content">
          <h4>${item.titulo}</h4>
          <strong class="mk-price">R$ ${item.preco.toFixed(2)}</strong>
          <p>${item.descricao || ''}</p>
          <small class="text-muted-small">Vendedor: ${item.vendedorNome}</small>
          <div class="mk-actions" style="margin-top: 10px;">
            <a href="https://wa.me/55${item.whatsapp.replace(/\D/g,'')}" target="_blank" class="btn btn-sm btn-primary">Contatar WhatsApp</a>
            ${isOwner || isAdmin ? `<button onclick="excluirAnuncioMarketplace('${docSnap.id}')" class="btn btn-sm btn-danger">Excluir</button>` : ''}
          </div>
        </div>
      `;
      marketplaceList.appendChild(card);
    });
  });
}

window.excluirAnuncioMarketplace = async (id) => {
  try {
    await deleteDoc(doc(db, "marketplace", id));
    Toast.fire({ icon: 'success', title: 'Anúncio excluído!' });
  } catch (error) {
    Swal.fire({ icon: 'error', title: 'Erro ao excluir', text: error.message });
  }
};

// =============================================================
// REFEIÇÕES, CARDÁPIO E EXCLUSÃO PARA ADMIN
// =============================================================

window.reservarRefeicao = async (dataOuTipo = 'almoco', tipoRefeicao = 'almoco') => {
  if (!currentUserData) return;

  const eData = typeof dataOuTipo === 'string' && dataOuTipo.includes('-');
  const dataReserva = eData ? dataOuTipo : new Date().toISOString().split('T')[0];
  const tipo = eData ? tipoRefeicao : dataOuTipo;

  // Formata a data para a mensagem de confirmação (DD/MM/AAAA)
  const partesData = dataReserva.split("-");
  const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}/${partesData[0]}` : dataReserva;

  // 1. Validação de Data e Horário Limite (08:30)
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

    if (horaAtual > 8 || (horaAtual === 8 && minutoAtual > 30)) {
      return Swal.fire({
        icon: 'warning',
        title: 'Horário Limite Excedido',
        text: 'As reservas para hoje encerram às 08:30.',
        confirmButtonColor: '#0284C7'
      });
    }
  }

  // 2. Janela de Confirmação antes de prosseguir
  const confirmacao = await Swal.fire({
    title: 'Confirmar Reserva?',
    text: `Deseja realmente marcar a refeição para o dia ${dataFormatada}?`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#0284C7',
    cancelButtonColor: '#64748B',
    confirmButtonText: 'Sim, confirmar',
    cancelButtonText: 'Cancelar'
  });

  if (!confirmacao.isConfirmed) return;

  try {
    // 3. Trava de Duplicidade no Banco
    const qDuplicidade = query(
      collection(db, "reservas_refeicao"),
      where("colaboradorUid", "==", currentUserData.uid),
      where("data", "==", dataReserva)
    );

    const snapshotExistente = await getDocs(qDuplicidade);

    if (!snapshotExistente.empty) {
      return Swal.fire({
        icon: 'info',
        title: 'Reserva já efetuada',
        text: `Você já possui uma reserva confirmada para o dia ${dataFormatada}.`,
        confirmButtonColor: '#0284C7'
      });
    }

    // 4. Efetua a Gravação da Reserva
    await addDoc(collection(db, "reservas_refeicao"), {
      colaboradorUid: currentUserData.uid,
      colaboradorNome: currentUserData.nome || currentUserData.email,
      tipo: tipo,
      data: dataReserva,
      valor: PRECO_REFEICAO,
      criadoEm: serverTimestamp()
    });

    Swal.fire({
      icon: 'success',
      title: 'Reserva Confirmada!',
      text: `Sua refeição para o dia ${dataFormatada} foi registrada com sucesso.`,
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

function ouvirReservasRefeicoes() {
  const hoje = new Date().toISOString().split('T')[0];
  const q = query(collection(db, "reservas_refeicao"), where("data", "==", hoje));

  onSnapshot(q, (snapshot) => {
    let almocos = 0;
    let jantas = 0;

    if (lunchList) lunchList.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const r = docSnap.data();
      if (r.tipo === 'janta') jantas++;
      else almocos++;

      if (lunchList) {
        const li = document.createElement("li");
        li.textContent = `${r.colaboradorNome} - ${r.tipo.toUpperCase()}`;
        lunchList.appendChild(li);
      }
    });

    const total = almocos + jantas;
    if (totalAlmoco) totalAlmoco.textContent = almocos;
    if (totalJanta) totalJanta.textContent = jantas;
    if (totalRefeicoes) totalRefeicoes.textContent = total;
    if (custoTotal) custoTotal.textContent = `R$ ${(total * PRECO_REFEICAO).toFixed(2)}`;
    if (totalLunchesElement) totalLunchesElement.textContent = `${total} reserva(s) para hoje`;
  });
}

// Submissão do Cardápio pelo Admin
if (menuForm) {
  menuForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dataCardapio = document.getElementById("menu-date").value;
    const pratoPrincipal = document.getElementById("menu-main").value;
    const acompanhamento = document.getElementById("menu-side").value;
    const saladaInput = document.getElementById("menu-salad");
    const salada = saladaInput ? saladaInput.value : "";
    const sobremesa = document.getElementById("menu-dessert").value;

    try {
      await setDoc(doc(db, "cardapio", dataCardapio), {
        pratoPrincipal,
        acompanhamento,
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

      dailyMenuDisplay.innerHTML = `
        <div class="notice-card" style="margin-top: 12px; padding: 16px;">
          <h4 style="margin-bottom: 8px; color: #0F172A;">Cardápio de ${dataFormatada}</h4>
          <p style="margin: 4px 0;"><strong>Prato Principal:</strong> ${cardapio.pratoPrincipal}</p>
          <p style="margin: 4px 0;"><strong>Acompanhamento:</strong> ${cardapio.acompanhamento}</p>
          <p style="margin: 4px 0;"><strong>Salada:</strong> ${cardapio.salada || 'Não informada'}</p>
          <p style="margin: 4px 0;"><strong>Sobremesa:</strong> ${cardapio.sobremesa || 'Não informada'}</p>
          <button onclick="reservarRefeicao('${dataStr}', 'almoco')" class="btn btn-primary" style="margin-top: 12px;">
            Reservar para este dia (R$ ${PRECO_REFEICAO.toFixed(2)})
          </button>
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
    weeklyMenuList.innerHTML = "";
    if (snapshot.empty) {
      weeklyMenuList.innerHTML = `<p class="text-muted-small">Nenhum cardápio cadastrado.</p>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const cardapio = docSnap.data();
      const dataStr = docSnap.id;
      const partes = dataStr.split("-");
      const dataFormatada = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataStr;

      // Verifica se o usuário atual é admin
      const isAdmin = currentUserData && (currentUserData.isAdmin || currentUserData.cargo === 'admin' || currentUserData.tipo === 'admin');

      const card = document.createElement("div");
      card.className = "card-kpi";
      card.style.textAlign = "left";
      card.innerHTML = `
        <span class="kpi-label">${dataFormatada}</span>
        <h4 style="margin: 4px 0; font-size: 1rem; color: #0F172A;">${cardapio.pratoPrincipal}</h4>
        <p style="font-size: 0.85rem; color: #64748B; margin: 2px 0;"><strong>Acompanhamento:</strong> ${cardapio.acompanhamento}</p>
        <p style="font-size: 0.85rem; color: #64748B; margin: 2px 0;"><strong>Salada:</strong> ${cardapio.salada || 'Não informada'}</p>
        ${cardapio.sobremesa ? `<small style="color: #0284C7; display: block; margin-top: 4px;"><strong>Sobremesa:</strong> ${cardapio.sobremesa}</small>` : ''}
        
        <div style="margin-top: 12px; display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <button onclick="reservarRefeicao('${dataStr}', 'almoco')" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem;">
            Reservar (R$ ${PRECO_REFEICAO.toFixed(2)})
          </button>
          ${isAdmin ? `<button onclick="excluirCardapio('${dataStr}')" class="btn" style="background: #FEE2E2; color: #B91C1C; border: none; padding: 6px 10px; border-radius: 4px; font-size: 0.85rem; cursor: pointer;">Excluir</button>` : ''}
        </div>
      `;
      weeklyMenuList.appendChild(card);
    });
  });
}