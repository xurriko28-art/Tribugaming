const express = require('express');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fetch = require('node-fetch');

const app = express();
let qrActual = null;
let conectado = false;
let grupoId = null;
const CANALES = ["rodribp26","theluffygamerd1","jennipoi","templario1901","akamephoenixlml","jonatan93k13","reptilianostv2","manzanillo150"];
let enVivo = {};

app.get('/', async (req,res)=>{
  if(conectado) return res.send(`<h1>CONECTADO A LA TRIBU</h1><p>Bot funcionando. Grupo: ${grupoId}</p>`);
  if(!qrActual) return res.send(`<h1>Generando QR... refresca en 10 seg</h1><script>setTimeout(()=>location.reload(),10000)</script>`);
  const qrImg = await QRCode.toDataURL(qrActual);
  res.send(`<h1>ESCANEA ESTE QR CON EL WHATSAPP DE LA TRIBU</h1><img src="${qrImg}" width="300"><br><p>Refresca si expira</p><script>setTimeout(()=>location.reload(),20000)</script>`);
});

async function estaLive(c){
  try{
    const r = await fetch(`https://twitch-api-henna.vercel.app/api/channel/${c}`);
    const d = await r.json();
    return d.isLive;
  }catch{ return false }
}

async function check(sock){
  for(let canal of CANALES){
    let live = await estaLive(canal);
    console.log(canal, live);
    if(live &&!enVivo[canal] && grupoId){
      enVivo[canal]=true;
      await sock.sendMessage(grupoId,{text:`EN DIRECTO: ${canal}\nhttps://twitch.tv/${canal}`});
    }
    if(!live) enVivo[canal]=false;
    await new Promise(r=>setTimeout(r,2000));
  }
}

async function iniciar(){
  const { state, saveCreds } = await useMultiFileAuthState('sesion');
  const sock = makeWASocket({ auth: state, printQRInTerminal: false });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', async (u)=>{
    const { connection, qr } = u;
    if(qr) qrActual = qr;
    if(connection==='open'){
      conectado=true;
      console.log('Conectado');
      const grupos = await sock.groupFetchAllParticipating();
      for(let id in grupos){
        console.log(grupos[id].subject);
        if(grupos[id].subject.toLowerCase().includes('tribu')) grupoId=id;
      }
      if(!grupoId) grupoId=Object.keys(grupos)[0];
      setInterval(()=>check(sock),60000);
    }
    if(connection==='close') { qrActual=null; conectado=false; iniciar(); }
  });
}
iniciar();
app.listen(10000, ()=>console.log('Web en 10000'));
