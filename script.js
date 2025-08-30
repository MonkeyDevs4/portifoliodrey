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

// Revelar imagens dos cards ao clicar (mantém seu comportamento)
document.querySelectorAll('[data-sample]').forEach(card=>{
  const btn = card.querySelector('.reveal-btn');
  const img = card.querySelector('img');
  function reveal(){
    card.classList.add('revealed');
  }
  if(btn) btn.addEventListener('click', reveal);
  if(btn){
    btn.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        reveal();
      }
    });
  }
  if(img){
    img.addEventListener('click', reveal);
  }
});

// Fallback: delegação global para garantir o reveal
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.reveal-btn');
  const img = e.target.closest('[data-sample] .thumb img');
  if (!btn && !img) return;
  const card = e.target.closest('[data-sample]');
  if (card) card.classList.add('revealed');
});
