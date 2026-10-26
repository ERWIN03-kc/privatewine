import {handleUpload} from '@vercel/blob/client';
import {put,list} from '@vercel/blob';
const slug=s=>String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'x';
const get=async p=>{const {blobs}=await list({prefix:p,limit:20});
return Promise.all(blobs.map(b=>fetch(b.url).then(r=>r.json()).catch(()=>null)))};
export default async function handler(req,res){
try{
if(req.method==='POST'){
const b=req.body||{};
if(String(b.type||'').startsWith('blob.')){
const r=await handleUpload({body:b,request:req,
onBeforeGenerateToken:async()=>({maximumSizeInBytes:500*1024*1024,addRandomSuffix:true}),
onUploadCompleted:async()=>{}});
return res.status(200).json(r)}
let host='';try{host=new URL(b.url).hostname}catch(e){}
if(!host.endsWith('.public.blob.vercel-storage.com'))return res.status(400).json({error:'url tidak valid'});
const id=Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3);
const name=String(b.name||'').trim().slice(0,100)||'Tanpa nama';
const m={id,name,desc:String(b.desc||'').slice(0,500),url:b.url,type:String(b.type||''),size:Number(b.size)||0,file:String(b.file||'file').slice(0,150),date:Date.now()};
const o={access:'public',addRandomSuffix:false,contentType:'application/json'};
const j=JSON.stringify(m);
await put('id/'+id+'.json',j,o);
await put('name/'+slug(name)+'~'+id+'.json',j,o);
return res.status(200).json(m)}
res.setHeader('cache-control','no-store');
if(req.query.id){
const id=String(req.query.id).replace(/[^a-z0-9]/g,'');
const a=(await get('id/'+id+'.json')).filter(Boolean);
if(!a.length)return res.status(404).json({error:'tidak ada'});
return res.status(200).json(a[0])}
const q=String(req.query.q||'').trim().toLowerCase();
if(!q)return res.status(200).json([]);
const mm=q.match(/[?&]v=([a-z0-9]+)/);
let out=[];
if(mm)out=await get('id/'+mm[1]+'.json');
else{
out=(await get('name/'+slug(q)+'~')).filter(m=>m&&String(m.name).toLowerCase()===q);
if(!out.length&&/^[a-z0-9]{6,12}$/.test(q))out=await get('id/'+q+'.json')}
return res.status(200).json(out.filter(Boolean).slice(0,20))
}catch(e){return res.status(500).json({error:e.message})}}
