
const D = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;

if (!TOKEN || !CLIENT_ID) {
  throw new Error("Missing DISCORD_TOKEN or CLIENT_ID in GitHub Secrets.");
}

const bot = new D.Client({
  intents: [
    D.GatewayIntentBits.Guilds,
    D.GatewayIntentBits.GuildMembers,
    D.GatewayIntentBits.GuildMessages,
    D.GatewayIntentBits.MessageContent
  ]
});

const warnings = new Map();
const spam = new Map();
const linkPattern = /https?:\/\/\S+|discord\.gg\/\S+/i;

const commands = [
  new D.SlashCommandBuilder()
    .setName("help")
    .setDescription("عرض أوامر VEX Guard"),

  new D.SlashCommandBuilder()
    .setName("warn")
    .setDescription("تحذير عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(true)),

  new D.SlashCommandBuilder()
    .setName("warnings")
    .setDescription("عرض تحذيرات عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true)),

  new D.SlashCommandBuilder()
    .setName("kick")
    .setDescription("طرد عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(false)),

  new D.SlashCommandBuilder()
    .setName("ban")
    .setDescription("حظر عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(false)),

  new D.SlashCommandBuilder()
    .setName("unban")
    .setDescription("فك حظر عضو باستخدام ID")
    .addStringOption(o => o.setName("userid").setDescription("معرّف المستخدم").setRequired(true)),

  new D.SlashCommandBuilder()
    .setName("timeout")
    .setDescription("إسكات عضو مؤقتًا")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("المدة بالدقائق").setMinValue(1).setMaxValue(40320).setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(false)),

  new D.SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("إزالة الإسكات عن عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true)),

  new D.SlashCommandBuilder()
    .setName("clear")
    .setDescription("حذف رسائل")
    .addIntegerOption(o => o.setName("amount").setDescription("عدد الرسائل").setMinValue(1).setMaxValue(100).setRequired(true)),

  new D.SlashCommandBuilder()
    .setName("lock")
    .setDescription("قفل الروم الحالي"),

  new D.SlashCommandBuilder()
    .setName("unlock")
    .setDescription("فتح الروم الحالي"),

  new D.SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("تغيير الوضع البطيء للروم")
    .addIntegerOption(o => o.setName("seconds").setDescription("الثواني، صفر للتعطيل").setMinValue(0).setMaxValue(21600).setRequired(true)),

  new D.SlashCommandBuilder()
    .setName("announce")
    .setDescription("إرسال إعلان")
    .addChannelOption(o => o.setName("channel").setDescription("روم الإعلان").addChannelTypes(D.ChannelType.GuildText).setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("نص الإعلان").setMaxLength(2000).setRequired(true)),

  new D.SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("معلومات عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(false)),

  new D.SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("معلومات السيرفر"),

  new D.SlashCommandBuilder()
    .setName("ticket-setup")
    .setDescription("إرسال لوحة فتح التكت")
].map(c => c.toJSON());

async function logAction(guild, title, description) {
  if (!LOG_CHANNEL_ID) return;

  const channel = guild.channels.cache.get(LOG_CHANNEL_ID);
  if (!channel?.isTextBased()) return;

  const embed = new D.EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp()
    .setFooter({ text: "VEX Guard • XR" });

  await channel.send({ embeds: [embed] }).catch(console.error);
}

async function replyError(interaction, message) {
  const data = { content: message, ephemeral: true };

  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(data).catch(() => {});
  } else {
    await interaction.reply(data).catch(() => {});
  }
}

bot.once("ready", async () => {
  console.log(`🛡️ VEX Guard online as ${bot.user.tag}`);

  try {
    const rest = new D.REST({ version: "10" }).setToken(TOKEN);
    const route = GUILD_ID
      ? D.Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      : D.Routes.applicationCommands(CLIENT_ID);

    await rest.put(route, { body: commands });
    console.log(`✅ Registered ${commands.length} commands.`);
  } catch (error) {
    console.error("Command registration error:", error);
  }
});

// Anti-link and anti-spam
bot.on("messageCreate", async message => {
  if (!message.guild || message.author.bot || !message.member) return;

  if (message.member.permissions.has(D.PermissionFlagsBits.ManageMessages)) return;

  if (linkPattern.test(message.content)) {
    try {
      await message.delete();
      await message.channel.send({
        content: `⚠️ ${message.author} الروابط ممنوعة في هذا السيرفر.`
      }).then(m => setTimeout(() => m.delete().catch(() => {}), 5000));
    } catch (error) {
      console.error("Link protection error:", error);
    }
    return;
  }

  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  let entry = spam.get(key);

  if (!entry || now - entry.start > 5000) {
    entry = { start: now, count: 0 };
  }

  entry.count++;
  spam.set(key, entry);

  if (entry.count >= 6) {
    try {
      await message.delete();
      await message.member.timeout(60_000, "VEX Guard anti-spam");
      await logAction(
        message.guild,
        "🚫 Anti-spam",
        `${message.author.tag} تم إسكات العضو دقيقة بسبب السبام.`
      );
    } catch (error) {
      console.error("Anti-spam error:", error);
    }
    spam.delete(key);
  }
});

bot.on("interactionCreate", async interaction => {
  try {
    // Ticket buttons
    if (interaction.isButton()) {
      if (interaction.customId === "vex_ticket_open") {
        const existing = interaction.guild.channels.cache.find(
          c => c.type === D.ChannelType.GuildText &&
            c.topic === `VEX-TICKET:${interaction.user.id}`
        );

        if (existing) {
          return interaction.reply({
            content: `لديك تكت مفتوح: ${existing}`,
            ephemeral: true
          });
        }

        const overwrites = [
          {
            id: interaction.guild.roles.everyone.id,
            deny: [D.PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              D.PermissionFlagsBits.ViewChannel,
              D.PermissionFlagsBits.SendMessages,
              D.PermissionFlagsBits.ReadMessageHistory
            ]
          },
          {
            id: bot.user.id,
            allow: [
              D.PermissionFlagsBits.ViewChannel,
              D.PermissionFlagsBits.SendMessages,
              D.PermissionFlagsBits.ReadMessageHistory,
              D.PermissionFlagsBits.ManageChannels
            ]
          }
        ];

        const options = {
          name: `ticket-${interaction.user.username}`
            .toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80) || "ticket",
          type: D.ChannelType.GuildText,
          topic: `VEX-TICKET:${interaction.user.id}`,
          permissionOverwrites: overwrites
        };

        if (TICKET_CATEGORY_ID) options.parent = TICKET_CATEGORY_ID;

        const channel = await interaction.guild.channels.create(options);

        const row = new D.ActionRowBuilder().addComponents(
          new D.ButtonBuilder()
            .setCustomId("vex_ticket_close")
            .setLabel("إغلاق التكت")
            .setEmoji("🔒")
            .setStyle(D.ButtonStyle.Danger)
        );

        await channel.send({
          content: `${interaction.user} أهلًا بك! اشرح طلبك هنا.`,
          components: [row]
        });

        return interaction.reply({
          content: `✅ تم فتح تكتك: ${channel}`,
          ephemeral: true
        });
      }

      if (interaction.customId === "vex_ticket_close") {
        const topic = interaction.channel?.topic || "";
        const isOwner = topic === `VEX-TICKET:${interaction.user.id}`;
        const canManage = interaction.memberPermissions?.has(
          D.PermissionFlagsBits.ManageChannels
        );

        if (!topic.startsWith("VEX-TICKET:") || (!isOwner && !canManage)) {
          return interaction.reply({
            content: "❌ ليس لديك صلاحية إغلاق هذا التكت.",
            ephemeral: true
          });
        }

        await interaction.reply("🔒 سيتم إغلاق التكت بعد 3 ثوانٍ.");
        const channel = interaction.channel;
        setTimeout(() => {
          channel.delete("VEX Guard ticket closed").catch(console.error);
        }, 3000);
        return;
      }
    }

    if (!interaction.isChatInputCommand()) return;

    const name = interaction.commandName;
    const guild = interaction.guild;
    const member = interaction.member;
    const isAdmin = interaction.memberPermissions?.has(
      D.PermissionFlagsBits.Administrator
    );

    if (name === "help") {
      return interaction.reply({
        embeds: [
          new D.EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("🛡️ VEX Guard • XR")
            .setDescription([
              "`/help` — المساعدة",
              "`/warn` — تحذير",
              "`/warnings` — عرض التحذيرات",
              "`/kick` — طرد",
              "`/ban` — حظر",
              "`/unban` — فك الحظر",
              "`/timeout` — إسكات",
              "`/untimeout` — إزالة الإسكات",
              "`/clear` — حذف الرسائل",
              "`/lock` و `/unlock` — قفل وفتح الروم",
              "`/slowmode` — الوضع البطيء",
              "`/announce` — إعلان",
              "`/userinfo` و `/serverinfo` — المعلومات",
              "`/ticket-setup` — إعداد التكت"
            ].join("\n"))
        ],
        ephemeral: true
      });
    }

    if (name === "userinfo") {
      const user = interaction.options.getUser("member") || interaction.user;
      const target = await guild.members.fetch(user.id).catch(() => null);

      const embed = new D.EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`👤 ${user.tag}`)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
          { name: "User ID", value: user.id },
          { name: "تاريخ إنشاء الحساب", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>` },
          { name: "تاريخ دخول السيرفر", value: target ? `<t:${Math.floor(target.joinedTimestamp / 1000)}:D>` : "غير متوفر" }
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (name === "serverinfo") {
      const g = await guild.fetch();

      const embed = new D.EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`📊 ${g.name}`)
        .setThumbnail(g.iconURL())
        .addFields(
          { name: "Server ID", value: g.id },
          { name: "عدد الأعضاء", value: String(g.memberCount), inline: true },
          { name: "عدد الرومات", value: String(g.channels.cache.size), inline: true },
          { name: "تاريخ الإنشاء", value: `<t:${Math.floor(g.createdTimestamp / 1000)}:D>` }
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (name === "ticket-setup") {
      if (!isAdmin) return replyError(interaction, "❌ هذا الأمر للإدارة فقط.");

      const row = new D.ActionRowBuilder().addComponents(
        new D.ButtonBuilder()
          .setCustomId("vex_ticket_open")
          .setLabel("فتح تكت")
          .setEmoji("🎫")
          .setStyle(D.ButtonStyle.Primary)
      );

      await interaction.channel.send({
        embeds: [
          new D.EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("🎫 مركز الدعم • XR")
            .setDescription("اضغط على الزر لفتح تكت والتواصل مع الإدارة.")
        ],
        components: [row]
      });

      return interaction.reply({
        content: "✅ تم إنشاء لوحة التكت.",
        ephemeral: true
      });
    }

    const adminCommands = [
      "warn", "warnings", "kick", "ban", "unban", "timeout",
      "untimeout", "clear", "lock", "unlock", "slowmode", "announce"
    ];

    if (adminCommands.includes(name) && !isAdmin) {
      return replyError(interaction, "❌ هذا الأمر للإدارة فقط.");
    }

    if (name === "warn") {
      const user = interaction.options.getUser("member");
      const reason = interaction.options.getString("reason");
      const key = `${guild.id}:${user.id}`;
      const list = warnings.get(key) || [];

      list.push({
        reason,
        moderator: interaction.user.tag,
        date: new Date().toISOString()
      });

      warnings.set(key, list);

      await logAction(guild, "⚠️ تحذير", `العضو: ${user.tag}\nالسبب: ${reason}\nالإداري: ${interaction.user.tag}`);

      return interaction.reply(`⚠️ تم تحذير ${user}.\nالسبب: ${reason}`);
    }

    if (name === "warnings") {
      const user = interaction.options.getUser("member");
      const list = warnings.get(`${guild.id}:${user.id}`) || [];

      return interaction.reply({
        content: list.length
          ? `⚠️ تحذيرات ${user.tag}:\n${list.map((w, i) => `${i + 1}. ${w.reason} — ${w.moderator}`).join("\n")}`
          : `✅ لا توجد تحذيرات محفوظة لـ ${user.tag}.`,
        ephemeral: true
      });
    }

    if (name === "kick") {
      const user = interaction.options.getUser("member");
      const target = await guild.members.fetch(user.id).catch(() => null);
      const reason = interaction.options.getString("reason") || "بدون سبب محدد";

      if (!target || !target.kickable || user.id === interaction.user.id) {
        return replyError(interaction, "❌ لا يمكن طرد هذا العضو.");
      }

      await target.kick(reason);
      await logAction(guild, "👢 طرد عضو", `${user.tag}\nالسبب: ${reason}\nالإداري: ${interaction.user.tag}`);
      return interaction.reply(`👢 تم طرد ${user}.`);
    }

    if (name === "ban") {
      const user = interaction.options.getUser("member");
      const target = await guild.members.fetch(user.id).catch(() => null);
      const reason = interaction.options.getString("reason") || "بدون سبب محدد";

      if (user.id === interaction.user.id || (target && !target.bannable)) {
        return replyError(interaction, "❌ لا يمكن حظر هذا العضو.");
      }

      await guild.members.ban(user.id, { reason });
      await logAction(guild, "🔨 حظر عضو", `${user.tag}\nالسبب: ${reason}\nالإداري: ${interaction.user.tag}`);
      return interaction.reply(`🔨 تم حظر ${user}.`);
    }

    if (name === "unban") {
      const id = interaction.options.getString("userid").trim();

      if (!/^\d{17,20}$/.test(id)) {
        return replyError(interaction, "❌ أدخل User ID صحيحًا.");
      }

      await guild.members.unban(id);
      await logAction(guild, "✅ فك الحظر", `User ID: ${id}\nالإداري: ${interaction.user.tag}`);
      return interaction.reply(`✅ تم فك الحظر عن ID: ${id}`);
    }

    if (name === "timeout") {
      const user = interaction.options.getUser("member");
      const minutes = interaction.options.getInteger("minutes");
      const reason = interaction.options.getString("reason") || "بدون سبب محدد";
      const target = await guild.members.fetch(user.id).catch(() => null);

      if (!target?.moderatable || user.id === interaction.user.id) {
        return replyError(interaction, "❌ لا يمكن إسكات هذا العضو.");
      }

      await target.timeout(minutes * 60_000, reason);
      await logAction(guild, "🔇 إسكات عضو", `${user.tag}\nالمدة: ${minutes} دقيقة\nالسبب: ${reason}`);
      return interaction.reply(`🔇 تم إسكات ${user} لمدة ${minutes} دقيقة.`);
    }

    if (name === "untimeout") {
      const user = interaction.options.getUser("member");
      const target = await guild.members.fetch(user.id).catch(() => null);

      if (!target?.moderatable) return replyError(interaction, "❌ لا يمكن إزالة الإسكات عن هذا العضو.");

      await target.timeout(null, "VEX Guard untimeout");
      await logAction(guild, "🔊 إزالة الإسكات", `${user.tag}\nالإداري: ${interaction.user.tag}`);
      return interaction.reply(`🔊 تمت إزالة الإسكات عن ${user}.`);
    }

    if (name === "clear") {
      const amount = interaction.options.getInteger("amount");

      if (!interaction.channel?.bulkDelete) {
        return replyError(interaction, "❌ لا يمكن حذف الرسائل في هذا الروم.");
      }

      const deleted = await interaction.channel.bulkDelete(amount, true);
      await logAction(guild, "🧹 حذف رسائل", `تم حذف ${deleted.size} رسالة بواسطة ${interaction.user.tag}.`);

      return interaction.reply({
        content: `🧹 تم حذف ${deleted.size} رسالة.`,
        ephemeral: true
      });
    }

    if (name === "lock" || name === "unlock") {
      const channel = interaction.channel;
      const everyone = guild.roles.everyone;

      await channel.permissionOverwrites.edit(everyone, {
        SendMessages: name === "unlock" ? null : false
      });

      await logAction(guild, "🔐 إعدادات الروم", `${channel} — ${name === "lock" ? "تم القفل" : "تم الفتح"}`);
      return interaction.reply(name === "lock" ? "🔒 تم قفل الروم." : "🔓 تم فتح الروم.");
    }

    if (name === "slowmode") {
      const seconds = interaction.options.getInteger("seconds");

      if (!interaction.channel?.setRateLimitPerUser) {
        return replyError(interaction, "❌ لا يمكن تغيير الوضع البطيء هنا.");
      }

      await interaction.channel.setRateLimitPerUser(seconds);
      return interaction.reply(seconds === 0
        ? "✅ تم تعطيل الوضع البطيء."
        : `🐢 تم ضبط الوضع البطيء على ${seconds} ثانية.`);
    }

    if (name === "announce") {
      const channel = interaction.options.getChannel("channel");
      const message = interaction.options.getString("message");

      await channel.send({
        embeds: [
          new D.EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("📢 إعلان • XR")
            .setDescription(message)
            .setFooter({ text: `بواسطة ${interaction.user.tag}` })
            .setTimestamp()
        ],
        allowedMentions: { parse: [] }
      });

      await logAction(guild, "📢 إعلان جديد", `القناة: ${channel}\nبواسطة: ${interaction.user.tag}`);
      return interaction.reply({ content: "✅ تم إرسال الإعلان.", ephemeral: true });
    }
  } catch (error) {
    console.error("VEX Guard error:", error);
    await replyError(interaction, "❌ حدث خطأ. تحقق من صلاحيات البوت وسجلات Actions.");
  }
});

bot.login(TOKEN);
