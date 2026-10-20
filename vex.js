
const {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const fs = require("node:fs");
const path = require("node:path");

// ==================== VEX GUARD ====================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  throw new Error("تأكد من DISCORD_TOKEN وCLIENT_ID وGUILD_ID في GitHub Secrets.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const rest = new REST({ version: "10" }).setToken(TOKEN);
const localFile = path.join(__dirname, "shortcuts.json");
const warnings = new Map();
let shortcuts = {};

const games = [
  "Brawl Stars 🎮",
  "Minecraft ⛏️",
  "Fortnite 🪂",
  "Rocket League 🚗",
  "Roblox 🧱",
  "eFootball ⚽"
];

function isAdmin(interaction) {
  return interaction.memberPermissions?.has(
    PermissionFlagsBits.Administrator
  );
}

function safeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 32);
}

// ==================== SAVE SHORTCUTS ====================

async function loadShortcuts() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;

  if (token && repo) {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo}/contents/shortcuts.json`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
          }
        }
      );

      if (response.ok) {
        const file = await response.json();
        shortcuts = JSON.parse(
          Buffer.from(file.content, "base64").toString("utf8")
        );
        console.log("✅ تم تحميل الاختصارات المحفوظة في GitHub.");
        return file.sha;
      }

      if (response.status !== 404) {
        console.log("⚠️ تعذّر تحميل الاختصارات من GitHub:", response.status);
      }
    } catch (error) {
      console.error("⚠️ خطأ أثناء تحميل الاختصارات:", error.message);
    }
  }

  try {
    if (fs.existsSync(localFile)) {
      shortcuts = JSON.parse(fs.readFileSync(localFile, "utf8"));
    }
  } catch {
    shortcuts = {};
  }

  return null;
}

async function saveShortcuts() {
  const data = JSON.stringify(shortcuts, null, 2);
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;

  // حفظ محلي احتياطيًا
  fs.writeFileSync(localFile, data, "utf8");

  if (!token || !repo) {
    console.log("⚠️ لا يوجد GITHUB_TOKEN؛ الحفظ محلي فقط.");
    return false;
  }

  try {
    const url =
      `https://api.github.com/repos/${repo}/contents/shortcuts.json`;

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    };

    let sha;
    const check = await fetch(url, { headers });

    if (check.ok) {
      sha = (await check.json()).sha;
    } else if (check.status !== 404) {
      throw new Error(`GitHub API status ${check.status}`);
    }

    const body = {
      message: "Save VEX Guard shortcuts",
      content: Buffer.from(data).toString("base64")
    };

    if (sha) body.sha = sha;

    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`GitHub save failed: ${response.status}`);
    }

    console.log("✅ تم حفظ الاختصارات في GitHub.");
    return true;
  } catch (error) {
    console.error("⚠️ لم يتم حفظ الاختصارات في GitHub:", error.message);
    return false;
  }
}

// ==================== SLASH COMMANDS ====================

function buildCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName("help")
      .setDescription("عرض أوامر VEX Guard"),

    new SlashCommandBuilder()
      .setName("warn")
      .setDescription("تحذير عضو")
      .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("سبب التحذير").setRequired(true)),

    new SlashCommandBuilder()
      .setName("warnings")
      .setDescription("عرض تحذيرات عضو")
      .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true)),

    new SlashCommandBuilder()
      .setName("kick")
      .setDescription("طرد عضو")
      .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(false)),

    new SlashCommandBuilder()
      .setName("ban")
      .setDescription("حظر عضو")
      .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(false)),

    new SlashCommandBuilder()
      .setName("unban")
      .setDescription("إلغاء حظر مستخدم بواسطة ID")
      .addStringOption(o => o.setName("userid").setDescription("معرّف المستخدم").setRequired(true)),

    new SlashCommandBuilder()
      .setName("timeout")
      .setDescription("إعطاء عضو مهلة بالدقائق")
      .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
      .addIntegerOption(o => o.setName("minutes").setDescription("المدة بالدقائق").setMinValue(1).setMaxValue(40320).setRequired(true))
      .addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(false)),

    new SlashCommandBuilder()
      .setName("untimeout")
      .setDescription("إزالة المهلة عن عضو")
      .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true)),

    new SlashCommandBuilder()
      .setName("clear")
      .setDescription("حذف رسائل من الروم")
      .addIntegerOption(o => o.setName("amount").setDescription("عدد الرسائل (1 إلى 100)").setMinValue(1).setMaxValue(100).setRequired(true)),

    new SlashCommandBuilder()
      .setName("lock")
      .setDescription("قفل الروم الحالي"),

    new SlashCommandBuilder()
      .setName("unlock")
      .setDescription("فتح الروم الحالي"),

    new SlashCommandBuilder()
      .setName("slowmode")
      .setDescription("تغيير وضع بطء المحادثة")
      .addIntegerOption(o => o.setName("seconds").setDescription("الثواني (0 إلى 21600)").setMinValue(0).setMaxValue(21600).setRequired(true)),

    new SlashCommandBuilder()
      .setName("announce")
      .setDescription("إرسال إعلان في الروم الحالي")
      .addStringOption(o => o.setName("message").setDescription("نص الإعلان").setRequired(true)),

    new SlashCommandBuilder()
      .setName("userinfo")
      .setDescription("عرض معلومات عضو")
      .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(false)),

    new SlashCommandBuilder()
      .setName("ticket-setup")
      .setDescription("إنشاء لوحة فتح التذاكر في الروم الحالي"),

    new SlashCommandBuilder()
      .setName("game")
      .setDescription("اقتراح لعبة عشوائية"),

    new SlashCommandBuilder()
      .setName("games")
      .setDescription("عرض قائمة الألعاب"),

    new SlashCommandBuilder()
      .setName("shortcut-create")
      .setDescription("إنشاء اختصار سلاش جديد")
      .addStringOption(o => o.setName("name").setDescription("اسم الأمر بالإنجليزية").setRequired(true))
      .addStringOption(o => o.setName("message").setDescription("الرسالة التي يرسلها الأمر").setRequired(true)),

    new SlashCommandBuilder()
      .setName("shortcut-delete")
      .setDescription("حذف اختصار سلاش")
      .addStringOption(o => o.setName("name").setDescription("اسم الاختصار").setRequired(true)),

    new SlashCommandBuilder()
      .setName("shortcuts")
      .setDescription("عرض الاختصارات المخصصة")
  ];

  for (const [name, message] of Object.entries(shortcuts)) {
    if (!commands.some(c => c.name === name)) {
      commands.push(
        new SlashCommandBuilder()
          .setName(name)
          .setDescription(`اختصار VEX: ${message}`.slice(0, 100))
      );
    }
  }

  return commands.map(c => c.toJSON());
}

async function registerCommands() {
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: buildCommands() }
  );
  console.log("✅ تم تسجيل أوامر VEX Guard والاختصارات في XR.");
}

// ==================== BOT READY & CONNECTION LOGS ====================

client.once(Events.ClientReady, async readyClient => {
  console.log(`✅ VEX Guard يعمل باسم ${readyClient.user.tag}`);
  console.log(`🟢 حالة الاتصال: ${readyClient.ws.status}`);
  console.log(`🆔 Bot ID: ${readyClient.user.id}`);
  console.log(`🏠 Guild ID: ${GUILD_ID}`);

  try {
    await loadShortcuts();
    await registerCommands();
  } catch (error) {
    console.error("❌ خطأ أثناء إعداد الأوامر:", error);
  }
});

client.on("shardDisconnect", event => {
  console.log("🔴 انقطع الاتصال مع Discord. Code:", event.code);
});

client.on("shardReconnecting", () => {
  console.log("🟡 إعادة الاتصال بـ Discord...");
});

client.on("shardResume", () => {
  console.log("🟢 عاد الاتصال بـ Discord.");
});

client.on("error", error => {
  console.error("❌ Discord client error:", error);
});

process.on("unhandledRejection", error => {
  console.error("❌ Unhandled rejection:", error);
});

// ==================== INTERACTIONS ====================

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  try {
    // الرد مبكرًا لتجنب Unknown interaction
    await interaction.deferReply({ ephemeral: true });

    // ---------- TICKET BUTTON ----------
    if (interaction.isButton()) {
      if (interaction.customId !== "vex_open_ticket") return;

      const guild = interaction.guild;
      if (!guild) return interaction.editReply("❌ هذا الزر يعمل داخل السيرفر فقط.");

      const existing = guild.channels.cache.find(
        c => c.type === ChannelType.GuildText &&
          c.topic === `vex-ticket:${interaction.user.id}`
      );

      if (existing) {
        return interaction.editReply(`🎫 لديك تذكرة مفتوحة: ${existing}`);
      }

      const channel = await guild.channels.create({
        name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 90),
        type: ChannelType.GuildText,
        topic: `vex-ticket:${interaction.user.id}`,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ] },
          { id: client.user.id, allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageChannels
          ] }
        ]
      });

      await channel.send(
        `🎫 أهلًا ${interaction.user}، اشرح طلبك هنا. فريق الإدارة سيساعدك قريبًا.`
      );

      return interaction.editReply(`✅ تم فتح تذكرتك: ${channel}`);
    }

    const { commandName, options, guild, member } = interaction;

    // ---------- CUSTOM SHORTCUT ----------
    if (Object.hasOwn(shortcuts, commandName)) {
      return interaction.editReply(shortcuts[commandName]);
    }

    // ---------- HELP ----------
    if (commandName === "help") {
      return interaction.editReply({
        content:
          "**🛡️ أوامر VEX Guard**\n" +
          "`/warn` `/warnings` `/kick` `/ban` `/unban`\n" +
          "`/timeout` `/untimeout` `/clear` `/lock` `/unlock`\n" +
          "`/slowmode` `/announce` `/userinfo` `/ticket-setup`\n" +
          "`/game` `/games` `/shortcut-create` `/shortcut-delete` `/shortcuts`"
      });
    }

    // ---------- GAMES ----------
    if (commandName === "game") {
      const game = games[Math.floor(Math.random() * games.length)];
      return interaction.editReply(`🎮 اقتراحي لك: **${game}**`);
    }

    if (commandName === "games") {
      return interaction.editReply(`🎮 **قائمة الألعاب:**\n${games.map(g => `• ${g}`).join("\n")}`);
    }

    // ---------- USER INFO ----------
    if (commandName === "userinfo") {
      const user = options.getUser("user") || interaction.user;
      const targetMember = await guild.members.fetch(user.id).catch(() => null);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("👤 معلومات العضو")
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: "الاسم", value: user.tag, inline: true },
          { name: "User ID", value: user.id, inline: true },
          { name: "تاريخ إنشاء الحساب", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>` }
        );

      if (targetMember) {
        embed.addFields({
          name: "انضم للسيرفر",
          value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:D>`
        });
      }

      return interaction.editReply({ embeds: [embed] });
    }

    // ---------- CUSTOM SHORTCUT MANAGEMENT ----------
    if (["shortcut-create", "shortcut-delete", "shortcuts"].includes(commandName)) {
      if (!isAdmin(interaction)) {
        return interaction.editReply("❌ هذا الأمر للإدارة فقط.");
      }

      if (commandName === "shortcuts") {
        const names = Object.keys(shortcuts);
        return interaction.editReply(
          names.length
            ? `**اختصاراتك:** ${names.map(n => `\`/${n}\``).join("، ")}`
            : "لا توجد اختصارات مخصصة بعد."
        );
      }

      if (commandName === "shortcut-create") {
        const name = safeName(options.getString("name"));
        const message = options.getString("message", true).trim();

        if (!name || name.length < 2) {
          return interaction.editReply("❌ الاسم غير صالح. استخدم حروفًا إنجليزية وأرقامًا أو شرطات.");
        }

        if (buildCommands().some(c => c.name === name)) {
          return interaction.editReply("❌ هذا الاسم مستخدم بالفعل كأمر موجود.");
        }

        if (!message || message.length > 1800) {
          return interaction.editReply("❌ الرسالة يجب أن تكون بين حرف واحد و1800 حرف.");
        }

        shortcuts[name] = message;
        await saveShortcuts();
        await registerCommands();

        return interaction.editReply(
          `✅ تم إنشاء الاختصار \`/${name}\`.\nقد تحتاج إلى لحظات حتى يظهر في قائمة أوامر Discord.`
        );
      }

      if (commandName === "shortcut-delete") {
        const name = safeName(options.getString("name"));

        if (!Object.hasOwn(shortcuts, name)) {
          return interaction.editReply("❌ لم أجد هذا الاختصار.");
        }

        delete shortcuts[name];
        await saveShortcuts();
        await registerCommands();

        return interaction.editReply(`✅ تم حذف الاختصار \`/${name}\`.`);
      }
    }

    // ---------- TICKET SETUP ----------
    if (commandName === "ticket-setup") {
      if (!isAdmin(interaction)) {
        return interaction.editReply("❌ هذا الأمر للإدارة فقط.");
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🎫 الدعم الفني | VEX Guard")
        .setDescription("اضغط على الزر أدناه لفتح تذكرة خاصة مع فريق الإدارة.");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("vex_open_ticket")
          .setLabel("فتح تذكرة")
          .setEmoji("🎫")
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.channel.send({ embeds: [embed], components: [row] });
      return interaction.editReply("✅ تم نشر لوحة التذاكر في هذا الروم.");
    }

    // ---------- MODERATION ----------
    const moderationCommands = [
      "warn", "warnings", "kick", "ban", "unban",
      "timeout", "untimeout", "clear", "lock",
      "unlock", "slowmode", "announce"
    ];

    if (moderationCommands.includes(commandName) && !isAdmin(interaction)) {
      return interaction.editReply("❌ هذا الأمر للإدارة فقط.");
    }

    if (commandName === "warn") {
      const user = options.getUser("user", true);
      const reason = options.getString("reason", true);
      const list = warnings.get(user.id) || [];

      list.push({ reason, moderator: interaction.user.tag, date: new Date().toISOString() });
      warnings.set(user.id, list);

      return interaction.editReply(`⚠️ تم تحذير **${user.tag}**.\nالسبب: ${reason}`);
    }

    if (commandName === "warnings") {
      const user = options.getUser("user", true);
      const list = warnings.get(user.id) || [];

      return interaction.editReply(
        list.length
          ? `⚠️ تحذيرات **${user.tag}**:\n${list.map((w, i) => `${i + 1}. ${w.reason} — ${w.moderator}`).join("\n")}`
          : `✅ لا توجد تحذيرات مسجلة لـ ${user.tag}.`
      );
    }

    if (commandName === "kick" || commandName === "ban") {
      const user = options.getUser("user", true);
      const reason = options.getString("reason") || "لم يتم تحديد سبب";

      const target = await guild.members.fetch(user.id).catch(() => null);
      if (!target) {
        return interaction.editReply("❌ العضو غير موجود في السيرفر.");
      }

      if (target.id === interaction.user.id || target.id === client.user.id) {
        return interaction.editReply("❌ لا يمكنك تنفيذ هذا الإجراء على نفسك أو على البوت.");
      }

      if (!target.manageable) {
        return interaction.editReply("❌ لا أستطيع إدارة هذا العضو. تحقق من صلاحياتي وترتيب الرتب.");
      }

      if (commandName === "kick") {
        await target.kick(reason);
        return interaction.editReply(`👢 تم طرد ${user.tag}.\nالسبب: ${reason}`);
      }

      await target.ban({ reason });
      return interaction.editReply(`🔨 تم حظر ${user.tag}.\nالسبب: ${reason}`);
    }

    if (commandName === "unban") {
      const userId = options.getString("userid", true).trim();

      if (!/^\d{17,20}$/.test(userId)) {
        return interaction.editReply("❌ أرسل User ID صحيحًا.");
      }

      await guild.members.unban(userId);
      return interaction.editReply(`✅ تم إلغاء الحظر عن المستخدم \`${userId}\`.`);
    }

    if (commandName === "timeout") {
      const user = options.getUser("user", true);
      const minutes = options.getInteger("minutes", true);
      const reason = options.getString("reason") || "لم يتم تحديد سبب";
      const target = await guild.members.fetch(user.id).catch(() => null);

      if (!target) return interaction.editReply("❌ العضو غير موجود.");
      if (!target.moderatable) return interaction.editReply("❌ لا أستطيع إعطاء هذا العضو مهلة. تحقق من ترتيب الرتب.");

      await target.timeout(minutes * 60 * 1000, reason);
      return interaction.editReply(`⏳ تم إعطاء ${user.tag} مهلة لمدة ${minutes} دقيقة.`);
    }

    if (commandName === "untimeout") {
      const user = options.getUser("user", true);
      const target = await guild.members.fetch(user.id).catch(() => null);

      if (!target) return interaction.editReply("❌ العضو غير موجود.");
      if (!target.moderatable) return interaction.editReply("❌ لا أستطيع إزالة المهلة عن هذا العضو.");

      await target.timeout(null);
      return interaction.editReply(`✅ تمت إزالة المهلة عن ${user.tag}.`);
    }

    if (commandName === "clear") {
      const amount = options.getInteger("amount", true);

      if (!interaction.channel?.isTextBased() || !interaction.channel.bulkDelete) {
        return interaction.editReply("❌ هذا الأمر لا يعمل في هذا الروم.");
      }

      const deleted = await interaction.channel.bulkDelete(amount, true);
      return interaction.editReply(`🧹 تم حذف ${deleted.size} رسالة.`);
    }

    if (commandName === "lock" || commandName === "unlock") {
      const channel = interaction.channel;

      if (!channel || !("permissionOverwrites" in channel)) {
        return interaction.editReply("❌ لا يمكن تعديل صلاحيات هذا الروم.");
      }

      const everyone = guild.roles.everyone;
      const locked = commandName === "lock";

      await channel.permissionOverwrites.edit(everyone, {
        SendMessages: locked ? false : null
      });

      return interaction.editReply(
        locked ? "🔒 تم قفل الروم." : "🔓 تم فتح الروم."
      );
    }

    if (commandName === "slowmode") {
      const seconds = options.getInteger("seconds", true);
      const channel = interaction.channel;

      if (!channel || !("setRateLimitPerUser" in channel)) {
        return interaction.editReply("❌ لا يمكن تعديل بطء المحادثة في هذا الروم.");
      }

      await channel.setRateLimitPerUser(seconds);
      return interaction.editReply(`🐢 تم ضبط بطء المحادثة على ${seconds} ثانية.`);
    }

    if (commandName === "announce") {
      const message = options.getString("message", true);

      await interaction.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("📢 إعلان | XR")
            .setDescription(message)
            .setFooter({ text: "VEX Guard" })
            .setTimestamp()
        ]
      });

      return interaction.editReply("✅ تم إرسال الإعلان.");
    }

    return interaction.editReply("ℹ️ لم أتعرف على هذا الأمر.");
  } catch (error) {
    console.error("❌ خطأ أثناء تنفيذ التفاعل:", error);

    const message =
      error.code === 50013
        ? "❌ ينقص البوت صلاحية Discord المطلوبة."
        : "❌ حدث خطأ. راجع سجل Actions لمعرفة التفاصيل.";

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(message).catch(() => {});
    } else {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
    }
  }
});

// ==================== START ====================

client.login(TOKEN).catch(error => {
  console.error("❌ فشل تسجيل الدخول إلى Discord:", error);
});
