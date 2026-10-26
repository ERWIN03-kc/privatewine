import {upload} from 'https://esm.sh/@vercel/blob@1/client';
const $=i=>document.getElementById(i);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sv=(w,p)=>'<svg width="'+w+'" height="'+w+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
const IC={up:sv(30,'<path d="M12 16V4m0 0L7 9m5-5l5 5M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3"/>'),play:sv(16,'<path d="M7 4l13 8-13 8z"/>'),dl:sv(16,'<path d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16"/>'),sr:sv(30,'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>')};
const size=n=>n<1048576?Math.max(1,Math.round(n/1024))+' KB':(n/1048576).toFixed(2)+' MB';
const link=id=>location.origin+'/?v='+id;
let tt;function toast(t){const e=$('toast');e.textContent=t;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),2800)}
function card(m){
const t=m.type||'',u=esc(m.url);let pv='';
if(t.startsWith('image/'))pv='<img src="'+u+'" alt="">';
else if(t.startsWith('video/'))pv='<video src="'+u+'" controls playsinline preload="metadata"></video>';
else if(t.startsWith('audio/'))pv='<audio src="'+u+'" controls></audio>';
const k=t.startsWith('image/')?'Foto':t.startsWith('video/')?'Video':t.startsWith('audio/')?'Audio':'File';
const dt=new Date(m.date).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
return '<div class="out"><h2>'+esc(m.name)+'</h2>'+pv+(m.desc?'<p>'+esc(m.desc)+'</p>':'')+'<div class="tags"><span>'+k+'</span><span>'+size(m.size)+'</span><span>'+dt+'</span></div><div class="acts"><a class="btn pri" href="'+u+'" target="_blank" rel="noopener">'+IC.play+'Open</a><a class="btn" href="'+u+'?download=1">'+IC.dl+'Download</a></div></div>'}
const v=new URLSearchParams(location.search).get('v');
if(v){
$('main').hidden=true;$('view').hidden=false;
$('view').innerHTML='<div class="card"><div class="empty">Memuat...</div></div>';
fetch('/api/files?id='+encodeURIComponent(v)).then(r=>r.ok?r.json():Promise.reject()).then(m=>{
$('view').innerHTML='<div class="card">'+card(m)+'<a class="btn full" style="margin-top:14px" href="/">Bikin link kamu sendiri</a></div>'
}).catch(()=>{$('view').innerHTML='<div class="card"><div class="empty">File tidak ditemukan.</div><a class="btn full" href="/">Ke beranda</a></div>'})}
function tab(n){$('p1').hidden=n!=1;$('p2').hidden=n!=2;$('t1').className=n==1?'on':'';$('t2').className=n==2?'on':'';if(n==2)cari()}
$('t1').onclick=()=>tab(1);$('t2').onclick=()=>tab(2);
const dropHtml=IC.up+'<p>Tarik file ke sini atau ketuk untuk pilih</p><small>Foto, video, file apa saja. Maks 500 MB</small>';
let file=null;
function pick(f){file=f;const d=$('drop');
if(!f){d.innerHTML=dropHtml;return}
const th=f.type.startsWith('image/')?'<img src="'+URL.createObjectURL(f)+'" alt="">':'';
d.innerHTML='<div class="chip">'+th+'<div><b>'+esc(f.name)+'</b><small>'+size(f.size)+' - ketuk untuk ganti</small></div></div>'}
pick(null);
const dr=$('drop');
dr.onclick=()=>$('f').click();
$('f').onchange=e=>pick(e.target.files[0]||null);
dr.ondragover=e=>{e.preventDefault();dr.classList.add('over')};
dr.ondragleave=()=>dr.classList.remove('over');
dr.ondrop=e=>{e.preventDefault();dr.classList.remove('over');if(e.dataTransfer.files[0])pick(e.dataTransfer.files[0])};
$('go').onclick=async()=>{
if(!file)return toast('Pilih file dulu');
if(file.size>500*1048576)return toast('File maksimal 500 MB');
const go=$('go');go.disabled=true;go.textContent='Mengunggah...';
$('prog').classList.add('on');$('bar').style.width='0';
try{
const b=await upload(file.name,file,{access:'public',handleUploadUrl:'/api/files',multipart:true,onUploadProgress:p=>{$('bar').style.width=p.percentage+'%'}});
const r=await fetch('/api/files',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:$('n').value,desc:$('d').value,url:b.url,type:file.type,size:file.size,file:file.name})});
const m=await r.json();if(!r.ok)throw new Error(m.error||'gagal');
$('res').hidden=false;
$('res').innerHTML='<label>Link kamu</label><div class="row"><input id="lk" readonly><button class="btn pri" id="cp">Salin</button></div>'+card(m);
$('lk').value=link(m.id);
$('cp').onclick=()=>{const i=$('lk');i.select();try{navigator.clipboard.writeText(i.value)}catch(e){document.execCommand('copy')}toast('Link disalin')};
toast('Link sudah jadi')
}catch(e){toast('Gagal: '+e.message)}
go.disabled=false;go.textContent='Bikin link';$('prog').classList.remove('on')};
const hint='<div class="empty">'+IC.sr+'<br>Tempel link atau ketik nama file persis untuk menemukannya.</div>';
let tm,sq=0;
$('q').oninput=()=>{clearTimeout(tm);tm=setTimeout(cari,400)};
async function cari(){
const q=$('q').value.trim(),n=++sq;
if(!q){$('list').innerHTML=hint;return}
$('list').innerHTML='<div class="empty">Mencari...</div>';
try{
const a=await (await fetch('/api/files?q='+encodeURIComponent(q))).json();
if(n!=sq)return;
$('list').innerHTML=Array.isArray(a)&&a.length?a.map(m=>'<div class="sr">'+card(m)+'</div>').join(''):'<div class="empty">Tidak ditemukan. Cek lagi nama atau linknya.</div>'
}catch(e){if(n==sq)$('list').innerHTML='<div class="empty">Gagal mencari. Coba lagi.</div>'}}
$('list').innerHTML=hint;
