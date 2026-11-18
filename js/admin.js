/* Content loader (everyone) + Admin panel (PIN + GitHub token) */
(function(){
  var CFG={owner:'abdallahkk44',repo:'abdallah_moblyat',branch:'main',
    pinHash:'ce87b91d358fb923c8cffd62745f6171af4a6d07ba8f4b429e5d4d17271314cc'};
  var SECTIONS={bedrooms:'ژووری نوستن',wardrobes:'تەقەم و دولاب',decor:'دیکۆری دیوار',kitchens:'چێشتخانە'};
  var content={texts:{},galleries:{}},pendingDelete=[];

  /* ---------- render ---------- */
  function applyTexts(){
    Object.keys(content.texts||{}).forEach(function(k){
      var el=document.querySelector('[data-key="'+k+'"]');if(el&&content.texts[k])el.textContent=content.texts[k];
    });
  }
  function renderGallery(k){
    var box=document.getElementById('gal-'+k),list=(content.galleries||{})[k];
    if(!box||!list)return;
    box.innerHTML='';
    list.forEach(function(it){
      var f=document.createElement('figure'),i=document.createElement('img');
      i.src=it._data||it.src;i.alt=it.alt||it.caption||'';i.loading='lazy';f.appendChild(i);
      if(it.caption){var c=document.createElement('figcaption');c.textContent=it.caption;f.appendChild(c)}
      box.appendChild(f);
    });
    box.classList.toggle('single',list.length===1);
  }
  function renderAll(){applyTexts();Object.keys(SECTIONS).forEach(renderGallery)}
  fetch('data/content.json?v='+Date.now()).then(function(r){return r.ok?r.json():null}).then(function(j){
    if(j){content=j;content.texts=content.texts||{};content.galleries=content.galleries||{};renderAll()}
  }).catch(function(){});

  /* ---------- helpers ---------- */
  function sha256(s){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)).then(function(b){
    return Array.prototype.map.call(new Uint8Array(b),function(x){return('0'+x.toString(16)).slice(-2)}).join('')})}
  function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
  function getToken(){try{return localStorage.getItem('ghToken')||''}catch(e){return''}}
  function setToken(t){try{t?localStorage.setItem('ghToken',t):localStorage.removeItem('ghToken')}catch(e){}}

  function api(path,opt){
    opt=opt||{};
    return fetch('https://api.github.com/repos/'+CFG.owner+'/'+CFG.repo+'/contents/'+path+(opt.method&&opt.method!=='GET'?'':'?ref='+CFG.branch+'&t='+Date.now()),{
      method:opt.method||'GET',
      headers:{'Authorization':'Bearer '+getToken(),'Accept':'application/vnd.github+json','Content-Type':'application/json'},
      body:opt.body?JSON.stringify(opt.body):undefined
    }).then(function(r){
      if(r.status===401||r.status===403){setToken('');throw new Error('تۆکێن هەڵەیە یان مۆڵەتی نییە')}
      if(r.status===404&&!opt.method)return null;
      if(!r.ok)return r.json().then(function(j){throw new Error(j.message||r.status)});
      return r.json();
    });
  }
  function putFile(path,b64,msg){
    return api(path).then(function(cur){
      return api(path,{method:'PUT',body:{message:msg,content:b64,branch:CFG.branch,sha:cur?cur.sha:undefined}});
    });
  }
  function delFile(path){
    return api(path).then(function(cur){
      if(!cur)return;return api(path,{method:'DELETE',body:{message:'Delete '+path,sha:cur.sha,branch:CFG.branch}});
    });
  }
  function toB64(str){return btoa(unescape(encodeURIComponent(str)))}
  function resize(file){
    return new Promise(function(res,rej){
      var img=new Image(),u=URL.createObjectURL(file);
      img.onload=function(){
        var w=Math.min(1400,img.width),h=Math.round(img.height*w/img.width),c=document.createElement('canvas');
        c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);URL.revokeObjectURL(u);
        res(c.toDataURL('image/webp',.85));
      };
      img.onerror=function(){rej(new Error('وێنەکە نەکرایەوە'))};img.src=u;
    });
  }

  /* ---------- UI ---------- */
  var overlay;
  function close(){if(overlay){overlay.remove();overlay=null}document.body.style.overflow=''}
  function open(){
    close();overlay=el('div','ad-ov');document.body.appendChild(overlay);document.body.style.overflow='hidden';return overlay;
  }
  function askPin(){
    var o=open(),b=el('div','ad-box');
    b.innerHTML='<h3>ئەدمین</h3><p>کۆدی ئەدمین بنووسە</p><input type="password" inputmode="numeric" id="adPin" autocomplete="off"><div class="ad-err" id="adErr"></div><div class="ad-row"><button class="ad-btn gold" id="adOk">چوونەژوورەوە</button><button class="ad-btn" id="adX">داخستن</button></div>';
    o.appendChild(b);var inp=b.querySelector('#adPin');inp.focus();
    function go(){sha256(inp.value.trim()).then(function(h){
      if(h===CFG.pinHash)getToken()?panel():askToken();else b.querySelector('#adErr').textContent='کۆدەکە هەڵەیە';
    })}
    b.querySelector('#adOk').onclick=go;b.querySelector('#adX').onclick=close;
    inp.addEventListener('keydown',function(e){if(e.key==='Enter')go()});
  }
  function askToken(){
    var o=open(),b=el('div','ad-box');
    b.innerHTML='<h3>بەستنەوە بە GitHub</h3><p>یەکجار تۆکێنی GitHub بنووسە (Fine-grained token) کە مۆڵەتی <b>Contents: Read and write</b> بۆ ئەم ڕیپۆیە هەبێت. لەسەر ئەم ئامێرە دەمێنێتەوە.</p><input type="password" id="adTok" dir="ltr" placeholder="github_pat_..."><div class="ad-err" id="adErr"></div><div class="ad-row"><button class="ad-btn gold" id="adOk">پاشەکەوت</button><button class="ad-btn" id="adX">داخستن</button></div>';
    o.appendChild(b);
    b.querySelector('#adOk').onclick=function(){
      var t=b.querySelector('#adTok').value.trim();if(!t){b.querySelector('#adErr').textContent='تۆکێن بنووسە';return}
      setToken(t);panel();
    };
    b.querySelector('#adX').onclick=close;
  }

  function panel(){
    var o=open(),p=el('div','ad-panel');o.appendChild(p);
    pendingDelete=[];
    var head=el('div','ad-head','<h3>بەڕێوەبردنی ماڵپەڕ</h3>');
    var x=el('button','ad-btn','✕');x.onclick=function(){if(confirm('گۆڕانکارییە پاشەکەوتنەکراوەکان دەسڕێنەوە؟')){location.reload()}};head.appendChild(x);p.appendChild(head);

    // texts
    p.appendChild(el('h4',null,'نووسینەکان'));
    var labels={hero_eyebrow:'سەرووی سەرەکی',hero_sub:'ژێرنووسی سەرەکی',hero_text:'دەقی سەرەکی',about_text:'دەربارەی ئێمە',sec_bedrooms:'ناوی بەشی ژووری نوستن',sec_wardrobes:'ناوی بەشی دولاب',sec_decor:'ناوی بەشی دیکۆر',sec_kitchens:'ناوی بەشی چێشتخانە',contact_intro:'دەقی پەیوەندی',addr_main:'ناونیشان',addr_note:'ناونیشان - تێبینی'};
    Object.keys(labels).forEach(function(k){
      var t=document.querySelector('[data-key="'+k+'"]');if(!t)return;
      var w=el('label','ad-field','<span>'+labels[k]+'</span>');
      var ta=el('textarea');ta.rows=k==='about_text'||k==='hero_text'?3:1;ta.value=t.textContent.trim();
      ta.oninput=function(){t.textContent=ta.value;content.texts[k]=ta.value};
      w.appendChild(ta);p.appendChild(w);
    });

    // galleries
    Object.keys(SECTIONS).forEach(function(k){
      p.appendChild(el('h4',null,'وێنەکانی '+SECTIONS[k]));
      var list=el('div','ad-list');p.appendChild(list);
      content.galleries[k]=content.galleries[k]||[];
      function draw(){
        list.innerHTML='';
        content.galleries[k].forEach(function(it,idx){
          var r=el('div','ad-item'),im=el('img');im.src=it._data||it.src;r.appendChild(im);
          var cap=el('input');cap.placeholder='نووسینی ژێر وێنە (دڵخواز)';cap.value=it.caption||'';
          cap.oninput=function(){it.caption=cap.value;renderGallery(k)};r.appendChild(cap);
          var bt=el('div','ad-mini');
          [['↑',-1],['↓',1]].forEach(function(m){var b=el('button','ad-btn',m[0]);b.onclick=function(){
            var j=idx+m[1],a=content.galleries[k];if(j<0||j>=a.length)return;var t=a[idx];a[idx]=a[j];a[j]=t;renderGallery(k);draw()};bt.appendChild(b)});
          var d=el('button','ad-btn red','سڕینەوە');d.onclick=function(){
            if(!confirm('ئەم وێنەیە دەسڕدرێتەوە؟'))return;
            content.galleries[k].splice(idx,1);if(!it._data)pendingDelete.push(it.src);renderGallery(k);draw()};
          bt.appendChild(d);r.appendChild(bt);list.appendChild(r);
        });
        if(!content.galleries[k].length)list.appendChild(el('p','ad-empty','هیچ وێنەیەک نییە'));
      }
      draw();
      var add=el('label','ad-btn gold ad-add','＋ زیادکردنی وێنە');
      var f=el('input');f.type='file';f.accept='image/*';f.multiple=true;f.style.display='none';
      f.onchange=function(){
        Array.prototype.slice.call(f.files).forEach(function(file,n){
          resize(file).then(function(data){
            var name='images/'+k+'/'+k+'-'+Date.now()+'-'+n+'.webp';
            content.galleries[k].push({src:name,alt:SECTIONS[k]+' - مۆبڵیاتی عەبدوڵڵا',caption:'',_data:data});
            renderGallery(k);draw();
          }).catch(function(e){alert(e.message)});
        });f.value='';
      };
      add.appendChild(f);p.appendChild(add);
    });

    // save
    var st=el('div','ad-status'),save=el('button','ad-btn gold big','پاشەکەوتکردن و بڵاوکردنەوە');
    var out=el('button','ad-btn','دەرچوون (لابردنی تۆکێن)');
    out.onclick=function(){setToken('');close()};
    save.onclick=function(){
      save.disabled=true;
      var jobs=[];
      var clean=JSON.parse(JSON.stringify(content));
      Object.keys(clean.galleries).forEach(function(k){clean.galleries[k]=clean.galleries[k].map(function(it){delete it._data;return it})});
      var uploads=[];
      Object.keys(content.galleries).forEach(function(k){content.galleries[k].forEach(function(it){if(it._data)uploads.push(it)})});
      var chain=Promise.resolve(),done=0,total=uploads.length+pendingDelete.length+1;
      function tick(){st.textContent='پاشەکەوتکردن... '+(++done)+'/'+total}
      uploads.forEach(function(it){chain=chain.then(function(){return putFile(it.src,it._data.split(',')[1],'Add '+it.src)}).then(tick)});
      pendingDelete.forEach(function(pth){chain=chain.then(function(){return delFile(pth)}).then(tick)});
      chain.then(function(){return putFile('data/content.json',toB64(JSON.stringify(clean,null,1)),'Update site content')}).then(tick)
      .then(function(){
        uploads.forEach(function(it){delete it._data});pendingDelete=[];
        st.className='ad-status ok';st.textContent='✅ پاشەکەوتکرا. دوای ١-٢ خولەک لە ماڵپەڕەکە دەردەکەوێت.';save.disabled=false;
      }).catch(function(e){
        st.className='ad-status bad';st.textContent='❌ '+e.message;save.disabled=false;
      });
    };
    p.appendChild(st);p.appendChild(save);p.appendChild(out);
  }

  var btn=document.getElementById('adminBtn');
  if(btn)btn.addEventListener('click',askPin);
})();
