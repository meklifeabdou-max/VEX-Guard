
const {
  Client, GatewayIntentBits, PermissionFlagsBits,
  SlashCommandBuilder, REST, Routes, EmbedBuilder,
  ChannelType
} = require("discord.js");

const fs = require("node:fs");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = process.env.GITHUB_REPOSITORY;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  throw new Error("تأكد من DISCORD_TOKEN وCLIENT_ID وGUILD_ID.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const warnings = new Map();
const localFile = "shortcuts.json";
let shortcuts = {};

const command = (name, description) =>
  new SlashCommandBuilder().setName(name).setDescription(description);

const commands = [
  command("help", "عرض الأوامر"),
  command("warn", "تحذير عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(true)),
  command("warnings", "عرض تحذيرات عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true)),
  command("kick", "طرد عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب")),
  command("ban", "حظر عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب")),
  command("unban", "فك حظر مستخدم")
    .addStringOption(o => o.setName("userid").setDescription("ID المستخدم").setRequired(true)),
  command("timeout", "إعطاء تايم أوت")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("الدقائق").setRequired(true).setMinValue(1).setMaxValue(40320)),
  command("untimeout", "إزالة التايم أوت")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true)),
  command("clear", "حذف رسائل")
    .addIntegerOption(o => o.setName("amount").setDescription("العدد 1-100").setRequired(true).setMinValue(1).setMaxValue(100)),
  command("lock", "قفل الروم"),
  command("unlock", "فتح الروم"),
  command("slowmode", "تحديد بطء المحادثة")
    .addIntegerOption(o => o.setName("seconds").setDescription("الثواني").setRequired(true).setMinValue(0).setMaxValue(21600)),
  command("announce", "إرسال إعلان")
    .addStringOption(o => o.setName("message").setDescription("الإعلان").setRequired(true))
    .addChannelOption(o => o.setName("channel").setDescription("الروم")),
  command("userinfo", "معلومات عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو")),
  command("serverinfo", "معلومات السيرفر"),
  command("ticket-setup", "إعداد لوحة التكت"),
  command("game", "اقتراح لعبة"),
  command("games", "عرض الألعاب"),
  command("shortcut-create", "إنشاء أمر سلاش")
    .addStringOption(o => o.setName("name").setDescription("اسم الأمر بالإنجليزية").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("رسالة الاختصار").setRequired(true)),
  command("shortcut-delete", "حذف أمر سلاش")
    .addStringOption(o => o.setName("name").setDescription("اسم الأمر").setRequired(true)),
  command("shortcuts", "عرض الاختصارات")
].map(c => c.toJSON());

const games = [
  "🎮 Brawl Stars",
  "⚽ eFootball",
  "🏆 Fortnite",
  "🧱 Minecraft",
  "🚗 Rocket League",
  "🎯 تحدي بين أعضاء السيرفر"
];

async function loadShortcuts() {
  if (GITHUB_TOKEN && REPO) {
    const url = `https://api.github.com/repos/${REPO}/contents/shortcuts.json`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" }
    });

    if (res.status === 404) {
      shortcuts = {};
      return;
    }
    if (!res.ok) throw new Error(`تعذر قراءة shortcuts.json: ${res.status}`);

    const file = await res.json();
    shortcuts = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
  } else {
    shortcuts = fs.existsSync(localFile)
      ? JSON.parse(fs.readFileSync(localFile, "utf8"))
      : {};
  }
}

async function saveShortcuts() {
  const content = JSON.stringify(shortcuts, null, 2);

  if (GITHUB_TOKEN && REPO) {
    const url = `https://api.github.com/repos/${REPO}/contents/shortcuts.json`;
    const headers = {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    };

    const old = await fetch(url, { headers });
    let sha;

    if (old.ok) sha = (await old.json()).sha;
    else if (old.status !== 404) throw new Error(`فشل قراءة ملف الاختصارات: ${old.status}`);

    const res = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "Update VEX Guard shortcuts",
        content: Buffer.from(content).toString("base64"),
        ...(sha ? { sha } : {})
      })
    });

    if (!res.ok) throw new Error(`فشل حفظ الاختصارات: ${res.status}`);
  } else {
    fs.writeFileSync(localFile, content);
  }
}

async function registerCommands() {
  const custom = Object.keys(shortcuts).map(name =>
    command(name, `اختصار مخصص: ${name}`).toJSON()
  );

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: [...commands, ...custom]
  });
}

function admin(i) {
  return i.memberPermissions?.has(PermissionFlagsBits.Administrator);
}

async function log(guild, message) {
  if (!LOG_CHANNEL_ID) return;
  try {
    const ch = await guild.channels.fetch(LOG_CHANNEL_ID);
    if (ch?.isTextBased()) await ch.send(message);
  } catch (e) {
    console.error("Log error:", e.message);
  }
}

client.once("ready", async () => {
  console.log(`✅ VEX Guard يعمل باسم ${client.user.tag}`);
  try {
    await loadShortcuts();
    await registerCommands();
    console.log("✅ تم تسجيل أوامر XR والاختصارات.");
  } catch (e) {
    console.error("Startup error:", e);
  }
});

client.on("interactionCreate", async i => {
  try {
    // نؤجل الرد فورًا لتفادي انتهاء مهلة التفاعل.
    if (i.isChatInputCommand()) {
      await i.deferReply({ ephemeral: true });
    } else if (i.isButton()) {
      await i.deferReply({ ephemeral: true });
    } else {
      return;
    }

    const reply = content => i.editReply(
      typeof content === "string" ? { content } : content
    );

    if (i.isButton()) {
      if (i.customId !== "vex_ticket") return reply("هذا الزر غير معروف.");

      const existing = i.guild.channels.cache.find(
        c => c.name === `ticket-${i.user.id}`
      );

      if (existing) return reply(`لديك تكت مفتوح بالفعل: ${existing}`);

      const ch = await i.guild.channels.create({
        name: `ticket-${i.user.id}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: i.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: i.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          },
          {
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ManageChannels
            ]
          }
        ]
      });

      return reply(`🎫 تم إنشاء تكتك: ${ch}`);
    }

    const name = i.commandName;
    const guild = i.guild;

    if (Object.hasOwn(shortcuts, name)) return reply(shortcuts[name]);

    if (name === "help") {
      return reply("**أوامر VEX Guard**\n" +
        commands.map(c => `/${c.name}`).join(" • "));
    }

    if (name === "game") {
      return reply(games[Math.floor(Math.random() * games.length)]);
    }

    if (name === "games") return reply(games.join("\n"));

    if (name === "serverinfo") {
      return reply({
        embeds: [new EmbedBuilder()
          .setTitle(guild.name)
          .setThumbnail(guild.iconURL())
          .addFields(
            { name: "الأعضاء", value: String(guild.memberCount), inline: true },
            { name: "معرّف السيرفر", value: guild.id, inline: true }
          )
          .setColor(0x5865F2)]
      });
    }

    if (name === "userinfo") {
      const user = i.options.getUser("member") || i.user;
      const member = await guild.members.fetch(user.id).catch(() => null);
      return reply({
        embeds: [new EmbedBuilder()
          .setTitle(`معلومات ${user.username}`)
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            { name: "ID", value: user.id },
            { name: "إنشاء الحساب", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>` },
            { name: "دخول السيرفر", value: member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : "غير متوفر" }
          ).setColor(0x5865F2)]
      });
    }

    const shortcutAdmin = ["shortcut-create", "shortcut-delete", "shortcuts"];
    const adminCommands = [
      "warn", "warnings", "kick", "ban", "unban", "timeout",
      "untimeout", "clear", "lock", "unlock", "slowmode",
      "announce", "ticket-setup"
    ];

    if (shortcutAdmin.includes(name)) {
      if (!admin(i)) return reply("❌ هذا الأمر للإدارة فقط.");

      if (name === "shortcuts") {
        const list = Object.keys(shortcuts);
        return reply(list.length ? list.map(n => `/${n}`).join("\n") : "لا توجد اختصارات.");
      }

      const shortcutName = i.options.getString("name").toLowerCase();

      if (name === "shortcut-create") {
        const message = i.options.getString("message");

        if (!/^[a-z0-9_-]{1,32}$/.test(shortcutName))
          return reply("❌ الاسم يجب أن يكون إنجليزيًا صغيرًا أو أرقامًا أو _ أو -.");

        if (commands.some(c => c.name === shortcutName))
          return reply("❌ هذا الاسم مستخدم لأمر أساسي.");

        if (Object.hasOwn(shortcuts, shortcutName))
          return reply("❌ الاختصار موجود مسبقًا.");

        shortcuts[shortcutName] = message.slice(0, 2000);

        try {
          await saveShortcuts();
          await registerCommands();
          return reply(`✅ تم إنشاء /${shortcutName}. حدّث قائمة الأوامر إذا لم يظهر فورًا.`);
        } catch (e) {
          delete shortcuts[shortcutName];
          console.error(e);
          return reply("❌ فشل حفظ الاختصار. تحقق من صلاحية الكتابة في GitHub.");
        }
      }

      if (!Object.hasOwn(shortcuts, shortcutName))
        return reply("❌ هذا الاختصار غير موجود.");

      const previous = shortcuts[shortcutName];
      delete shortcuts[shortcutName];

      try {
        await saveShortcuts();
        await registerCommands();
        return reply(`✅ تم حذف /${shortcutName}.`);
      } catch (e) {
        shortcuts[shortcutName] = previous;
        console.error(e);
        return reply("❌ تعذر حذف الاختصار.");
      }
    }

    if (name === "ticket-setup") {
      if (!admin(i)) return reply("❌ للإدارة فقط.");

      await i.channel.send({
        embeds: [new EmbedBuilder()
          .setTitle("🎫 الدعم الفني | XR")
          .setDescription("اضغط الزر لفتح تكت خاص مع الإدارة.")
          .setColor(0x5865F2)],
        components: [{
          type: 1,
          components: [{
            type: 2, style: 1,
            label: "فتح تكت",
            custom_id: "vex_ticket",
            emoji: { name: "🎫" }
          }]
        }]
      });
      return reply("✅ تم نشر لوحة التكت في هذا الروم.");
    }

    if (!adminCommands.includes(name)) return reply("❌ أمر غير معروف.");
    if (!admin(i)) return reply("❌ تحتاج صلاحية Administrator.");

    if (name === "warn") {
      const user = i.options.getUser("member");
      const reason = i.options.getString("reason");
      const list = warnings.get(user.id) || [];
      list.push({ reason, by: i.user.tag });
      warnings.set(user.id, list);
      await log(guild, `⚠️ تحذير ${user.tag}: ${reason}`);
      return reply(`⚠️ تم تحذير ${user}. السبب: ${reason}`);
    }

    if (name === "warnings") {
      const user = i.options.getUser("member");
      const list = warnings.get(user.id) || [];
      return reply(list.length
        ? list.map((w, n) => `${n + 1}. ${w.reason} — ${w.by}`).join("\n")
        : "لا توجد تحذيرات محفوظة.");
    }

    if (name === "announce") {
      const channel = i.options.getChannel("channel") || i.channel;
      if (!channel.isTextBased()) return reply("❌ اختر رومًا نصيًا.");
      await channel.send(`📢 **إعلان XR**\n${i.options.getString("message")}`);
      return reply("✅ تم إرسال الإعلان.");
    }

    if (["kick", "ban", "timeout", "untimeout"].includes(name)) {
      const user = i.options.getUser("member");
      const target = await guild.members.fetch(user.id).catch(() => null);
      if (!target) return reply("❌ العضو غير موجود في السيرفر.");
      if (user.id === guild.ownerId || user.id === i.user.id)
        return reply("❌ لا يمكن تنفيذ هذا الإجراء على هذا العضو.");
      if (target.roles.highest.position >= guild.members.me.roles.highest.position)
        return reply("❌ رتبة البوت يجب أن تكون أعلى من رتبة العضو.");

      const reason = i.options.getString("reason") || `بواسطة ${i.user.tag}`;

      if (name === "kick") await target.kick(reason);
      if (name === "ban") await target.ban({ reason });
      if (name === "timeout") {
        const minutes = i.options.getInteger("minutes");
        await target.timeout(minutes * 60000, reason);
        return reply(`⏳ تم إعطاء ${user} تايم أوت لمدة ${minutes} دقيقة.`);
      }
      if (name === "untimeout") await target.timeout(null, reason);

      await log(guild, `تم تنفيذ /${name} على ${user.tag}`);
      return reply(`✅ تم تنفيذ /${name} على ${user}.`);
    }

    if (name === "unban") {
      await guild.bans.remove(i.options.getString("userid"));
      return reply("✅ تم فك الحظر.");
    }

    if (name === "clear") {
      const amount = i.options.getInteger("amount");
      const deleted = await i.channel.bulkDelete(amount, true);
      return reply(`🧹 تم حذف ${deleted.size} رسالة.`);
    }

    if (name === "lock" || name === "unlock") {
      await i.channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: name === "unlock"
      });
      return reply(name === "lock" ? "🔒 تم قفل الروم." : "🔓 تم فتح الروم.");
    }

    if (name === "slowmode") {
      const seconds = i.options.getInteger("seconds");
      await i.channel.setRateLimitPerUser(seconds);
      return reply(`✅ تم ضبط Slowmode على ${seconds} ثانية.`);
    }
  } catch (error) {
    console.error("VEX Guard error:", error);

    if (i.isRepliable()) {
      try {
        if (i.deferred || i.replied) {
          await i.editReply("❌ حدث خطأ. راجع سجلات GitHub Actions.");
        } else {
          await i.reply({
            content: "❌ حدث خطأ. راجع سجلات GitHub Actions.",
            ephemeral: true
          });
        }
      } catch (replyError) {
        console.error("Interaction response error:", replyError.code || replyError.message);
      }
    }
  }
});

client.on("error", error => console.error("Discord client error:", error));
process.on("unhandledRejection", error => console.error("Unhandled rejection:", error));

client.login(TOKEN);
