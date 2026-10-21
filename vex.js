
const {
  Client, GatewayIntentBits, REST, Routes,
  SlashCommandBuilder, PermissionFlagsBits: P,
  ChannelType, EmbedBuilder, ActionRowBuilder,
  ButtonBuilder, ButtonStyle, PermissionFlagsBits
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || "";
const SUPPORT_ROLE_ID = process.env.SUPPORT_ROLE_ID || "";

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  throw new Error("أضف DISCORD_TOKEN و CLIENT_ID و GUILD_ID في متغيرات البيئة.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const definitions = [
  // 1-10 معلومات
  ["help","عرض الأوامر","none"],
  ["ping","فحص سرعة البوت","none"],
  ["server","معلومات السيرفر","none"],
  ["avatar","صورة الحساب","user"],
  ["userinfo","معلومات عضو","user"],
  ["botinfo","معلومات البوت","none"],
  ["membercount","عدد الأعضاء","none"],
  ["roles","عرض رتب السيرفر","none"],
  ["channelinfo","معلومات الروم","none"],
  ["servericon","أيقونة السيرفر","none"],

  // 11-55 ألعاب
  ["roll","رمي النرد","none"],
  ["coinflip","صورة أم كتابة","none"],
  ["rps","حجر ورقة مقص","choice"],
  ["guess","خمن رقمًا من 1 إلى 10","guess"],
  ["number","رقم عشوائي","none"],
  ["trivia","سؤال معلومات عامة","none"],
  ["quiz","اختبار سريع","none"],
  ["math","حساب نتيجة عملية","math"],
  ["dice","رمي نردين","none"],
  ["slots","لعبة الحظ","none"],
  ["choose","اختر بين الخيارات","text"],
  ["eightball","اسأل الكرة السحرية","text"],
  ["truth","سؤال صراحة","none"],
  ["dare","تحدي ممتع","none"],
  ["wouldyourather","هذا أم ذاك","none"],
  ["neverhaveiever","لعبة لم أفعل قط","none"],
  ["riddles","لغز عشوائي","none"],
  ["scramble","كلمة حروفها مختلطة","none"],
  ["memory","اختبار ذاكرة","none"],
  ["reaction","تحدي سرعة رد الفعل","none"],
  ["fasttype","تحدي الكتابة السريعة","none"],
  ["higherlower","أعلى أم أقل","none"],
  ["blackjack","بطاقات حظ بسيطة","none"],
  ["lottery","قرعة عشوائية","none"],
  ["roulette","عجلة حظ نصية","none"],
  ["rockpaper","حجر ورقة مقص عشوائي","none"],
  ["emojiquiz","خمن معنى الرموز","none"],
  ["flagquiz","تحدي أعلام الدول","none"],
  ["capitals","تحدي عواصم الدول","none"],
  ["animalquiz","معلومات عن الحيوانات","none"],
  ["footballquiz","أسئلة كرة القدم","none"],
  ["animequiz","أسئلة الأنمي","none"],
  ["gamingquiz","أسئلة الألعاب","none"],
  ["brawlstars","تحدي براول ستارز","none"],
  ["fortnite","تحدي فورتنايت","none"],
  ["minecraft","تحدي ماينكرافت","none"],
  ["efootball","تحدي إي فوتبول","none"],
  ["valorant","تحدي فالورانت","none"],
  ["chess","نصيحة شطرنج","none"],
  ["wordchain","تحدي الكلمات","none"],
  ["wordle","كلمة اليوم","none"],
  ["hangman","كلمة مخفية","none"],
  ["leaderboard","لوحة المتصدرين","none"],
  ["daily","مكافأة يومية تجريبية","none"],
  ["profile","ملف اللاعب التجريبي","none"],

  // 56-70 تفاعل
  ["joke","نكتة","none"],
  ["fact","معلومة عشوائية","none"],
  ["quote","اقتباس تحفيزي","none"],
  ["compliment","كلمة إيجابية لعضو","user"],
  ["roast","مزحة خفيفة","user"],
  ["rate","تقييم من 10","text"],
  ["ship","توافق عشوائي للمرح","two_users"],
  ["hug","إرسال تحية ودية","user"],
  ["highfive","تحية بالكف","user"],
  ["slap","مزحة تفاعلية","user"],
  ["meme","فكرة ميم","none"],
  ["cat","حقيقة عن القطط","none"],
  ["dog","حقيقة عن الكلاب","none"],
  ["advice","نصيحة عشوائية","none"],
  ["motivation","عبارة تحفيزية","none"],

  // 71-85 إدارة
  ["warn","تحذير عضو","user_reason",P.ModerateMembers],
  ["kick","طرد عضو","user_reason",P.KickMembers],
  ["ban","حظر عضو","user_reason",P.BanMembers],
  ["unban","فك حظر بمعرف العضو","unban",P.BanMembers],
  ["timeout","إعطاء مهلة","duration",P.ModerateMembers],
  ["untimeout","إزالة المهلة","user",P.ModerateMembers],
  ["clear","مسح الرسائل","integer",P.ManageMessages],
  ["slowmode","تحديد بطء الروم","integer",P.ManageChannels],
  ["lock","قفل الروم","none",P.ManageChannels],
  ["unlock","فتح الروم","none",P.ManageChannels],
  ["hide","إخفاء الروم","none",P.ManageChannels],
  ["show","إظهار الروم","none",P.ManageChannels],
  ["nickname","تغيير لقب عضو","nickname",P.ManageNicknames],
  ["roleadd","إعطاء رتبة","role",P.ManageRoles],
  ["roleremove","إزالة رتبة","role",P.ManageRoles],

  // 86-90 نظام التكت
  ["ticket-panel","إنشاء لوحة التكت","none",P.ManageChannels],
  ["ticket-close","إغلاق التكت الحالي","none"],
  ["ticket-add","إضافة عضو للتكت","user",P.ManageChannels],
  ["ticket-remove","إزالة عضو من التكت","user",P.ManageChannels],
  ["ticket-claim","استلام التكت الحالي","none",P.ManageChannels],

  // 91-100 أدوات
  ["say","إرسال رسالة","text",P.ManageMessages],
  ["poll","إنشاء تصويت","text"],
  ["announce","إرسال إعلان","text",P.ManageMessages],
  ["embed","إرسال Embed","embed",P.ManageMessages],
  ["report","إرسال بلاغ","text"],
  ["suggest","إرسال اقتراح","text"],
  ["reverse","عكس النص","text"],
  ["repeat","تكرار النص","text"],
  ["remind","إنشاء تذكير نصي","text"],
  ["support","معلومات الدعم","none"]
];

if (definitions.length !== 100) {
  throw new Error(`عدد الأوامر غير صحيح: ${definitions.length}`);
}

function buildCommand([name, description, kind, permission]) {
  const b = new SlashCommandBuilder()
    .setName(name)
    .setDescription(description);

  if (permission) b.setDefaultMemberPermissions(permission);

  if (["user", "user_reason", "duration", "role", "nickname"].includes(kind)) {
    b.addUserOption(o => o.setName("member").setDescription("اختر العضو").setRequired(true));
  }
  if (["user_reason"].includes(kind)) {
    b.addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(false));
  }
  if (kind === "duration") {
    b.addIntegerOption(o => o.setName("minutes").setDescription("المدة بالدقائق").setMinValue(1).setMaxValue(40320).setRequired(true));
    b.addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(false));
  }
  if (kind === "unban") {
    b.addStringOption(o => o.setName("user_id").setDescription("معرف العضو").setRequired(true));
  }
  if (kind === "integer") {
    b.addIntegerOption(o => o.setName("amount").setDescription("العدد أو الثواني").setMinValue(0).setMaxValue(100).setRequired(true));
  }
  if (kind === "guess") {
    b.addIntegerOption(o => o.setName("number").setDescription("خمن رقمًا بين 1 و10").setMinValue(1).setMaxValue(10).setRequired(true));
  }
  if (kind === "text") {
    b.addStringOption(o => o.setName("text").setDescription("اكتب النص أو الخيارات").setRequired(true));
  }
  if (kind === "choice") {
    b.addStringOption(o => o.setName("choice").setDescription("اختيارك").setRequired(true).addChoices(
      {name:"حجر",value:"حجر"},{name:"ورقة",value:"ورقة"},{name:"مقص",value:"مقص"}
    ));
  }
  if (kind === "math") {
    b.addIntegerOption(o => o.setName("a").setDescription("العدد الأول").setRequired(true));
    b.addIntegerOption(o => o.setName("b").setDescription("العدد الثاني").setRequired(true));
    b.addStringOption(o => o.setName("operation").setDescription("العملية").setRequired(true).addChoices(
      {name:"جمع",value:"add"},{name:"طرح",value:"subtract"},
      {name:"ضرب",value:"multiply"},{name:"قسمة",value:"divide"}
    ));
  }
  if (kind === "two_users") {
    b.addUserOption(o => o.setName("first").setDescription("العضو الأول").setRequired(true));
    b.addUserOption(o => o.setName("second").setDescription("العضو الثاني").setRequired(true));
  }
  if (kind === "role") {
    b.addRoleOption(o => o.setName("role").setDescription("الرتبة").setRequired(true));
  }
  if (kind === "nickname") {
    b.addStringOption(o => o.setName("nickname").setDescription("اللقب الجديد").setRequired(true));
  }
  if (kind === "embed") {
    b.addStringOption(o => o.setName("title").setDescription("عنوان الرسالة").setRequired(true));
    b.addStringOption(o => o.setName("description").setDescription("محتوى الرسالة").setRequired(true));
  }
  return b;
}

const commands = definitions.map(d => buildCommand(d).toJSON());

const pick = a => a[Math.floor(Math.random() * a.length)];
const questions = [
  "ما أفضل لعبة عندك؟", "من أفضل لاعب كرة قدم؟",
  "ما أفضل أنمي شاهدته؟", "ما هدفك القادم؟",
  "ما اللعبة التي تلعبها أكثر؟", "لو تسافر لأي بلد، ماذا تختار؟"
];
const riddles = [
  "ما الشيء الذي له أسنان ولا يعض؟ المشط.",
  "ما الشيء الذي يكتب ولا يقرأ؟ القلم.",
  "ما الشيء الذي كلما أخذت منه كبر؟ الحفرة."
];
const jokes = [
  "واحد نسى كلمة السر، الكمبيوتر قال له: حتى أنا نسيتها 😂",
  "لاعب دخل الامتحان بخطة 4-3-3 😂",
  "الكمبيوتر عطس، قالوا له: عندك فيروس؟ 😂"
];
const trivia = [
  "كم عدد أيام الأسبوع؟ 7.",
  "ما أكبر كوكب في المجموعة الشمسية؟ المشتري.",
  "كم عدد ألوان قوس قزح الشائعة؟ 7.",
  "ما عاصمة الجزائر؟ الجزائر العاصمة."
];

async function registerCommands() {
  console.log(`📤 تسجيل ${commands.length} أمرًا في سيرفر XR فقط...`);
  const rest = new REST({ version: "10", timeout: 120000 }).setToken(TOKEN);
  const result = await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log(`✅ تم تسجيل ${result.length} أمرًا داخل XR.`);
}

async function createTicket(i) {
  const guild = i.guild;
  const existing = guild.channels.cache.find(
    c => c.type === ChannelType.GuildText && c.topic === `ticket-owner:${i.user.id}`
  );
  if (existing) {
    return i.reply({ content: `عندك تكت مفتوح بالفعل: ${existing}`, ephemeral: true });
  }

  const overwrites = [
    { id: guild.roles.everyone.id, deny: [P.ViewChannel] },
    { id: i.user.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.AttachFiles] },
    { id: client.user.id, allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory, P.ManageChannels] }
  ];

  if (SUPPORT_ROLE_ID && guild.roles.cache.has(SUPPORT_ROLE_ID)) {
    overwrites.push({
      id: SUPPORT_ROLE_ID,
      allow: [P.ViewChannel, P.SendMessages, P.ReadMessageHistory]
    });
  }

  const channel = await guild.channels.create({
    name: `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 90),
    type: ChannelType.GuildText,
    topic: `ticket-owner:${i.user.id}`,
    parent: TICKET_CATEGORY_ID || undefined,
    permissionOverwrites: overwrites
  });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket:close").setLabel("إغلاق التكت").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("ticket:claim").setLabel("استلام التكت").setStyle(ButtonStyle.Success)
  );

  await channel.send({
    content: `مرحبًا ${i.user} 👋\nاكتب تفاصيل طلبك، وسيقوم فريق الدعم بمساعدتك.`,
    components: [row]
  });
  return i.reply({ content: `✅ تم فتح تكتك: ${channel}`, ephemeral: true });
}

async function closeTicket(i) {
  const channel = i.channel;
  if (!channel || channel.type !== ChannelType.GuildText || !channel.topic?.startsWith("ticket-owner:")) {
    return i.reply({ content: "❌ هذا الأمر يعمل داخل روم تكت فقط.", ephemeral: true });
  }

  const ownerId = channel.topic.slice("ticket-owner:".length);
  const isStaff = i.memberPermissions?.has(P.ManageChannels);
  if (i.user.id !== ownerId && !isStaff) {
    return i.reply({ content: "❌ فقط صاحب التكت أو الإدارة يمكنه إغلاقه.", ephemeral: true });
  }

  await i.reply("🔒 سيتم إغلاق التكت بعد 3 ثوانٍ.");
  setTimeout(() => channel.delete("Ticket closed").catch(() => {}), 3000);
}

client.once("ready", () => {
  console.log(`🛡️ ${client.user.tag} يعمل الآن.`);
  client.user.setActivity("XR | Games & Support");
});

client.on("interactionCreate", async i => {
  try {
    if (i.guildId && i.guildId !== GUILD_ID) {
      if (i.isRepliable()) {
        await i.reply({ content: "هذا البوت مخصص لسيرفر XR فقط.", ephemeral: true }).catch(() => {});
      }
      return;
    }

    if (i.isButton()) {
      if (i.customId === "ticket:create") return await createTicket(i);
      if (i.customId === "ticket:close") return await closeTicket(i);
      if (i.customId === "ticket:claim") {
        if (!i.channel?.topic?.startsWith("ticket-owner:")) {
          return i.reply({ content: "هذا ليس روم تكت.", ephemeral: true });
        }
        if (!i.memberPermissions?.has(P.ManageChannels)) {
          return i.reply({ content: "هذه الوظيفة لفريق الدعم فقط.", ephemeral: true });
        }
        await i.channel.send(`📌 تم استلام التكت بواسطة ${i.user}.`);
        return i.reply({ content: "✅ استلمت التكت.", ephemeral: true });
      }
      return;
    }

    if (!i.isChatInputCommand()) return;

    const name = i.commandName;
    const member = i.options.getUser("member");
    const text = i.options.getString("text");
    const reason = i.options.getString("reason") || "لم يُذكر سبب";

    if (name === "ticket-panel") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket:create").setLabel("فتح تكت").setEmoji("🎫").setStyle(ButtonStyle.Primary)
      );
      await i.channel.send({
        embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle("🎫 مركز الدعم | XR")
          .setDescription("اضغط الزر أدناه لفتح تكت خاص مع فريق الدعم.")],
        components: [row]
      });
      return i.reply({ content: "✅ تم إنشاء لوحة التكت.", ephemeral: true });
    }

    if (name === "ticket-close") return await closeTicket(i);

    if (name === "ticket-add" || name === "ticket-remove") {
      if (!i.channel?.topic?.startsWith("ticket-owner:")) {
        return i.reply({ content: "❌ استخدم هذا الأمر داخل روم تكت.", ephemeral: true });
      }
      const allow = name === "ticket-add";
      await i.channel.permissionOverwrites.edit(member.id, {
        ViewChannel: allow, SendMessages: allow, ReadMessageHistory: allow
      });
      return i.reply(allow ? `✅ أُضيف ${member} إلى التكت.` : `✅ أُزيل ${member} من التكت.`);
    }

    if (name === "ticket-claim") {
      if (!i.channel?.topic?.startsWith("ticket-owner:")) {
        return i.reply({ content: "❌ استخدم الأمر داخل تكت.", ephemeral: true });
      }
      await i.channel.send(`📌 استلم ${i.user} هذا التكت.`);
      return i.reply({ content: "✅ تم استلام التكت.", ephemeral: true });
    }

    // الإدارة
    if (name === "warn") {
      try { await member.send(`⚠️ تحذير في ${i.guild.name}. السبب: ${reason}`); } catch {}
      return i.reply(`⚠️ تم إصدار تحذير لـ ${member}. السبب: ${reason}`);
    }

    if (name === "kick" || name === "ban") {
      const target = await i.guild.members.fetch(member.id);
      if (name === "kick") {
        if (!target.kickable) return i.reply({ content: "لا أستطيع طرد هذا العضو بسبب ترتيب الرتب.", ephemeral: true });
        await target.kick(reason);
        return i.reply(`👢 تم طرد ${member.tag}. السبب: ${reason}`);
      }
      await i.guild.members.ban(member.id, { reason });
      return i.reply(`🔨 تم حظر ${member.tag}. السبب: ${reason}`);
    }

    if (name === "unban") {
      const id = i.options.getString("user_id");
      await i.guild.members.unban(id);
      return i.reply(`✅ تم فك الحظر عن ${id}.`);
    }

    if (name === "timeout" || name === "untimeout") {
      const target = await i.guild.members.fetch(member.id);
      if (!target.moderatable) return i.reply({ content: "لا أستطيع تعديل مهلة هذا العضو.", ephemeral: true });
      if (name === "timeout") {
        const minutes = i.options.getInteger("minutes");
        await target.timeout(minutes * 60000, reason);
        return i.reply(`⏳ تم إعطاء ${member} مهلة ${minutes} دقيقة.`);
      }
      await target.timeout(null);
      return i.reply(`✅ تمت إزالة المهلة عن ${member}.`);
    }

    if (name === "clear") {
      const n = i.options.getInteger("amount");
      if (n < 1 || n > 100) return i.reply({ content: "العدد يجب أن يكون من 1 إلى 100.", ephemeral: true });
      const deleted = await i.channel.bulkDelete(n, true);
      return i.reply({ content: `🧹 تم مسح ${deleted.size} رسالة. لا يمكن مسح الرسائل الأقدم من 14 يومًا بهذه الطريقة.`, ephemeral: true });
    }

    if (name === "slowmode") {
      const seconds = i.options.getInteger("amount");
      if (seconds > 21600) return i.reply({ content: "الحد الأقصى 21600 ثانية.", ephemeral: true });
      await i.channel.setRateLimitPerUser(seconds);
      return i.reply(`🐢 تم ضبط Slowmode على ${seconds} ثانية.`);
    }

    if (["lock","unlock","hide","show"].includes(name)) {
      const changes = {
        lock: { SendMessages: false },
        unlock: { SendMessages: null },
        hide: { ViewChannel: false },
        show: { ViewChannel: null }
      };
      await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, changes[name]);
      return i.reply(({lock:"🔒 تم قفل الروم.",unlock:"🔓 تم فتح الروم.",hide:"🙈 تم إخفاء الروم.",show:"👀 تم إظهار الروم."})[name]);
    }

    if (name === "nickname") {
      const m = await i.guild.members.fetch(member.id);
      await m.setNickname(i.options.getString("nickname"));
      return i.reply(`✅ تم تغيير لقب ${member}.`);
    }

    if (name === "roleadd" || name === "roleremove") {
      const role = i.options.getRole("role");
      const m = await i.guild.members.fetch(member.id);
      if (role.managed || role.position >= i.guild.members.me.roles.highest.position) {
        return i.reply({ content: "❌ رتبة البوت يجب أن تكون أعلى من الرتبة المطلوبة.", ephemeral: true });
      }
      if (name === "roleadd") await m.roles.add(role);
      else await m.roles.remove(role);
      return i.reply(`✅ تم ${name === "roleadd" ? "إعطاء" : "إزالة"} ${role} ${name === "roleadd" ? "إلى" : "من"} ${member}.`);
    }

    // معلومات
    if (name === "help") {
      const lines = definitions.map((d, idx) => `\`${idx + 1}. /${d[0]}\` — ${d[1]}`);
      return i.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle("VEX Guard | 100 أمر").setDescription(lines.join("\n").slice(0, 4000))], ephemeral: true });
    }
    if (name === "ping") return i.reply(`🏓 Ping: ${client.ws.ping}ms`);
    if (name === "server") return i.reply(`🏰 ${i.guild.name}\n👥 الأعضاء: ${i.guild.memberCount}\n🆔 ${i.guild.id}`);
    if (name === "membercount") return i.reply(`👥 عدد الأعضاء: ${i.guild.memberCount}`);
    if (name === "servericon") return i.reply(i.guild.iconURL({ size: 1024 }) || "لا توجد أيقونة.");
    if (name === "roles") return i.reply(`🎭 ${i.guild.roles.cache.map(r => r.name).slice(0, 40).join("، ")}`);
    if (name === "channelinfo") return i.reply(`📍 الروم: ${i.channel.name}\n🆔 ${i.channel.id}`);
    if (name === "botinfo") return i.reply(`🤖 ${client.user.tag}\n🏓 Ping: ${client.ws.ping}ms`);
    if (name === "avatar" || name === "userinfo") {
      const u = member || i.user;
      if (name === "avatar") return i.reply(u.displayAvatarURL({ size: 1024 }));
      const m = await i.guild.members.fetch(u.id).catch(() => null);
      return i.reply(`👤 ${u.tag}\n🆔 ${u.id}\n📅 الحساب: <t:${Math.floor(u.createdTimestamp / 1000)}:D>\n📥 انضم: ${m?.joinedTimestamp ? `<t:${Math.floor(m.joinedTimestamp / 1000)}:D>` : "غير متوفر"}`);
    }

    // الألعاب والأدوات
    const games = {
      roll: () => `🎲 النتيجة: ${1 + Math.floor(Math.random() * 6)}`,
      coinflip: () => `🪙 ${pick(["صورة","كتابة"])}`,
      number: () => `🔢 رقمك العشوائي: ${1 + Math.floor(Math.random() * 100)}`,
      trivia: () => `🧠 ${pick(trivia)}`,
      quiz: () => `❓ ${pick(trivia)}`,
      dice: () => `🎲 ${1 + Math.floor(Math.random()*6)} + ${1 + Math.floor(Math.random()*6)}`,
      slots: () => `🎰 ${pick(["🍒 🍋 🍒","⭐ ⭐ ⭐","🍇 🍒 🍋","💎 💎 💎","🍋 🍋 🍒"])}`,
      eightball: () => `🎱 ${pick(["نعم!","لا.","ربما 🤔","أكيد!","اسأل لاحقًا."])}`,
      truth: () => `💬 ${pick(["ما أكبر حلم عندك؟","ما أكثر شيء يضحكك؟","ما أفضل ذكرى عندك؟"])}`,
      dare: () => `🎯 ${pick(["قل شيئًا إيجابيًا عن صديق.","اذكر لعبتك المفضلة.","اكتب إيموجي يصف يومك."])}`,
      wouldyourather: () => `🤔 ${pick(["بلايستيشن أم PC؟","كرة القدم أم الألعاب؟","السفر أم البقاء بالبيت؟"])}`,
      neverhaveiever: () => `🙈 لم أفعل قط: ${pick(["نسيت واجبًا مدرسيًا.","لعبت حتى تأخرت.","ضحكت في وقت غير مناسب."])}`,
      riddles: () => `🧩 ${pick(riddles)}`,
      scramble: () => `🔤 كلمة للتحدي: ${pick(["مدرسة","حاسوب","مغامرة","كرة","صديق"])}`,
      memory: () => `🧠 احفظ هذه الرموز: ${pick(["⭐🍎🚀","🎮⚽🌙","🐱💎🔥"])}`,
      reaction: () => `⚡ تحدي سرعة: عندما ترى هذا الرمز اضغط عليه بأسرع ما تستطيع ${pick(["⚡","🎯","🚀"])}`,
      fasttype: () => `⌨️ اكتب بسرعة: **${pick(["VEX Guard","XR Server","Gaming Time"])}**`,
      higherlower: () => `📈 تخمين اليوم: الرقم التالي قد يكون أعلى أو أقل من ${1 + Math.floor(Math.random()*50)}!`,
      blackjack: () => `🃏 نقاطك: ${4 + Math.floor(Math.random()*17)} — لعبة حظ تجريبية.`,
      lottery: () => `🎟️ رقم القرعة: ${1 + Math.floor(Math.random()*999)}`,
      roulette: () => `🎡 ${pick(["أحمر","أسود","أخضر"])} — نتيجة عشوائية للمرح.`,
      rockpaper: () => `✊ ${pick(["حجر","ورقة","مقص"])}`,
      emojiquiz: () => `🧩 خمن المعنى: ${pick(["⚽🏆","🎮👑","🌙⭐","🐱❤️"])}`,
      flagquiz: () => `🏳️ خمن العلم: ${pick(["🇩🇿","🇯🇵","🇧🇷","🇫🇷","🇦🇷"])}`,
      capitals: () => `🌍 ما عاصمة ${pick(["الجزائر","فرنسا","اليابان","مصر","إيطاليا"])}؟`,
      animalquiz: () => `🐾 ${pick(["ما أسرع حيوان بري؟ الفهد.","ما الحيوان المعروف بملك الغابة؟ الأسد.","كم رجلًا للعنكبوت؟ ثمانية."])}`,
      footballquiz: () => `⚽ ${pick(["كم لاعبًا يبدأ به الفريق في الملعب؟ 11.","كم مدة المباراة الأساسية؟ 90 دقيقة.","ما اسم جائزة أفضل لاعب في العالم؟"])}`,
      animequiz: () => `🎌 سؤال أنمي: ${pick(["اذكر أنميًا من اختيارك.","من شخصيتك المفضلة؟","أي أنمي تنصح به؟"])}`,
      gamingquiz: () => `🎮 ${pick(["ما لعبتك المفضلة؟","ما أول لعبة لعبتها؟","أي منصة تفضل؟"])}`,
      brawlstars: () => `⭐ تحدي براول ستارز: ${pick(["اذكر أسطورتك المفضلة.","من أفضل Brawler عندك؟","كم كأسًا عندك؟"])}`,
      fortnite: () => `🎯 تحدي فورتنايت: ${pick(["ما أفضل مكان للهبوط؟","ما سلاحك المفضل؟","Solo أم Duo؟"])}`,
      minecraft: () => `⛏️ سؤال ماينكرافت: ${pick(["ما الذي تحتاجه لصناعة طاولة تصنيع؟","ما اسم العالم السفلي؟","ما الوحش الذي ينفجر؟"])}`,
      efootball: () => `⚽ تحدي إي فوتبول: ${pick(["من مهاجمك المفضل؟","أي خطة تلعب بها؟","من أفضل لاعب عندك؟"])}`,
      valorant: () => `🎯 تحدي فالورانت: ${pick(["من عميلك المفضل؟","ما دورك المفضل؟","أي خريطة تحب؟"])}`,
      chess: () => "♟️ نصيحة شطرنج: طوّر قطعك وسيطر على الوسط.",
      wordchain: () => `🔤 كلمة البداية: **${pick(["كتاب","كرة","شمس","بحر","لعبة"])}**`,
      wordle: () => `🟩 تحدي كلمة اليوم: حاول تخمين كلمة من ${pick([4,5,6])} أحرف.`,
      hangman: () => `🔡 كلمة مخفية للتحدي: ${pick(["ق _ م","ك _ ا ب","ل _ ع ب ة"])}`,
      leaderboard: () => "🏆 لوحة المتصدرين التجريبية: لا يوجد نظام نقاط محفوظ بعد.",
      daily: () => "🎁 هذه مكافأة يومية تجريبية؛ لا يتم حفظ الرصيد بين مرات التشغيل.",
      profile: () => `👤 ملف ${i.user.username}\n🏅 نقاط اللعب غير محفوظة في هذه النسخة.`,
      joke: () => `😂 ${pick(jokes)}`,
      fact: () => `💡 ${pick(["الأخطبوط له ثلاثة قلوب.","ضوء الشمس يستغرق نحو 8 دقائق للوصول إلى الأرض.","النحل يتواصل بحركات خاصة."])}`,
      quote: () => `✨ ${pick(["النجاح يبدأ بخطوة.","كل محاولة تعلمك شيئًا جديدًا.","استمر بالتقدم ولو قليلًا كل يوم."])}`,
      roast: () => `😄 مزحة خفيفة لـ ${member}: أنت أسطورة... بس أحيانًا تحتاج تحديثًا!`,
      meme: () => "😂 فكرة ميم: لما تقول آخر مباراة ثم تلعب خمس مباريات إضافية.",
      cat: () => "🐱 القطط تقضي جزءًا كبيرًا من يومها في الراحة.",
      dog: () => "🐶 الكلاب تتمتع بحاسة شم قوية جدًا.",
      advice: () => `💡 ${pick(["قسّم أهدافك إلى خطوات صغيرة.","خذ استراحة عند التعب.","تعلّم من أخطائك."])}`,
      motivation: () => "🔥 لا تستسلم؛ التقدم الصغير يظل تقدمًا.",
      support: () => "🛟 افتح تكت من لوحة الدعم للتواصل مع الإدارة."
    };

    if (name === "guess") {
      const n = i.options.getInteger("number");
      const answer = 1 + Math.floor(Math.random() * 10);
      return i.reply(n === answer ? `🎉 صحيح! الرقم ${answer}.` : `❌ الرقم كان ${answer}. حاول مجددًا!`);
    }
    if (name === "rps") {
      const mine = i.options.getString("choice");
      const bot = pick(["حجر","ورقة","مقص"]);
      const win = (mine === "حجر" && bot === "مقص") || (mine === "ورقة" && bot === "حجر") || (mine === "مقص" && bot === "ورقة");
      return i.reply(`أنت: ${mine}\nالبوت: ${bot}\n${mine === bot ? "تعادل!" : win ? "فزت! 🎉" : "حظ أوفر المرة القادمة!"}`);
    }
    if (name === "math") {
      const a = i.options.getInteger("a"), b = i.options.getInteger("b");
      const op = i.options.getString("operation");
      if (op === "divide" && b === 0) return i.reply({content:"لا يمكن القسمة على صفر.",ephemeral:true});
      const result = {add:a+b,subtract:a-b,multiply:a*b,divide:a/b}[op];
      return i.reply(`🧮 النتيجة: ${result}`);
    }
    if (name === "choose") {
      const choices = text.split(",").map(s => s.trim()).filter(Boolean);
      return i.reply(choices.length ? `🎯 الاختيار: **${pick(choices)}**` : "اكتب خيارات تفصل بينها بفواصل.");
    }
    if (name === "rate") return i.reply(`⭐ تقييم ${text}: ${Math.floor(Math.random()*11)}/10`);
    if (name === "ship") {
      const a = i.options.getUser("first"), b = i.options.getUser("second");
      return i.reply(`💖 نسبة التوافق بين ${a} و${b}: ${Math.floor(Math.random()*101)}% — للمرح فقط.`);
    }
    if (["compliment","hug","highfive","slap"].includes(name)) {
      const lines = {
        compliment:`🌟 ${member} شخص رائع!`,
        hug:`🤗 أرسل ${i.user} تحية ودية إلى ${member}.`,
        highfive:`🙌 تحية بالكف بين ${i.user} و${member}!`,
        slap:`😄 مزحة كرتونية خفيفة بين ${i.user} و${member}.`
      };
      return i.reply(lines[name]);
    }
    if (name === "say" || name === "repeat") {
      await i.channel.send(text);
      return i.reply({content:"✅ تم.",ephemeral:true});
    }
    if (name === "announce") {
      await i.channel.send(`📢 **إعلان XR**\n${text}`);
      return i.reply({content:"✅ تم نشر الإعلان.",ephemeral:true});
    }
    if (name === "poll") {
      const msg = await i.channel.send(`📊 **تصويت**\n${text}`);
      await msg.react("👍");
      await msg.react("👎");
      return i.reply({content:"✅ تم إنشاء التصويت.",ephemeral:true});
    }
    if (name === "embed") {
      await i.channel.send({embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle(i.options.getString("title")).setDescription(i.options.getString("description"))]});
      return i.reply({content:"✅ تم إرسال الرسالة.",ephemeral:true});
    }
    if (name === "reverse") return i.reply(text.split("").reverse().join(""));
    if (name === "report" || name === "suggest") {
      await i.channel.send(`📩 **${name === "report" ? "بلاغ" : "اقتراح"} من ${i.user}**\n${text}`);
      return i.reply({content:"✅ تم إرسال رسالتك في هذا الروم.",ephemeral:true});
    }
    if (name === "remind") return i.reply(`⏰ تذكيرك النصي: ${text}\nملاحظة: هذا الإصدار لا يرسل إشعارًا لاحقًا.`);
    if (games[name]) return i.reply(games[name]());

  } catch (err) {
    console.error(`خطأ في الأمر /${i.commandName}:`, err);
    const msg = "❌ حدث خطأ. تحقق من صلاحيات البوت وترتيب الرتب.";
    if (i.replied || i.deferred) {
      return i.followUp({content:msg,ephemeral:true}).catch(()=>{});
    }
    return i.reply({content:msg,ephemeral:true}).catch(()=>{});
  }
});

async function main() {
  try {
    await registerCommands();
    await client.login(TOKEN);
  } catch (err) {
    console.error("❌ تعذر تشغيل VEX Guard:", err.stack || err.message);
  }
}

main();
