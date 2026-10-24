import express from 'express';
import webpush from 'web-push';
import fs from 'node:fs';
import crypto from 'node:crypto';
const app=express();app.use(express.json({limit:'100kb'}));app.use(express.static('public'));
const file=process.env.DATA_FILE||'subscriptions.json';
const load=()=>{try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return {}}};
const save=data=>fs.writeFileSync(file,JSON.stringify(data));
const publicKey=process.env.VAPID_PUBLIC_KEY,privateKey=process.env.VAPID_PRIVATE_KEY;
if(!publicKey||!privateKey)console.warn('Configure VAPID keys to enable push');
else webpush.setVapidDetails(process.env.VAPID_SUBJECT||'mailto:admin@example.com',publicKey,privateKey);
app.get('/api/key',(req,res)=>res.json({key:publicKey||null}));
app.post('/api/subscribe',(req,res)=>{const {subscription,bedtime='22:30',lead=30,morning='08:00',focus=0}=req.body;if(!subscription?.endpoint||!subscription?.keys?.auth||!subscription?.keys?.p256dh)return res.status(400).json({error:'Invalid subscription'});if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(bedtime)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(morning)||![30,45,60].includes(Number(lead))||![0,15,20,30].includes(Number(focus)))return res.status(400).json({error:'Invalid settings'});const id=crypto.createHash('sha256').update(subscription.endpoint).digest('hex');const data=load();data[id]={subscription,bedtime,lead:Number(lead),morning,focus:Number(focus),updated:Date.now(),sent:{}};save(data);res.json({ok:true})});
app.post('/api/unsubscribe',(req,res)=>{const endpoint=req.body?.endpoint;if(!endpoint)return res.status(400).json({error:'Missing endpoint'});const data=load();delete data[crypto.createHash('sha256').update(endpoint).digest('hex')];save(data);res.json({ok:true})});
const toMinutes=s=>{const [h,m]=s.split(':').map(Number);return h*60+m};
const timeString=d=>`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
async function tick(){if(!publicKey||!privateKey)return;const data=load();let changed=false;const now=new Date();const today=`${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;const minute=now.getHours()*60+now.getMinutes();for(const [id,item] of Object.entries(data)){const rest=(toMinutes(item.bedtime)-item.lead+1440)%1440;const events=[['rest',rest,'PAUSA Rest','Đã đến giờ nghỉ số. Hãy để dòng tin tạm dừng.'],['morning',toMinutes(item.morning),'PAUSA Journey','Sáng nay bạn cảm thấy giấc ngủ thế nào?']];for(const [kind,target,title,body] of events){const key=`${today}-${kind}`;if(Math.abs(minute-target)>1||item.sent[key])continue;try{await webpush.sendNotification(item.subscription,JSON.stringify({title,body,url:'/?tab='+ (kind==='rest'?'rest':'journey')}));item.sent[key]=true;changed=true}catch(e){if([404,410].includes(e.statusCode)){delete data[id];changed=true;break}else console.error('Push failed',e.statusCode||e.message)}}if(data[id]){item.sent=Object.fromEntries(Object.entries(item.sent).filter(([k])=>k.startsWith(today)));changed=true}}if(changed)save(data)}
setInterval(tick,60000);tick();
app.listen(process.env.PORT||3000,()=>console.log('PAUSA running'));
