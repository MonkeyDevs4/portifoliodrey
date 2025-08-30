// Header sombra sutil ao rolar
const header = document.querySelector('header');
addEventListener('scroll', () => {
  header.style.boxShadow = (scrollY > 4) ? '0 6px 20px rgba(2,8,23,.06)' : 'none';
});

// Reveal on scroll (seções)
const io = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('show');
      io.unobserve(entry.target);
    }
  })
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// Botão de copiar e-mail
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

// Função util: marcar como revelado e evitar abrir link no mesmo clique
function markRevealed(card){
  if (!card.classList.contains('revealed')) {
    card.classList.add('revealed');
    card.dataset.justRevealed = '1'; // flag para este clique
  }
}

// Revelar imagens dos cards ao clicar
document.querySelectorAll('[data-sample]').forEach(card=>{
  const btn = card.querySelector('.reveal-btn');
  const img = card.querySelector('img');

  if (btn) {
    btn.addEventListener('click', () => markRevealed(card));
    btn.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        markRevealed(card);
      }
    });
  }
  if (img) {
    img.addEventListener('click', () => markRevealed(card));
  }

  // Após revelado, clicar no card abre o link (em nova aba)
  card.addEventListener('click', (e) => {
    const href = card.dataset.href;
    if (!href) return;

    // se acabou de revelar neste mesmo clique, não abre ainda
    if (card.dataset.justRevealed === '1') {
      delete card.dataset.justRevealed;
      return;
    }

    if (card.classList.contains('revealed')) {
      window.open(href, '_blank', 'noopener');
    }
  });
});

// Fallback: delegação global (caso listeners locais falhem)
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.reveal-btn');
  const img = e.target.closest('[data-sample] .thumb img');
  if (!btn && !img) return;
  const card = e.target.closest('[data-sample]');
  if (card) markRevealed(card);
});
