
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

// ===============================
// VEX GUARD - CONFIGURATION
// ===============================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const TICKET_CHANNEL_ID = process.env.TICKET_CHANNEL_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ أضف DISCORD_TOKEN و CLIENT_ID و GUILD_ID في GitHub Secrets.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const warnings = new Map();
const shortcuts = new Map();
const cooldowns = new Map();

// ===============================
// SLASH COMMANDS
// ===============================

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("عرض جميع أوامر VEX Guard"),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("تحذير عضو")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("عرض تحذيرات عضو")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("طرد عضو")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("حظر عضو")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("unban")
    .setDescription("فك حظر مستخدم بواسطة ID")
    .addStringOption(o => o.setName("userid").setDescription("ID المستخدم").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("إسكات عضو مؤقتًا")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("المدة بالدقائق").setMinValue(1).setMaxValue(40320).setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("إزالة الإسكات المؤقت")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("حذف رسائل من الروم")
    .addIntegerOption(o => o.setName("amount").setDescription("عدد الرسائل من 1 إلى 100").setMinValue(1).setMaxValue(100).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("قفل الروم")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("فتح الروم")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("تحديد وقت الانتظار بين الرسائل")
    .addIntegerOption(o => o.setName("seconds").setDescription("من 0 إلى 21600 ثانية").setMinValue(0).setMaxValue(21600).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("إرسال إعلان في الروم الحالي")
    .addStringOption(o => o.setName("text").setDescription("نص الإعلان").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("عرض معلومات عضو")
    .addUserOption(o => o.setName("user").setDescription("العضو")),

  new SlashCommandBuilder()
    .setName("ticket-setup")
    .setDescription("إنشاء لوحة التكتات")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("game")
    .setDescription("لعبة تخمين رقم"),

  new SlashCommandBuilder()
    .setName("games")
    .setDescription("عرض الألعاب المتاحة"),

  new SlashCommandBuilder()
    .setName("shortcut-create")
    .setDescription("إنشاء اختصار نصي")
    .addStringOption(o => o.setName("name").setDescription("اسم الاختصار").setRequired(true))
    .addStringOption(o => o.setName("text").setDescription("الرسالة التي يرسلها").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("shortcut-delete")
    .setDescription("حذف اختصار نصي")
    .addStringOption(o => o.setName("name").setDescription("اسم الاختصار").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("shortcuts")
    .setDescription("عرض الاختصارات"),

  new SlashCommandBuilder()
    .setName("shortcut-use")
    .setDescription("استخدام اختصار نصي")
    .addStringOption(o => o.setName("name").setDescription("اسم الاختصار").setRequired(true))
].map(command => command.toJSON());

// ===============================
// REGISTER COMMANDS
// ===============================

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log("✅ تم تسجيل أوامر XR.");
}

// ===============================
// READY / CONNECTION
// ===============================

client.once(Events.ClientReady, async bot => {
  console.log(`✅ ${bot.user.tag} متصل بـ Discord`);
  console.log("🛡️ VEX Guard جاهز للعمل.");

  try {
    await registerCommands();
  } catch (error) {
    console.error("❌ فشل تسجيل الأوامر:", error.message);
  }
});

client.on(Events.ShardDisconnect, () => {
  console.log("⚠️ انقطع اتصال Discord، تتم محاولة إعادة الاتصال.");
});

client.on(Events.ShardReconnecting, () => {
  console.log("🔄 إعادة الاتصال بـ Discord...");
});

client.on(Events.Error, error => {
  console.error("❌ خطأ Discord:", error.message);
});

// ===============================
// LOGGING
// ===============================

async function sendLog(guild, text) {
  if (!LOG_CHANNEL_ID) return;

  try {
    const channel = await guild.channels.fetch(LOG_CHANNEL_ID);
    if (channel && channel.isTextBased()) {
      await channel.send({ content: text });
    }
  } catch (error) {
    console.error("تعذر إرسال سجل الإدارة:", error.message);
  }
}

// ===============================
// TICKET BUTTONS
// ===============================

async function createTicket(interaction) {
  const guild = interaction.guild;

  const existing = guild.channels.cache.find(
    c => c.type === ChannelType.GuildText &&
         c.topic === `VEX_TICKET_${interaction.user.id}`
  );

  if (existing) {
    return interaction.editReply(`لديك تكت مفتوح بالفعل: ${existing}`);
  }

  const channel = await guild.channels.create({
    name: `ticket-${interaction.user.username}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 80),
    type: ChannelType.GuildText,
    topic: `VEX_TICKET_${interaction.user.id}`,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: interaction.user.id,
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

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("vex_ticket_close")
      .setLabel("إغلاق التكت")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `مرحبًا ${interaction.user} 👋\nاشرح طلبك هنا، وسيتمكن طاقم الإدارة من مساعدتك.`,
    components: [row]
  });

  await interaction.editReply(`✅ تم إنشاء تكتك: ${channel}`);
}

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId === "vex_ticket_open") {
        await interaction.deferReply({ ephemeral: true });
        return await createTicket(interaction);
      }

      if (interaction.customId === "vex_ticket_close") {
        if (!interaction.channel?.topic?.startsWith("VEX_TICKET_")) {
          return interaction.reply({
            content: "هذا ليس تكتًا تابعًا للبوت.",
            ephemeral: true
          });
        }

        const ownerId = interaction.channel.topic.slice("VEX_TICKET_".length);
        const isOwner = interaction.user.id === ownerId;
        const isMod = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels);

        if (!isOwner && !isMod) {
          return interaction.reply({
            content: "ليس لديك صلاحية إغلاق هذا التكت.",
            ephemeral: true
          });
        }

        await interaction.reply("🔒 سيتم إغلاق التكت بعد 3 ثوانٍ.");
        setTimeout(() => {
          interaction.channel.delete().catch(console.error);
        }, 3000);
      }

      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, guild, member } = interaction;

    // Keep Discord interactions from timing out.
    await interaction.deferReply({
      ephemeral: [
        "warn", "warnings", "kick", "ban", "unban",
        "timeout", "untimeout", "clear", "lock", "unlock",
        "slowmode", "ticket-setup", "shortcut-create",
        "shortcut-delete", "shortcut-use"
      ].includes(commandName)
    });

    const reply = content => interaction.editReply(content);
    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

    // =========================
    // HELP
    // =========================

    if (commandName === "help") {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🛡️ 『VEX』 Guard")
        .setDescription([
          "`/warn` — تحذير عضو",
          "`/warnings` — عرض التحذيرات",
          "`/kick` — طرد عضو",
          "`/ban` — حظر عضو",
          "`/unban` — فك الحظر",
          "`/timeout` — إسكات مؤقت",
          "`/untimeout` — إزالة الإسكات",
          "`/clear` — حذف رسائل",
          "`/lock` و `/unlock` — قفل وفتح الروم",
          "`/slowmode` — وقت الانتظار",
          "`/announce` — إعلان",
          "`/userinfo` — معلومات عضو",
          "`/ticket-setup` — إعداد التكتات",
          "`/game` و `/games` — ألعاب",
          "`/shortcut-create` و `/shortcut-use` — اختصارات",
          "`/shortcut-delete` و `/shortcuts` — إدارة الاختصارات"
        ].join("\n"));

      return reply({ embeds: [embed] });
    }

    // =========================
    // WARNINGS
    // =========================

    if (commandName === "warn") {
      const user = options.getUser("user");
      const reason = options.getString("reason");
      const list = warnings.get(user.id) || [];

      list.push({
        reason,
        moderator: interaction.user.id,
        date: new Date().toISOString()
      });

      warnings.set(user.id, list);
      await sendLog(guild, `⚠️ ${user.tag} تحذير من ${interaction.user.tag}: ${reason}`);

      return reply(`⚠️ تم تحذير ${user}.\nالسبب: ${reason}\nعدد تحذيراته في الذاكرة الحالية: ${list.length}`);
    }

    if (commandName === "warnings") {
      const user = options.getUser("user");
      const list = warnings.get(user.id) || [];

      return reply(
        list.length
          ? `⚠️ تحذيرات ${user.tag}:\n${list.map((w, i) => `${i + 1}. ${w.reason}`).join("\n")}`
          : `✅ لا توجد تحذيرات مسجلة لـ ${user.tag}.`
      );
    }

    // =========================
    // KICK / BAN / TIMEOUT
    // =========================

    if (["kick", "ban", "timeout", "untimeout"].includes(commandName)) {
      const user = options.getUser("user");
      const target = await guild.members.fetch(user.id).catch(() => null);

      if (!target) {
        return reply("❌ لم أجد العضو داخل السيرفر.");
      }

      if (user.id === interaction.user.id) {
        return reply("❌ لا يمكنك تنفيذ هذا الأمر على نفسك.");
      }

      if (user.id === client.user.id) {
        return reply("❌ لا يمكن تنفيذ هذا الأمر على البوت.");
      }

      if (!target.manageable) {
        return reply("❌ رتبة البوت يجب أن تكون أعلى من رتبة العضو.");
      }

      if (!isAdmin &&
          target.roles.highest.position >= member.roles.highest.position) {
        return reply("❌ لا يمكنك تنفيذ هذا الأمر على عضو رتبته مساوية أو أعلى من رتبتك.");
      }

      const reason = options.getString("reason") || `بواسطة ${interaction.user.tag}`;

      if (commandName === "kick") {
        if (!target.kickable) return reply("❌ لا أملك صلاحية طرد هذا العضو.");
        await target.kick(reason);
        await sendLog(guild, `👢 تم طرد ${user.tag}. السبب: ${reason}`);
        return reply(`✅ تم طرد ${user.tag}.`);
      }

      if (commandName === "ban") {
        if (!target.bannable) return reply("❌ لا أملك صلاحية حظر هذا العضو.");
        await target.ban({ reason });
        await sendLog(guild, `🔨 تم حظر ${user.tag}. السبب: ${reason}`);
        return reply(`✅ تم حظر ${user.tag}.`);
      }

      if (commandName === "timeout") {
        const minutes = options.getInteger("minutes");
        await target.timeout(minutes * 60 * 1000, reason);
        await sendLog(guild, `🔇 تم إسكات ${user.tag} لمدة ${minutes} دقيقة.`);
        return reply(`✅ تم إسكات ${user.tag} لمدة ${minutes} دقيقة.`);
      }

      if (commandName === "untimeout") {
        await target.timeout(null, `إزالة الإسكات بواسطة ${interaction.user.tag}`);
        return reply(`✅ تمت إزالة الإسكات عن ${user.tag}.`);
      }
    }

    if (commandName === "unban") {
      const userId = options.getString("userid");

      try {
        await guild.members.unban(userId, `بواسطة ${interaction.user.tag}`);
        await sendLog(guild, `🔓 تم فك الحظر عن ID: ${userId}`);
        return reply(`✅ تم فك الحظر عن ${userId}.`);
      } catch {
        return reply("❌ تعذر فك الحظر. تحقق من ID والصلاحيات.");
      }
    }

    // =========================
    // CHANNEL MODERATION
    // =========================

    if (commandName === "clear") {
      const amount = options.getInteger("amount");

      if (!interaction.channel?.bulkDelete) {
        return reply("❌ لا يمكن حذف الرسائل في هذا الروم.");
      }

      const deleted = await interaction.channel.bulkDelete(amount, true);
      return reply(`🧹 تم حذف ${deleted.size} رسالة.`);
    }

    if (commandName === "lock" || commandName === "unlock") {
      const channel = interaction.channel;

      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: commandName === "unlock"
          ? null
          : false
      });

      return reply(
        commandName === "lock"
          ? "🔒 تم قفل الروم."
          : "🔓 تم فتح الروم."
      );
    }

    if (commandName === "slowmode") {
      const seconds = options.getInteger("seconds");
      await interaction.channel.setRateLimitPerUser(seconds);
      return reply(`✅ تم ضبط Slowmode على ${seconds} ثانية.`);
    }

    if (commandName === "announce") {
      const text = options.getString("text");

      await interaction.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("📢 إعلان XR")
            .setDescription(text)
            .setFooter({ text: "『VEX』 Guard" })
            .setTimestamp()
        ]
      });

      return reply("✅ تم إرسال الإعلان.");
    }

    // =========================
    // USER INFO
    // =========================

    if (commandName === "userinfo") {
      const user = options.getUser("user") || interaction.user;
      const target = await guild.members.fetch(user.id).catch(() => null);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`معلومات ${user.tag}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: "اسم المستخدم", value: user.tag, inline: true },
          { name: "ID", value: user.id, inline: true },
          { name: "تاريخ إنشاء الحساب", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: false }
        );

      if (target) {
        embed.addFields({
          name: "تاريخ الانضمام للسيرفر",
          value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:D>`,
          inline: false
        });
      }

      return reply({ embeds: [embed] });
    }

    // =========================
    // TICKETS
    // =========================

    if (commandName === "ticket-setup") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("vex_ticket_open")
          .setLabel("فتح تكت")
          .setEmoji("🎫")
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("🎫 نظام التكتات")
            .setDescription("اضغط على الزر لفتح تكت خاص والتواصل مع الإدارة.")
        ],
        components: [row]
      });

      return reply("✅ تم إنشاء لوحة التكتات.");
    }

    // =========================
    // GAMES
    // =========================

    if (commandName === "games") {
      return reply("🎮 الألعاب المتاحة:\n`/game` — تخمين رقم من 1 إلى 5.");
    }

    if (commandName === "game") {
      const answer = Math.floor(Math.random() * 5) + 1;

      return reply(
        `🎲 ${interaction.user} خمن رقمًا من 1 إلى 5!\nالرقم هو **${answer}** 😄`
      );
    }

    // =========================
    // TEXT SHORTCUTS
    // =========================

    if (commandName === "shortcut-create") {
      const name = options.getString("name").toLowerCase().trim();
      const text = options.getString("text").trim();

      if (!/^[a-z0-9_-]{1,30}$/.test(name)) {
        return reply("❌ استخدم حروفًا إنجليزية صغيرة أو أرقامًا أو - أو _، بحد أقصى 30 حرفًا.");
      }

      if (text.length > 1800) {
        return reply("❌ الرسالة طويلة جدًا. الحد الأقصى 1800 حرف.");
      }

      shortcuts.set(name, text);
      return reply(`✅ تم إنشاء الاختصار **${name}**.\nاستخدمه عبر \`/shortcut-use name:${name}\`.`);
    }

    if (commandName === "shortcut-delete") {
      const name = options.getString("name").toLowerCase().trim();

      if (!shortcuts.has(name)) {
        return reply("❌ هذا الاختصار غير موجود.");
      }

      shortcuts.delete(name);
      return reply(`✅ تم حذف الاختصار **${name}**.`);
    }

    if (commandName === "shortcuts") {
      return reply(
        shortcuts.size
          ? `📋 الاختصارات:\n${[...shortcuts.keys()].map(name => `• ${name}`).join("\n")}`
          : "لا توجد اختصارات حاليًا."
      );
    }

    if (commandName === "shortcut-use") {
      const name = options.getString("name").toLowerCase().trim();
      const text = shortcuts.get(name);

      return reply(text || "❌ لم أجد هذا الاختصار.");
    }

  } catch (error) {
    console.error("❌ خطأ أثناء تنفيذ الأمر:", error);

    const message = "❌ حدث خطأ أثناء تنفيذ الأمر. تحقق من صلاحيات البوت وسجل التشغيل.";

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(message);
      } else {
        await interaction.reply({ content: message, ephemeral: true });
      }
    } catch (replyError) {
      console.error("تعذر الرد على التفاعل:", replyError.message);
    }
  }
});

// ===============================
// GLOBAL ERRORS
// ===============================

process.on("unhandledRejection", error => {
  console.error("❌ Promise error:", error);
});

process.on("uncaughtException", error => {
  console.error("❌ Unexpected error:", error);
});

// ===============================
// START BOT
// ===============================

client.login(TOKEN).catch(error => {
  console.error("❌ فشل تسجيل الدخول إلى Discord:", error.message);
  process.exit(1);
});
