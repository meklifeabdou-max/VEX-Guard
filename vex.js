
const {
  Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder,
  EmbedBuilder, PermissionFlagsBits, ChannelType,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, Events
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildInvites
  ]
});

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  throw new Error("تأكد من DISCORD_TOKEN و CLIENT_ID و GUILD_ID في GitHub Secrets");
}

const startedAt = Date.now();
const warnings = new Map();
const logs = new Map();
const settings = new Map();
const spam = new Map();
const linkWarnings = new Map();

function cfg(guildId) {
  if (!settings.has(guildId)) {
    settings.set(guildId, {
      antispam: true, antilink: true, antiinvite: true,
      antimention: true, lockdown: false,
      category: process.env.TICKET_CATEGORY_ID || "",
      support: process.env.SUPPORT_ROLE_ID || "",
      log: "", welcome: "", goodbye: "", autorole: ""
    });
  }
  return settings.get(guildId);
}

function staff(i) {
  return i.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
    i.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
    i.memberPermissions?.has(PermissionFlagsBits.ModerateMembers);
}

async function log(guild, text) {
  const s = cfg(guild.id);
  const list = logs.get(guild.id) || [];
  list.unshift({ text, time: Date.now() });
  logs.set(guild.id, list.slice(0, 200));
  const ch = guild.channels.cache.get(s.log);
  if (ch?.isTextBased()) await ch.send(`📋 ${text}`).catch(() => {});
}

function addWarn(guildId, userId, reason, by) {
  const key = `${guildId}:${userId}`;
  const list = warnings.get(key) || [];
  list.push({ reason, by, time: Date.now() });
  warnings.set(key, list);
  return list.length;
}

const definitions = [
  ["help","قائمة الأوامر","help"],
  ["serverinfo","معلومات السيرفر","serverinfo"],
  ["membercount","عدد الأعضاء","membercount"],
  ["servericon","صورة السيرفر","servericon"],
  ["botinfo","معلومات البوت","botinfo"],
  ["uptime","مدة التشغيل","uptime"],
  ["userinfo","معلومات عضو","userinfo"],
  ["avatar","صورة عضو","avatar"],
  ["rolelist","قائمة الرتب","rolelist"],
  ["channellist","قائمة الرومات","channellist"],
  ["warn","تحذير عضو","warn"],
  ["warnings","تحذيرات عضو","warnings"],
  ["clearwarnings","مسح تحذيرات عضو","clearwarnings"],
  ["kick","طرد عضو","kick"],
  ["ban","حظر عضو","ban"],
  ["unban","إلغاء حظر ID","unban"],
  ["timeout","إعطاء مهلة","timeout"],
  ["untimeout","إزالة المهلة","untimeout"],
  ["softban","حظر ثم فك الحظر","softban"],
  ["baninfo","معلومات عن حظر عضو","baninfo"],
  ["nick","تغيير لقب عضو","nick"],
  ["resetnick","إعادة اللقب الافتراضي","resetnick"],
  ["roleadd","إعطاء رتبة لعضو","roleadd"],
  ["roleremove","سحب رتبة من عضو","roleremove"],
  ["memberroles","رتب عضو","memberroles"],
  ["purge","حذف رسائل","purge"],
  ["purgeuser","حذف رسائل عضو","purgeuser"],
  ["slowmode","تحديد الوضع البطيء","slowmode"],
  ["lock","قفل الروم","lock"],
  ["unlock","فتح الروم","unlock"],
  ["hide","إخفاء الروم","hide"],
  ["show","إظهار الروم","show"],
  ["renamechannel","تغيير اسم الروم","renamechannel"],
  ["settopic","تغيير وصف الروم","settopic"],
  ["nsfw","تبديل إعداد NSFW","nsfw"],
  ["clonechannel","نسخ الروم","clonechannel"],
  ["deletechannel","حذف الروم الحالي","deletechannel"],
  ["createchannel","إنشاء روم نصي","createchannel"],
  ["createcategory","إنشاء كاتيجوري","createcategory"],
  ["syncperms","مزامنة صلاحيات الروم","syncperms"],
  ["addrole","إنشاء رتبة","addrole"],
  ["deleterole","حذف رتبة","deleterole"],
  ["renamerole","تغيير اسم رتبة","renamerole"],
  ["colorrole","تغيير لون رتبة","colorrole"],
  ["hoistrole","تبديل ظهور الرتبة منفصلة","hoistrole"],
  ["mentionablerole","تبديل إمكانية منشن الرتبة","mentionablerole"],
  ["roleinfo","معلومات رتبة","roleinfo"],
  ["channelinfo","معلومات الروم","channelinfo"],
  ["channelperms","عرض صلاحيات الروم","channelperms"],
  ["clearreactions","حذف تفاعلات رسالة","clearreactions"],
  ["antispam","تشغيل أو تعطيل حماية السبام","antispam"],
  ["antilink","تشغيل أو تعطيل حماية الروابط","antilink"],
  ["antiinvite","حماية روابط الدعوات","antiinvite"],
  ["antimention","حماية المنشن الجماعي","antimention"],
  ["anticaps","فحص الرسائل ذات الأحرف الكبيرة","anticaps"],
  ["antiwebhook","حالة حماية Webhook","antiwebhook"],
  ["antiraid","تفعيل وضع مقاومة الغارات","antiraid"],
  ["protection","حالة الحماية","protection"],
  ["lockdown","إغلاق الرومات النصية","lockdown"],
  ["unlockdown","إلغاء الإغلاق العام","unlockdown"],
  ["raidmode","تبديل وضع الغارات","raidmode"],
  ["slowmodeall","تحديد البطء في الرومات النصية","slowmodeall"],
  ["setlog","تحديد روم السجلات","setlog"],
  ["logs","عرض السجلات","logs"],
  ["modlogs","سجلات عضو","modlogs"],
  ["clearlogs","مسح السجلات المحفوظة","clearlogs"],
  ["audit","آخر عمليات البوت المسجلة","audit"],
  ["setwelcome","تحديد روم الترحيب","setwelcome"],
  ["setgoodbye","تحديد روم المغادرة","setgoodbye"],
  ["setautorole","تحديد رتبة العضو الجديد","setautorole"],
  ["setstaffrole","تحديد رتبة الدعم","setstaffrole"],
  ["setmuterole","فحص إعدادات المهلة","setmuterole"],
  ["ticketpanel","إنشاء لوحة التكتات","ticketpanel"],
  ["ticketsetup","إعداد نظام التكتات","ticketsetup"],
  ["ticketclose","إغلاق التكت","ticketclose"],
  ["ticketclaim","استلام التكت","ticketclaim"],
  ["ticketadd","إضافة عضو للتكت","ticketadd"],
  ["ticketremove","إزالة عضو من التكت","ticketremove"],
  ["ticketrename","تغيير اسم التكت","ticketrename"],
  ["tickettranscript","ملخص رسائل التكت","tickettranscript"],
  ["announce","إرسال إعلان","announce"],
  ["say","إرسال رسالة باسم البوت","say"],
  ["embed","إرسال Embed","embed"],
  ["poll","تصويت إداري","poll"],
  ["reportview","عرض آخر البلاغات","reportview"],
  ["suggestview","عرض آخر الاقتراحات","suggestview"],
  ["cleanbots","حذف رسائل البوتات","cleanbots"],
  ["cleanwebhooks","حذف رسائل Webhook","cleanwebhooks"],
  ["pruneinactive","معاينة الأعضاء غير النشطين","pruneinactive"],
  ["serverlock","تفعيل قفل السيرفر النصي","serverlock"],
  ["serverunlock","إلغاء قفل السيرفر النصي","serverunlock"],
  ["setverification","عرض إرشادات التحقق","setverification"],
  ["verificationstatus","عرض إعدادات التحقق","verificationstatus"],
  ["resetprotection","إعادة إعدادات الحماية الافتراضية","resetprotection"],
  ["antispamstatus","حالة حماية السبام","antispamstatus"],
  ["antilinkstatus","حالة حماية الروابط","antilinkstatus"],
  ["setmodrole","تحديد رتبة الدعم والإشراف","setmodrole"],
  ["listbans","قائمة المحظورين","listbans"],
  ["memberhistory","ملخص إجراءات عضو","memberhistory"],
  ["exportlogs","تصدير نص السجلات في الرد","exportlogs"]
];

const schemas = {
  user: b => b.addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true)),
  reason: b => b.addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(true)),
  amount: b => b.addIntegerOption(o => o.setName("amount").setDescription("العدد").setMinValue(1).setMaxValue(100).setRequired(true)),
  role: b => b.addRoleOption(o => o.setName("role").setDescription("الرتبة").setRequired(true)),
  channel: b => b.addChannelOption(o => o.setName("channel").setDescription("الروم").setRequired(true)),
  text: b => b.addStringOption(o => o.setName("text").setDescription("النص").setRequired(true))
};

const optionTypes = {
  warn:["user","reason"], kick:["user","reason"], ban:["user","reason"],
  softban:["user","reason"], timeout:["user","reason"],
  warnings:["user"], clearwarnings:["user"], untimeout:["user"],
  nick:["user","text"], resetnick:["user"], roleadd:["user","role"],
  roleremove:["user","role"], memberroles:["user"], purge:["amount"],
  purgeuser:["user","amount"], slowmode:["amount"], renamechannel:["text"],
  settopic:["text"], createchannel:["text"], createcategory:["text"],
  renamerole:["role","text"], colorrole:["role","text"],
  hoistrole:["role"], mentionablerole:["role"], roleinfo:["role"],
  channelinfo:["channel"], clearreactions:["text"],
  antispam:["text"], antilink:["text"], antiinvite:["text"],
  antimention:["text"], antiraid:["text"], slowmodeall:["amount"],
  setlog:["channel"], setwelcome:["channel"], setgoodbye:["channel"],
  setautorole:["role"], setstaffrole:["role"], ticketsetup:["channel","role"],
  ticketadd:["user"], ticketremove:["user"], ticketrename:["text"],
  announce:["channel","text"], say:["text"], embed:["text"],
  poll:["text"], reportview:["amount"], suggestview:["amount"],
  setverification:["text"], setmodrole:["role"]
};

const commands = definitions.map(([name, description, action]) => {
  const b = new SlashCommandBuilder().setName(name).setDescription(description);
  if (name === "unban" || name === "baninfo") {
    b.addStringOption(o => o.setName("user_id").setDescription("ID العضو").setRequired(true));
  }
  if (name === "timeout") {
    b.addIntegerOption(o => o.setName("minutes").setDescription("عدد الدقائق").setMinValue(1).setMaxValue(40320).setRequired(true));
  }
  if (name === "ticketsetup") {
    b.addChannelOption(o => o.setName("category").setDescription("كاتيجوري التكت").addChannelTypes(ChannelType.GuildCategory).setRequired(true));
  }
  if (name === "createchannel") {
    b.addStringOption(o => o.setName("type").setDescription("text أو voice").addChoices(
      {name:"text",value:"text"},{name:"voice",value:"voice"}
    ).setRequired(false));
  }
  if (name === "createcategory") {
    // text option supplies category name
  }
  if (name === "addrole") {
    b.addStringOption(o => o.setName("name").setDescription("اسم الرتبة").setRequired(true));
  }
  if (name === "deleterole" || name === "hoistrole" || name === "mentionablerole") {
    schemas.role(b);
  }
  if (name === "nsfw") {
    b.addBooleanOption(o => o.setName("enabled").setDescription("تفعيل NSFW").setRequired(true));
  }
  if (["antispam","antilink","antiinvite","antimention","antiraid"].includes(name)) {
    b.addBooleanOption(o => o.setName("enabled").setDescription("تشغيل الحماية").setRequired(true));
  }
  for (const key of (optionTypes[name] || [])) {
    if (name === "timeout" && key === "reason") schemas.reason(b);
    else if (key === "user") schemas.user(b);
    else if (key === "reason") schemas.reason(b);
    else if (key === "amount") schemas.amount(b);
    else if (key === "role") schemas.role(b);
    else if (key === "channel") schemas.channel(b);
    else if (key === "text") schemas.text(b);
  }
  return { ...b.toJSON(), action };
});

const rest = new REST({version:"10"}).setToken(TOKEN);

client.once(Events.ClientReady, async () => {
  console.log(`🛡️ ${client.user.tag} يعمل الآن.`);
  try {
    // يستبدل قائمة أوامر السيرفر المحدد كاملة بالأوامر الموجودة هنا.
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands.map(({action, ...command}) => command)
    });
    console.log(`✅ تم تسجيل ${commands.length} أمرًا في السيرفر المحدد.`);
  } catch (e) {
    console.error("❌ فشل تسجيل الأوامر:", e);
  }
});

function ticketOwner(channel) {
  return channel?.topic?.match(/ticket-owner:(\d+)/)?.[1] || null;
}

async function openTicket(i, type) {
  const s = cfg(i.guild.id);
  const existing = i.guild.channels.cache.find(c =>
    c.type === ChannelType.GuildText && c.topic === `ticket-owner:${i.user.id}`
  );
  if (existing) return i.reply({content:`عندك تكت مفتوح بالفعل: ${existing}`,ephemeral:true});

  await i.deferReply({ephemeral:true});
  const overwrites = [
    {id:i.guild.id,deny:[PermissionFlagsBits.ViewChannel]},
    {id:i.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory]},
    {id:client.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ManageChannels,PermissionFlagsBits.ReadMessageHistory]}
  ];
  if (s.support) overwrites.push({
    id:s.support,
    allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory]
  });

  const ch = await i.guild.channels.create({
    name:`ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,90) || "ticket",
    type:ChannelType.GuildText,
    parent:s.category || undefined,
    topic:`ticket-owner:${i.user.id}`,
    permissionOverwrites:overwrites
  });

  const embed = new EmbedBuilder().setColor(0x5865F2)
    .setTitle("🎫 تكت جديد")
    .setDescription(`أهلًا ${i.user}\n**نوع التكت:** ${type}\nاشرح طلبك وانتظر فريق الدعم.`)
    .setTimestamp();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_claim").setLabel("استلام التكت").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("ticket_close").setLabel("إغلاق التكت").setStyle(ButtonStyle.Danger)
  );
  await ch.send({content:s.support ? `<@&${s.support}> ${i.user}` : `${i.user}`,embeds:[embed],components:[row]});
  await i.editReply({content:`✅ تم فتح التكت: ${ch}`});
  await log(i.guild,`${i.user.tag} فتح تكت ${type}`);
}

client.on(Events.GuildMemberAdd, async member => {
  const s = cfg(member.guild.id);
  if (s.autorole) await member.roles.add(s.autorole).catch(()=>{});
  if (s.welcome) {
    const ch = member.guild.channels.cache.get(s.welcome);
    if (ch?.isTextBased()) await ch.send(`👋 أهلًا ${member} في **${member.guild.name}**`).catch(()=>{});
  }
});

client.on(Events.GuildMemberRemove, async member => {
  const s = cfg(member.guild.id);
  if (s.goodbye) {
    const ch = member.guild.channels.cache.get(s.goodbye);
    if (ch?.isTextBased()) await ch.send(`👋 غادر السيرفر: **${member.user.tag}**`).catch(()=>{});
  }
});

client.on(Events.MessageCreate, async m => {
  if (!m.guild || m.author.bot || !m.member) return;
  const s = cfg(m.guild.id);
  if (m.member.permissions.has(PermissionFlagsBits.Administrator) ||
      m.member.permissions.has(PermissionFlagsBits.ManageMessages)) return;

  const invite = /discord\.gg\/|discord\.com\/invite\//i.test(m.content);
  const url = /https?:\/\/|www\./i.test(m.content);
  if ((s.antiinvite && invite) || (s.antilink && url)) {
    await m.delete().catch(()=>{});
    const key = `${m.guild.id}:${m.author.id}`;
    const count = (linkWarnings.get(key) || 0) + 1;
    linkWarnings.set(key,count);
    await m.channel.send(`⚠️ ${m.author} الروابط ممنوعة. تحذير ${count}/3`)
      .then(msg=>setTimeout(()=>msg.delete().catch(()=>{}),5000)).catch(()=>{});
    if (count >= 3) {
      await m.member.timeout(10*60*1000,"تكرار الروابط").catch(()=>{});
      linkWarnings.set(key,0);
      await log(m.guild,`مهلة لـ ${m.author.tag} بسبب الروابط`);
    }
    return;
  }
  if (s.antimention && m.mentions.users.size >= 5) {
    await m.delete().catch(()=>{});
    await m.channel.send(`⚠️ ${m.author} ممنوع المنشن الجماعي.`)
      .then(msg=>setTimeout(()=>msg.delete().catch(()=>{}),5000)).catch(()=>{});
    return;
  }
  if (s.antispam) {
    const key = `${m.guild.id}:${m.author.id}`;
    const now = Date.now();
    const recent = (spam.get(key)||[]).filter(t=>now-t<5000);
    recent.push(now);
    spam.set(key,recent);
    if (recent.length >= 5) {
      await m.member.timeout(10*60*1000,"سبام").catch(()=>{});
      spam.set(key,[]);
      await log(m.guild,`مهلة لـ ${m.author.tag} بسبب السبام`);
    }
  }
});

client.on(Events.InteractionCreate, async i => {
  try {
    if (i.isButton()) {
      if (["ticket_support","ticket_help","ticket_purchase"].includes(i.customId)) {
        return openTicket(i,{
          ticket_support:"الدعم",ticket_help:"المساعدة",ticket_purchase:"الشراء"
        }[i.customId]);
      }
      if (i.customId === "ticket_close") {
        const owner = ticketOwner(i.channel);
        if (owner !== i.user.id && !staff(i)) {
          return i.reply({content:"❌ صاحب التكت أو الإدارة فقط.",ephemeral:true});
        }
        await i.reply("🔒 سيتم حذف التكت بعد 3 ثوانٍ.");
        await log(i.guild,`${i.user.tag} أغلق ${i.channel.name}`);
        setTimeout(()=>i.channel.delete().catch(()=>{}),3000);
        return;
      }
      if (i.customId === "ticket_claim") {
        if (!staff(i)) return i.reply({content:"❌ هذا الزر للإدارة فقط.",ephemeral:true});
        return i.reply(`✅ تم استلام التكت بواسطة ${i.user}.`);
      }
    }
    if (!i.isChatInputCommand()) return;
    if (!staff(i)) return i.reply({content:"❌ أوامر هذا البوت مخصصة للإدارة.",ephemeral:true});

    const cmd = i.commandName;
    const guild = i.guild;
    const s = cfg(guild.id);
    const u = i.options.getUser("user");
    const role = i.options.getRole("role");
    const channel = i.options.getChannel("channel");
    const text = i.options.getString("text");
    const reason = i.options.getString("reason") || "لم يحدد سبب";
    const target = u ? await guild.members.fetch(u.id).catch(()=>null) : null;

    switch (cmd) {
      case "help":
        return i.reply({embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle("VEX Guard • أوامر الإدارة").setDescription(definitions.map(([n,d])=>`/${n} — ${d}`).join("\n"))],ephemeral:true});
      case "serverinfo":
        return i.reply(`**${guild.name}**\nالأعضاء: ${guild.memberCount}\nالرومات: ${guild.channels.cache.size}\nالرتب: ${guild.roles.cache.size}`);
      case "membercount":
        return i.reply(`👥 عدد الأعضاء: ${guild.memberCount}`);
      case "servericon":
        return i.reply(guild.iconURL({size:1024}) || "لا توجد صورة للسيرفر.");
      case "botinfo":
        return i.reply(`🤖 ${client.user.tag}\nمدة التشغيل: ${Math.floor((Date.now()-startedAt)/60000)} دقيقة`);
      case "uptime":
        return i.reply(`⏱️ ${Math.floor((Date.now()-startedAt)/1000)} ثانية`);
      case "userinfo": {
        const member = target || await guild.members.fetch(i.user.id);
        return i.reply(`العضو: ${member.user.tag}\nID: ${member.id}\nانضم: <t:${Math.floor(member.joinedTimestamp/1000)}:D>`);
      }
      case "avatar":
        return i.reply((u||i.user).displayAvatarURL({size:1024}));
      case "rolelist":
        return i.reply(guild.roles.cache.map(r=>r.name).slice(0,70).join("، ") || "لا توجد رتب.");
      case "channellist":
        return i.reply(guild.channels.cache.map(c=>c.name).slice(0,70).join("، ") || "لا توجد رومات.");

      case "warn": {
        if (!target) return i.reply({content:"❌ العضو غير موجود في السيرفر.",ephemeral:true});
        const count = addWarn(guild.id,u.id,reason,i.user.tag);
        await log(guild,`${i.user.tag} حذّر ${u.tag}: ${reason}`);
        return i.reply(`⚠️ تم تحذير ${u}. إجمالي التحذيرات: ${count}`);
      }
      case "warnings": {
        const list = warnings.get(`${guild.id}:${u.id}`)||[];
        return i.reply({content:list.length?list.map((w,n)=>`${n+1}. ${w.reason} — ${w.by}`).join("\n"):"لا توجد تحذيرات.",ephemeral:true});
      }
      case "clearwarnings":
        warnings.delete(`${guild.id}:${u.id}`);
        return i.reply(`✅ تم مسح تحذيرات ${u}.`);
      case "kick":
        if (!target) return i.reply("❌ العضو غير موجود.");
        await target.kick(reason);
        await log(guild,`طرد ${u.tag}: ${reason}`);
        return i.reply(`✅ تم طرد ${u.tag}.`);
      case "ban":
      case "softban":
        await guild.members.ban(u.id,{reason});
        if (cmd==="softban") await guild.members.unban(u.id,"Softban").catch(()=>{});
        await log(guild,`${cmd} ${u.tag}: ${reason}`);
        return i.reply(`✅ تم تنفيذ ${cmd} على ${u.tag}.`);
      case "unban": {
        const id = i.options.getString("user_id");
        await guild.members.unban(id);
        return i.reply(`✅ تم إلغاء حظر ${id}.`);
      }
      case "baninfo": {
        const id = i.options.getString("user_id");
        const ban = await guild.bans.fetch(id).catch(()=>null);
        return i.reply(ban?`المستخدم محظور: ${ban.user.tag}\nالسبب: ${ban.reason||"غير محدد"}`:"هذا المستخدم غير محظور.");
      }
      case "timeout": {
        if (!target) return i.reply("❌ العضو غير موجود.");
        const mins = i.options.getInteger("minutes");
        await target.timeout(mins*60000,reason);
        await log(guild,`مهلة ${u.tag}: ${mins} دقيقة`);
        return i.reply(`✅ تم إعطاء ${u} مهلة ${mins} دقيقة.`);
      }
      case "untimeout":
        if (!target) return i.reply("❌ العضو غير موجود.");
        await target.timeout(null);
        return i.reply(`✅ تمت إزالة المهلة عن ${u}.`);
      case "nick":
        if (!target) return i.reply("❌ العضو غير موجود.");
        await target.setNickname(text);
        return i.reply("✅ تم تغيير اللقب.");
      case "resetnick":
        if (!target) return i.reply("❌ العضو غير موجود.");
        await target.setNickname(null);
        return i.reply("✅ تمت إعادة اللقب.");
      case "roleadd":
      case "roleremove":
        if (!target) return i.reply("❌ العضو غير موجود.");
        if (cmd==="roleadd") await target.roles.add(role);
        else await target.roles.remove(role);
        return i.reply(`✅ تم تنفيذ الأمر على ${u}.`);
      case "memberroles":
        return i.reply(target?target.roles.cache.map(r=>r.name).join("، "):"العضو غير موجود.");

      case "purge":
      case "purgeuser": {
        const amount = i.options.getInteger("amount");
        const msgs = await i.channel.messages.fetch({limit:100});
        const chosen = cmd==="purgeuser" ? msgs.filter(m=>m.author.id===u.id).first(amount) : msgs.first(amount);
        const deleted = await i.channel.bulkDelete(chosen,true);
        return i.reply({content:`🧹 تم حذف ${deleted.size} رسالة.`,ephemeral:true});
      }
      case "slowmode":
        await i.channel.setRateLimitPerUser(i.options.getInteger("amount"));
        return i.reply("✅ تم تعديل الوضع البطيء.");
      case "lock":
      case "unlock":
        await i.channel.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:cmd==="unlock"});
        return i.reply(cmd==="lock"?"🔒 تم قفل الروم.":"🔓 تم فتح الروم.");
      case "hide":
      case "show":
        await i.channel.permissionOverwrites.edit(guild.roles.everyone,{ViewChannel:cmd==="show"});
        return i.reply(cmd==="hide"?"🙈 تم إخفاء الروم.":"👁️ تم إظهار الروم.");
      case "renamechannel":
        await i.channel.setName(text);
        return i.reply("✅ تم تغيير اسم الروم.");
      case "settopic":
        await i.channel.setTopic(text);
        return i.reply("✅ تم تغيير وصف الروم.");
      case "nsfw":
        await i.channel.setNSFW(i.options.getBoolean("enabled"));
        return i.reply("✅ تم تحديث إعداد NSFW.");
      case "clonechannel": {
        const cloned = await i.channel.clone();
        return i.reply(`✅ تم نسخ الروم: ${cloned}`);
      }
      case "deletechannel":
        await i.reply({content:"🗑️ سيتم حذف الروم.",ephemeral:true});
        return i.channel.delete().catch(()=>{});
      case "createchannel": {
        const type = i.options.getString("type")==="voice" ? ChannelType.GuildVoice : ChannelType.GuildText;
        const ch = await guild.channels.create({name:text,type});
        return i.reply(`✅ تم إنشاء ${ch}.`);
      }
      case "createcategory": {
        const ch = await guild.channels.create({name:text,type:ChannelType.GuildCategory});
        return i.reply(`✅ تم إنشاء الكاتيجوري ${ch.name}.`);
      }
      case "syncperms":
        await i.channel.lockPermissions();
        return i.reply("✅ تمت مزامنة الصلاحيات.");
      case "addrole": {
        const name = i.options.getString("name");
        const r = await guild.roles.create({name});
        return i.reply(`✅ تم إنشاء الرتبة ${r}.`);
      }
      case "deleterole":
        await role.delete();
        return i.reply("✅ تم حذف الرتبة.");
      case "renamerole":
        await role.setName(text);
        return i.reply("✅ تم تغيير اسم الرتبة.");
      case "colorrole":
        if (!/^#?[0-9a-fA-F]{6}$/.test(text)) return i.reply({content:"اكتب اللون مثل #5865F2",ephemeral:true});
        await role.setColor(text.replace("#",""));
        return i.reply("✅ تم تغيير لون الرتبة.");
      case "hoistrole":
        await role.setHoist(!role.hoist);
        return i.reply("✅ تم تبديل إعداد ظهور الرتبة.");
      case "mentionablerole":
        await role.setMentionable(!role.mentionable);
        return i.reply("✅ تم تبديل إعداد المنشن للرتبة.");
      case "roleinfo":
        return i.reply(`الرتبة: ${role.name}\nID: ${role.id}\nالأعضاء: ${role.members.size}`);
      case "channelinfo":
        return i.reply(`الروم: ${channel.name}\nID: ${channel.id}\nالنوع: ${channel.type}`);
      case "channelperms":
        return i.reply({content:i.channel.permissionOverwrites.cache.map(p=>`${p.id}: ${p.allow.toArray().join(", ")}`).join("\n")||"لا توجد صلاحيات خاصة.",ephemeral:true});
      case "clearreactions": {
        const id = text;
        const msg = await i.channel.messages.fetch(id).catch(()=>null);
        if (!msg) return i.reply({content:"لم أجد الرسالة بهذا الـID.",ephemeral:true});
        await msg.reactions.removeAll();
        return i.reply("✅ تم حذف التفاعلات.");
      }

      case "antispam":
        s.antispam = i.options.getBoolean("enabled");
        return i.reply(`حماية السبام: ${s.antispam?"مفعّلة":"معطّلة"}`);
      case "antilink":
        s.antilink = i.options.getBoolean("enabled");
        return i.reply(`حماية الروابط: ${s.antilink?"مفعّلة":"معطّلة"}`);
      case "antiinvite":
        s.antiinvite = i.options.getBoolean("enabled");
        return i.reply(`حماية الدعوات: ${s.antiinvite?"مفعّلة":"معطّلة"}`);
      case "antimention":
        s.antimention = i.options.getBoolean("enabled");
        return i.reply(`حماية المنشن الجماعي: ${s.antimention?"مفعّلة":"معطّلة"}`);
      case "anticaps":
        return i.reply("ℹ️ فحص الأحرف الكبيرة غير مفعّل تلقائيًا في هذا الإصدار.");
      case "antiwebhook":
        return i.reply("ℹ️ هذه النسخة تعرض حالة الحماية فقط؛ لم يتم حذف Webhooks تلقائيًا.");
      case "antiraid":
      case "raidmode":
        s.antiraid = i.options.getBoolean("enabled") ?? !s.antiraid;
        return i.reply(`وضع الغارات: ${s.antiraid?"مفعّل":"معطّل"}`);
      case "protection":
      case "antispamstatus":
      case "antilinkstatus":
        return i.reply(`🛡️ الحماية\nسبام: ${s.antispam?"ON":"OFF"}\nروابط: ${s.antilink?"ON":"OFF"}\nدعوات: ${s.antiinvite?"ON":"OFF"}\nمنشن جماعي: ${s.antimention?"ON":"OFF"}`);
      case "lockdown":
      case "serverlock":
        s.lockdown = true;
        for (const c of guild.channels.cache.values()) if (c.isTextBased() && c.permissionOverwrites) {
          await c.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:false}).catch(()=>{});
        }
        return i.reply("🔒 تم تفعيل قفل الرومات النصية.");
      case "unlockdown":
      case "serverunlock":
        s.lockdown = false;
        for (const c of guild.channels.cache.values()) if (c.isTextBased() && c.permissionOverwrites) {
          await c.permissionOverwrites.edit(guild.roles.everyone,{SendMessages:null}).catch(()=>{});
        }
        return i.reply("🔓 تم إلغاء قفل الرومات النصية.");
      case "slowmodeall": {
        const secs = i.options.getInteger("amount");
        for (const c of guild.channels.cache.values()) if (c.type===ChannelType.GuildText) await c.setRateLimitPerUser(secs).catch(()=>{});
        return i.reply("✅ تم تطبيق الوضع البطيء على الرومات النصية.");
      }
      case "setlog":
        s.log = channel.id;
        return i.reply(`✅ روم السجلات: ${channel}`);
      case "logs":
      case "audit":
      case "exportlogs": {
        const list = logs.get(guild.id)||[];
        const result = list.slice(0,15).map(x=>x.text).join("\n") || "لا توجد سجلات.";
        return i.reply({content:result.slice(0,1900),ephemeral:true});
      }
      case "modlogs":
      case "memberhistory": {
        const list = logs.get(guild.id)||[];
        const found = list.filter(x=>x.text.includes(u.tag)||x.text.includes(u.id));
        return i.reply({content:found.slice(0,10).map(x=>x.text).join("\n")||"لا توجد سجلات لهذا العضو.",ephemeral:true});
      }
      case "clearlogs":
        logs.delete(guild.id);
        return i.reply("✅ تم مسح السجلات الموجودة في الذاكرة.");
      case "setwelcome":
        s.welcome = channel.id;
        return i.reply("✅ تم تحديد روم الترحيب.");
      case "setgoodbye":
        s.goodbye = channel.id;
        return i.reply("✅ تم تحديد روم المغادرة.");
      case "setautorole":
        s.autorole = role.id;
        return i.reply("✅ تم تحديد رتبة الأعضاء الجدد.");
      case "setstaffrole":
      case "setmodrole":
        s.support = role.id;
        return i.reply("✅ تم تحديث رتبة الدعم/الإشراف.");
      case "setmuterole":
        return i.reply("ℹ️ يستخدم البوت مهلة Discord المدمجة بدل رتبة كتم.");
      case "ticketpanel": {
        const embed = new EmbedBuilder().setColor(0x5865F2).setTitle("🎫 مركز التذاكر")
          .setDescription("اختر نوع التكت: الدعم أو المساعدة أو الشراء.");
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ticket_support").setLabel("الدعم").setEmoji("🛠️").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("ticket_help").setLabel("المساعدة").setEmoji("❓").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("ticket_purchase").setLabel("الشراء").setEmoji("🛒").setStyle(ButtonStyle.Secondary)
        );
        await i.channel.send({embeds:[embed],components:[row]});
        return i.reply({content:"✅ تم إنشاء لوحة التكتات.",ephemeral:true});
      }
      case "ticketsetup":
        s.category = i.options.getChannel("category").id;
        s.support = role.id;
        return i.reply("✅ تم إعداد الكاتيجوري ورتبة الدعم.");
      case "ticketclose": {
        if (!ticketOwner(i.channel)) return i.reply({content:"هذا الروم ليس تكتًا.",ephemeral:true});
        await i.reply("🔒 سيتم حذف التكت بعد 3 ثوانٍ.");
        setTimeout(()=>i.channel.delete().catch(()=>{}),3000);
        return;
      }
      case "ticketclaim":
        if (!ticketOwner(i.channel)) return i.reply({content:"هذا الروم ليس تكتًا.",ephemeral:true});
        return i.reply(`✅ استلم ${i.user} التكت.`);
      case "ticketadd":
      case "ticketremove": {
        if (!ticketOwner(i.channel)) return i.reply({content:"هذا الروم ليس تكتًا.",ephemeral:true});
        if (cmd==="ticketadd") await i.channel.permissionOverwrites.edit(u.id,{ViewChannel:true,SendMessages:true,ReadMessageHistory:true});
        else await i.channel.permissionOverwrites.delete(u.id).catch(()=>{});
        return i.reply(`✅ تم تنفيذ ${cmd} على ${u}.`);
      }
      case "ticketrename":
        if (!ticketOwner(i.channel)) return i.reply({content:"هذا الروم ليس تكتًا.",ephemeral:true});
        await i.channel.setName(text);
        return i.reply("✅ تم تغيير اسم التكت.");
      case "tickettranscript": {
        if (!ticketOwner(i.channel)) return i.reply({content:"هذا الروم ليس تكتًا.",ephemeral:true});
        const msgs = await i.channel.messages.fetch({limit:50});
        const summary = msgs.reverse().map(m=>`${m.author.tag}: ${m.content}`).join("\n");
        return i.reply({content:summary.slice(0,1900)||"لا توجد رسائل نصية.",ephemeral:true});
      }
      case "announce": {
        const ch = i.options.getChannel("channel");
        await ch.send({embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle("📢 إعلان إداري").setDescription(text).setTimestamp()]});
        return i.reply({content:"✅ تم إرسال الإعلان.",ephemeral:true});
      }
      case "say":
        await i.channel.send(text);
        return i.reply({content:"✅ تم إرسال الرسالة.",ephemeral:true});
      case "embed":
        await i.channel.send({embeds:[new EmbedBuilder().setColor(0x5865F2).setDescription(text)]});
        return i.reply({content:"✅ تم إرسال Embed.",ephemeral:true});
      case "poll": {
        const msg = await i.channel.send(`📊 **تصويت إداري**\n${text}`);
        await msg.react("👍"); await msg.react("👎");
        return i.reply({content:"✅ تم إنشاء التصويت.",ephemeral:true});
      }
      case "reportview":
        return i.reply({content:"لا توجد بلاغات محفوظة بشكل منفصل في هذه النسخة.",ephemeral:true});
      case "suggestview":
        return i.reply({content:"لا توجد اقتراحات محفوظة بشكل منفصل في هذه النسخة.",ephemeral:true});
      case "cleanbots": {
        const msgs = await i.channel.messages.fetch({limit:100});
        const deleted = await i.channel.bulkDelete(msgs.filter(m=>m.author.bot),true);
        return i.reply({content:`🧹 تم حذف ${deleted.size} رسالة من البوتات.`,ephemeral:true});
      }
      case "cleanwebhooks": {
        const msgs = await i.channel.messages.fetch({limit:100});
        const deleted = await i.channel.bulkDelete(msgs.filter(m=>m.webhookId),true);
        return i.reply({content:`🧹 تم حذف ${deleted.size} رسالة Webhook.`,ephemeral:true});
      }
      case "pruneinactive":
        return i.reply({content:"ℹ️ استخدم إعدادات أعضاء Discord لمراجعة الأعضاء غير النشطين قبل الطرد.",ephemeral:true});
      case "setverification":
      case "verificationstatus":
        return i.reply({content:"ℹ️ التحقق يحتاج إعدادات إضافية مثل قناة تحقق أو دور Verified؛ لم يتم تفعيله تلقائيًا هنا.",ephemeral:true});
      case "resetprotection":
        s.antispam=true; s.antilink=true; s.antiinvite=true; s.antimention=true;
        return i.reply("✅ تمت إعادة إعدادات الحماية الافتراضية.");
      case "listbans": {
        const bans = await guild.bans.fetch();
        return i.reply({content:bans.map(b=>`${b.user.tag} — ${b.user.id}`).slice(0,30).join("\n")||"قائمة الحظر فارغة.",ephemeral:true});
      }
      default:
        return i.reply({content:"هذا الأمر مسجل، لكن وظيفته غير مفعّلة بالكامل في هذه النسخة.",ephemeral:true});
    }
  } catch (e) {
    console.error(e);
    const reply = {content:"❌ حدث خطأ. تأكد من صلاحيات البوت ورتبته وإعدادات الأمر.",ephemeral:true};
    if (i.deferred) await i.editReply(reply).catch(()=>{});
    else if (i.replied) await i.followUp(reply).catch(()=>{});
    else await i.reply(reply).catch(()=>{});
  }
});

client.login(TOKEN);
