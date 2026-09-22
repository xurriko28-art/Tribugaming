const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const QR = require('qrcode');
const axios = require('axios');
const express = require('express');
const app = express();

let lastQR = null;
app.get('/', (req,res)=>{
  if(!lastQR) return res.send('<h1>Generando QR... refresca en 10 seg</h1><script>setTimeout(()=>location.reload(),10000)</script>');
  res.send(`<div style="text-align:center;font-family:sans-serif"><h1>ESCANEA ESTE QR CON WHATSAPP</h1><img src="${lastQR}" style="width:300px"><p>WhatsApp > 3 puntitos > Dispositivos vinculados > Vincular dispositivo</p><script>setTimeout(()=>location.reload(),20000)</script></div>`);
});

app.listen(process.env.PORT || 10000, ()=>console.log('Web ON'));

const MAP = {'5492615584178':'rodribp26','18093270214':'theluffygamerd1','528998787182':'jennipoi','525573349769':'templario1901','528681202466':'akamephoenixlml','34672766999':'jonatan93k13','34641043210':'reptilianostv2','34637182220':'manzanillo150'};
let ya = {}; let grupoId=null;
async function enVivo(u){ try{let r=await axios.get('https://decapi.me/twitch/uptime/'+u,{timeout:10000}); if(r.data.toLowerCase().includes('offline')) return {ok:false}; return {ok:true,txt:r.data};}catch{return{ok:false}}}

async function start(){
  const { state, saveCreds } = await useMultiFileAuthState('./sesion');
  const sock = makeWASocket({ auth: state, logger: P({level:'silent'}), browser: ["Ubuntu","Chrome","20.0"] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (up)=>{
    const { connection, qr } = up;
    if(qr){ lastQR = await QR.toDataURL(qr); console.log('QR GENERADO - Abre la web de Render'); }
    if(connection === 'open'){
      console.log('CONECTADO!!!!');
      lastQR = null;
      try{ let g=await sock.groupFetchAllParticipating(); grupoId=Object.keys(g)[0]; }catch(e){}
      setInterval(async()=>{
        if(!grupoId) return;
        for(let num in MAP){
          let res=await enVivo(MAP[num]);
          if(res.ok &&!ya[MAP[num]]){ ya[MAP[num]]=true; try{ await sock.sendMessage(grupoId,{text:`🔴 EN DIRECTO @${num} https://twitch.tv/${MAP[num]} (${res.txt})`, mentions:[num+'@s.whatsapp.net']}); }catch(e){} }
          if(!res.ok) ya[MAP[num]]=false;
        }
      },120000);
    }
  });
}
start();
