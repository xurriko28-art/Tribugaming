const { default: makeWASocket, useMultiFileAuthState, delay } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');
const axios = require('axios');
const express = require('express');
const app = express();
app.get('/', (req,res)=>res.send('BOT ONLINE - Esperando codigo'));
app.listen(process.env.PORT || 10000);

const TU_NUM = '34641043210';
const MAP = {'5492615584178':'rodribp26','18093270214':'theluffygamerd1','528998787182':'jennipoi','525573349769':'templario1901','528681202466':'akamephoenixlml','34672766999':'jonatan93k13','34641043210':'reptilianostv2','34637182220':'manzanillo150'};
let ya = {}; let grupoId = null;

async function enVivo(user){
 try{
  let r = await axios.get('https://decapi.me/twitch/uptime/'+user,{timeout:10000});
  if(r.data.toLowerCase().includes('offline')) return {ok:false};
  return {ok:true, txt:r.data};
 }catch{ return {ok:false}; }
}

async function start(){
 if(fs.existsSync('./sesion')){ fs.rmSync('./sesion',{recursive:true,force:true}); }
 const { state, saveCreds } = await useMultiFileAuthState('./sesion');
 const sock = makeWASocket({ auth: state, logger: P({level:'silent'}), printQRInTerminal: false, browser: ["Chrome","Chrome",""] });
 sock.ev.on('creds.update', saveCreds);

 if(!state.creds.registered){
   await delay(3000);
   let intento = 0;
   while(intento < 5){
     try{
       intento++;
       console.log(`Intentando pedir codigo intento ${intento} para ${TU_NUM}...`);
       let code = await sock.requestPairingCode(TU_NUM);
       console.log('===========================================');
       console.log(`>>> CODIGO: ${code} <<<`);
       console.log('METE ESTE CODIGO EN WHATSAPP YA');
       console.log('===========================================');
       break;
     }catch(e){
       console.log(`Error intento ${intento}: ${e.message} - reintentando en 5s`);
       await delay(5000);
     }
   }
 }

 sock.ev.on('connection.update', async (up)=>{
   if(up.connection === 'open'){
     console.log('CONECTADO CON EXITO!!!! BOT FUNCIONANDO');
     try{ let grupos = await sock.groupFetchAllParticipating(); grupoId = Object.keys(grupos)[0]; console.log('Grupo encontrado: '+grupoId); }catch(e){console.log('No hay grupos aun');}
     setInterval(async ()=>{
       if(!grupoId) return;
       for(let num in MAP){
         let res = await enVivo(MAP[num]);
         if(res.ok &&!ya[MAP[num]]){ ya[MAP[num]]=true; try{ await sock.sendMessage(grupoId,{text:`🔴 EN DIRECTO @${num} https://twitch.tv/${MAP[num]} (${res.txt})`, mentions:[num+'@s.whatsapp.net']}); }catch(e){} }
         if(!res.ok) ya[MAP[num]]=false;
       }
     }, 120000);
   }
 });
}
start();
