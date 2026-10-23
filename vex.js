
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const DEFAULT_CATEGORY = process.env.TICKET_CATEGORY_ID || "";
const DEFAULT_SUPPORT_ROLE = process.env.SUPPORT_ROLE_ID || "";

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  throw new Error("Missing DISCORD_TOKEN, CLIENT_ID or GUILD_ID in GitHub Secrets.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const rest = new REST({ version: "10" }).setToken(TOKEN);

const definitions = [
  ["help", "عرض قائمة الأوامر"],
  ["ping", "فحص سرعة البوت"],
  ["server", "معلومات السيرفر"],
  ["servericon", "صورة السيرفر"],
  ["membercount", "عدد أعضاء السيرفر"],
  ["userinfo", "معلومات عضو"],
  ["avatar", "صورة عضو"],
  ["botinfo", "معلومات البوت"],
  ["roles", "قائمة الرتب"],
  ["channels", "قائمة الرومات"],
  ["channelinfo", "معلومات روم"],
  ["roleinfo", "معلومات رتبة"],
  ["uptime", "مدة تشغيل البوت"],
  ["invite", "رابط دعوة البوت"],
  ["invites", "عدد دعوات عضو"],
  ["inviteleaderboard", "ترتيب الدعوات"],
  ["warn", "تحذير عضو"],
  ["warnings", "عرض التحذيرات"],
  ["warnclear", "مسح تحذيرات عضو"],
  ["kick", "طرد عضو"],
  ["ban", "حظر عضو"],
  ["unban", "إلغاء حظر عضو"],
  ["timeout", "إعطاء عضو مهلة"],
  ["untimeout", "إزالة المهلة"],
  ["clear", "حذف رسائل"],
  ["slowmode", "تحديد الوضع البطيء"],
  ["lock", "قفل الروم"],
  ["unlock", "فتح الروم"],
  ["hide", "إخفاء الروم"],
  ["show", "إظهار الروم"],
  ["nickname", "تغيير لقب عضو"],
  ["roleadd", "إعطاء رتبة لعضو"],
  ["roleremove", "سحب رتبة من عضو"],
  ["announce", "إرسال إعلان"],
  ["say", "إرسال رسالة"],
  ["poll", "إنشاء تصويت"],
  ["embed", "إنشاء رسالة Embed"],
  ["report", "إرسال بلاغ للإدارة"],
  ["suggest", "إرسال اقتراح"],
  ["setlog", "تحديد روم السجلات"],
  ["logs", "عرض آخر السجلات"],
  ["modlogs", "عرض سجلات عضو"],
  ["ticketpanel", "إنشاء لوحة التكتات"],
  ["ticketclose", "إغلاق التكت"],
  ["ticketclaim", "استلام التكت"],
  ["ticketadd", "إضافة عضو للتكت"],
  ["ticketremove", "إزالة عضو من التكت"],
  ["ticketsetup", "إعداد نظام التكتات"],
  ["antispam", "تفعيل أو تعطيل حماية السبام"],
  ["antilink", "تفعيل أو تعطيل حماية الروابط"],
  ["protection", "عرض إعدادات الحماية"],
  ["lockdown", "تفعيل إغلاق السيرفر"],
  ["unlockdown", "إلغاء إغلاق السيرفر"],
  ["purge", "حذف رسائل عضو"],
  ["remind", "إنشاء تذكير"],
  ["choose", "اختيار عشوائي"],
  ["coinflip", "رمي العملة"],
  ["dice", "رمي النرد"],
  ["reverse", "عكس النص"],
  ["calculator", "آلة حاسبة"]
];

const option = {
  user: (b, name = "user", desc = "العضو") =>
    b.addUserOption(o => o.setName(name).setDescription(desc).setRequired(true)),
  reason: b =>
    b.addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(true)),
  text: (b, name = "text", desc = "النص") =>
    b.addStringOption(o => o.setName(name).setDescription(desc).setRequired(true)),
  channel: b =>
    b.addChannelOption(o => o.setName("channel").setDescription("الروم").setRequired(true)),
  role: b =>
    b.addRoleOption(o => o.setName("role").setDescription("الرتبة").setRequired(true))
};

const commands = definitions.map(([name, description]) => {
  const b = new SlashCommandBuilder().setName(name).setDescription(description);

  switch (name) {
    case "userinfo":
    case "avatar":
    case "invites":
    case "warnings":
    case "warnclear":
    case "untimeout":
    case "purge":
    case "modlogs":
      b.addUserOption(o => o.setName("user").setDescription("العضو").setRequired(name === "warnclear" || name === "untimeout" || name === "purge"));
      break;
    case "channelinfo":
      b.addChannelOption(o => o.setName("channel").setDescription("الروم").setRequired(true));
      break;
    case "roleinfo":
      option.role(b);
      break;
    case "warn":
      option.user(b);
      option.reason(b);
      break;
    case "kick":
    case "ban":
      option.user(b);
      option.reason(b);
      break;
    case "unban":
      b.addStringOption(o => o.setName("user_id").setDescription("ID العضو").setRequired(true));
      break;
    case "timeout":
      option.user(b);
      b.addIntegerOption(o => o.setName("minutes").setDescription("عدد الدقائق").setRequired(true).setMinValue(1).setMaxValue(40320));
      b.addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(false));
      break;
    case "clear":
      b.addIntegerOption(o => o.setName("amount").setDescription("عدد الرسائل").setRequired(true).setMinValue(1).setMaxValue(100));
      break;
    case "slowmode":
      b.addIntegerOption(o => o.setName("seconds").setDescription("عدد الثواني").setRequired(true).setMinValue(0).setMaxValue(21600));
      break;
    case "nickname":
      option.user(b);
      b.addStringOption(o => o.setName("nickname").setDescription("اللقب الجديد").setRequired(true));
      break;
    case "roleadd":
    case "roleremove":
      option.user(b);
      option.role(b);
      break;
    case "announce":
      option.channel(b);
      option.text(b);
      break;
    case "say":
    case "report":
    case "suggest":
      option.text(b);
      break;
    case "poll":
      b.addStringOption(o => o.setName("question").setDescription("سؤال التصويت").setRequired(true));
      b.addStringOption(o => o.setName("option1").setDescription("الخيار الأول").setRequired(true));
      b.addStringOption(o => o.setName("option2").setDescription("الخيار الثاني").setRequired(true));
      break;
    case "embed":
      b.addStringOption(o => o.setName("title").setDescription("العنوان").setRequired(true));
      b.addStringOption(o => o.setName("description").setDescription("الوصف").setRequired(true));
      break;
    case "setlog":
      option.channel(b);
      break;
    case "ticketadd":
    case "ticketremove":
      option.user(b);
      break;
    case "ticketsetup":
      b.addChannelOption(o => o.setName("category").setDescription("كاتيجوري التكتات").addChannelTypes(ChannelType.GuildCategory).setRequired(true));
      option.role(b, "support_role", "رتبة الدعم");
      break;
    case "antispam":
    case "antilink":
      b.addBooleanOption(o => o.setName("enabled").setDescription("تشغيل الحماية؟").setRequired(true));
      break;
    case "purge":
      option.user(b);
      b.addIntegerOption(o => o.setName("amount").setDescription("عدد الرسائل").setRequired(true).setMinValue(1).setMaxValue(100));
      break;
    case "remind":
      b.addIntegerOption(o => o.setName("minutes").setDescription("بعد كم دقيقة؟").setRequired(true).setMinValue(1).setMaxValue(10080));
      option.text(b);
      break;
    case "choose":
      option.text(b, "options", "الخيارات مفصولة بفواصل");
      break;
    case "calculator":
      option.text(b, "expression", "مثال: 12*5+3");
      break;
  }

  return b.toJSON();
});

const warnings = new Map();
const logs = new Map();
const inviteCounts = new Map();
const inviteCache = new Map();
const spamCache = new Map();
const linkWarnings = new Map();
const guildSettings = new Map();

const startedAt = Date.now();

function getSettings(guildId) {
  if (!guildSettings.has(guildId)) {
    guildSettings.set(guildId, {
      antiSpam: true,
      antiLink: true,
      category: DEFAULT_CATEGORY,
      supportRole: DEFAULT_SUPPORT_ROLE,
      logChannel: null,
      lockdown: false
    });
  }
  return guildSettings.get(guildId);
}

function isStaff(i) {
  return Boolean(
    i.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
    i.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
    i.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)
  );
}

function requireStaff(i) {
  if (isStaff(i)) return true;
  i.reply({ content: "❌ هذا الأمر للإدارة فقط.", ephemeral: true }).catch(() => {});
  return false;
}

async function logAction(guild, text) {
  const settings = getSettings(guild.id);
  const channelId = settings.logChannel;
  if (channelId) {
    const channel = guild.channels.cache.get(channelId);
    if (channel?.isTextBased()) {
      await channel.send({ content: `📋 ${text}` }).catch(() => {});
    }
  }
  const list = logs.get(guild.id) || [];
  list.unshift({ text, time: Date.now() });
  logs.set(guild.id, list.slice(0, 100));
}

function addWarning(guildId, userId, reason, moderator) {
  const list = warnings.get(`${guildId}:${userId}`) || [];
  list.push({ reason, moderator, time: Date.now() });
  warnings.set(`${guildId}:${userId}`, list);
  return list.length;
}

function getTicketOwner(channel) {
  const match = channel?.topic?.match(/ticket-owner:(\d+)/);
  return match?.[1] || null;
}

async function createTicket(i, type) {
  const settings = getSettings(i.guild.id);
  const category = settings.category;
  const supportRole = settings.supportRole;

  const existing = i.guild.channels.cache.find(
    c => c.type === ChannelType.GuildText && c.topic === `ticket-owner:${i.user.id}`
  );

  if (existing) {
    return i.reply({ content: `عندك تكت مفتوح بالفعل: ${existing}`, ephemeral: true });
  }

  await i.deferReply({ ephemeral: true });

  const overwrites = [
    { id: i.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: i.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles
      ]
    },
    {
      id: client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ReadMessageHistory
      ]
    }
  ];

  if (supportRole) {
    overwrites.push({
      id: supportRole,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory
      ]
    });
  }

  const channel = await i.guild.channels.create({
    name: `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 90),
    type: ChannelType.GuildText,
    parent: category || undefined,
    topic: `ticket-owner:${i.user.id}`,
    permissionOverwrites: overwrites
  });

  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle("🎫 تكت جديد")
    .setDescription(
      `مرحبًا ${i.user}!\n\n**نوع التكت:** ${type}\nاشرح طلبك بالتفصيل وانتظر فريق الدعم.`
    )
    .setFooter({ text: "VEX Guard • Ticket System" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket_claim").setLabel("استلام التكت").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("ticket_close").setLabel("إغلاق التكت").setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: supportRole ? `<@&${supportRole}> ${i.user}` : `${i.user}`,
    embeds: [embed],
    components: [row]
  });

  await i.editReply({ content: `✅ تم فتح التكت: ${channel}` });
  await logAction(i.guild, `فتح ${i.user.tag} تكت ${type} في #${channel.name}`);
}

client.once(Events.ClientReady, async () => {
  console.log(`🛡️ ${client.user.tag} يعمل الآن.`);

  try {
    // استبدال أوامر السيرفر القديمة بالقائمة الجديدة كاملة.
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log(`✅ تم حذف الأوامر القديمة واستبدالها بـ ${commands.length} أمرًا في السيرفر المحدد.`);
  } catch (error) {
    console.error("❌ فشل تسجيل الأوامر:", error);
  }

  for (const guild of client.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch();
      inviteCache.set(guild.id, new Map(invites.map(inv => [inv.code, inv.uses || 0])));
    } catch {}
  }
});

client.on(Events.InviteCreate, async invite => {
  try {
    const invites = await invite.guild.invites.fetch();
    inviteCache.set(invite.guild.id, new Map(invites.map(inv => [inv.code, inv.uses || 0])));
  } catch {}
});

client.on(Events.GuildMemberAdd, async member => {
  try {
    const before = inviteCache.get(member.guild.id) || new Map();
    const current = await member.guild.invites.fetch();
    const used = current.find(inv => (inv.uses || 0) > (before.get(inv.code) || 0));

    inviteCache.set(member.guild.id, new Map(current.map(inv => [inv.code, inv.uses || 0])));

    if (used?.inviter) {
      const key = `${member.guild.id}:${used.inviter.id}`;
      inviteCounts.set(key, (inviteCounts.get(key) || 0) + 1);
      await logAction(member.guild, `${member.user.tag} دخل بدعوة ${used.inviter.tag}`);
    }
  } catch {}
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot || !message.member) return;

  const settings = getSettings(message.guild.id);
  const staff = message.member.permissions.has(PermissionFlagsBits.Administrator) ||
    message.member.permissions.has(PermissionFlagsBits.ManageMessages);

  if (staff) return;

  if (settings.antiLink && /(https?:\/\/|www\.|discord\.gg\/)/i.test(message.content)) {
    await message.delete().catch(() => {});
    const key = `${message.guild.id}:${message.author.id}`;
    const count = (linkWarnings.get(key) || 0) + 1;
    linkWarnings.set(key, count);

    await message.channel.send({
      content: `⚠️ ${message.author} الروابط ممنوعة هنا. تحذير ${count}/3.`
    }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000)).catch(() => {});

    if (count >= 3) {
      await message.member.timeout(10 * 60 * 1000, "تكرار إرسال الروابط").catch(() => {});
      linkWarnings.set(key, 0);
      await logAction(message.guild, `تم إعطاء مهلة لـ ${message.author.tag} بسبب تكرار الروابط.`);
    }
    return;
  }

  if (settings.antiSpam) {
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const recent = (spamCache.get(key) || []).filter(t => now - t < 5000);
    recent.push(now);
    spamCache.set(key, recent);

    if (recent.length >= 5) {
      const messages = await message.channel.messages.fetch({ limit: 30 }).catch(() => null);
      if (messages) {
        const own = messages.filter(m => m.author.id === message.author.id && now - m.createdTimestamp < 5000);
        await message.channel.bulkDelete(own, true).catch(() => {});
      }
      await message.member.timeout(10 * 60 * 1000, "سبام").catch(() => {});
      spamCache.set(key, []);
      await logAction(message.guild, `تمت معاقبة ${message.author.tag} بسبب السبام.`);
    }
  }
});

client.on(Events.InteractionCreate, async i => {
  try {
    if (i.isButton()) {
      if (["ticket_support", "ticket_help", "ticket_purchase"].includes(i.customId)) {
        const type = {
          ticket_support: "الدعم",
          ticket_help: "المساعدة",
          ticket_purchase: "الشراء"
        }[i.customId];
        return await createTicket(i, type);
      }

      if (i.customId === "ticket_close") {
        const owner = getTicketOwner(i.channel);
        if (owner !== i.user.id && !isStaff(i)) {
          return i.reply({ content: "❌ صاحب التكت أو الإدارة فقط يمكنهم إغلاقه.", ephemeral: true });
        }
        await i.reply({ content: "🔒 سيتم إغلاق التكت بعد 3 ثوانٍ." });
        await logAction(i.guild, `${i.user.tag} أغلق التكت #${i.channel.name}`);
        setTimeout(() => i.channel.delete().catch(() => {}), 3000);
        return;
      }

      if (i.customId === "ticket_claim") {
        if (!isStaff(i)) return i.reply({ content: "❌ هذا الزر للإدارة فقط.", ephemeral: true });
        return i.reply({ content: `✅ تم استلام التكت بواسطة ${i.user}.` });
      }
    }

    if (!i.isChatInputCommand()) return;

    const { commandName: cmd, guild, member, channel } = i;
    const settings = getSettings(guild.id);
    const user = i.options.getUser("user");
    const reason = i.options.getString("reason") || "لم يتم تحديد سبب";

    const staffCommands = [
      "warn", "warnings", "warnclear", "kick", "ban", "unban", "timeout",
      "untimeout", "clear", "slowmode", "lock", "unlock", "hide", "show",
      "nickname", "roleadd", "roleremove", "setlog", "modlogs", "ticketpanel",
      "ticketclose", "ticketclaim", "ticketadd", "ticketremove", "ticketsetup",
      "antispam", "antilink", "lockdown", "unlockdown", "purge", "announce",
      "say", "embed", "logs"
    ];

    if (staffCommands.includes(cmd) && !requireStaff(i)) return;

    switch (cmd) {
      case "help":
        return i.reply({
          embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle("🛡️ VEX Guard").setDescription(
            definitions.map(([n, d]) => `\`/${n}\` — ${d}`).join("\n")
          )],
          ephemeral: true
        });

      case "ping":
        return i.reply(`🏓 Pong! ${client.ws.ping}ms`);

      case "server":
        return i.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(guild.name).setDescription(
          `الأعضاء: ${guild.memberCount}\nالرومات: ${guild.channels.cache.size}\nالرتب: ${guild.roles.cache.size}`
        )] });

      case "servericon":
        return i.reply(guild.iconURL({ size: 1024 }) || "لا توجد صورة للسيرفر.");

      case "membercount":
        return i.reply(`👥 عدد الأعضاء: **${guild.memberCount}**`);

      case "userinfo": {
        const target = user || i.user;
        const m = await guild.members.fetch(target.id).catch(() => null);
        return i.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(target.tag)
          .setThumbnail(target.displayAvatarURL())
          .setDescription(`ID: ${target.id}\nتاريخ إنشاء الحساب: <t:${Math.floor(target.createdTimestamp / 1000)}:D>\nتاريخ دخول السيرفر: ${m ? `<t:${Math.floor(m.joinedTimestamp / 1000)}:D>` : "غير معروف"}`)] });
      }

      case "avatar": {
        const target = user || i.user;
        return i.reply(target.displayAvatarURL({ size: 1024 }));
      }

      case "botinfo":
        return i.reply(`🤖 ${client.user.tag}\nالأعضاء في السيرفر الحالي: ${guild.memberCount}\nمدة التشغيل: ${Math.floor((Date.now() - startedAt) / 1000)} ثانية`);

      case "roles":
        return i.reply(guild.roles.cache.map(r => r.name).slice(0, 80).join("، ") || "لا توجد رتب.");

      case "channels":
        return i.reply(guild.channels.cache.map(c => c.name).slice(0, 80).join("، ") || "لا توجد رومات.");

      case "channelinfo": {
        const c = i.options.getChannel("channel");
        return i.reply(`الروم: ${c.name}\nID: ${c.id}\nالنوع: ${c.type}`);
      }

      case "roleinfo": {
        const r = i.options.getRole("role");
        return i.reply(`الرتبة: ${r.name}\nID: ${r.id}\nعدد الأعضاء: ${r.members.size}`);
      }

      case "uptime":
        return i.reply(`⏱️ مدة التشغيل: ${Math.floor((Date.now() - startedAt) / 60000)} دقيقة.`);

      case "invite":
        return i.reply(`رابط دعوة البوت: https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=8&scope=bot%20applications.commands`);

      case "invites": {
        const target = user || i.user;
        return i.reply(`📨 دعوات ${target}: **${inviteCounts.get(`${guild.id}:${target.id}`) || 0}**`);
      }

      case "inviteleaderboard": {
        const rows = [...inviteCounts.entries()]
          .filter(([k]) => k.startsWith(`${guild.id}:`))
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([k, v], n) => `${n + 1}. <@${k.split(":")[1]}> — ${v}`)
          .join("\n");
        return i.reply(rows || "لا توجد بيانات دعوات حتى الآن.");
      }

      case "warn": {
        const count = addWarning(guild.id, user.id, reason, i.user.tag);
        await logAction(guild, `${i.user.tag} حذّر ${user.tag}: ${reason}`);
        return i.reply(`⚠️ تم تحذير ${user}. عدد التحذيرات: ${count}`);
      }

      case "warnings": {
        const target = user || i.user;
        const list = warnings.get(`${guild.id}:${target.id}`) || [];
        return i.reply({ content: list.length ? list.map((w, n) => `${n + 1}. ${w.reason} — بواسطة ${w.moderator}`).join("\n") : "لا توجد تحذيرات مسجلة.", ephemeral: true });
      }

      case "warnclear": {
        const target = i.options.getUser("user");
        warnings.delete(`${guild.id}:${target.id}`);
        await logAction(guild, `${i.user.tag} مسح تحذيرات ${target.tag}`);
        return i.reply(`✅ تم مسح تحذيرات ${target}.`);
      }

      case "kick": {
        const target = await guild.members.fetch(user.id);
        await target.kick(reason);
        await logAction(guild, `${i.user.tag} طرد ${user.tag}: ${reason}`);
        return i.reply(`✅ تم طرد ${user.tag}.`);
      }

      case "ban": {
        await guild.members.ban(user.id, { reason });
        await logAction(guild, `${i.user.tag} حظر ${user.tag}: ${reason}`);
        return i.reply(`✅ تم حظر ${user.tag}.`);
      }

      case "unban": {
        const id = i.options.getString("user_id");
        await guild.members.unban(id);
        await logAction(guild, `${i.user.tag} ألغى حظر ${id}`);
        return i.reply(`✅ تم إلغاء حظر ${id}.`);
      }

      case "timeout": {
        const target = await guild.members.fetch(user.id);
        const minutes = i.options.getInteger("minutes");
        await target.timeout(minutes * 60000, reason);
        await logAction(guild, `${i.user.tag} أعطى ${user.tag} مهلة ${minutes} دقيقة`);
        return i.reply(`✅ تم إعطاء ${user} مهلة ${minutes} دقيقة.`);
      }

      case "untimeout": {
        const target = await guild.members.fetch(user.id);
        await target.timeout(null);
        await logAction(guild, `${i.user.tag} أزال المهلة عن ${user.tag}`);
        return i.reply(`✅ تمت إزالة المهلة عن ${user}.`);
      }

      case "clear":
      case "purge": {
        const amount = i.options.getInteger("amount");
        const target = cmd === "purge" ? i.options.getUser("user") : null;
        const messages = await channel.messages.fetch({ limit: 100 });
        const filtered = target ? messages.filter(m => m.author.id === target.id).first(amount) : messages.first(amount);
        const deleted = await channel.bulkDelete(filtered, true);
        return i.reply({ content: `🧹 تم حذف ${deleted.size} رسالة.`, ephemeral: true });
      }

      case "slowmode": {
        await channel.setRateLimitPerUser(i.options.getInteger("seconds"));
        return i.reply("✅ تم تحديث الوضع البطيء.");
      }

      case "lock":
      case "unlock": {
        await channel.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: cmd === "unlock"
        });
        return i.reply(cmd === "lock" ? "🔒 تم قفل الروم." : "🔓 تم فتح الروم.");
      }

      case "hide":
      case "show": {
        await channel.permissionOverwrites.edit(guild.roles.everyone, {
          ViewChannel: cmd === "show"
        });
        return i.reply(cmd === "hide" ? "🙈 تم إخفاء الروم." : "👁️ تم إظهار الروم.");
      }

      case "nickname": {
        const target = await guild.members.fetch(user.id);
        await target.setNickname(i.options.getString("nickname"));
        return i.reply(`✅ تم تغيير لقب ${user}.`);
      }

      case "roleadd":
      case "roleremove": {
        const target = await guild.members.fetch(user.id);
        const role = i.options.getRole("role");
        if (cmd === "roleadd") await target.roles.add(role);
        else await target.roles.remove(role);
        return i.reply(`✅ تم ${cmd === "roleadd" ? "إعطاء" : "سحب"} رتبة ${role} من ${user}.`);
      }

      case "announce": {
        const c = i.options.getChannel("channel");
        const text = i.options.getString("text");
        await c.send({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle("📢 إعلان").setDescription(text).setTimestamp()] });
        return i.reply({ content: "✅ تم إرسال الإعلان.", ephemeral: true });
      }

      case "say":
        await channel.send(i.options.getString("text"));
        return i.reply({ content: "✅ تم إرسال الرسالة.", ephemeral: true });

      case "poll": {
        const question = i.options.getString("question");
        const a = i.options.getString("option1");
        const b = i.options.getString("option2");
        const msg = await channel.send(`📊 **${question}**\n\n👍 ${a}\n👎 ${b}`);
        await msg.react("👍");
        await msg.react("👎");
        return i.reply({ content: "✅ تم إنشاء التصويت.", ephemeral: true });
      }

      case "embed": {
        const embed = new EmbedBuilder().setColor(0x5865F2)
          .setTitle(i.options.getString("title"))
          .setDescription(i.options.getString("description"))
          .setTimestamp();
        await channel.send({ embeds: [embed] });
        return i.reply({ content: "✅ تم إرسال Embed.", ephemeral: true });
      }

      case "report":
        await logAction(guild, `بلاغ من ${i.user.tag}: ${i.options.getString("text")}`);
        return i.reply({ content: "✅ تم إرسال البلاغ للإدارة.", ephemeral: true });

      case "suggest":
        await logAction(guild, `اقتراح من ${i.user.tag}: ${i.options.getString("text")}`);
        return i.reply({ content: "✅ تم إرسال الاقتراح.", ephemeral: true });

      case "setlog": {
        const c = i.options.getChannel("channel");
        settings.logChannel = c.id;
        return i.reply(`✅ تم تحديد روم السجلات: ${c}`);
      }

      case "logs": {
        const list = logs.get(guild.id) || [];
        return i.reply({ content: list.slice(0, 10).map(x => x.text).join("\n") || "لا توجد سجلات.", ephemeral: true });
      }

      case "modlogs": {
        const target = user || i.user;
        const list = logs.get(guild.id) || [];
        const found = list.filter(x => x.text.includes(target.tag) || x.text.includes(target.id));
        return i.reply({ content: found.slice(0, 10).map(x => x.text).join("\n") || "لا توجد سجلات لهذا العضو.", ephemeral: true });
      }

      case "ticketpanel": {
        const embed = new EmbedBuilder().setColor(0x5865F2)
          .setTitle("🎫 مركز التذاكر")
          .setDescription("اختر نوع التكت المناسب لك وسيقوم فريق الدعم بمساعدتك.");
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ticket_support").setLabel("الدعم").setEmoji("🛠️").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("ticket_help").setLabel("المساعدة").setEmoji("❓").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("ticket_purchase").setLabel("الشراء").setEmoji("🛒").setStyle(ButtonStyle.Secondary)
        );
        await channel.send({ embeds: [embed], components: [row] });
        return i.reply({ content: "✅ تم إنشاء لوحة التكتات.", ephemeral: true });
      }

      case "ticketclose": {
        const owner = getTicketOwner(channel);
        if (!owner) return i.reply({ content: "❌ هذا الروم ليس تكتًا.", ephemeral: true });
        if (owner !== i.user.id && !isStaff(i)) return i.reply({ content: "❌ ليس لديك صلاحية إغلاق هذا التكت.", ephemeral: true });
        await i.reply("🔒 سيتم حذف التكت بعد 3 ثوانٍ.");
        setTimeout(() => channel.delete().catch(() => {}), 3000);
        return;
      }

      case "ticketclaim":
        if (!getTicketOwner(channel)) return i.reply({ content: "❌ هذا الروم ليس تكتًا.", ephemeral: true });
        return i.reply(`✅ تم استلام التكت بواسطة ${i.user}.`);

      case "ticketadd":
      case "ticketremove": {
        if (!getTicketOwner(channel)) return i.reply({ content: "❌ هذا الروم ليس تكتًا.", ephemeral: true });
        const target = i.options.getUser("user");
        if (cmd === "ticketadd") {
          await channel.permissionOverwrites.edit(target.id, {
            ViewChannel: true, SendMessages: true, ReadMessageHistory: true
          });
        } else {
          await channel.permissionOverwrites.delete(target.id).catch(() => {});
        }
        return i.reply(`✅ تم ${cmd === "ticketadd" ? "إضافة" : "إزالة"} ${target}.`);
      }

      case "ticketsetup": {
        const category = i.options.getChannel("category");
        const role = i.options.getRole("support_role");
        settings.category = category.id;
        settings.supportRole = role.id;
        return i.reply("✅ تم إعداد نظام التكتات. أرسل `/ticketpanel` لإنشاء اللوحة.");
      }

      case "antispam":
        settings.antiSpam = i.options.getBoolean("enabled");
        return i.reply(`✅ حماية السبام: ${settings.antiSpam ? "مفعّلة" : "معطّلة"}.`);

      case "antilink":
        settings.antiLink = i.options.getBoolean("enabled");
        return i.reply(`✅ حماية الروابط: ${settings.antiLink ? "مفعّلة" : "معطّلة"}.`);

      case "protection":
        return i.reply(`🛡️ إعدادات الحماية\nالسبام: ${settings.antiSpam ? "مفعّل" : "معطّل"}\nالروابط: ${settings.antiLink ? "مفعّلة" : "معطّلة"}`);

      case "lockdown": {
        settings.lockdown = true;
        for (const c of guild.channels.cache.values()) {
          if (c.isTextBased() && c.permissionOverwrites) {
            await c.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(() => {});
          }
        }
        return i.reply("🔒 تم تفعيل الإغلاق العام للرومات النصية.");
      }

      case "unlockdown": {
        settings.lockdown = false;
        for (const c of guild.channels.cache.values()) {
          if (c.isTextBased() && c.permissionOverwrites) {
            await c.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null }).catch(() => {});
          }
        }
        return i.reply("🔓 تم إلغاء الإغلاق العام للرومات النصية.");
      }

      case "remind": {
        const minutes = i.options.getInteger("minutes");
        const text = i.options.getString("text");
        await i.reply(`⏰ سأذكّرك بعد ${minutes} دقيقة.`);
        setTimeout(() => i.user.send(`⏰ تذكيرك: ${text}`).catch(() => {}), minutes * 60000);
        return;
      }

      case "choose": {
        const choices = i.options.getString("options").split(",").map(s => s.trim()).filter(Boolean);
        return i.reply(choices.length ? `🎯 الاختيار: **${choices[Math.floor(Math.random() * choices.length)]}**` : "أدخل خيارات مفصولة بفواصل.");
      }

      case "coinflip":
        return i.reply(Math.random() < 0.5 ? "🪙 كتابة!" : "🪙 صورة!");

      case "dice":
        return i.reply(`🎲 النتيجة: **${Math.floor(Math.random() * 6) + 1}**`);

      case "reverse":
        return i.reply(i.options.getString("text").split("").reverse().join(""));

      case "calculator": {
        const expression = i.options.getString("expression");
        if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
          return i.reply({ content: "❌ التعبير يحتوي على رموز غير مسموحة.", ephemeral: true });
        }
        const result = Function(`"use strict"; return (${expression})`)();
        if (!Number.isFinite(result)) return i.reply("❌ تعذّر حساب التعبير.");
        return i.reply(`🧮 النتيجة: **${result}**`);
      }
    }
  } catch (error) {
    console.error(`Error in interaction:`, error);

    const reply = { content: "❌ حدث خطأ أثناء تنفيذ الأمر. تأكد من صلاحيات البوت وإعدادات السيرفر.", ephemeral: true };

    if (i.deferred) {
      await i.editReply(reply).catch(() => {});
    } else if (i.replied) {
      await i.followUp(reply).catch(() => {});
    } else {
      await i.reply(reply).catch(() => {});
    }
  }
});

client.login(TOKEN);
