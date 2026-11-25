/* =========================================================================
   Assistente Jurídico — 70-ferramentas.js
   🧰 As ferramentas que já funcionam, cada uma no seu arquivo (ferramentas/),
   abertas aqui dentro. Ficam "vivas": trocar de aba não apaga o que estava
   sendo feito nelas.
   ========================================================================= */
(function (J) {
  'use strict';
  const LISTA = [
    { id: 'transcrever', arq: 'transcrever.html', nome: '🎙 Transcrever Áudio (WhatsApp)', d: 'Áudios do WhatsApp viram texto LITERAL com o tempo de cada trecho, para usar como prova. Junta a ficha do arquivo (tamanho, duração, data e a impressão digital SHA-256). Baixa em Word.' },
    { id: 'aistudio', arq: 'ai-studio/index.html', nome: '⚡ AI Studio (chat rápido e econômico)', d: 'O chat mais leve: responde mais rápido e gasta menos (Gemini, Groq, OpenRouter, Monica, Ollama). Selecione um texto no Jurídico antes de abrir e ele já vai para a caixa do chat. Tem as ferramentas de imagem, Markdown, dividir/juntar e envio em partes.' },
    { id: 'meuchat', arq: 'meu-chat/index.html', nome: '💬 Meu Chat (chat livre)', d: 'O seu chat completo, separado do jurídico: não gasta o pedido das peças. Mesmo login da ☁️ nuvem.' },
    { id: 'desmontador', arq: 'desmontador-backup.html', nome: '♻️ Restaurador Universal', d: 'Escolha backups de qualquer app seu (.json, .zip, .csv, .tsv): descobre o que é, mostra ao vivo, devolve no formato original e restaura aqui. Uma peça por tipo: seus apps, projetos da Replit, AI Code Studio, ChatGPT.' },
    { id: 'banco', arq: 'banco-neon.html', nome: '🗄 Banco de Dados (Neon)', d: 'Cole o endereço do Neon: veja as tabelas e o que tem dentro, baixe tudo (backup) e crie tabelas. Comando que apaga pede CONFIRMO.' },
    { id: 'verificador', arq: 'verificador-citacoes.html', nome: '🔎 Verificador de Citações', d: 'Cole o texto da IA: marca julgado inventado (número de exemplo, dígito do CNJ que não confere, súmula que não existe, relator sem nome) e dá os links para conferir.' },
    { id: 'calculadora', arq: 'calculadora-sentenca.html', nome: '🧮 Calculadora da Sentença (completa)', d: 'Mês a mês pela sentença: tabela oficial do TJMG embutida (ou colada de qualquer jeito, até do Cálculo Jurídico), qualquer série do Banco Central (ao ano ou ao mês), capitalização anual, os 4 modelos de honorários e os recursais. Parecer com resumo, fontes, links e análise do cálculo da outra parte.' },
    { id: 'montador', arq: 'montador.html', nome: '🧩 Montador Universal (+ 🤖 regra com IA)', d: 'Abre qualquer arquivo (PDF, Excel, CSV, JSON, texto), você cria as regras tocando nas linhas e baixa no formato que quiser. 🤖 A IA escreve a regra uma vez; depois ele aplica sozinho, sem gastar IA. Guarda modelos.' },
    { id: 'raiox', arq: 'raio-x-zip.html', nome: '🩻 Raio-X de ZIP (zip gigante)', d: 'Abre zip enorme (até zip dentro de zip) sem descompactar tudo e sem travar. Gera o PLANO do projeto (rotas, APIs, pastas, manuais) e um ZIP pequeno com os arquivos importantes — senhas e chaves saem tampadas.' },
    { id: 'datajud', arq: 'datajud.html', nome: '📡 Processos (DataJud/CNJ) e 🔎 Jurisprudência na fonte', d: 'Digite o número do processo e veja as movimentações direto do CNJ (grátis). ⭐ Acompanhe vários e toque em "Ver novidades" para saber o que mudou. E pesquise jurisprudência abrindo a busca OFICIAL do STJ, STF, TJMG e CNJ com os seus termos.' },
    { id: 'modelo', arq: 'montador-simples.html', nome: '🎯 Igualar a um modelo (Montador Simples)', d: 'Você cola um arquivo MODELO (ex.: o CSV baixado do site do Bacen) e a tabela que tem (ex.: TJMG). Ele aprende o formato do modelo — separador, data, decimal, cabeçalho, rodapé — e entrega igual. Também limpa texto de PDF e transforma backup/JSON em tabela.' },
    { id: 'conversor', arq: 'conversor-indices.html', nome: '📈 Conversor de Índices → Bacen', d: 'Qualquer tabela de índices (TJMG, IBGE, PDF, Excel, Cálculo Jurídico) sai no formato do Banco Central: data;valor, mês a mês. Com memória de cálculo para conferir um valor.' },
    { id: 'perito', arq: 'perito.html', nome: '🔬 Perito de Metadados', d: 'Perícia em PDF/foto: autor, datas, programas, sinais de montagem. Gera relatório de apoio com resumo em palavras simples, em Word ou PDF.' },
    { id: 'comunicacoes', arq: 'comunicacoes.html', nome: '📬 Comunicações (DJEN) + 🤖 Robô de prazos', d: '🤖 Acha sessão virtual, calcula o prazo de sustentação oral e prepara o aviso ao cliente (e-mail/WhatsApp). Intimações e publicações do Diário de Justiça Eletrônico Nacional.' },
    { id: 'limpador', arq: 'limpador.html', nome: '🧹 Limpador de Processos', d: 'Tira a sujeira do PDF do processo (assinaturas, rodapé do PJe, links…). NOVO: 📑 índice das peças (sentença, acórdão, decisão, petição…) — deixe só as decisões e até o Ollama dá conta de processo enorme; ✍️ cria a regra a partir de uma linha de exemplo, sem saber regex. Depois divide em partes e resume com IA grátis.' },
    { id: 'organizador', arq: 'organizador.html', nome: '📑 Organizador de Documentos', d: 'Importa o PDF, mostra tudo numerado e organizado, e baixa no padrão que você criar.' },
    { id: 'juntador', arq: 'juntador.html', nome: '🧩 Juntador de Arquivos', d: 'Junta vários arquivos (Word, texto, até .zip) num texto só — bom para mandar tudo à IA de uma vez.' },
    { id: 'extrator', arq: 'extrator.html', nome: '🌐 Extrator de Sites', d: 'Cole o endereço de uma página pública e puxe o texto inteiro (ex.: uma decisão publicada).' },
    { id: 'colador', arq: 'colador.html', nome: '🔗 Colador de Links', d: 'Seus links e os dos tribunais (TJMG, TRF6, STJ, Meu INSS…) num lugar só. Também guarda códigos.' },
    { id: 'laboratorio', arq: 'laboratorio.html', nome: '🧪 Laboratório HTML', d: 'Toque numa parte da página e mude cor, tamanho, espaço. Com aulas de HTML e CSS.' },
    { id: 'colecionador', arq: 'colecionador.html', nome: '🧰 Colecionador de Comandos', d: 'Guarda os comandos com explicação. Cole a resposta da IA e ele separa sozinho.' },
    { id: 'cacabug', arq: 'cacabug/index.html', nome: '🐞 Caça-Bug', d: 'Acha e conserta erros nos seus códigos e projetos.' },
    { id: 'comparador', arq: 'comparador.html', nome: '⚖️ Comparador de Versões', d: 'Compara duas ou várias versões de um projeto e junta o que falta.' },
  ];
  let painel, quadro;
  const vivos = new Map();

  function montar(el) {
    painel = el;
    el.innerHTML = '<h2>🧰 Ferramentas</h2><p class="peq mut">Abrem aqui dentro, em tela cheia. Toque em ← Voltar para voltar ao Assistente — a ferramenta continua aberta do jeito que você deixou.</p>' +
      '<div class="grade">' + LISTA.map((f) => '<button class="ferr" data-f="' + f.id + '"><b>' + f.nome + '</b><span>' + f.d + '</span></button>').join('') + '</div>' +
      '<div class="caixa" style="margin-top:14px">A chave do Gemini que você colocou em ⚙️ Config já vai junto para o 🧹 Limpador.</div>';
    quadro = document.createElement('div'); quadro.className = 'quadro-ferr'; quadro.hidden = true;
    quadro.innerHTML = '<div class="barra"><button class="bt mini" id="fr-voltar">← Voltar</button><b id="fr-nome"></b><button class="bt mini" id="fr-recarregar" title="Recarregar">⟳</button><button class="bt mini" id="fr-fora" title="Abrir fora">↗</button></div>';
    document.body.appendChild(quadro);
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-f]'); if (b) abrir(b.dataset.f); });
    J.$('#fr-voltar').onclick = () => { quadro.hidden = true; document.body.style.overflow = ''; };
    J.$('#fr-recarregar').onclick = () => { const f = vivos.get(quadro.dataset.atual); if (f) f.src = f.src; };
    J.$('#fr-fora').onclick = () => { const it = LISTA.find((x) => x.id === quadro.dataset.atual); if (it) window.open('ferramentas/' + it.arq, '_blank'); };
  }
  function passarChave() {
    const c = J.ia.cfg(); if (!c.chave) return;
    try { const k = 'limpador:chaves'; const ch = JSON.parse(localStorage.getItem(k) || '{}'); if (!ch.gemini) { ch.gemini = c.chave; localStorage.setItem(k, JSON.stringify(ch)); } } catch {}
  }
  function abrir(id) {
    const it = LISTA.find((x) => x.id === id); if (!it) return;
    passarChave();
    quadro.dataset.atual = id; J.$('#fr-nome').textContent = it.nome;
    vivos.forEach((f, k) => (f.hidden = k !== id));
    if (!vivos.has(id)) {
      const f = document.createElement('iframe');
      f.src = 'ferramentas/' + it.arq; f.title = it.nome;
      f.setAttribute('allow', 'clipboard-read; clipboard-write; microphone; camera; fullscreen');
      f.addEventListener('load', () => { f.dataset.pronto = '1'; });
      quadro.appendChild(f); vivos.set(id, f);
    }
    quadro.hidden = false; document.body.style.overflow = 'hidden';
    if (id === 'aistudio' && ultimaSel.t && Date.now() - ultimaSel.q < 10 * 60000) { mandarAIStudio(ultimaSel.t, true); ultimaSel.t = ''; }
  }
  // 📤 25/11: texto selecionado no Jurídico vai para a caixa do chat do ⚡ AI Studio
  const ultimaSel = { t: '', q: 0 };
  document.addEventListener('selectionchange', () => { try { const t = String(window.getSelection() || '').trim(); if (t.length >= 15) { ultimaSel.t = t; ultimaSel.q = Date.now(); } } catch (e) {} });
  function mandarAIStudio(texto, jaAberto) {
    if (!jaAberto) abrir('aistudio');
    const f = vivos.get('aistudio'); if (!f || !texto) return;
    const enviar = () => { try { f.contentWindow.postMessage({ paraAIStudio: texto }, '*'); } catch (e) {} };
    if (f.dataset.pronto) enviar(); else f.addEventListener('load', () => { f.dataset.pronto = '1'; setTimeout(enviar, 600); }, { once: true });
  }
  J.ferramentas = { LISTA, abrir, mandarAIStudio };
  J.registrar({ aba: 'ferramentas', montar });
})(window.J);
