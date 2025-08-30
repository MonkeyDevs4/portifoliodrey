// ===== Header: sombra sutil ao rolar (igual ao seu) =====
const header = document.querySelector('header');
addEventListener('scroll', () => {
  header.style.boxShadow = (scrollY > 4) ? '0 6px 20px rgba(2,8,23,.06)' : 'none';
});

// ===== Reveal on scroll (igual ao seu) =====
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('show');
      io.unobserve(entry.target);
    }
  });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// ===== Copiar e-mail (igual ao seu) =====
const copyBtn = document.getElementById('copyBtn');
const emailText = document.getElementById('emailText');
if (copyBtn && emailText){
  copyBtn.addEventListener('click', async () => {
    try{
      await navigator.clipboard.writeText(emailText.textContent.trim());
      copyBtn.textContent = 'Copied!';
      setTimeout(()=>copyBtn.textContent='Copy email', 1500);
    }catch(e){
      alert('Copy failed. Email: ' + emailText.textContent.trim());
    }
  });
}

// ===== Utilidades =====
const DEMO_BY_TITLE = new Map([
  ['business landing page', 'https://nova-landing-demo.netlify.app'],
  ['personal portfolio',     'https://devfolio-demo-example.netlify.app'],
  ['store prototype',        'https://example-cafe-store.netlify.app'],
]);

const DEMO_BY_INDEX = [
  'https://nova-landing-demo.netlify.app',         // 1º card
  'https://devfolio-demo-example.netlify.app',     // 2º card
  'https://example-cafe-store.netlify.app',        // 3º card
];

function normalize(txt){
  return (txt || '').toString().trim().toLowerCase();
}

function getCardHref(card, index){
  // 1) se existir data-href no HTML, respeita
  if (card.dataset.href) return card.dataset.href;

  // 2) tenta pelo título (h3)
  const h3 = card.querySelector('h3');
  const byTitle = DEMO_BY_TITLE.get(normalize(h3 && h3.textContent));
  if (byTitle) return byTitle;

  // 3) fallback: pela ordem do grid (0,1,2)
  return DEMO_BY_INDEX[index] || null;
}

function revealCard(card){
  if (!card.classList.contains('revealed')) {
    card.classList.add('revealed');
    card.dataset.justRevealed = '1'; // evita abrir link no mesmo clique
  }
}

function openDemo(href){
  // tenta nova aba; se bloqueado, abre na mesma
  const win = window.open(href, '_blank', 'noopener');
  if (!win) window.location.href = href;
}

// ===== Cards: revelar no 1º clique, abrir link no 2º =====
const cards = Array.from(document.querySelectorAll('[data-sample]'));
cards.forEach((card, index) => {
  const btn = card.querySelector('.reveal-btn');
  const img = card.querySelector('img');
  const href = getCardHref(card, index);

  // Clique direto no botão ou na imagem => revela
  if (btn) {
    btn.addEventListener('click', () => revealCard(card));
    btn.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        revealCard(card);
      }
    });
  }
  if (img) {
    img.addEventListener('click', () => revealCard(card));
  }

  // Clique no card: se já revelado, abre o link
  card.addEventListener('click', (e) => {
    // se o clique veio do botão/figura e ainda não estava revelado, só revela
    if (e.target.closest('.reveal-btn') || e.target.closest('.thumb img')) {
      // revealCard já foi chamado nos listeners acima
      return;
    }

    // evita abrir no mesmo clique em que foi revelado
    if (card.dataset.justRevealed === '1') {
      delete card.dataset.justRevealed;
      return;
    }

    if (card.classList.contains('revealed') && href) {
      openDemo(href);
    } else {
      // se não estiver revelado ainda e o usuário clicar no corpo do card
      revealCard(card);
    }
  });
});

// ===== Fallback de delegação (redundante, só para robustez) =====
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.reveal-btn');
  const img = e.target.closest('[data-sample] .thumb img');
  if (!btn && !img) return;
  const card = e.target.closest('[data-sample]');
  if (card) revealCard(card);
});
