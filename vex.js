
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

const fs = require("node:fs");
const path = require("node:path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const SHORTCUTS_FILE = path.join(__dirname, "shortcuts.json");

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  throw new Error("تأكد من DISCORD_TOKEN وCLIENT_ID وGUILD_ID.");
}

let shortcuts = {};
const warnings = new Map();

const fixedCommands = [
  new SlashCommandBuilder().setName("help").setDescription("عرض جميع الأوامر"),
  new SlashCommandBuilder().setName("warn").setDescription("تحذير عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(true)),
  new SlashCommandBuilder().setName("warnings").setDescription("عرض تحذيرات عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true)),
  new SlashCommandBuilder().setName("kick").setDescription("طرد عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب")),
  new SlashCommandBuilder().setName("ban").setDescription("حظر عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب")),
  new SlashCommandBuilder().setName("unban").setDescription("فك حظر مستخدم")
    .addStringOption(o => o.setName("userid").setDescription("ID المستخدم").setRequired(true)),
  new SlashCommandBuilder().setName("timeout").setDescription("إعطاء تايم أوت")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("المدة بالدقائق").setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption(o => o.setName("reason").setDescription("السبب")),
  new SlashCommandBuilder().setName("untimeout").setDescription("إزالة التايم أوت")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true)),
  new SlashCommandBuilder().setName("clear").setDescription("حذف رسائل")
    .addIntegerOption(o => o.setName("amount").setDescription("عدد الرسائل 1-100").setRequired(true).setMinValue(1).setMaxValue(100)),
  new SlashCommandBuilder().setName("lock").setDescription("قفل الروم"),
  new SlashCommandBuilder().setName("unlock").setDescription("فتح الروم"),
  new SlashCommandBuilder().setName("slowmode").setDescription("تحديد بطء المحادثة")
    .addIntegerOption(o => o.setName("seconds").setDescription("المدة بالثواني").setRequired(true).setMinValue(0).setMaxValue(21600)),
  new SlashCommandBuilder().setName("announce").setDescription("إرسال إعلان")
    .addStringOption(o => o.setName("message").setDescription("نص الإعلان").setRequired(true))
    .addChannelOption(o => o.setName("channel").setDescription("الروم المستهدف")),
  new SlashCommandBuilder().setName("userinfo").setDescription("معلومات عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو")),
  new SlashCommandBuilder().setName("ticket-setup").setDescription("إنشاء لوحة التكت"),
  new SlashCommandBuilder().setName("game").setDescription("اقتراح لعبة"),
  new SlashCommandBuilder().setName("games").setDescription("عرض ألعاب مقترحة"),
  new SlashCommandBuilder().setName("shortcut-create").setDescription("إنشاء أمر سلاش مخصص")
    .addStringOption(o => o.setName("name").setDescription("اسم الأمر بدون /").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("الرسالة التي سيرسلها الأمر").setRequired(true)),
  new SlashCommandBuilder().setName("shortcut-delete").setDescription("حذف أمر سلاش مخصص")
    .addStringOption(o => o.setName("name").setDescription("اسم الأمر بدون /").setRequired(true)),
  new SlashCommandBuilder().setName("shortcuts").setDescription("عرض الاختصارات المخصصة")
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
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/contents/shortcuts.json`,
        { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" } }
      );

      if (response.ok) {
        const file = await response.json();
        shortcuts = JSON.parse(Buffer.from(file.content, "base64").toString("utf8"));
      } else if (response.status !== 404) {
        console.error("تعذر قراءة الاختصارات من GitHub:", response.status);
      }
    } catch (error) {
      console.error("تعذر تحميل الاختصارات:", error.message);
    }
  } else if (fs.existsSync(SHORTCUTS_FILE)) {
    shortcuts = JSON.parse(fs.readFileSync(SHORTCUTS_FILE, "utf8"));
  }
}

async function saveShortcuts() {
  const content = JSON.stringify(shortcuts, null, 2);

  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
    const url = `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/contents/shortcuts.json`;
    const headers = {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json"
    };

    const previous = await fetch(url, { headers });
    let sha;

    if (previous.ok) sha = (await previous.json()).sha;
    else if (previous.status !== 404) throw new Error("تعذر قراءة ملف الاختصارات من GitHub.");

    const result = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: "Update VEX Guard shortcuts",
        content: Buffer.from(content, "utf8").toString("base64"),
        ...(sha ? { sha } : {})
      })
    });

    if (!result.ok) throw new Error(`فشل حفظ الاختصارات في GitHub: ${result.status}`);
  } else {
    fs.writeFileSync(SHORTCUTS_FILE, content);
  }
}

async function registerCommands() {
  const custom = Object.entries(shortcuts).map(([name]) =>
    new SlashCommandBuilder()
      .setName(name)
      .setDescription(`اختصار مخصص: ${name}`)
      .toJSON()
  );

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: [...fixedCommands, ...custom]
  });
}

function isAdmin(interaction) {
  return interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
}

async function logAction(guild, message) {
  if (!LOG_CHANNEL_ID) return;
  try {
    const channel = await guild.channels.fetch(LOG_CHANNEL_ID);
    if (channel?.isTextBased()) await channel.send(`📋 ${message}`);
  } catch (error) {
    console.error("تعذر إرسال سجل الإدارة:", error.message);
  }
}

client.once("ready", async () => {
  console.log(`✅ VEX Guard يعمل باسم ${client.user.tag}`);

  try {
    await loadShortcuts();
    await registerCommands();
    console.log("✅ تم تسجيل أوامر XR والاختصارات.");
  } catch (error) {
    console.error("خطأ أثناء تسجيل الأوامر:", error);
  }
});

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId === "vex_ticket") {
        const existing = interaction.guild.channels.cache.find(
          c => c.name === `ticket-${interaction.user.id}`.slice(0, 90)
        );
        if (existing) {
          return interaction.reply({ content: `لديك تكت مفتوح: ${existing}`, ephemeral: true });
        }

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.id}`.slice(0, 90),
          permissionOverwrites: [
            { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
          ]
        });

        return interaction.reply({ content: `🎫 تم إنشاء تكتك: ${channel}`, ephemeral: true });
      }
    }

    if (!interaction.isChatInputCommand()) return;

    const { commandName, guild, member } = interaction;

    if (shortcuts[commandName]) {
      return interaction.reply(shortcuts[commandName].slice(0, 2000));
    }

    if (commandName === "help") {
      return interaction.reply({
        content: "**أوامر VEX Guard**\n" +
          "`/warn` `/warnings` `/kick` `/ban` `/unban` `/timeout` `/untimeout`\n" +
          "`/clear` `/lock` `/unlock` `/slowmode` `/announce` `/userinfo`\n" +
          "`/ticket-setup` `/game` `/games` `/shortcut-create` `/shortcut-delete` `/shortcuts`",
        ephemeral: true
      });
    }

    if (commandName === "game") {
      return interaction.reply(games[Math.floor(Math.random() * games.length)]);
    }

    if (commandName === "games") {
      return interaction.reply("🎮 **ألعاب وتحديات مقترحة**\n" + games.join("\n"));
    }

    if (["shortcut-create", "shortcut-delete", "shortcuts"].includes(commandName)) {
      if (!isAdmin(interaction)) {
        return interaction.reply({ content: "❌ هذا الأمر للإدارة فقط.", ephemeral: true });
      }

      if (commandName === "shortcuts") {
        const list = Object.keys(shortcuts);
        return interaction.reply({
          content: list.length ? list.map(n => `/${n}`).join("\n") : "لا توجد اختصارات حتى الآن.",
          ephemeral: true
        });
      }

      if (commandName === "shortcut-create") {
        const name = interaction.options.getString("name").toLowerCase();
        const message = interaction.options.getString("message");

        if (!/^[a-z0-9_-]{1,32}$/.test(name)) {
          return interaction.reply({ content: "❌ الاسم يجب أن يحتوي على حروف إنجليزية صغيرة أو أرقام أو _ أو -، وبحد أقصى 32 حرفًا.", ephemeral: true });
        }

        if (fixedCommands.some(c => c.name === name)) {
          return interaction.reply({ content: "❌ هذا الاسم مستخدم بالفعل لأمر أساسي.", ephemeral: true });
        }

        if (shortcuts[name]) {
          return interaction.reply({ content: "❌ هذا الاختصار موجود بالفعل.", ephemeral: true });
        }

        shortcuts[name] = message.slice(0, 2000);

        try {
          await saveShortcuts();
          await registerCommands();
          return interaction.reply(`✅ تم إنشاء الأمر **/${name}**. قد تحتاج قائمة Discord إلى لحظات لتحديث الأوامر.`);
        } catch (error) {
          delete shortcuts[name];
          console.error(error);
          return interaction.reply({ content: "❌ لم أستطع حفظ الاختصار أو تسجيله. راجع إعدادات GitHub وسجلات Actions.", ephemeral: true });
        }
      }

      if (commandName === "shortcut-delete") {
        const name = interaction.options.getString("name").toLowerCase();
        if (!shortcuts[name]) {
          return interaction.reply({ content: "❌ لم أجد هذا الاختصار.", ephemeral: true });
        }

        const old = shortcuts[name];
        delete shortcuts[name];

        try {
          await saveShortcuts();
          await registerCommands();
          return interaction.reply(`✅ تم حذف الأمر **/${name}**.`);
        } catch (error) {
          shortcuts[name] = old;
          console.error(error);
          return interaction.reply({ content: "❌ تعذر حذف الاختصار. راجع سجلات Actions.", ephemeral: true });
        }
      }
    }

    if (commandName === "ticket-setup") {
      if (!isAdmin(interaction)) return interaction.reply({ content: "❌ للإدارة فقط.", ephemeral: true });
      const embed = new EmbedBuilder()
        .setTitle("🎫 الدعم الفني | XR")
        .setDescription("اضغط الزر بالأسفل لفتح تكت خاص مع الإدارة.")
        .setColor(0x5865F2);

      return interaction.reply({
        embeds: [embed],
        components: [{
          type: 1,
          components: [{ type: 2, style: 1, label: "فتح تكت", custom_id: "vex_ticket", emoji: { name: "🎫" } }]
        }]
      });
    }

    if (commandName === "userinfo") {
      const user = interaction.options.getUser("member") || interaction.user;
      const target = await guild.members.fetch(user.id).catch(() => null);
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setTitle(`معلومات ${user.username}`)
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            { name: "ID", value: user.id },
            { name: "تاريخ إنشاء الحساب", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>` },
            { name: "تاريخ دخول السيرفر", value: target ? `<t:${Math.floor(target.joinedTimestamp / 1000)}:D>` : "غير متوفر" }
          )
          .setColor(0x5865F2)]
      });
    }

    const adminCommands = [
      "warn", "warnings", "kick", "ban", "unban", "timeout", "untimeout",
      "clear", "lock", "unlock", "slowmode", "announce"
    ];

    if (!adminCommands.includes(commandName)) return;
    if (!isAdmin(interaction)) {
      return interaction.reply({ content: "❌ هذا الأمر يتطلب صلاحية Administrator.", ephemeral: true });
    }

    if (commandName === "warn") {
      const user = interaction.options.getUser("member");
      const reason = interaction.options.getString("reason");
      const list = warnings.get(user.id) || [];
      list.push({ reason, by: interaction.user.tag, at: Date.now() });
      warnings.set(user.id, list);
      await logAction(guild, `${user.tag} تلقى تحذيرًا: ${reason}`);
      return interaction.reply(`⚠️ تم تحذير ${user}. السبب: ${reason}`);
    }

    if (commandName === "warnings") {
      const user = interaction.options.getUser("member");
      const list = warnings.get(user.id) || [];
      return interaction.reply({
        content: list.length
          ? `⚠️ تحذيرات ${user.tag}:\n${list.map((w, i) => `${i + 1}. ${w.reason} — ${w.by}`).join("\n")}`
          : `✅ لا توجد تحذيرات محفوظة لـ ${user.tag}.`,
        ephemeral: true
      });
    }

    if (commandName === "kick" || commandName === "ban" || commandName === "timeout" || commandName === "untimeout") {
      const user = interaction.options.getUser("member");
      const target = await guild.members.fetch(user.id).catch(() => null);
      if (!target) return interaction.reply({ content: "❌ لم أجد العضو في السيرفر.", ephemeral: true });
      if (user.id === guild.ownerId || user.id === interaction.user.id) {
        return interaction.reply({ content: "❌ لا يمكنك تنفيذ هذا الإجراء على هذا العضو.", ephemeral: true });
      }
      if (target.roles.highest.position >= guild.members.me.roles.highest.position) {
        return interaction.reply({ content: "❌ يجب أن تكون أعلى رتبة البوت أعلى من رتبة العضو المستهدف.", ephemeral: true });
      }

      const reason = interaction.options.getString("reason") || `بواسطة ${interaction.user.tag}`;

      if (commandName === "kick") await target.kick(reason);
      if (commandName === "ban") await target.ban({ reason });
      if (commandName === "timeout") {
        const minutes = interaction.options.getInteger("minutes");
        await target.timeout(minutes * 60 * 1000, reason);
        await logAction(guild, `Timeout: ${user.tag} لمدة ${minutes} دقيقة.`);
        return interaction.reply(`⏳ تم إعطاء ${user} تايم أوت لمدة ${minutes} دقيقة.`);
      }
      if (commandName === "untimeout") await target.timeout(null, `إزالة التايم أوت بواسطة ${interaction.user.tag}`);

      await logAction(guild, `${commandName}: ${user.tag}`);
      return interaction.reply(`✅ تم تنفيذ الأمر **/${commandName}** على ${user}.`);
    }

    if (commandName === "unban") {
      const id = interaction.options.getString("userid");
      await guild.members.unban(id);
      await logAction(guild, `تم فك الحظر عن المستخدم ${id}`);
      return interaction.reply(`✅ تم فك الحظر عن المستخدم \`${id}\`.`);
    }

    if (commandName === "clear") {
      const amount = interaction.options.getInteger("amount");
      if (!interaction.channel?.bulkDelete) {
        return interaction.reply({ content: "❌ هذا الأمر يعمل داخل رومات النصوص فقط.", ephemeral: true });
      }
      const deleted = await interaction.channel.bulkDelete(amount, true);
      return interaction.reply({ content: `🧹 تم حذف ${deleted.size} رسالة.`, ephemeral: true });
    }

    if (commandName === "lock" || commandName === "unlock") {
      const locked = commandName === "lock";
      await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: !locked
      });
      return interaction.reply(locked ? "🔒 تم قفل الروم." : "🔓 تم فتح الروم.");
    }

    if (commandName === "slowmode") {
      const seconds = interaction.options.getInteger("seconds");
      await interaction.channel.setRateLimitPerUser(seconds);
      return interaction.reply(`✅ مدة بطء المحادثة الآن ${seconds} ثانية.`);
    }

    if (commandName === "announce") {
      const message = interaction.options.getString("message");
      const channel = interaction.options.getChannel("channel") || interaction.channel;
      await channel.send({ content: `📢 **إعلان XR**\n${message}` });
      return interaction.reply({ content: "✅ تم إرسال الإعلان.", ephemeral: true });
    }
  } catch (error) {
    console.error("VEX Guard error:", error);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "❌ حدث خطأ. راجع سجلات GitHub Actions لمعرفة السبب.", ephemeral: true }).catch(() => {});
    }
  }
});

client.login(TOKEN);
