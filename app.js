/* =========================================================
   A PAREDE DE DESEJOS — lógica
   ========================================================= */

const CONFIG = {
  // >>> COLE AQUI a URL do seu Cloudflare Worker, ex.:
  //     "https://parede-de-desejos.SEU-SUBDOMINIO.workers.dev"
  WORKER_URL: "https://parede-de-desejos.rodri01001.workers.dev",
};

const PERSONAGENS = [
  { id: "001", nome: "Faca" },
  { id: "002", nome: "Sabonete" },
  { id: "003", nome: "Mostarda" },
  { id: "004", nome: "Papelão" },
  { id: "005", nome: "Papel" },
  { id: "006", nome: "Luva" },
  { id: "007", nome: "Velcro" },
];

const LEGENDAS = [
  "0 — um incômodo passageiro",
  "1 — um custo pequeno",
  "2 — algo que não se esquece fácil",
  "3 — uma perda concreta",
  "4 — uma marca permanente",
  "5 — uma mutilação fria",
  "6 — o limiar do que se suporta",
];

const SELOS_LOCAIS = [
  "O preço está anotado.",
  "A dívida foi inscrita na pedra.",
  "Anotado. A pedra não esquece.",
];

const estado = {
  ativo: PERSONAGENS[0].id,
  nivel: null,
  contagens: Object.fromEntries(PERSONAGENS.map((p) => [p.id, 0])),
};

/* ---------- referências de DOM ---------- */
const $abas = document.getElementById("abas");
const $niveis = document.getElementById("niveis");
const $legenda = document.getElementById("nivelLegenda");
const $quemDeseja = document.getElementById("quemDeseja");
const $desejo = document.getElementById("desejo");
const $oferecer = document.getElementById("oferecer");
const $veredito = document.getElementById("veredito");
const $vereditoTexto = document.getElementById("vereditoTexto");
const $vereditoSelo = document.getElementById("vereditoSelo");
const $aviso = document.getElementById("aviso");

const workerConfigurado = () =>
  CONFIG.WORKER_URL && !CONFIG.WORKER_URL.includes("COLE_A_URL");

/* ---------- chave de acesso (mora só no navegador, nunca no código) ---------- */
const CHAVE_STORAGE = "parede:chave";

function obterChave() {
  let chave = localStorage.getItem(CHAVE_STORAGE);
  if (!chave) {
    chave = prompt("Sussurre a chave da Parede:");
    if (chave) localStorage.setItem(CHAVE_STORAGE, chave.trim());
  }
  return chave ? chave.trim() : "";
}

function esquecerChave() {
  localStorage.removeItem(CHAVE_STORAGE);
}

/* ---------- render das abas ---------- */
function renderAbas() {
  $abas.innerHTML = "";
  for (const p of PERSONAGENS) {
    const li = document.createElement("li");
    li.className = "aba" + (p.id === estado.ativo ? " ativa" : "");
    li.dataset.id = p.id;
    li.innerHTML = `
      <span class="codigo">${p.id}</span>
      <span class="nome">${p.nome}</span>
      <span class="contador">desejos: <b>${estado.contagens[p.id]}</b></span>`;
    li.addEventListener("click", () => selecionarPersonagem(p.id));
    $abas.appendChild(li);
  }
  const atual = PERSONAGENS.find((p) => p.id === estado.ativo);
  $quemDeseja.textContent = `${atual.id} · ${atual.nome}`;
}

function selecionarPersonagem(id) {
  estado.ativo = id;
  renderAbas();
}

/* ---------- render do seletor de nível ---------- */
function renderNiveis() {
  $niveis.innerHTML = "";
  for (let n = 0; n <= 6; n++) {
    const div = document.createElement("div");
    div.className = "nivel";
    div.dataset.n = n;
    div.textContent = n;
    div.addEventListener("click", () => escolherNivel(n));
    $niveis.appendChild(div);
  }
}

function escolherNivel(n) {
  estado.nivel = n;
  [...$niveis.children].forEach((c) =>
    c.classList.toggle("escolhido", Number(c.dataset.n) === n)
  );
  $legenda.textContent = LEGENDAS[n];
}

/* ---------- avisos ---------- */
function mostrarAviso(texto) {
  $aviso.textContent = texto;
  $aviso.hidden = false;
}
function limparAviso() {
  $aviso.hidden = true;
}

/* ---------- carregar contadores do Worker ---------- */
async function carregarContagens() {
  if (!workerConfigurado()) {
    mostrarAviso(
      "A Parede ainda não foi acordada. Abra app.js e cole a URL do seu Cloudflare Worker em CONFIG.WORKER_URL. Os pedidos só são concedidos com ela."
    );
    return;
  }
  try {
    const r = await fetch(`${CONFIG.WORKER_URL}/counts`);
    if (!r.ok) throw new Error(r.status);
    const dados = await r.json();
    for (const p of PERSONAGENS) {
      estado.contagens[p.id] = Number(dados[p.id] || 0);
    }
    renderAbas();
  } catch (e) {
    mostrarAviso("Não foi possível ouvir a pedra (contadores). A Parede segue, mas talvez sem memória. Detalhe: " + e.message);
  }
}

/* ---------- inscrever o veredito letra por letra ---------- */
function inscrever(texto, selo) {
  $veredito.hidden = false;
  $vereditoSelo.textContent = "";
  $vereditoTexto.textContent = "";
  $vereditoTexto.classList.add("escrevendo");
  $veredito.scrollIntoView({ behavior: "smooth", block: "center" });

  let i = 0;
  const passo = () => {
    if (i <= texto.length) {
      $vereditoTexto.textContent = texto.slice(0, i);
      i++;
      // ritmo irregular, como quem corta a pedra
      setTimeout(passo, 14 + Math.random() * 26);
    } else {
      $vereditoTexto.classList.remove("escrevendo");
      $vereditoSelo.textContent = selo || "";
    }
  };
  passo();
}

/* ---------- oferecer o desejo ---------- */
async function oferecer() {
  const desejo = $desejo.value.trim();
  limparAviso();

  if (!desejo) {
    mostrarAviso("A Parede não escuta o silêncio. Escreva um desejo.");
    return;
  }
  if (estado.nivel === null) {
    mostrarAviso("Escolha a profundidade do preço, de 0 a 6.");
    return;
  }
  if (!workerConfigurado()) {
    mostrarAviso(
      "A Parede ainda não foi acordada. Cole a URL do seu Cloudflare Worker em CONFIG.WORKER_URL (app.js)."
    );
    return;
  }

  const chave = obterChave();
  if (!chave) {
    mostrarAviso("Sem a chave, a Parede não abre. Recarregue para sussurrá-la de novo.");
    return;
  }

  const atual = PERSONAGENS.find((p) => p.id === estado.ativo);

  $oferecer.disabled = true;
  $oferecer.classList.add("pensando");
  $oferecer.textContent = "A Parede considera…";

  try {
    const r = await fetch(`${CONFIG.WORKER_URL}/wish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-parede-key": chave,
      },
      body: JSON.stringify({
        id: atual.id,
        nome: atual.nome,
        desejo,
        nivel: estado.nivel,
      }),
    });
    if (r.status === 401) {
      esquecerChave();
      mostrarAviso("A chave estava errada. A Parede a recusou. Recarregue e sussurre de novo.");
      return;
    }
    if (!r.ok) {
      const corpo = await r.text();
      throw new Error(`${r.status} — ${corpo.slice(0, 200)}`);
    }
    const dados = await r.json();

    // atualiza o contador deste suplicante
    if (typeof dados.count === "number") {
      estado.contagens[atual.id] = dados.count;
      renderAbas();
    }

    const selo =
      dados.selo || SELOS_LOCAIS[Math.floor(Math.random() * SELOS_LOCAIS.length)];
    inscrever(dados.price || "A Parede ficou em silêncio.", selo);
    $desejo.value = "";
  } catch (e) {
    mostrarAviso("A Parede recusou o pedido. Verifique a chave e a URL do Worker. Detalhe: " + e.message);
  } finally {
    $oferecer.disabled = false;
    $oferecer.classList.remove("pensando");
    $oferecer.textContent = "Oferecer à Parede";
  }
}

/* ---------- atalho: Ctrl/Cmd + Enter envia ---------- */
$desejo.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") oferecer();
});
$oferecer.addEventListener("click", oferecer);

/* ---------- início ---------- */
renderAbas();
renderNiveis();
carregarContagens();
