(function(){
  // mobile menu
  var nav=document.getElementById('nav'),mb=document.getElementById('menuBtn');
  mb.addEventListener('click',function(){var o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o)});
  nav.addEventListener('click',function(e){if(e.target.tagName==='A')nav.classList.remove('open')});

  // reveal on scroll
  var els=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.1});
    els.forEach(function(el){io.observe(el)});
  }else els.forEach(function(el){el.classList.add('in')});

  // lightbox: works per gallery, picks up any new <figure><img> automatically
  var lb=document.getElementById('lb'),lbImg=lb.querySelector('img'),count=lb.querySelector('.count');
  var group=[],idx=0,startX=null;
  function show(i){idx=(i+group.length)%group.length;lbImg.src=group[idx].currentSrc||group[idx].src;lbImg.alt=group[idx].alt;count.textContent=(idx+1)+' / '+group.length}
  function open(g,i){group=g;lb.classList.add('open');lb.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';show(i)}
  function close(){lb.classList.remove('open');lb.setAttribute('aria-hidden','true');document.body.style.overflow=''}
  document.querySelectorAll('.gallery').forEach(function(gal){
    gal.addEventListener('click',function(e){
      var fig=e.target.closest('figure');if(!fig)return;
      var imgs=Array.prototype.slice.call(gal.querySelectorAll('figure img'));
      open(imgs,imgs.indexOf(fig.querySelector('img')));
    });
  });
  lb.querySelector('.close').onclick=close;
  lb.querySelector('.prev').onclick=function(){show(idx+1)}; // RTL: right arrow = previous visually
  lb.querySelector('.next').onclick=function(){show(idx-1)};
  lb.addEventListener('click',function(e){if(e.target===lb)close()});
  document.addEventListener('keydown',function(e){
    if(!lb.classList.contains('open'))return;
    if(e.key==='Escape')close();
    if(e.key==='ArrowLeft')show(idx+1);
    if(e.key==='ArrowRight')show(idx-1);
  });
  lb.addEventListener('touchstart',function(e){startX=e.touches[0].clientX},{passive:true});
  lb.addEventListener('touchend',function(e){
    if(startX===null)return;var d=e.changedTouches[0].clientX-startX;startX=null;
    if(Math.abs(d)>50)show(d<0?idx+1:idx-1);
  });
})();
