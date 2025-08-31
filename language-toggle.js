/* Language Toggle – EN <-> PT-BR
   Autor: Andrey Gomes (andreygms04@gmail.com) | GitHub: https://github.com/MonkeyDevs4
   Coloque este arquivo na RAIZ do projeto e inclua <script src="language-toggle.js"></script> antes de </body>.
   Como funciona:
   1) O script injeta um botão flutuante “EN / PT-BR”.
   2) Ele procura elementos com [data-i18n], e troca o texto conforme o dicionário abaixo.
   3) Se você ainda não marcou nada com data-i18n, ele tenta traduzir por “texto exato” usando um fallback.
   4) Preferência fica salva em localStorage ("lang" = "en" | "pt").
   Dica: marque os textos importantes com data-i18n para ter 100% de controle (ex: <h1 data-i18n="hero_title">Hello, I'm Andrey</h1>).
*/

(function () {
  const STORAGE_KEY = "lang";
  const DEFAULT_LANG = localStorage.getItem(STORAGE_KEY) || "en"; // começa no idioma salvo

  // ====== DICIONÁRIO ======
  // Use chaves semânticas (recomendado) com data-i18n OU mapeie por texto exato em fallbackExact.
  const dict = {
    en: {
      // Chaves por data-i18n
      hero_title: "Hello, I'm Andrey",
      hero_sub: "Front-end Developer",
      cta_contact: "Contact",
      cta_download_cv: "Download CV",
      nav_home: "Home",
      nav_about: "About",
      nav_projects: "Projects",
      nav_contact: "Contact",
      section_about_title: "About Me",
      section_projects_title: "Featured Projects",
      section_contact_title: "Let’s Talk",
      footer_rights: "All rights reserved.",

      // Você pode continuar adicionando...
    },
    pt: {
      hero_title: "Olá, eu sou o Andrey",
      hero_sub: "Desenvolvedor Front-end",
      cta_contact: "Contato",
      cta_download_cv: "Baixar CV",
      nav_home: "Início",
      nav_about: "Sobre",
      nav_projects: "Projetos",
      nav_contact: "Contato",
      section_about_title: "Sobre Mim",
      section_projects_title: "Projetos em Destaque",
      section_contact_title: "Vamos Conversar",
      footer_rights: "Todos os direitos reservados.",
    },
  };

  // ====== FALLBACK POR TEXTO EXATO ======
  // Se você ainda NÃO marcou elementos com data-i18n, o script tenta traduzir por innerText exato.
  // Basta incluir pares EN->PT aqui:
  const fallbackExact = {
    "Hello, I'm Andrey": "Olá, eu sou o Andrey",
    "Front-end Developer": "Desenvolvedor Front-end",
    "Contact": "Contato",
    "Download CV": "Baixar CV",
    "Home": "Início",
    "About": "Sobre",
    "Projects": "Projetos",
    "Let’s Talk": "Vamos Conversar",
    "All rights reserved.": "Todos os direitos reservados.",
  };

  // ====== ESTILOS DO BOTÃO (injeção) ======
  const styles = `
  #lang-toggle {
    position: fixed; inset: auto 16px 16px auto;
    z-index: 9999; border: 0; border-radius: 999px;
    padding: 10px 14px; box-shadow: 0 6px 18px rgba(0,0,0,.18);
    font: 600 14px/1.1 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji';
    cursor: pointer; background: #0f172a; color: #fff; opacity: .92;
    transition: transform .15s ease, opacity .2s ease;
  }
  #lang-toggle:hover { transform: translateY(-1px); opacity: 1; }
  #lang-toggle:active { transform: translateY(0); }
  @media (prefers-color-scheme: light) {
    #lang-toggle { background: #111827; color:#fff; }
  }`;

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

  function currentLang() {
    return localStorage.getItem(STORAGE_KEY) || "en";
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
  }

  function updateButtonLabel(btn) {
    const lang = currentLang();
    btn.textContent = lang === "en" ? "EN · PT-BR" : "PT-BR · EN";
  }

  // Troca textos de elementos marcados com data-i18n
  function translateByKeys(lang) {
    const nodes = document.querySelectorAll("[data-i18n]");
    nodes.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const map = dict[lang] || {};
      if (map[key]) {
        if (el.placeholder !== undefined && el.tagName === "INPUT") {
          el.placeholder = map[key];
        } else {
          el.textContent = map[key];
        }
      }
    });
  }

  // Fallback: troca por texto exato para elementos SEM data-i18n (seguro e opcional)
  function translateByExact(lang) {
    if (lang !== "pt") return; // só precisa quando mudar para pt
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    const replacements = new Map(Object.entries(fallbackExact));
    const texts = [];
    let node;
    while ((node = walker.nextNode())) {
      const t = node.nodeValue.trim();
      if (!t) continue;
      if (replacements.has(t)) texts.push({ node, from: t, to: replacements.get(t) });
    }
    texts.forEach(({ node, to }) => {
      node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), to);
    });
  }

  function translate(lang) {
    translateByKeys(lang);
    translateByExact(lang);
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  }

  function init() {
    injectStyles();
    const btn = createButton();

    // idioma inicial
    setLang(DEFAULT_LANG);
    translate(DEFAULT_LANG);
    updateButtonLabel(btn);

    btn.addEventListener("click", () => {
      const next = currentLang() === "en" ? "pt" : "en";
      setLang(next);

      // Recarrega a página para restaurar textos originais antes de aplicar PT (garante consistência do fallback)
      // Obs: Se você já usa data-i18n em tudo, pode remover o reload para transição instantânea.
      if (next === "en") {
        location.reload();
      } else {
        translate(next);
        updateButtonLabel(btn);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
