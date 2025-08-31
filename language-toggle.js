/* language-toggle.js — EN ⇄ PT-BR (v4.4, botão fixo no canto INFERIOR ESQUERDO)
   Autor: Andrey Gomes (andreygms04@gmail.com) | GitHub: https://github.com/MonkeyDevs4
   Mantém o botão PT-BR ⇄ EN, traduz todo o conteúdo/atributos/HEAD.
*/
(function () {
  "use strict";

  const STORAGE_KEY = "lang"; // "en" | "pt"
  const TRANSLATABLE_ATTRS = ["alt", "title", "aria-label", "placeholder", "value"];
  const EXCLUDE_TAGS = new Set(["SCRIPT", "STYLE", "CODE", "PRE", "NOSCRIPT", "TEXTAREA"]);
  const STYLE_ID = "lang-toggle-style";

  // ===== Mapeamentos (minúsculas) — textos do seu index.html =====
  const TEXT_EN_TO_PT = new Map([
    // Nav
    ["services", "Serviços"],
    ["portfolio", "Portfólio"],
    ["about", "Sobre"],
    ["contact", "Contato"],

    // Hero
    ["web developer", "Desenvolvedor Web"],
    ["i build modern, responsive and professional websites.", "Eu crio sites modernos, responsivos e profissionais."],
    ["from minimal and elegant to bold and colorful — i craft websites that match your brand, loading fast and working perfectly on any device.",
     "Do minimalista e elegante ao ousado e colorido — eu desenvolvo sites que combinam com a sua marca, carregam rápido e funcionam perfeitamente em qualquer dispositivo."],
    ["email me", "Me envie um e-mail"],
    ["view upwork profile", "Ver perfil no Upwork"],

    // Services
    ["services", "Serviços"],
    ["everything you need to launch a clean, modern and effective website.",
     "Tudo que você precisa para lançar um site limpo, moderno e eficaz."],
    ["responsive websites", "Sites Responsivos"],
    ["pixel-perfect layouts that adapt to phones, tablets and desktops.",
     "Layouts pixel-perfect que se adaptam a celulares, tablets e desktops."],
    ["landing pages", "Páginas de Conversão"],
    ["high-converting pages for campaigns, events and product launches.",
     "Páginas de alta conversão para campanhas, eventos e lançamentos de produtos."],
    ["portfolio & business sites", "Sites de Portfólio & Empresas"],
    ["clean and professional pages to present your work or company.",
     "Páginas limpas e profissionais para apresentar seu trabalho ou empresa."],
    ["e-commerce (light)", "E-commerce (leve)"],
    ["product pages, carts and checkout integrations when needed.",
     "Páginas de produto, carrinho e integrações de checkout quando necessário."],
    ["forms & email", "Formulários & E-mail"],
    ["contact forms, email capture and basic automations.",
     "Formulários de contato, captura de e-mails e automações básicas."],
    ["seo & performance", "SEO & Desempenho"],
    ["on-page seo, speed optimization and best practices.",
     "SEO on-page, otimização de velocidade e boas práticas."],

    // Portfolio
    ["portfolio samples", "Exemplos de Portfólio"],
    ["a few examples and prototypes. final client projects are added upon delivery.",
     "Alguns exemplos e protótipos. Projetos finais de clientes são adicionados após a entrega."],
    ["business landing page", "Landing Page Empresarial"],
    ["clean hero, benefits, testimonials and contact cta.",
     "Hero limpo, benefícios, depoimentos e CTA de contato."],
    ["personal portfolio", "Portfólio Pessoal"],
    ["sections for work, bio and contact — polished and fast.",
     "Seções para trabalhos, bio e contato — polido e rápido."],
    ["store prototype", "Protótipo de Loja"],
    ["product grid, detail page and cart flow for demos.",
     "Grade de produtos, página de detalhes e fluxo de carrinho para demonstrações."],
    ["click to reveal", "Clique para revelar"],

    // Tags do About
    ["responsive design", "Design Responsivo"],
    ["seo basics", "Noções de SEO"],
    ["performance", "Desempenho"],

    // Contact
    ["contact", "Contato"],
    ["let’s build something great together.", "Vamos construir algo incrível juntos."],
    ["let's build something great together.", "Vamos construir algo incrível juntos."],
    ["prefer email? it’s the fastest way to reach me.", "Prefere e-mail? É a forma mais rápida de falar comigo."],
    ["copy email", "Copiar e-mail"],
    ["write now", "Escrever agora"],
    ["also available on", "Também disponível em"],

    // Botão flutuante de contato
    ["email me", "Me envie um e-mail"],
  ]);

  const ATTR_EN_TO_PT = new Map([
    ["business landing page preview", "Prévia de Landing Page Empresarial"],
    ["personal portfolio preview", "Prévia de Portfólio Pessoal"],
    ["store prototype preview", "Prévia de Protótipo de Loja"],
    ["reveal image", "Revelar imagem"],
    ["open live demo", "Abrir demo ao vivo"],
  ]);

  // Head
  const HEAD_TRANSLATIONS = {
    title_en: "Andrey Gomes — Web Developer",
    title_pt: "Andrey Gomes — Desenvolvedor Web",
    desc_en: "Modern, responsive and professional websites by Andrey Gomes.",
    desc_pt: "Sites modernos, responsivos e profissionais por Andrey Gomes.",
  };

  // ===== Infra =====
  const textOriginal = new WeakMap();        // Node(TEXT) -> string
  const attrOriginal = new WeakMap();        // Element -> {attr: string}
  const elementOriginalHTML = new WeakMap(); // Element -> innerHTML (casos especiais)
  const touchedTextNodes = new Set();

  // Helpers
  const lc = (s) => (s ?? "").toString().trim().toLowerCase();
  const normalize = (s) => lc(s).replace(/\s+/g, " ").replace(/[’']/g, "'");

  function isTextNodeEligible(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return false;
    const parent = node.parentElement;
    if (!parent || EXCLUDE_TAGS.has(parent.tagName)) return false;
    if (parent.closest("[data-no-i18n]")) return false;
    const t = node.nodeValue;
    return t && t.trim().length > 0;
  }

  function TreeWalker(root, whatToShow) {
    if (document.createTreeWalker) return document.createTreeWalker(root, whatToShow, null);
    // Polyfill simples (fallback)
    const texts = [];
    (function collect(n){ if (n.nodeType === 3) texts.push(n); if (n.childNodes) Array.from(n.childNodes).forEach(collect); })(root);
    let i = -1;
    return { nextNode(){ i++; return texts[i] || null; } };
  }

  function translateTextNodesToPT(root = document.body) {
    const walker = new TreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!isTextNodeEligible(node)) continue;
      const original = node.nodeValue;
      const key = lc(original);
      if (!touchedTextNodes.has(node)) {
        textOriginal.set(node, original);
        touchedTextNodes.add(node);
      }
      if (TEXT_EN_TO_PT.has(key)) node.nodeValue = TEXT_EN_TO_PT.get(key);
    }
  }

  function translateAttrsToPT(root = document.body) {
    const all = root.querySelectorAll("*");
    all.forEach((el) => {
      if (EXCLUDE_TAGS.has(el.tagName) || el.closest("[data-no-i18n]")) return;
      let saved = attrOriginal.get(el);
      if (!saved) { saved = {}; attrOriginal.set(el, saved); }
      TRANSLATABLE_ATTRS.forEach((attr) => {
        if (!el.hasAttribute(attr)) return;
        const val = el.getAttribute(attr); if (!val) return;
        const key = lc(val);
        if (!(attr in saved)) saved[attr] = val;
        if (ATTR_EN_TO_PT.has(key)) el.setAttribute(attr, ATTR_EN_TO_PT.get(key));
      });
    });
  }

  // ===== Caso especial: parágrafo do "Sobre" com <strong> =====
  function translateAboutParagraphPT() {
    const p = document.querySelector("#about .card p");
    if (!p) return;
    if (!elementOriginalHTML.has(p)) elementOriginalHTML.set(p, p.innerHTML);

    const name = (p.querySelector("strong")?.textContent || "Andrey Gomes").trim();
    const txt = normalize(p.textContent);
    const hasIntro = txt.includes("hi! i'm");
    const hasFocus = txt.includes("web developer focused on fast, accessible and responsive experiences");
    const hasProud = txt.includes("you'll be proud to share");

    if (hasIntro && hasFocus && hasProud) {
      p.innerHTML =
        `Olá! Eu sou <strong>${name}</strong>, ` +
        `desenvolvedor web focado em experiências rápidas, acessíveis e responsivas. ` +
        `Entendo seus objetivos, desenho uma estrutura limpa e entrego um site ` +
        `do qual você terá orgulho de compartilhar.`;
    }
  }

  function revertSpecialCases() {
    const p = document.querySelector("#about .card p");
    if (!p) return;
    const orig = elementOriginalHTML.get(p);
    if (orig) p.innerHTML = orig;
  }

  function revertToEN() {
    revertSpecialCases();
    touchedTextNodes.forEach((node) => {
      const orig = textOriginal.get(node);
      if (typeof orig === "string") node.nodeValue = orig;
    });
    document.querySelectorAll("*").forEach((el) => {
      const saved = attrOriginal.get(el);
      if (!saved) return;
      for (const [attr, val] of Object.entries(saved)) el.setAttribute(attr, val);
    });
  }

  // Head
  function applyHead(lang) {
    if (lang === "pt") {
      document.title = HEAD_TRANSLATIONS.title_pt;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", HEAD_TRANSLATIONS.desc_pt);
      document.documentElement.lang = "pt-BR";
    } else {
      document.title = HEAD_TRANSLATIONS.title_en;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", HEAD_TRANSLATIONS.desc_en);
      document.documentElement.lang = "en";
    }
  }

  // Observer (dinâmico)
  const observer = new MutationObserver((muts) => {
    if (getLang() !== "pt") return;
    for (const m of muts) {
      if (m.type === "childList") {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1) {
            translateTextNodesToPT(n);
            translateAttrsToPT(n);
            translateAboutParagraphPT();
          } else if (n.nodeType === 3 && isTextNodeEligible(n)) {
            if (!touchedTextNodes.has(n)) textOriginal.set(n, n.nodeValue);
            const key = lc(n.nodeValue);
            if (TEXT_EN_TO_PT.has(key)) n.nodeValue = TEXT_EN_TO_PT.get(key);
            touchedTextNodes.add(n);
          }
        });
      } else if (m.type === "attributes" && TRANSLATABLE_ATTRS.includes(m.attributeName)) {
        const el = m.target;
        const saved = attrOriginal.get(el) || {};
        if (!(m.attributeName in saved)) saved[m.attributeName] = m.oldValue || el.getAttribute(m.attributeName);
        attrOriginal.set(el, saved);
        const val = el.getAttribute(m.attributeName);
        const key = lc(val);
        if (ATTR_EN_TO_PT.has(key)) el.setAttribute(m.attributeName, ATTR_EN_TO_PT.get(key));
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

  // ==== UI do botão (forçando ESQUERDA) ====
  function injectStyles() {
    // Remove estilo antigo se existir
    const old = document.getElementById(STYLE_ID);
    if (old) old.remove();

    const css = `
      #lang-toggle{
        position:fixed;
        left: max(16px, env(safe-area-inset-left)) !important;
        right: auto !important;
        bottom: calc(16px + env(safe-area-inset-bottom));
        z-index:9999;
        border:0;border-radius:999px;padding:10px 14px;
        box-shadow:0 6px 18px rgba(0,0,0,.18);
        font:600 14px/1 system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial;
        cursor:pointer;background:#0f172a;color:#fff;opacity:.95;
        transition:transform .15s ease,opacity .2s ease
      }
      #lang-toggle:hover{transform:translateY(-1px);opacity:1}
      #lang-toggle:active{transform:translateY(0)}
      @media (prefers-color-scheme: light){#lang-toggle{background:#111827;color:#fff}}
    `;
    const tag = document.createElement("style");
    tag.id = STYLE_ID;
    tag.textContent = css;
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
  const getLang = () => localStorage.getItem(STORAGE_KEY) || "en";
  const setLang = (v) => localStorage.setItem(STORAGE_KEY, v);
  const updateBtn = (btn) => btn.textContent = getLang()==="pt" ? "PT-BR · EN" : "EN · PT-BR";

  // ==== Init ====
  function init(){
    injectStyles();
    const btn = createButton();
    updateBtn(btn);

    if(getLang()==="pt"){
      translateTextNodesToPT();
      translateAttrsToPT();
      translateAboutParagraphPT();
      applyHead("pt");
      startObserver();
    } else {
      applyHead("en");
    }

    btn.addEventListener("click", ()=>{
      const next = getLang()==="en" ? "pt" : "en";
      setLang(next); updateBtn(btn);
      if(next==="pt"){
        translateTextNodesToPT();
        translateAttrsToPT();
        translateAboutParagraphPT();
        applyHead("pt");
        startObserver();
      } else {
        observer.disconnect();
        revertToEN();
        applyHead("en");
      }
    });
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
