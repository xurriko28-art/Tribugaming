const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const axios = require('axios');
const express = require('express');
const app = express();
app.get('/', (req,res)=>res.send('ONLINE'));
app.listen(process.env.PORT || 10000, ()=>console.log('Web ON'));

const TU_NUM = '34641043210';
const MAP = {
 '5492615584178':'rodribp26','18093270214':'theluffygamerd1','528998787182':'jennipoi',
 '525573349769':'templario1901','528681202466':'akamephoenixlml','34672766999':'jonatan93k13',
 '34641043210':'reptilianostv2','34637182220':'manzanillo150'
};
let ya = {};
let grupoId = null;

if(fs.existsSync('./sesion')){ try{fs.rmSync('./sesion',{recursive:true,force:true}); console.log('Sesion vieja borrada');}catch(e){} }

async function enVivo(user){
 try{
  let r = await axios.get('https://decapi.me/twitch/uptime/'+user,{timeout:10000});
  if(r.data.toLowerCase().includes('offline')) return {ok:false};
  return {ok:true, txt:r.data};
 }catch{ return {ok:false}; }
}

async function start(){
 const { state, saveCreds } = await useMultiFileAuthState('sesion');
 const sock = makeWASocket({ auth: state, logger: P({level:'silent'}), browser: ["Ubuntu","Chrome","20.0"] });
 sock.ev.on('creds.update', saveCreds);

 if(!state.creds.registered){
   console.log('Esperando para pedir codigo para '+TU_NUM);
   setTimeout(async ()=>{
     try{
       let code = await sock.requestPairingCode(TU_NUM);
       console.log('===========================================');
       console.log('>>> CODIGO PARA '+TU_NUM+' : '+code+' <<<');
       console.log('METELO YA EN WHATSAPP SIN GUION');
       console.log('===========================================');
       setInterval(async()=>{
         try{
           let c2 = await sock.requestPairingCode(TU_NUM);
           console.log('>>> CODIGO NUEVO: '+c2+' <<<');
         }catch(e){}
       }, 45000);
     }catch(e){ console.log('Error pidiendo codigo', e.message); }
   }, 5000);
 }

 sock.ev.on('connection.update', async (up)=>{
   const { connection } = up;
   if(connection === 'open'){
     console.log('CONECTADO CON EXITO!!!!');
     try{
       let grupos = await sock.groupFetchAllParticipating();
       grupoId = Object.keys(grupos)[0];
       console.log('Grupo: '+grupoId);
     }catch(e){}
     setInterval(async ()=>{
       if(!grupoId) return;
       for(let num in MAP){
         let tw = MAP[num];
         let res = await enVivo(tw);
         if(res.ok &&!ya[tw]){
           ya[tw] = true;
           try{ await sock.sendMessage(grupoId, { text: `🔴 EN DIRECTO @${num} https://twitch.tv/${tw} (${res.txt})`, mentions: [num+'@s.whatsapp.net'] }); }catch(e){}
         }
         if(!res.ok) ya[tw] = false;
       }
     }, 120000);
   }
 });
}
start();
