
const {
  Client, GatewayIntentBits, REST, Routes,
  SlashCommandBuilder, PermissionFlagsBits,
  EmbedBuilder, ChannelType
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  throw new Error("❌ اضبط DISCORD_TOKEN و CLIENT_ID و GUILD_ID.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const P = PermissionFlagsBits;
const optUser = (b, name = "member") =>
  b.addUserOption(o => o.setName(name).setDescription("اختر العضو").setRequired(true));
const optText = (b, name = "text", required = true) =>
  b.addStringOption(o => o.setName(name).setDescription("اكتب النص").setRequired(required));
const optInt = (b, name, min, max) =>
  b.addIntegerOption(o => o.setName(name).setDescription("أدخل رقمًا").setMinValue(min).setMaxValue(max).setRequired(true));
const optRole = b =>
  b.addRoleOption(o => o.setName("role").setDescription("اختر الرتبة").setRequired(true));

function make(name, description, configure, permission) {
  const b = new SlashCommandBuilder().setName(name).setDescription(description);
  if (configure) configure(b);
  if (permission) b.setDefaultMemberPermissions(permission);
  return b;
}

// 50 أمرًا بالضبط
const commands = [
  // 1-10: أساسيات ومعلومات
  make("help", "عرض قائمة الأوامر"),
  make("ping", "فحص سرعة البوت"),
  make("server", "معلومات سيرفر XR"),
  make("userinfo", "معلومات عضو", b => optUser(b)),
  make("avatar", "صورة حساب عضو", b => b.addUserOption(o => o.setName("member").setDescription("العضو"))),
  make("botinfo", "معلومات البوت"),
  make("membercount", "عدد أعضاء السيرفر"),
  make("channelinfo", "معلومات الروم الحالي"),
  make("roles", "عرض رتب السيرفر"),
  make("servericon", "عرض أيقونة السيرفر"),

  // 11-18: تفاعل وترفيه
  make("say", "اجعل البوت يرسل رسالة", b => optText(b), P.ManageMessages),
  make("poll", "إنشاء تصويت", b => optText(b)),
  make("choose", "اختر عشوائيًا من الخيارات", b => optText(b)),
  make("roll", "رمي النرد"),
  make("coinflip", "رمي قطعة نقدية"),
  make("eightball", "اسأل سؤالًا عشوائيًا", b => optText(b)),
  make("rps", "حجر ورقة مقص", b => b.addStringOption(o => o.setName("choice").setDescription("اختيارك").setRequired(true).addChoices(
    { name: "حجر", value: "حجر" },
    { name: "ورقة", value: "ورقة" },
    { name: "مقص", value: "مقص" }
  ))),
  make("rate", "تقييم عشوائي من 10", b => optText(b)),

  // 19-25: ترفيه إضافي
  make("trivia", "سؤال معلومات عامة"),
  make("joke", "نكتة عشوائية"),
  make("fact", "معلومة عشوائية"),
  make("quote", "اقتباس تحفيزي"),
  make("highfive", "تحية بالكف", b => optUser(b)),
  make("compliment", "كلمة إيجابية لعضو", b => optUser(b)),
  make("math", "عملية حسابية", b => {
    optInt(b, "a", -100000, 100000);
    optInt(b, "b", -100000, 100000);
    b.addStringOption(o => o.setName("operation").setDescription("العملية").setRequired(true).addChoices(
      { name: "جمع", value: "add" },
      { name: "طرح", value: "subtract" },
      { name: "ضرب", value: "multiply" },
      { name: "قسمة", value: "divide" }
    ));
  }),

  // 26-35: الإدارة والإشراف
  make("warn", "تحذير عضو", b => { optUser(b); optText(b, "reason"); }, P.ModerateMembers),
  make("kick", "طرد عضو", b => { optUser(b); optText(b, "reason", false); }, P.KickMembers),
  make("ban", "حظر عضو", b => { optUser(b); optText(b, "reason", false); }, P.BanMembers),
  make("unban", "فك حظر باستخدام معرف العضو", b => optText(b, "user_id"), P.BanMembers),
  make("timeout", "إعطاء عضو مهلة", b => {
    optUser(b); optInt(b, "minutes", 1, 40320); optText(b, "reason", false);
  }, P.ModerateMembers),
  make("untimeout", "إزالة المهلة", b => optUser(b), P.ModerateMembers),
  make("clear", "مسح رسائل من الروم", b => optInt(b, "amount", 1, 100), P.ManageMessages),
  make("slowmode", "تحديد بطء الروم بالثواني", b => optInt(b, "seconds", 0, 21600), P.ManageChannels),
  make("lock", "قفل الروم الحالي", null, P.ManageChannels),
  make("unlock", "فتح الروم الحالي", null, P.ManageChannels),

  // 36-43: إدارة الرومات والرتب
  make("hide", "إخفاء الروم عن الأعضاء", null, P.ManageChannels),
  make("show", "إظهار الروم للأعضاء", null, P.ManageChannels),
  make("nickname", "تغيير اسم عضو", b => {
    optUser(b);
    b.addStringOption(o => o.setName("name").setDescription("الاسم الجديد").setRequired(true));
  }, P.ManageNicknames),
  make("role_add", "إعطاء رتبة لعضو", b => { optUser(b); optRole(b); }, P.ManageRoles),
  make("role_remove", "إزالة رتبة من عضو", b => { optUser(b); optRole(b); }, P.ManageRoles),
  make("announce", "إرسال إعلان في الروم", b => optText(b), P.ManageMessages),
  make("embed", "إرسال رسالة بتصميم Embed", b => {
    optText(b, "title");
    optText(b, "description");
  }, P.ManageMessages),
  make("created", "تاريخ إنشاء حسابك أو حساب عضو", b => b.addUserOption(o => o.setName("member").setDescription("العضو"))),

  // 44-50: أدوات إضافية
  make("joined", "تاريخ انضمام عضو للسيرفر", b => b.addUserOption(o => o.setName("member").setDescription("العضو"))),
  make("report", "الإبلاغ عن عضو", b => { optUser(b); optText(b, "reason"); }),
  make("suggest", "إرسال اقتراح للسيرفر", b => optText(b)),
  make("reverse", "عكس نص", b => optText(b)),
  make("repeat", "تكرار نص", b => optText(b)),
  make("giveawaypick", "اختيار فائز من المشاركين", b => {
    optUser(b, "participant1");
    optUser(b, "participant2");
    b.addUserOption(o => o.setName("participant3").setDescription("المشارك الثالث"));
    b.addUserOption(o => o.setName("participant4").setDescription("المشارك الرابع"));
    b.addUserOption(o => o.setName("participant5").setDescription("المشارك الخامس"));
  }),
  make("support", "معلومات طلب المساعدة")
].map(c => c.toJSON());

const questions = [
  "ما أفضل لعبة عندك؟",
  "من لاعبك المفضل؟",
  "ما هدفك هذه السنة؟",
  "ما أكثر شيء يضحكك؟",
  "ما أفضل أنمي شاهدته؟",
  "ما أكثر لعبة تلعبها؟"
];

const jokes = [
  "واحد دخل الامتحان وخرج فرحان... نسى يكتب اسمه 😂",
  "الكمبيوتر عطس، قالوله: عندك فيروس؟ 😂",
  "واحد اشترى ساعة ذكية، ولات هي اللي تقول له وقتاش يرقد 😂"
];

const facts = [
  "الأخطبوط عنده ثلاثة قلوب.",
  "العسل يمكن أن يبقى صالحًا مدة طويلة جدًا إذا خُزّن جيدًا.",
  "ضوء الشمس يصل إلى الأرض في حوالي 8 دقائق و20 ثانية."
];

const quotes = [
  "النجاح يبدأ بخطوة صغيرة.",
  "لا تتوقف عن التعلم والتطور.",
  "كل محاولة تعلمك شيئًا جديدًا."
];

const random = arr => arr[Math.floor(Math.random() * arr.length)];

async function registerCommands() {
  console.log(`📤 تسجيل ${commands.length} أمرًا داخل XR فقط...`);
  const rest = new REST({ version: "10", timeout: 120000 }).setToken(TOKEN);

  const result = await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log(`✅ تم تسجيل ${result.length} أمرًا في XR.`);
}

client.once("ready", () => {
  console.log(`🛡️ ${client.user.tag} يعمل الآن في XR.`);
  client.user.setActivity("XR 🛡️");
});

client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;

  if (i.guildId !== GUILD_ID) {
    return i.reply({ content: "❌ هذا البوت مخصص لسيرفر XR فقط.", ephemeral: true });
  }

  const name = i.commandName;
  const user = i.options.getUser("member");
  const reason = i.options.getString("reason") || "لم يُذكر سبب";

  try {
    switch (name) {
      case "help":
        return i.reply({
          embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle("🛡️ VEX Guard | 50 أمرًا")
            .setDescription(commands.map(c => `\`/${c.name}\` — ${c.description}`).join("\n"))],
          ephemeral: true
        });

      case "ping":
        return i.reply(`🏓 سرعة البوت: ${client.ws.ping}ms`);

      case "server":
        return i.reply({
          embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(i.guild.name)
            .setThumbnail(i.guild.iconURL())
            .addFields(
              { name: "الأعضاء", value: `${i.guild.memberCount}`, inline: true },
              { name: "الرومات", value: `${i.guild.channels.cache.size}`, inline: true },
              { name: "معرف السيرفر", value: i.guild.id }
            )]
        });

      case "userinfo": {
        const u = user || i.user;
        const m = await i.guild.members.fetch(u.id).catch(() => null);
        return i.reply({
          embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(`👤 ${u.tag}`)
            .setThumbnail(u.displayAvatarURL({ size: 512 }))
            .addFields(
              { name: "المعرف", value: u.id },
              { name: "تاريخ إنشاء الحساب", value: `<t:${Math.floor(u.createdTimestamp / 1000)}:D>` },
              { name: "انضم للسيرفر", value: m?.joinedTimestamp ? `<t:${Math.floor(m.joinedTimestamp / 1000)}:D>` : "غير متوفر" }
            )]
        });
      }

      case "avatar": {
        const u = user || i.options.getUser("member") || i.user;
        return i.reply(u.displayAvatarURL({ size: 1024 }));
      }

      case "botinfo":
        return i.reply(`🤖 البوت: ${client.user.tag}\n📡 Ping: ${client.ws.ping}ms\n🛡️ السيرفر: XR`);

      case "membercount":
        return i.reply(`👥 عدد أعضاء XR: ${i.guild.memberCount}`);

      case "channelinfo":
        return i.reply(`📍 الروم: ${i.channel.name}\n🆔 ${i.channel.id}\n👥 النوع: ${i.channel.type}`);

      case "roles":
        return i.reply(`🎭 رتب السيرفر:\n${i.guild.roles.cache.map(r => r.name).slice(0, 40).join("، ")}`);

      case "servericon":
        return i.reply(i.guild.iconURL({ size: 1024 }) || "السيرفر لا يملك أيقونة.");

      case "say":
      case "repeat":
        await i.channel.send(i.options.getString("text"));
        return i.reply({ content: "✅ تم إرسال الرسالة.", ephemeral: true });

      case "announce":
        await i.channel.send(`📢 **إعلان XR**\n${i.options.getString("text")}`);
        return i.reply({ content: "✅ تم إرسال الإعلان.", ephemeral: true });

      case "embed":
        await i.channel.send({
          embeds: [new EmbedBuilder().setColor(0x5865F2)
            .setTitle(i.options.getString("title"))
            .setDescription(i.options.getString("description"))]
        });
        return i.reply({ content: "✅ تم إرسال Embed.", ephemeral: true });

      case "poll": {
        const msg = await i.channel.send(`📊 **تصويت XR**\n${i.options.getString("text")}`);
        await msg.react("👍");
        await msg.react("👎");
        return i.reply({ content: "✅ تم إنشاء التصويت.", ephemeral: true });
      }

      case "choose": {
        const choices = i.options.getString("text").split(",").map(x => x.trim()).filter(Boolean);
        if (!choices.length) return i.reply({ content: "اكتب خيارات تفصل بينها بفواصل.", ephemeral: true });
        return i.reply(`🎯 اختياري: **${random(choices)}**`);
      }

      case "roll":
        return i.reply(`🎲 نتيجتك: **${1 + Math.floor(Math.random() * 6)}**`);

      case "coinflip":
        return i.reply(`🪙 النتيجة: **${random(["صورة", "كتابة"])}**`);

      case "eightball":
        return i.reply(`🎱 ${random(["نعم!", "لا.", "ربما 🤔", "جرّب لاحقًا.", "أكيد!"])}`);

      case "rps": {
        const choices = ["حجر", "ورقة", "مقص"];
        const mine = i.options.getString("choice");
        const bot = random(choices);
        const result = mine === bot ? "تعادل!" :
          ((mine === "حجر" && bot === "مقص") ||
           (mine === "ورقة" && bot === "حجر") ||
           (mine === "مقص" && bot === "ورقة")) ? "فزت! 🎉" : "فزت عليك 😎";
        return i.reply(`أنت: **${mine}**\nالبوت: **${bot}**\n${result}`);
      }

      case "rate":
        return i.reply(`⭐ تقييم ${i.options.getString("text")}: **${Math.floor(Math.random() * 11)}/10**`);

      case "trivia":
        return i.reply(`🧠 سؤال: ${random(questions)}`);

      case "joke":
        return i.reply(random(jokes));

      case "fact":
        return i.reply(`💡 ${random(facts)}`);

      case "quote":
        return i.reply(`✨ ${random(quotes)}`);

      case "highfive":
        return i.reply(`🙌 أعطى ${i.user} تحية بالكف إلى ${user}!`);

      case "compliment":
        return i.reply(`🌟 ${user} شخص مميز، استمر في التألق!`);

      case "math": {
        const a = i.options.getInteger("a");
        const b = i.options.getInteger("b");
        const op = i.options.getString("operation");
        if (op === "divide" && b === 0) return i.reply({ content: "❌ لا يمكن القسمة على صفر.", ephemeral: true });
        const result = { add: a + b, subtract: a - b, multiply: a * b, divide: a / b }[op];
        return i.reply(`🧮 النتيجة: **${result}**`);
      }

      case "warn": {
        const u = i.options.getUser("member");
        try { await u.send(`⚠️ تلقيت تحذيرًا في ${i.guild.name}.\nالسبب: ${reason}`); } catch {}
        return i.reply(`⚠️ تم تسجيل تحذير لـ ${u}.\nالسبب: ${reason}`);
      }

      case "kick": {
        const u = i.options.getUser("member");
        const m = await i.guild.members.fetch(u.id);
        if (!m.kickable) return i.reply({ content: "❌ لا أستطيع طرد هذا العضو. تحقق من ترتيب الرتب.", ephemeral: true });
        await m.kick(reason);
        return i.reply(`👢 تم طرد ${u.tag}. السبب: ${reason}`);
      }

      case "ban": {
        const u = i.options.getUser("member");
        await i.guild.members.ban(u.id, { reason });
        return i.reply(`🔨 تم حظر ${u.tag}. السبب: ${reason}`);
      }

      case "unban": {
        const id = i.options.getString("user_id");
        await i.guild.members.unban(id);
        return i.reply(`✅ تم فك الحظر عن المعرف ${id}.`);
      }

      case "timeout": {
        const u = i.options.getUser("member");
        const m = await i.guild.members.fetch(u.id);
        const minutes = i.options.getInteger("minutes");
        if (!m.moderatable) return i.reply({ content: "❌ لا أستطيع إعطاءه مهلة.", ephemeral: true });
        await m.timeout(minutes * 60000, reason);
        return i.reply(`⏳ تم إعطاء ${u} مهلة ${minutes} دقيقة.`);
      }

      case "untimeout": {
        const m = await i.guild.members.fetch(user.id);
        if (!m.moderatable) return i.reply({ content: "❌ لا أستطيع إزالة المهلة.", ephemeral: true });
        await m.timeout(null);
        return i.reply(`✅ تمت إزالة المهلة عن ${user}.`);
      }

      case "clear": {
        const amount = i.options.getInteger("amount");
        const deleted = await i.channel.bulkDelete(amount, true);
        return i.reply({ content: `🧹 تم مسح ${deleted.size} رسالة. الرسائل الأقدم من 14 يومًا لا تُمسح بهذه الطريقة.`, ephemeral: true });
      }

      case "slowmode": {
        const seconds = i.options.getInteger("seconds");
        await i.channel.setRateLimitPerUser(seconds);
        return i.reply(`🐢 تم ضبط Slowmode على ${seconds} ثانية.`);
      }

      case "lock":
      case "unlock": {
        const locked = name === "lock";
        await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, {
          SendMessages: locked ? false : null
        });
        return i.reply(locked ? "🔒 تم قفل الروم." : "🔓 تم فتح الروم.");
      }

      case "hide":
      case "show": {
        const hidden = name === "hide";
        await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, {
          ViewChannel: hidden ? false : null
        });
        return i.reply(hidden ? "🙈 تم إخفاء الروم." : "👀 تم إظهار الروم.");
      }

      case "nickname": {
        const m = await i.guild.members.fetch(user.id);
        await m.setNickname(i.options.getString("name"));
        return i.reply(`✅ تم تغيير اسم ${user}.`);
      }

      case "role_add":
      case "role_remove": {
        const u = i.options.getUser("member");
        const role = i.options.getRole("role");
        const m = await i.guild.members.fetch(u.id);
        if (role.managed || role.position >= i.guild.members.me.roles.highest.position) {
          return i.reply({ content: "❌ لا أستطيع إدارة هذه الرتبة بسبب ترتيب الرتب أو لأنها مُدارة من تكامل.", ephemeral: true });
        }
        if (name === "role_add") await m.roles.add(role);
        else await m.roles.remove(role);
        return i.reply(`✅ ${name === "role_add" ? "أُضيفت" : "أُزيلت"} رتبة ${role} ${name === "role_add" ? "إلى" : "من"} ${u}.`);
      }

      case "created": {
        const u = i.options.getUser("member") || i.user;
        return i.reply(`📅 تاريخ إنشاء حساب ${u.tag}: <t:${Math.floor(u.createdTimestamp / 1000)}:F>`);
      }

      case "joined": {
        const u = i.options.getUser("member") || i.user;
        const m = await i.guild.members.fetch(u.id).catch(() => null);
        return i.reply(m?.joinedTimestamp ? `📥 انضم ${u} إلى السيرفر في <t:${Math.floor(m.joinedTimestamp / 1000)}:F>` : "❌ لم أجد هذا العضو في السيرفر.");
      }

      case "report": {
        const u = i.options.getUser("member");
        const embed = new EmbedBuilder().setColor(0xED4245).setTitle("🚨 بلاغ جديد")
          .addFields(
            { name: "المبلّغ", value: `${i.user.tag} (${i.user.id})` },
            { name: "العضو المبلّغ عنه", value: `${u.tag} (${u.id})` },
            { name: "السبب", value: reason }
          ).setTimestamp();
        await i.channel.send({ embeds: [embed] });
        return i.reply({ content: "✅ تم إرسال البلاغ في هذا الروم.", ephemeral: true });
      }

      case "suggest":
        await i.channel.send(`💡 **اقتراح جديد من ${i.user}**\n${i.options.getString("text")}`);
        return i.reply({ content: "✅ تم إرسال اقتراحك.", ephemeral: true });

      case "reverse":
        return i.reply(i.options.getString("text").split("").reverse().join(""));

      case "giveawaypick": {
        const users = [1, 2, 3, 4, 5]
          .map(n => i.options.getUser(`participant${n}`))
          .filter(Boolean);
        return i.reply(`🎉 الفائز العشوائي: ${random(users)}`);
      }

      case "support":
        return i.reply("🛟 لطلب المساعدة، تواصل مع إدارة سيرفر XR أو افتح تذكرة الدعم إن كانت متاحة.");
    }
  } catch (err) {
    console.error(`خطأ في /${name}:`, err);
    const msg = "❌ حدث خطأ. تأكد من صلاحيات البوت وترتيب رتبته.";
    if (i.replied || i.deferred) {
      return i.followUp({ content: msg, ephemeral: true }).catch(() => {});
    }
    return i.reply({ content: msg, ephemeral: true }).catch(() => {});
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
