/* =========================================================================
   AI Studio PC — pc-extras.js (23/11)
   O que o AI Code Studio ganhou na versão de computador:
   • ⏱ DESEMPENHO: cada resposta mostra quanto tempo levou e quantos tokens por segundo.
     O painel ⏱ compara as IAs (Ollama × Gemini × Monica…) pela média das últimas respostas.
   • 🗣 VOZ NATURAL GRÁTIS: Francisca, Francisco ou Antônio (a voz do Edge que o programa do PC já liga sozinho,
     em 127.0.0.1:7790). Se ela não responder, usa a voz do aparelho.
   • 🔤 FOTO EM TEXTO: a foto vira texto (OCR em português) e vai para a IA — para as que não enxergam imagem (Ollama…).
   • 🔡 ACENTOS CERTOS: arquivo em UTF-8, UTF-16 ou Windows-1252/Latin-1 é lido sem virar "�".
   • ⌨️ TERMINAL do computador (cmd do Windows) dentro do app, com "↩ Mandar para a IA".
   ========================================================================= */
(function () {
  'use strict';
  const $id = (i) => document.getElementById(i);
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lerPref = (k, d) => { try { const v = localStorage.getItem('pc:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
  const gravarPref = (k, v) => { try { localStorage.setItem('pc:' + k, JSON.stringify(v)); } catch (e) {} };
  const toast = (t, tipo) => { try { MODULE_UI.toast(t, tipo); } catch (e) { console.log(t); } };

  // ── 🔡 codificação dos arquivos ──
  function decodificar(u8) {
    u8 = u8 instanceof Uint8Array ? u8 : new Uint8Array(u8);
    if (u8[0] === 0xff && u8[1] === 0xfe) return new TextDecoder('utf-16le').decode(u8.subarray(2));
    if (u8[0] === 0xfe && u8[1] === 0xff) return new TextDecoder('utf-16be').decode(u8.subarray(2));
    const semBom = u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf ? u8.subarray(3) : u8;
    try { return new TextDecoder('utf-8', { fatal: true }).decode(semBom); }
    catch (e) { try { return new TextDecoder('windows-1252').decode(semBom); } catch (e2) { return new TextDecoder('latin1').decode(semBom); } }
  }

  // ── 🔤 foto em texto ──
  function fotoEmTexto() {
    const m = lerPref('fotoTexto', 'auto');
    if (m === 'sempre') return true; if (m === 'nunca') return false;
    try { return MODULE_Provider.current().provider === 'ollama'; } catch (e) { return false; }
  }
  let tesseractPronto = null;
  function carregarTesseract() {
    if (window.Tesseract) return Promise.resolve();
    if (!tesseractPronto) tesseractPronto = new Promise((ok, erro) => {
      const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
      s.onload = ok; s.onerror = () => { tesseractPronto = null; erro(new Error('não consegui baixar o leitor de texto (precisa de internet na 1ª vez)')); };
      document.head.appendChild(s);
    });
    return tesseractPronto;
  }
  async function ocr(file) {
    await carregarTesseract();
    const r = await window.Tesseract.recognize(file, 'por');
    return String((r && r.data && r.data.text) || '').replace(/\n{3,}/g, '\n\n').trim();
  }

  // ── ⏱ desempenho ──
  function registrar(provider, model, perf) {
    const l = lerPref('desempenho', []); l.push({ provider, model, ...perf, quando: Date.now() });
    gravarPref('desempenho', l.slice(-300));
  }
  function tabelaDesempenho() {
    const l = lerPref('desempenho', []); if (!l.length) return '<p style="opacity:.7">Ainda nenhuma resposta medida. Converse com uma IA e volte aqui.</p>';
    const g = {}; l.forEach((x) => { const k = x.provider + ' · ' + x.model; (g[k] = g[k] || []).push(x); });
    const linhas = Object.entries(g).map(([k, xs]) => { const ms = xs.reduce((t, x) => t + x.ms, 0) / xs.length, tps = xs.reduce((t, x) => t + x.tps, 0) / xs.length; return { k, n: xs.length, ms, tps }; }).sort((a, b) => b.tps - a.tps);
    const max = Math.max(...linhas.map((x) => x.tps), 1);
    return '<table style="width:100%;border-collapse:collapse;font-size:13px"><tr style="opacity:.7"><th style="text-align:left">IA · modelo</th><th>respostas</th><th>tempo médio</th><th style="text-align:left">tokens/s</th></tr>' +
      linhas.map((x) => '<tr style="border-top:1px solid var(--border)"><td style="padding:6px 4px">' + esc(x.k) + '</td><td style="text-align:center">' + x.n + '</td><td style="text-align:center">' + (x.ms / 1000).toFixed(1) + ' s</td><td><div style="display:flex;align-items:center;gap:6px"><div style="height:8px;border-radius:4px;background:var(--accent);width:' + Math.max(4, Math.round((x.tps / max) * 120)) + 'px"></div>' + x.tps.toFixed(1) + '</div></td></tr>').join('') + '</table>' +
      '<p style="opacity:.7;font-size:12px;margin-top:6px">tokens/s maior = escreve mais rápido. "Tempo médio" inclui esperar a IA começar. Quando a IA não informa os tokens, conto aproximado (4 letras ≈ 1 token).</p>';
  }

  // ── 🗣 voz natural (Francisca/Francisco/Antônio) ──
  const VOZES = [['', 'Voz do aparelho (a de antes)'], ['pt-BR-FranciscaNeural', 'Francisca (natural, grátis)'], ['pt-BR-FranciscoNeural', 'Francisco (natural, grátis)'], ['pt-BR-AntonioNeural', 'Antônio (natural, grátis)'], ['pt-BR-ThalitaNeural', 'Thalita (natural, grátis)']];
  const vozNatural = () => lerPref('vozNatural', 'pt-BR-FranciscaNeural');
  let tocando = null, idFala = 0;
  function limparTexto(t) { return String(t).replace(/```[\s\S]*?(```|$)/g, ' (tem um bloco de código na tela) ').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/https?:\/\/\S+/g, ' link ').replace(/[#*_>~|•]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function pedacos(t) { const out = []; let cur = ''; (t.match(/[^.!?;:\n]+[.!?;:]*\s*/g) || [t]).forEach((p) => { if ((cur + p).length > 1400) { if (cur.trim()) out.push(cur); cur = p; } else cur += p; }); if (cur.trim()) out.push(cur); return out; }
  async function falarNatural(texto, aoAcabar) {
    const id = ++idFala; const l = pedacos(limparTexto(texto));
    for (const p of l) {
      if (id !== idFala) return;
      const r = await fetch('http://127.0.0.1:7790/falar', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ texto: p, voz: vozNatural() }) });
      if (!r.ok) throw new Error('voz respondeu ' + r.status);
      const url = URL.createObjectURL(await r.blob());
      await new Promise((ok) => { tocando = new Audio(url); tocando.onended = ok; tocando.onerror = ok; tocando.play().catch(ok); });
      URL.revokeObjectURL(url);
    }
    if (id === idFala && aoAcabar) aoAcabar();
  }
  function ligarVoz() {
    if (typeof MODULE_Voice === 'undefined') return;
    const falar0 = MODULE_Voice.speak, parar0 = MODULE_Voice.stopSpeaking;
    MODULE_Voice.speak = function (texto, aoAcabar) {
      if (!vozNatural()) return falar0(texto, aoAcabar);
      parar0();
      falarNatural(texto, aoAcabar).catch(() => { toast('🗣 A voz natural não respondeu — usei a voz do aparelho.', 'warn'); falar0(texto, aoAcabar); });
    };
    MODULE_Voice.stopSpeaking = function () { idFala++; try { tocando && tocando.pause(); } catch (e) {} parar0(); };
  }

  // ── painel ⏱ ──
  function abrirPainel() {
    let w = $id('pcPainel'); if (w) { w.remove(); return; }
    w = document.createElement('div'); w.id = 'pcPainel';
    w.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.55);display:grid;place-items:center;padding:16px;overscroll-behavior:none';
    const ft = lerPref('fotoTexto', 'auto');
    w.innerHTML = '<div style="background:var(--bg2);color:var(--text);border:1px solid var(--border);border-radius:12px;padding:16px;max-width:640px;width:100%;max-height:90vh;overflow:auto">' +
      '<div style="display:flex;align-items:center;gap:8px"><h2 style="flex:1;font-size:17px">⏱ Desempenho · voz · foto</h2><button class="btn icon" id="pcFechar">✕</button></div>' +
      '<h3 style="font-size:14px;margin:12px 0 6px">⏱ Qual IA responde mais rápido</h3><div id="pcTabela">' + tabelaDesempenho() + '</div>' +
      '<div style="margin-top:6px"><button class="btn sm" id="pcZerar">Zerar as medições</button></div>' +
      '<h3 style="font-size:14px;margin:16px 0 6px">🗣 Voz que lê as respostas</h3><select id="pcVoz" style="width:100%">' + VOZES.map(([v, n]) => '<option value="' + v + '"' + (v === vozNatural() ? ' selected' : '') + '>' + n + '</option>').join('') + '</select>' +
      '<div style="margin-top:6px"><button class="btn sm" id="pcTestarVoz">🔊 Testar</button> <span style="opacity:.7;font-size:12px">As naturais são grátis e já vêm no programa do PC (precisam de internet).</span></div>' +
      '<h3 style="font-size:14px;margin:16px 0 6px">🔤 Foto em texto</h3><select id="pcFoto" style="width:100%"><option value="auto"' + (ft === 'auto' ? ' selected' : '') + '>Automático: só quando a IA é o Ollama</option><option value="sempre"' + (ft === 'sempre' ? ' selected' : '') + '>Sempre: toda foto vira texto</option><option value="nunca"' + (ft === 'nunca' ? ' selected' : '') + '>Nunca: manda a foto (para IA que enxerga)</option></select>' +
      '<p style="opacity:.7;font-size:12px;margin-top:6px">O texto é lido aqui no PC (em português) e vai na mensagem. A 1ª vez baixa o leitor (~10 MB).</p>' +
      '<h3 style="font-size:14px;margin:16px 0 6px">✂️ Tamanho de cada parte ("Em partes")</h3><input id="pcTamParte" type="number" min="1000" step="500" value="' + (+lerPref('tamParte', 6000) || 6000) + '" style="width:140px"> letras <span style="opacity:.7;font-size:12px">(Ollama pequeno: 4000–6000 · Gemini: 30000)</span>' +
      '<h3 style="font-size:14px;margin:16px 0 6px">🧩 Link fixo do Mini SK (PWA)</h3><div style="display:flex;gap:6px"><input id="pcMiniSK" style="flex:1" placeholder="https://… (o endereço do seu Mini SK)" value="' + esc(lerPref('linkMiniSK', '')) + '"><button class="btn sm" id="pcMiniSKok">Guardar</button></div><p style="opacity:.7;font-size:12px;margin-top:4px">O botão 🧩 no topo abre esse endereço.</p></div>';
    document.body.appendChild(w);
    $id('pcFechar').onclick = () => w.remove();
    w.addEventListener('click', (e) => { if (e.target === w) w.remove(); });
    $id('pcZerar').onclick = () => { gravarPref('desempenho', []); $id('pcTabela').innerHTML = tabelaDesempenho(); };
    $id('pcVoz').onchange = (e) => { gravarPref('vozNatural', e.target.value); toast('🗣 Voz trocada.', 'success'); };
    $id('pcTestarVoz').onclick = () => MODULE_Voice.speak('Olá! Esta é a voz do seu AI Studio no computador.');
    $id('pcTamParte').onchange = (e) => { gravarPref('tamParte', Math.max(1000, +e.target.value || 6000)); toast('✂️ Pronto.', 'success'); };
    $id('pcMiniSKok').onclick = () => { const v = $id('pcMiniSK').value.trim(); if (v && !/^https?:\/\//i.test(v)) return toast('O link tem que começar com https://', 'warn'); gravarPref('linkMiniSK', v); toast(v ? '🧩 Link guardado. Toque em 🧩 no topo para abrir.' : 'Link apagado.', 'success'); };
    $id('pcFoto').onchange = (e) => { gravarPref('fotoTexto', e.target.value); toast('🔤 Pronto.', 'success'); };
  }

  // ── ⌨️ terminal do computador ──
  let ws = null, saida = '';
  function abrirTerminal() {
    let w = $id('pcTerm'); if (w) { w.remove(); try { ws && ws.close(); } catch (e) {} ws = null; return; }
    const porta = window.miniskPC && window.miniskPC.portas && window.miniskPC.portas.terminal;
    w = document.createElement('div'); w.id = 'pcTerm';
    w.style.cssText = 'position:fixed;left:0;right:0;bottom:0;height:42vh;z-index:8000;background:#0b0f14;color:#d6e2f0;border-top:2px solid var(--accent);display:flex;flex-direction:column;overscroll-behavior:none';
    w.innerHTML = '<div style="display:flex;gap:6px;align-items:center;padding:6px 8px;background:#111821"><b style="flex:1">⌨️ Terminal do computador</b><button class="btn sm" id="ptIA">↩ Mandar para a IA</button><button class="btn sm" id="ptCtrlC">Ctrl+C</button><button class="btn sm" id="ptLimpar">Limpar</button><button class="btn icon" id="ptFechar">✕</button></div>' +
      '<pre id="ptSaida" style="flex:1;overflow:auto;margin:0;padding:8px;font:12px/1.45 Consolas,monospace;white-space:pre-wrap;word-break:break-word"></pre>' +
      '<div style="display:flex;gap:6px;padding:6px 8px;background:#111821"><input id="ptLinha" style="flex:1;font-family:Consolas,monospace" placeholder="Digite um comando (ex.: ollama list) e Enter" autocomplete="off"><button class="btn sm primary" id="ptRodar">▶</button></div>';
    document.body.appendChild(w);
    const out = $id('ptSaida');
    const escrever = (t) => {
      t = String(t).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '');
      for (const ch of t) { if (ch === '\b') saida = saida.slice(0, -1); else saida += ch; }
      if (saida.length > 200000) saida = saida.slice(-150000);
      out.textContent = saida; out.scrollTop = out.scrollHeight;
    };
    $id('ptFechar').onclick = abrirTerminal;
    $id('ptLimpar').onclick = () => { saida = ''; out.textContent = ''; };
    if (!porta) { escrever('O terminal só funciona no programa do PC (o .exe).\nAqui no navegador não dá para mexer no computador.\n'); return; }
    try { ws = new WebSocket('ws://127.0.0.1:' + porta + '/ws', ['tty']); } catch (e) { escrever('Não conectei: ' + e.message); return; }
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => ws.send(JSON.stringify({ columns: 120, rows: 30 }));
    ws.onmessage = (e) => { const u8 = new Uint8Array(e.data instanceof ArrayBuffer ? e.data : new TextEncoder().encode(e.data)); if (u8[0] === 48) escrever(new TextDecoder().decode(u8.subarray(1))); };
    ws.onclose = () => escrever('\n[terminal desligado]\n');
    const mandar = (t) => { if (ws && ws.readyState === 1) ws.send('0' + t); };
    const rodar = () => { const l = $id('ptLinha').value; $id('ptLinha').value = ''; mandar(l + '\r'); };
    $id('ptRodar').onclick = rodar;
    $id('ptLinha').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); rodar(); } });
    $id('ptCtrlC').onclick = () => mandar('\x03');
    $id('ptIA').onclick = () => {
      const fim = saida.slice(-8000).trim(); if (!fim) return toast('O terminal está vazio.', 'warn');
      const inp = $id('userInput'); inp.value += (inp.value ? '\n\n' : '') + 'Saída do terminal:\n```\n' + (window.Segredos ? Segredos.tampar(fim) : fim) + '\n```\n'; try { MODULE_UI.autoResize(inp); } catch (e) {}
      toast('↩ A saída foi para a caixa de mensagem.', 'success');
    };
    setTimeout(() => $id('ptLinha').focus(), 100);
  }


  // ── 🧰 24/11: FERRAMENTAS dentro do AI Studio (imagem, dividir/juntar, Markdown, leitor de backup, chat rápido) ──
  // O que sai delas vai DIRETO para a caixa do chat (➡) ou em PARTES (✂️), para não gastar tempo copiando e colando.
  const FERR = [['imagem', '🖼 Imagem', 'Medidor, preparador e conversor de imagem. Use "📤 Pegar texto" e depois ➡ Mandar para o chat.'],
    ['dividir-juntar', '✂️ Dividir/Juntar', 'Divide texto grande em pedaços e junta de volta.'],
    ['markdown', '📝 Markdown', 'Visualizador de Markdown (o .md que o Claude faz).'],
    ['leitor-backup', '📂 Leitor de backup', 'Lê backups (AI Studio, ChatGPT…). Para trazer as conversas para cá: ☰ → 📂 Importar backup.'],
    ['chat-rapido', '💬 Chat rápido', 'O chat antigo (Chat IA Pro): Gemini (AIza ou AQ.), Groq, OpenRouter, Monica…']];
  let ferrAtual = 'imagem';
  function mandarParaChat(texto) {
    const inp = $id('userInput'); if (!inp) return;
    texto = String(texto || '').trim(); if (!texto) return toast('Não achei texto para mandar.', 'warn');
    inp.value += (inp.value.trim() ? '\n\n' : '') + texto; try { MODULE_UI.autoResize(inp); } catch (e) {}
    inp.focus(); toast('➡ Foi para a caixa do chat (~' + Math.round(texto.length / 4) + ' tokens). Confira e toque em enviar.', 'success');
  }
  function pegarDaFerramenta() {
    const f = $id('pcFerrFrame'); let d; try { d = f.contentDocument; } catch (e) { d = null; }
    if (!d) return '';
    const mao = d.getElementById('mao'); if (mao && mao.value.trim()) return mao.value;
    const sel = String((f.contentWindow.getSelection && f.contentWindow.getSelection()) || ''); if (sel.trim()) return sel;
    const c = d.querySelectorAll('textarea,output,pre,#resultado,.resultado,#saida,.saida,#output,.output,#preview,.preview');
    for (let i = c.length - 1; i >= 0; i--) { const v = c[i].value != null && c[i].tagName !== 'OUTPUT' ? c[i].value : c[i].innerText; if (String(v || '').trim()) return v; }
    return '';
  }
  function partes(texto, tam) {
    const out = []; let cur = '';
    for (const bloco of String(texto).split(/(\n\s*\n)/)) {
      if ((cur + bloco).length > tam && cur.trim()) { out.push(cur); cur = ''; }
      if (bloco.length > tam) { for (let i = 0; i < bloco.length; i += tam) out.push(bloco.slice(i, i + tam)); }
      else cur += bloco;
    }
    if (cur.trim()) out.push(cur);
    return out;
  }
  let enviandoPartes = false;
  async function enviarEmPartes(texto) {
    texto = String(texto || '').trim(); if (!texto) return toast('Não achei texto para mandar.', 'warn');
    if (enviandoPartes) return toast('Já estou mandando em partes. Espere acabar (ou toque em ⏹).', 'warn');
    const tam = +lerPref('tamParte', 6000) || 6000; const l = partes(texto, tam);
    if (l.length === 1) return mandarParaChat(texto);
    enviandoPartes = true;
    try {
      for (let i = 0; i < l.length; i++) {
        const ult = i === l.length - 1;
        const msg = ult ? '[PARTE ' + (i + 1) + ' de ' + l.length + ' — ÚLTIMA]\n' + l[i] + '\n\n[Fim. Agora responda considerando TODAS as partes.]'
          : '[PARTE ' + (i + 1) + ' de ' + l.length + ']\n' + l[i] + '\n\n[Ainda não responda: diga só "recebi a parte ' + (i + 1) + '". Vou mandar o resto.]';
        toast('✂️ Mandando a parte ' + (i + 1) + ' de ' + l.length + '…');
        await MODULE_Chat.send(msg);
        const c = activeConv && activeConv(); const ultM = c && c.messages[c.messages.length - 1];
        if (!ultM || ultM.role === 'error') { toast('⏹ Parei na parte ' + (i + 1) + ': a IA deu erro (ou você parou). O resto não foi mandado.', 'warn'); break; }
      }
    } finally { enviandoPartes = false; }
  }
  function abrirFerramentas() {
    let w = $id('pcFerr'); if (w) { w.remove(); return; }
    w = document.createElement('div'); w.id = 'pcFerr';
    w.style.cssText = 'position:fixed;top:0;right:0;bottom:0;width:min(720px,100vw);z-index:7900;background:var(--bg2);border-left:2px solid var(--accent);display:flex;flex-direction:column;overscroll-behavior:none;box-shadow:-6px 0 20px rgba(0,0,0,.35)';
    w.innerHTML = '<div style="display:flex;gap:6px;align-items:center;padding:8px;flex-wrap:wrap;border-bottom:1px solid var(--border)"><b style="flex:1">🧰 Ferramentas</b><button class="btn sm primary" id="pfMandar" title="Manda o que a ferramenta produziu (a Mão, o texto selecionado ou o resultado) para a caixa do chat">➡ Mandar para o chat</button><button class="btn sm" id="pfPartes" title="Texto grande: manda em partes, uma de cada vez">✂️ Em partes</button><button class="btn sm" id="pfTrazer" title="Coloca a última resposta da IA dentro da ferramenta">📥 Última resposta</button><button class="btn icon" id="pfFechar">✕</button></div>' +
      '<div style="display:flex;gap:4px;padding:6px 8px;overflow-x:auto;border-bottom:1px solid var(--border)">' + FERR.map(([id, nome]) => '<button class="btn sm" data-ferr="' + id + '">' + nome + '</button>').join('') + '</div>' +
      '<div id="pfDica" style="padding:4px 10px;font-size:12px;opacity:.75"></div><iframe id="pcFerrFrame" style="flex:1;width:100%;border:0;background:#fff"></iframe>';
    document.body.appendChild(w);
    const abrir = (id) => { ferrAtual = id; gravarPref('ferrAtual', id); $id('pcFerrFrame').src = 'ferramentas/' + id + '.html'; $id('pfDica').textContent = (FERR.find((x) => x[0] === id) || [])[2] || ''; w.querySelectorAll('[data-ferr]').forEach((b) => b.classList.toggle('primary', b.dataset.ferr === id)); };
    w.addEventListener('click', (e) => { const b = e.target.closest('[data-ferr]'); if (b) abrir(b.dataset.ferr); });
    $id('pfFechar').onclick = abrirFerramentas;
    $id('pfMandar').onclick = () => mandarParaChat(pegarDaFerramenta());
    $id('pfPartes').onclick = () => enviarEmPartes(pegarDaFerramenta());
    $id('pfTrazer').onclick = () => {
      const c = activeConv && activeConv(); const m = c && [...c.messages].reverse().find((x) => x.role === 'assistant'); if (!m) return toast('Ainda não tem resposta da IA.', 'warn');
      let d; try { d = $id('pcFerrFrame').contentDocument; } catch (e) { d = null; } if (!d) return;
      const alvo = d.getElementById('mao') || d.querySelector('textarea'); if (!alvo) return toast('Essa ferramenta não tem campo de texto.', 'warn');
      alvo.value = m.content; alvo.dispatchEvent(new Event('input', { bubbles: true })); toast('📥 A última resposta foi para a ferramenta.', 'success');
    };
    abrir(lerPref('ferrAtual', 'imagem'));
  }

  // ── 🧩 24/11: link FIXO do Mini SK (versão PWA) — muda em ⏱ ──
  function abrirMiniSK() {
    const l = String(lerPref('linkMiniSK', '') || '').trim();
    if (!l) { abrirPainel(); setTimeout(() => { const i = $id('pcMiniSK'); if (i) i.focus(); toast('🧩 Cole o link do seu Mini SK (PWA) aqui e toque em Guardar.'); }, 200); return; }
    window.open(l, '_blank');
  }

  // ── 📂 24/11: IMPORTAR BACKUP de outros formatos, ficando igual ao chat (Meu Chat, ChatGPT, Chat rápido, lista de mensagens) ──
  function convDe(titulo, msgs, quando) {
    const id = 'imp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return { id, title: String(titulo || 'Conversa importada').slice(0, 80), messages: msgs.filter((m) => m.content), summary: '', createdAt: quando || Date.now(), updatedAt: quando || Date.now() };
  }
  function converterBackup(d) {
    const out = [];
    if (d && d.app === 'meu-chat' && Array.isArray(d.conversas)) {
      d.conversas.forEach((c) => out.push(convDe(c.titulo, (c.msgs || []).map((m) => ({ role: m.papel === 'eu' ? 'user' : 'assistant', content: window.Segredos ? Segredos.tampar(m.texto || '') : (m.texto || ''), ts: m.quando || Date.now() })), c.criado)));
      return { convs: out, memoria: d.memoria || '', formato: 'Meu Chat' };
    }
    if (Array.isArray(d) && d[0] && d[0].mapping) {
      d.forEach((c) => { const nos = Object.values(c.mapping || {}).filter((n) => n.message && n.message.content && (n.message.content.parts || []).some((x) => typeof x === 'string' && x.trim())).sort((a, b) => (a.message.create_time || 0) - (b.message.create_time || 0));
        out.push(convDe(c.title, nos.filter((n) => ['user', 'assistant'].includes(n.message.author && n.message.author.role)).map((n) => ({ role: n.message.author.role, content: n.message.content.parts.filter((x) => typeof x === 'string').join('\n'), ts: (n.message.create_time || 0) * 1000 || Date.now() })), (c.create_time || 0) * 1000)); });
      return { convs: out, formato: 'ChatGPT' };
    }
    const lista = Array.isArray(d) ? d : d && Array.isArray(d.messages) ? d.messages : null;
    if (lista && lista[0] && lista[0].role && 'content' in lista[0]) {
      out.push(convDe(d.title || 'Conversa importada', lista.filter((m) => m.role !== 'system').map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content), ts: Date.now() }))));
      return { convs: out, formato: d.title ? 'Chat rápido' : 'Lista de mensagens' };
    }
    if (d && Array.isArray(d.conversations)) { d.conversations.forEach((c) => out.push(convDe(c.title || c.titulo, (c.messages || c.msgs || []).map((m) => ({ role: (m.role || m.papel) === 'user' || m.papel === 'eu' ? 'user' : 'assistant', content: m.content || m.texto || '', ts: Date.now() }))))); return { convs: out, formato: 'Lista de conversas' }; }
    return null;
  }
  function ligarImportacao() {
    if (typeof MODULE_Storage === 'undefined') return;
    const original = MODULE_Storage.handleImport;
    MODULE_Storage.handleImport = function (e) {
      const file = e.target.files[0]; if (!file) return;
      file.text().then((t) => {
        let d; try { d = JSON.parse(t); } catch (er) { return toast('❌ Esse arquivo não é um backup (.json).', 'error'); }
        if (d && d.conversations && !Array.isArray(d.conversations)) return original({ target: { files: [file], set value(v) {} } }); // backup do próprio AI Studio
        const r = converterBackup(d);
        if (!r || !r.convs.length) return toast('❌ Não reconheci esse backup.', 'error');
        r.convs.forEach((c) => { STATE.conversations[c.id] = c; });
        if (r.memoria && typeof MODULE_Brain !== 'undefined' && MODULE_Brain.mergeMemories) { try { MODULE_Brain.mergeMemories([{ id: 'meuchat_memoria', title: 'Memória do Meu Chat', content: r.memoria }]); } catch (er) {} }
        MODULE_Storage.save(); try { refreshAll(); } catch (er) { MODULE_Chat.renderConversations(); }
        toast('✅ ' + r.convs.length + ' conversa(s) do ' + r.formato + ' importadas. Estão na lista ☰.', 'success');
      });
      e.target.value = '';
    };
  }

  // 📥 25/11: o SK Jurídico (ou outra página que abriu o AI Studio) pode mandar texto direto para a caixa do chat
  window.addEventListener('message', (e) => { const d = e.data; if (d && typeof d.paraAIStudio === 'string' && d.paraAIStudio.trim()) mandarParaChat(d.paraAIStudio); });
  window.PC_EXTRAS = { decodificar, fotoEmTexto, ocr, registrar, abrirPainel, abrirTerminal, falarNatural, abrirFerramentas, mandarParaChat, enviarEmPartes, partes, abrirMiniSK, converterBackup };
  ligarImportacao();
  ligarVoz();
  // 🦙 no programa do PC: se a IA escolhida é o Ollama, liga ele escondido (sem janela preta)
  setTimeout(() => { try { if (window.miniskPC && window.miniskPC.ligarOllama && MODULE_Provider.current().provider === 'ollama') window.miniskPC.ligarOllama().then((r) => r && r !== 'já estava ligado' && toast('🦙 Ollama: ' + r)); } catch (e) {} }, 1500);
  // 23/11: sem "esticar igual chiclete"
  const st = document.createElement('style'); st.textContent = 'html,body,*{overscroll-behavior:none}'; document.head.appendChild(st);
})();
