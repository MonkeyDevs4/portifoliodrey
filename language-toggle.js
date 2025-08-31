/* Language Toggle v2 – EN <-> PT-BR (drop-in, sem mexer no HTML)
   Autor: Andrey Gomes (andreygms04@gmail.com) | GitHub: https://github.com/MonkeyDevs4
   Como usar:
   - Arquivo na RAIZ do projeto.
   - Garanta <script src="language-toggle.js"></script> antes de </body>.
   - Botão flutuante "EN · PT-BR" aparece no canto inferior direito.
   - Sem data-i18n? Tudo bem. Este script traduz textos comuns automaticamente
     (case-insensitive) e também placeholders, titles, aria-labels, alt e value.
   - Para voltar ao EN, basta clicar de novo. O original é restaurado.
*/

(function () {
  "use strict";

  const STORAGE_KEY = "lang";
  const EXCLUDE_TAGS = new Set(["SCRIPT", "STYLE", "CODE", "PRE", "NOSCRIPT", "TEXTAREA"]);
  const TRANSLATABLE_ATTRS = ["placeholder", "title", "aria-label", "alt", "value"];
  const DEBUG = false; // mude p/ true para ver logs no console

  // Glossário: inglês (minúsculo) => português
  // (frases mais longas primeiro ajuda a casar expressões completas)
  const GLOSSARY_ENTRIES = [
    // Navegação / seções
    ["featured projects", "Projetos em Destaque"],
    ["personal portfolio", "Portfólio pessoal"],
    ["business landing page", "Landing page empresarial"],
    ["prototype store", "Loja protótipo"],
    ["about me", "Sobre Mim"],
    ["let’s talk", "Vamos Conversar"],
    ["let's talk", "Vamos Conversar"],
    ["all rights reserved.", "Todos os direitos reservados."],
    ["front-end developer", "Desenvolvedor Front-end"],
    ["back-end developer", "Desenvolvedor Back-end"],
    ["full-stack developer", "Desenvolvedor Full-Stack"],
    ["download cv", "Baixar CV"],
    ["download resume", "Baixar Currículo"],
    ["view project", "Ver projeto"],
    ["view more", "Ver mais"],
    ["learn more", "Saiba mais"],
    ["live demo", "Demo ao vivo"],
    ["source code", "Código-fonte"],
    ["hire me", "Contrate-me"],
    ["skills", "Habilidades"],
    ["services", "Serviços"],
    ["experience", "Experiência"],
    ["portfolio", "Portfólio"],
    ["resume", "Currículo"],
    ["blog", "Blog"],
    ["home", "Início"],
    ["about", "Sobre"],
    ["projects", "Projetos"],
    ["contact", "Contato"],

    // Formulários
    ["name", "Nome"],
    ["email", "E-mail"],
    ["message", "Mensagem"],
    ["subject", "Assunto"],
    ["submit", "Enviar"],
    ["send", "Enviar"],
    ["type your message", "Digite sua mensagem"],
    ["your name", "Seu nome"],
    ["your email", "Seu e-mail"],

    // Botões comuns / UI
    ["next", "Próximo"],
    ["previous", "Anterior"],
    ["close", "Fechar"],
    ["open", "Abrir"],
    ["download", "Baixar"],
    ["read more", "Leia mais"],

    // Hero genéricos (ajuste conforme seu conteúdo)
    ["hello, i'm andrey", "Olá, eu sou o Andrey"],
    ["hello, i'm", "Olá, eu sou"],
    ["hello, i’m", "Olá, eu sou"],
  ];

  // Monta mapa e ordem por tamanho (frases maiores primeiro)
  const GLOSSARY = new Map(GLOSSARY_ENTRIES);
  const ORDERED_KEYS = [...GLOSSARY.keys()].sort((a, b) => b.length - a.length);

  // Armazena originais para voltar ao EN sem recarregar
  const touchedTextNodes = new Set(); // Node -> já salvo
  const textOriginal = new WeakMap(); // Node -> string
  const attrOriginal = new WeakMap(); // Element -> { attr: original }

  // ===== estilos do botão =====
  const styles = `
  #lang-toggle {
    position: fixed; right: 16px; bottom: 16px;
    z-index: 9999; border: 0; border-radius: 999px;
    padding: 10px 14px; box-shadow: 0 6px 18px rgba(0,0,0,.18);
    font: 600 14px/1 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans';
    cursor: pointer; background: #0f172a; color: #fff; opacity: .95;
    transition: transform .15s ease, opacity .2s ease;
  }
  #lang-toggle:hover { transform: translateY(-1px); opacity: 1; }
  #lang-toggle:active { transform: translateY(0); }
  @media (prefers-color-scheme: light) {
    #lang-toggle { background: #111827; color:#fff; }
  }`;

  function log(...args) {
    if (DEBUG) console.log("[i18n]", ...args);
  }

  function injectStyles() {
    const tag = document.createElement("style");
    tag.textContent = styles;
    document.head.appendChild(tag);
  }

  function createButton() {
    const btn = document.createElement("button");
    btn.id = "lang-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Toggle language");
    document.body.appendChild(btn);
    return btn;
  }

  function getLang() {
    return localStorage.getItem(STORAGE_KEY) || "en";
  }
  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  }
  function updateButtonLabel(btn) {
    btn.textContent = getLang() === "en" ? "EN · PT-BR" : "PT-BR · EN";
  }

  // ===== util =====
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function applyGlossaryToString(str) {
    if (!str || !str.trim()) return str;
    let out = str;
    const lowerWhole = str.toLowerCase();
    let changed = false;

    // Troca por frases/termos conhecidos (case-insensitive, com bordas "soltas" para pegar pontuação)
    for (const key of ORDERED_KEYS) {
      if (!lowerWhole.includes(key)) continue;
      const pattern = new RegExp(`\\b${escapeRegex(key)}\\b`, "gi");
      if (pattern.test(out)) {
        out = out.replace(pattern, GLOSSARY.get(key));
        changed = true;
      }
    }
    return changed ? out : str;
  }

  function isEligible(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return false;
    const parent = node.parentElement;
    if (!parent || EXCLUDE_TAGS.has(parent.tagName)) return false;
    if (parent.closest("[data-no-i18n]")) return false;
    const text = node.nodeValue;
    return text && text.trim().length > 0;
  }

  function translateTextNodesToPT(root = document.body) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node, count = 0;
    while ((node = walker.nextNode())) {
      if (!isEligible(node)) continue;
      const original = node.nodeValue;
      if (!touchedTextNodes.has(node)) {
        textOriginal.set(node, original);
        touchedTextNodes.add(node);
      }
      const translated = applyGlossaryToString(original);
      if (translated !== original) {
        node.nodeValue = translated;
        count++;
      }
    }
    log("Text nodes translated:", count);
  }

  function translateAttrsToPT(root = document.body) {
    let count = 0;
    const all = root.querySelectorAll("*");
    all.forEach((el) => {
      if (EXCLUDE_TAGS.has(el.tagName) || el.closest("[data-no-i18n]")) return;
      let stored = attrOriginal.get(el);
      if (!stored) {
        stored = {};
        attrOriginal.set(el, stored);
      }
      TRANSLATABLE_ATTRS.forEach((attr) => {
        if (!el.hasAttribute(attr)) return;
        const val = el.getAttribute(attr);
        if (!val) return;
        if (!(attr in stored)) stored[attr] = val;
        const translated = applyGlossaryToString(val);
        if (translated !== val) {
          el.setAttribute(attr, translated);
          count++;
        }
      });
    });
    log("Attributes translated:", count);
  }

  function revertToEN() {
    // Reverte textos
    touchedTextNodes.forEach((node) => {
      const orig = textOriginal.get(node);
      if (typeof orig === "string") node.nodeValue = orig;
    });
    // Reverte atributos
    const all = document.querySelectorAll("*");
    all.forEach((el) => {
      const saved = attrOriginal.get(el);
      if (!saved) return;
      for (const [attr, val] of Object.entries(saved)) {
        el.setAttribute(attr, val);
      }
    });
  }

  // Observa novas mutações (ex.: itens carregados via JS) e traduz se já estiver em PT
  const observer = new MutationObserver((mutations) => {
    if (getLang() !== "pt") return;
    for (const m of mutations) {
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === Node.ELEMENT_NODE) {
            translateTextNodesToPT(n);
            translateAttrsToPT(n);
          } else if (n.nodeType === Node.TEXT_NODE) {
            // nó de texto adicionado diretamente
            if (isEligible(n)) {
              if (!touchedTextNodes.has(n)) textOriginal.set(n, n.nodeValue);
              n.nodeValue = applyGlossaryToString(n.nodeValue);
              touchedTextNodes.add(n);
            }
          }
        });
      } else if (m.type === "attributes") {
        if (TRANSLATABLE_ATTRS.includes(m.attributeName)) {
          const el = m.target;
          const saved = attrOriginal.get(el) || {};
          if (!(m.attributeName in saved)) saved[m.attributeName] = m.oldValue || el.getAttribute(m.attributeName);
          attrOriginal.set(el, saved);
          const val = el.getAttribute(m.attributeName);
          const translated = applyGlossaryToString(val);
          if (translated !== val) el.setAttribute(m.attributeName, translated);
        }
      }
    }
  });

  function startObserver() {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: TRANSLATABLE_ATTRS,
    });
  }

  function init() {
    injectStyles();
    const btn = createButton();

    // idioma inicial
    const initial = localStorage.getItem(STORAGE_KEY) || "en";
    setLang(initial);
    updateButtonLabel(btn);

    if (initial === "pt") {
      translateTextNodesToPT();
      translateAttrsToPT();
      startObserver();
    }

    btn.addEventListener("click", () => {
      const next = getLang() === "en" ? "pt" : "en";
      setLang(next);
      updateButtonLabel(btn);
      if (next === "pt") {
        translateTextNodesToPT();
        translateAttrsToPT();
        startObserver();
      } else {
        observer.disconnect();
        revertToEN();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
