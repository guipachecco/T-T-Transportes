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
const avisosList = document.getElementById("notices-list"); // Garantindo padronização correta do ID
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
  ouvirRefeicoesDoMes();
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

// Função para abrir o modal de reporte de manutenção/SOS (Exposta no window)
window.abrirReporteManutencao = () => {
  // Fecha a barra lateral ao abrir o formulário
  if (typeof window.fecharMenuSidebar === "function") {
    window.fecharMenuSidebar();
  }

  Swal.fire({
    title: '🛠️ Reportar Manutenção / SOS',
    html: `
      <div style="text-align: left; display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
        <div>
          <label style="font-size: 0.85rem; font-weight: 600; color: #334155;">Veículo / Frota *</label>
          <input id="swal-veiculo" class="swal2-input" placeholder="Ex: Caminhão Volvo FH 540" style="margin: 4px 0 0 0; width: 100%;">
        </div>
        
        <div>
          <label style="font-size: 0.85rem; font-weight: 600; color: #334155;">Placa *</label>
          <input id="swal-placa" class="swal2-input" placeholder="Ex: ABC-1D23" style="margin: 4px 0 0 0; width: 100%;">
        </div>

        <div>
          <label style="font-size: 0.85rem; font-weight: 600; color: #334155;">Tipo de Problema *</label>
          <select id="swal-tipo" class="swal2-input" style="margin: 4px 0 0 0; width: 100%;">
            <option value="Mecânica">Mecânica</option>
            <option value="Elétrica">Elétrica</option>
            <option value="Pneus">Pneus</option>
            <option value="Funilaria / Pintura">Funilaria / Pintura</option>
            <option value="Outros / Emergência SOS">Outros / Emergência SOS</option>
          </select>
        </div>

        <div>
          <label style="font-size: 0.85rem; font-weight: 600; color: #334155;">Prioridade *</label>
          <select id="swal-prioridade" class="swal2-input" style="margin: 4px 0 0 0; width: 100%;">
            <option value="Baixa">Baixa</option>
            <option value="Média" selected>Média</option>
            <option value="Alta">Alta (Urgente / SOS)</option>
          </select>
        </div>

        <div>
          <label style="font-size: 0.85rem; font-weight: 600; color: #334155;">Descrição do Problema *</label>
          <textarea id="swal-descricao" class="swal2-textarea" placeholder="Descreva o que está acontecendo..." style="margin: 4px 0 0 0; width: 100%; height: 80px;"></textarea>
        </div>

        <div>
          <label style="font-size: 0.85rem; font-weight: 600; color: #334155;">Fotos do Problema (Opcional)</label>
          <input type="file" id="swal-fotos" multiple accept="image/*" class="swal2-file" style="margin: 4px 0 0 0; width: 100%;">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Enviar Chamado',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#EF4444',
    focusConfirm: false,
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

      return { 
        veiculo, 
        placa, 
        tipo, 
        prioridade, 
        descricao, 
        files: fotosInput ? fotosInput.files : [] 
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
  const { value: formValues } = await Swal.fire({
    title: 'Criar Anúncio no Marketplace',
    html: `
      <input id="swal-mk-titulo" class="swal2-input" placeholder="Título do Produto / Serviço">
      <input id="swal-mk-preco" class="swal2-input" type="number" step="0.01" placeholder="Preço (R$)">
      <input id="swal-mk-whats" class="swal2-input" placeholder="WhatsApp com DDD (Ex: 47 99999-9999)" maxlength="15">
      <textarea id="swal-mk-desc" class="swal2-textarea" placeholder="Descrição do produto..."></textarea>
      <label style="display:block; text-align:left; margin-top:10px; font-weight:600; font-size:0.85rem;">Selecione até 10 fotos:</label>
      <input type="file" id="swal-mk-fotos" class="swal2-file" accept="image/*" multiple>
    `,
    showCancelButton: true,
    confirmButtonText: 'Publicar Anúncio',
    cancelButtonText: 'Cancelar',
    didOpen: () => {
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
function ouvirRefeicoesDoMes() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const prefixoMes = `${ano}-${mes}`; // Exemplo: "2026-08"

  // Busca do dia 01 até o último dia do mês atual
  const q = query(
    collection(db, "reservas_refeicao"),
    where("data", ">=", `${prefixoMes}-01`),
    where("data", "<=", `${prefixoMes}-31`)
  );

  onSnapshot(q, (snapshot) => {
    let totalRefeicoesMes = 0;

    snapshot.forEach((docSnap) => {
      const r = docSnap.data();
      
     
       if (currentUserData && r.colaboradorUid !== currentUserData.uid) return;

      totalRefeicoesMes++;
    });

    const elTotal = document.getElementById("total-refeicoes-mes");
    const elCusto = document.getElementById("custo-total-mes");

    if (elTotal) elTotal.textContent = totalRefeicoesMes;
    if (elCusto) elCusto.textContent = `R$ ${(totalRefeicoesMes * PRECO_REFEICAO).toFixed(2)}`;
  });
}
// =============================================================
// REFEIÇÕES, CARDÁPIO E EXCLUSÃO PARA ADMIN
// =============================================================

window.reservarRefeicao = async (dataOuTipo = 'almoco', tipoRefeicao = 'almoco') => {
  if (!currentUserData) return;

  const eData = typeof dataOuTipo === 'string' && dataOuTipo.includes('-');
  const dataReserva = eData ? dataOuTipo : new Date().toISOString().split('T')[0];
  const tipo = eData ? tipoRefeicao : dataOuTipo;

  const partesData = dataReserva.split("-");
  const dataFormatada = partesData.length === 3 ? `${partesData[2]}/${partesData[1]}/${partesData[0]}` : dataReserva;

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

      // Verificação padronizada de Administrador
      const isAdmin = currentUserData?.role === 'admin';

      const card = document.createElement("div");
      card.className = "card-kpi";
      card.style.cssText = "text-align: left; background: #ffffff; border-radius: 8px; padding: 14px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;";
      card.innerHTML = `
        <span class="kpi-label" style="font-weight: 600; color: #0284C7; font-size: 0.85rem;">📅 ${dataFormatada}</span>
        <h4 style="margin: 6px 0; font-size: 1rem; color: #0F172A; font-weight: 600;">${cardapio.pratoPrincipal}</h4>
        <p style="font-size: 0.85rem; color: #475569; margin: 2px 0;"><strong>Acompanhamento:</strong> ${cardapio.acompanhamento}</p>
        <p style="font-size: 0.85rem; color: #475569; margin: 2px 0;"><strong>Salada:</strong> ${cardapio.salada || 'Não informada'}</p>
        ${cardapio.sobremesa ? `<small style="color: #0284C7; display: block; margin-top: 4px;"><strong>Sobremesa:</strong> ${cardapio.sobremesa}</small>` : ''}
        
        <div style="display: flex; gap: 8px; margin-top: 10px; align-items: center; flex-wrap: wrap;">
          <button onclick="reservarRefeicao('${dataStr}', 'almoco')" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.85rem; font-weight: 600;">
            Reservar (R$ ${PRECO_REFEICAO.toFixed(2)})
          </button>
          ${isAdmin ? `<button onclick="excluirCardapio('${dataStr}')" class="btn btn-sm btn-danger" style="background: #FEE2E2; color: #B91C1C; border: none; padding: 6px 10px; border-radius: 4px; font-size: 0.85rem; cursor: pointer; font-weight: 600;">Excluir</button>` : ''}
        </div>
      `;
      weeklyMenuList.appendChild(card);
    });
  });
}