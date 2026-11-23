import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder, MessageFlags, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const { DISCORD_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID } = process.env;
if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) throw new Error('Set DISCORD_TOKEN and DISCORD_CLIENT_ID in .env');
const realms = ['Icecrown', 'Lordaeron', 'Blackrock', 'Onyxia'];
const pages = ['summary','professions','equipment'];
const labels = {summary:'Resumen',professions:'Profesiones',equipment:'Equipamiento'};
const commands = [
  new SlashCommandBuilder().setName('character').setDescription('Consultar un personaje de Warmane')
    .addStringOption(o=>o.setName('name').setDescription('Nombre del personaje').setRequired(true).setMinLength(2).setMaxLength(24))
    .addStringOption(o=>o.setName('realm').setDescription('Reino').setRequired(true).addChoices(...realms.map(r=>({name:r,value:r})))),
  new SlashCommandBuilder().setName('servertime').setDescription('Hora configurada (no sincronizada con Warmane)')
].map(c=>c.toJSON());
const client = new Client({intents:[GatewayIntentBits.Guilds]});
const cache = new Map();
const isObject = x=>x && typeof x==='object' && !Array.isArray(x);
const safe = x=>x===undefined||x===null||x===''?'No disponible':String(x).slice(0,1000);
const field = (obj,...keys)=>keys.map(k=>obj?.[k]).find(v=>v!==undefined&&v!==null&&v!=='');
async function fetchSection(name,realm,section){
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),8000);
  try {
    const url=`https://armory.warmane.com/api/character/${encodeURIComponent(name)}/${encodeURIComponent(realm)}/${section}`;
    const res=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json','User-Agent':'WarmaneLite/2.9'}});
    if(!res.ok) return null;
    const json=await res.json();
    return (isObject(json)||Array.isArray(json))&&!json?.error?json:null;
  }catch{return null;}finally{clearTimeout(timer);}
}
async function getCharacter(name,realm){
  const key=`${realm}:${name}`.toLowerCase(), old=cache.get(key);
  if(old&&Date.now()-old.time<60000) return old.data;
  // Sections are best-effort: Warmane may reject requests or omit endpoints.
  const [summary,professions,equipment]=await Promise.all(pages.map(p=>fetchSection(name,realm,p)));
  const data={summary,professions,equipment};
  if(!summary && !professions && !equipment) throw new Error('Warmane API inaccessible or no character found');
  cache.set(key,{time:Date.now(),data});return data;
}
function pretty(value,limit=900){
  if(value===undefined||value===null||value==='')return 'No disponible en la API';
  if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return safe(value);
  if(Array.isArray(value)) return value.length?value.slice(0,15).map(v=>typeof v==='object'?(v.name??v.title??v.id??JSON.stringify(v)):v).join('\n').slice(0,limit):'Sin datos';
  if(isObject(value))return Object.entries(value).slice(0,16).map(([k,v])=>`${k}: ${typeof v==='object'?JSON.stringify(v):v}`).join('\n').slice(0,limit);
  return 'No disponible';
}
const translateClass = {Warrior:'Guerrero',Paladin:'Paladín',Hunter:'Cazador',Rogue:'Pícaro',Priest:'Sacerdote',DeathKnight:'Caballero de la Muerte','Death Knight':'Caballero de la Muerte',Shaman:'Chamán',Mage:'Mago',Warlock:'Brujo',Druid:'Druida'};
const translateRace = {Human:'Humano',Orc:'Orco',Dwarf:'Enano',NightElf:'Elfo de la noche','Night Elf':'Elfo de la noche',Undead:'No-muerto',Tauren:'Tauren',Gnome:'Gnomo',Troll:'Trol',BloodElf:'Elfo de sangre','Blood Elf':'Elfo de sangre',Draenei:'Draenei'};
const translateFaction = {Alliance:'Alianza',Horde:'Horda'};
const translateProfession = {Alchemy:'Alquimia',Blacksmithing:'Herrería',Enchanting:'Encantamiento',Engineering:'Ingeniería',Herbalism:'Herboristería',Inscription:'Inscripción',Jewelcrafting:'Joyería',Leatherworking:'Peletería',Mining:'Minería',Skinning:'Desuello',Tailoring:'Sastrería'};
const translateSlot = {head:'Cabeza',neck:'Cuello',shoulder:'Hombros',back:'Espalda',chest:'Pecho',wrist:'Muñecas',hands:'Manos',waist:'Cintura',legs:'Piernas',feet:'Pies',finger1:'Anillo 1',finger2:'Anillo 2',trinket1:'Abalorio 1',trinket2:'Abalorio 2',mainhand:'Mano principal',offhand:'Mano secundaria',ranged:'A distancia',shirt:'Camisa',tabard:'Tabardo'};
function translateText(value, dict) {
  const v=safe(value);
  return dict[v]??v;
}
function localized(value, dict, limit=850) {
  if(value===undefined||value===null||value==='')return 'No disponible en la API';
  if(typeof value==='string'||typeof value==='number')return translateText(value,dict);
  if(Array.isArray(value)) return value.length?value.slice(0,16).map(v=>{
    if(isObject(v))return `${translateText(v.name??v.title??v.id??'Dato',dict)}${v.skill??v.level?` — ${v.skill??v.level}`:''}`;
    return translateText(v,dict);
  }).join('\n').slice(0,limit):'Sin datos';
  if(isObject(value))return Object.entries(value).slice(0,16).map(([k,v])=>
    `${translateText(k,dict)}: ${isObject(v)?translateText(v.name??v.title??JSON.stringify(v),dict):Array.isArray(v)?localized(v,dict,250):translateText(v,dict)}`
  ).join('\n').slice(0,limit);
  return 'No disponible en la API';
}
function equipmentEntries(equipment){
  if(!equipment)return [];
  const raw=Array.isArray(equipment)?equipment:
    Array.isArray(equipment.items)?equipment.items:
    Array.isArray(equipment.equipment)?equipment.equipment:
    Array.isArray(equipment.gear)?equipment.gear:
    isObject(equipment.items)?Object.entries(equipment.items).map(([slot,item])=>({slot,...(isObject(item)?item:{name:item})})):
    isObject(equipment)?Object.entries(equipment).map(([slot,item])=>({slot,...(isObject(item)?item:{name:item})})):[];
  return raw.map((item,index)=>{
    if(typeof item==='string')return {slot:'',name:item};
    if(!isObject(item))return {slot:'',name:safe(item)};
    const slot=translateSlot[String(item.slot??item.position??item.inventorySlot??'').toLowerCase()]??
      (typeof item.slot==='string'&&isNaN(Number(item.slot))?item.slot:'');
    const name=item.name??item.title??item.item?.name??item.itemName??item.item?.title;
    return {slot,name:typeof name==='string'?name:typeof item.id==='number'?`Objeto #${item.id}`:'Objeto sin nombre'};
  }).filter(item=>item.name&&item.name!=='No disponible');
}
function equipmentColumns(equipment){
  const items=equipmentEntries(equipment);
  if(!items.length)return [{name:'Piezas equipadas',value:'No disponible en la API'}];
  const lines=items.map((item,i)=>`${String(i+1).padStart(2,'0')}. ${item.slot?`**${item.slot}:** `:''}${item.name}`);
  const columns=[[],[]];
  const halfway=Math.ceil(lines.length/2);
  lines.forEach((line,i)=>columns[i<halfway?0:1].push(line));
  return columns.filter(c=>c.length).map((c,i)=>({
    name:i===0?'Equipo · Primera parte':'Equipo · Segunda parte',
    value:c.join('\n').slice(0,1024),
    inline:columns[1].length>0
  }));
}
function embedFor(name,realm,data,page='summary'){
  const summary=isObject(data.summary?.character)?data.summary.character:data.summary||{};
  const e=new EmbedBuilder().setColor(0x5878b7)
    .setTitle(`${safe(summary.name??name)} — ${realm}`)
    .setURL(`https://armory.warmane.com/character/${encodeURIComponent(name)}/${encodeURIComponent(realm)}/summary`)
    .setFooter({text:'Warmane API · Información no disponible cuando la API no la entrega · caché 60 s'});
  const equipment=data.equipment??field(summary,'equipment','items','gear');
  if(page==='equipment'){
    e.setDescription('**Equipamiento del personaje**');
    e.addFields(...equipmentColumns(equipment));
  }else{
    e.addFields(
      {name:'Nivel',value:safe(summary.level),inline:true},
      {name:'Clase',value:translateText(summary.class,translateClass),inline:true},
      {name:'Raza',value:translateText(summary.race,translateRace),inline:true},
      {name:'Hermandad',value:safe(isObject(summary.guild)?summary.guild.name:summary.guild),inline:true},
      {name:'Facción',value:translateText(summary.faction,translateFaction),inline:true},
      {name:'Puntos de logro',value:safe(field(summary,'achievementpoints','achievementPoints')),inline:true},
      {name:'Profesiones',value:localized(data.professions??field(summary,'professions'),translateProfession,750)}
    );
  }
  return e;
}
function navigation(name,realm,selected='summary'){
  return [new ActionRowBuilder().addComponents(
    ...[['summary','Resumen'],['equipment','Equipamiento']].map(([page,label])=>
      new ButtonBuilder().setCustomId(`warmane:${page}:${realm}:${name}`)
        .setLabel(label).setStyle(page===selected?ButtonStyle.Primary:ButtonStyle.Secondary)
        .setDisabled(page===selected))
  )];
}
function clockEmbed(){
  const offset=Number(process.env.SERVER_UTC_OFFSET??'0');
  if(!Number.isFinite(offset)||Math.abs(offset)>14)throw new Error('Invalid SERVER_UTC_OFFSET');
  const time=new Date(Date.now()+offset*3600000).toISOString().slice(11,19);
  return new EmbedBuilder().setColor(0x5878b7).setTitle('Hora configurada').setDescription(`**${time}** (UTC${offset>=0?'+':''}${offset})`)
    .setFooter({text:'Cálculo local, NO verificado contra el reloj de Warmane'});
}
client.on(Events.InteractionCreate,async interaction=>{
  if(interaction.isButton() && interaction.customId.startsWith('warmane:')){
    try {
      const [,page,realm,...nameParts]=interaction.customId.split(':');
      const name=nameParts.join(':');
      if(!['summary','equipment'].includes(page)||!realms.includes(realm)||!name)return;
      await interaction.deferUpdate();
      const data=await getCharacter(name,realm);
      await interaction.editReply({embeds:[embedFor(name,realm,data,page)],components:navigation(name,realm,page)});
    }catch(error){console.error('Error al cambiar de pestaña:',error.message);}
    return;
  }
  if(!interaction.isChatInputCommand())return;
  try{
    if(interaction.commandName==='servertime')return await interaction.reply({embeds:[clockEmbed()]});
    if(interaction.commandName!=='character')return;
    const name=interaction.options.getString('name',true).trim();
    const realm=interaction.options.getString('realm',true);
    await interaction.deferReply();
    const data=await getCharacter(name,realm);
    await interaction.editReply({embeds:[embedFor(name,realm,data)],components:navigation(name,realm)});
  }catch(error){
    console.error('Warmane command error:',error.message);
    const payload={content:'No fue posible consultar Warmane. La API puede estar bloqueada, no disponible o no ofrecer esos datos.',embeds:[],components:[]};
    if(interaction.deferred||interaction.replied)await interaction.editReply(payload);
    else await interaction.reply({...payload,flags:MessageFlags.Ephemeral});
  }
});
client.once(Events.ClientReady,()=>console.log(`Connected as ${client.user.tag}`));
const rest=new REST({version:'10'}).setToken(DISCORD_TOKEN);
const route=DISCORD_GUILD_ID?Routes.applicationGuildCommands(DISCORD_CLIENT_ID,DISCORD_GUILD_ID):Routes.applicationCommands(DISCORD_CLIENT_ID);
await rest.put(route,{body:commands});
await client.login(DISCORD_TOKEN);
