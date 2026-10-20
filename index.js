
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

// ================================
// VEX GUARD - XR SERVER
// ================================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  throw new Error("Missing DISCORD_TOKEN or CLIENT_ID in Secrets.");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("عرض قائمة أوامر VEX Guard"),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("تحذير عضو")
    .addUserOption(o =>
      o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("reason").setDescription("سبب التحذير").setRequired(true)),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("طرد عضو")
    .addUserOption(o =>
      o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("reason").setDescription("السبب").setRequired(false)),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("حظر عضو")
    .addUserOption(o =>
      o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("reason").setDescription("السبب").setRequired(false)),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("إسكات عضو مؤقتًا")
    .addUserOption(o =>
      o.setName("member").setDescription("العضو").setRequired(true))
    .addIntegerOption(o =>
      o.setName("minutes").setDescription("المدة بالدقائق")
        .setMinValue(1).setMaxValue(40320).setRequired(true))
    .addStringOption(o =>
      o.setName("reason").setDescription("السبب").setRequired(false)),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("حذف رسائل من الروم")
    .addIntegerOption(o =>
      o.setName("amount").setDescription("عدد الرسائل")
        .setMinValue(1).setMaxValue(100).setRequired(true)),

  new SlashCommandBuilder()
    .setName("ticket-setup")
    .setDescription("إنشاء رسالة فتح التكت")
].map(command => command.toJSON());

const spamTracker = new Map();
const linkPattern = /https?:\/\/\S+|discord\.gg\/\S+/i;

client.once("clientReady", async () => {
  console.log(`🛡️ VEX Guard is online as ${client.user.tag}`);

  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    if (GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: commands }
      );
    } else {
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands }
      );
    }

    console.log("✅ Slash commands registered.");
  } catch (error) {
    console.error("Command registration failed:", error);
  }
});

// ================================
// ANTI-SPAM & ANTI-LINK
// ================================

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  if (message.member?.permissions.has(
    PermissionFlagsBits.ManageMessages
  )) return;

  if (linkPattern.test(message.content)) {
    try {
      await message.delete();
      await message.author.send(
        `⚠️ تم حذف رابط أرسلته في سيرفر ${message.guild.name}.`
      ).catch(() => {});
    } catch (error) {
      console.error("Link protection error:", error);
    }
    return;
  }

  const now = Date.now();
  const key = `${message.guild.id}:${message.author.id}`;
  let data = spamTracker.get(key);

  if (!data || now - data.start > 5000) {
    data = { start: now, count: 0 };
  }

  data.count++;
  spamTracker.set(key, data);

  if (data.count >= 6) {
    try {
      await message.delete();
      await message.member?.timeout(
        60 * 1000,
        "VEX Guard: Anti-spam"
      );
      await message.channel.send(
        `🛡️ ${message.author} تم إسكاتك لمدة دقيقة بسبب السبام.`
      );
    } catch (error) {
      console.error("Anti-spam error:", error);
    }

    spamTracker.delete(key);
  }
});

// ================================
// INTERACTIONS
// ================================

client.on("interactionCreate", async interaction => {
  try {
    // Ticket buttons
    if (interaction.isButton()) {
      if (interaction.customId === "vex_open_ticket") {
        const existing = interaction.guild.channels.cache.find(
          channel =>
            channel.type === ChannelType.GuildText &&
            channel.topic === `VEX-TICKET:${interaction.user.id}`
        );

        if (existing) {
          return interaction.reply({
            content: `لديك تكت مفتوح بالفعل: ${existing}`,
            ephemeral: true
          });
        }

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "")
            .slice(0, 80),
          type: ChannelType.GuildText,
          topic: `VEX-TICKET:${interaction.user.id}`,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone.id,
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

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle("🎫 VEX GUARD SUPPORT")
          .setDescription(
            `أهلًا ${interaction.user}!\nاكتب طلبك هنا، وسيساعدك فريق الإدارة.`
          )
          .setFooter({ text: "XR • VEX Guard" });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("vex_close_ticket")
            .setLabel("إغلاق التكت")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger)
        );

        await channel.send({
          content: `${interaction.user}`,
          embeds: [embed],
          components: [row]
        });

        return interaction.reply({
          content: `✅ تم فتح تكتك: ${channel}`,
          ephemeral: true
        });
      }

      if (interaction.customId === "vex_close_ticket") {
        if (
          !interaction.channel.topic?.startsWith("VEX-TICKET:") ||
          !interaction.memberPermissions?.has(
            PermissionFlagsBits.ManageChannels
          ) &&
          interaction.channel.topic !== `VEX-TICKET:${interaction.user.id}`
        ) {
          return interaction.reply({
            content: "❌ ليس لديك صلاحية إغلاق هذا التكت.",
            ephemeral: true
          });
        }

        await interaction.reply({
          content: "🔒 سيتم إغلاق التكت خلال 3 ثوانٍ..."
        });

        setTimeout(() => {
          interaction.channel.delete("VEX Guard ticket closed")
            .catch(console.error);
        }, 3000);

        return;
      }
    }

    if (!interaction.isChatInputCommand()) return;

    const { commandName, member, guild } = interaction;
    const isAdmin = member.permissions.has(
      PermissionFlagsBits.Administrator
    );

    // Help
    if (commandName === "help") {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🛡️ VEX GUARD • XR")
        .setDescription([
          "`/help` — قائمة الأوامر",
          "`/warn` — تحذير عضو",
          "`/kick` — طرد عضو",
          "`/ban` — حظر عضو",
          "`/timeout` — إسكات مؤقت",
          "`/clear` — حذف الرسائل",
          "`/ticket-setup` — إعداد التكت",
          "",
          "🔗 حماية الروابط مفعلة.",
          "🚫 حماية السبام مفعلة."
        ].join("\n"));

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    // Ticket setup
    if (commandName === "ticket-setup") {
      if (!isAdmin) {
        return interaction.reply({
          content: "❌ هذا الأمر للإدارة فقط.",
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🎫 مركز الدعم • XR")
        .setDescription(
          "اضغط على الزر أدناه لفتح تكت والتواصل مع الإدارة."
        )
        .setFooter({ text: "VEX Guard • Support System" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("vex_open_ticket")
          .setLabel("فتح تكت")
          .setEmoji("🎫")
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.channel.send({
        embeds: [embed],
        components: [row]
      });

      return interaction.reply({
        content: "✅ تم إرسال رسالة التكت.",
        ephemeral: true
      });
    }

    // Permissions
    const permissionCommands = [
      "warn", "kick", "ban", "timeout", "clear"
    ];

    if (permissionCommands.includes(commandName) && !isAdmin) {
      return interaction.reply({
        content: "❌ هذا الأمر خاص بالإدارة.",
        ephemeral: true
      });
    }

    // Warn
    if (commandName === "warn") {
      const user = interaction.options.getUser("member");
      const reason = interaction.options.getString("reason");

      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xF1C40F)
            .setTitle("⚠️ تحذير عضو")
            .addFields(
              { name: "العضو", value: `${user}`, inline: true },
              { name: "الإداري", value: `${interaction.user}`, inline: true },
              { name: "السبب", value: reason }
            )
            .setFooter({ text: "VEX Guard • XR" })
            .setTimestamp()
        ]
      });
      return;
    }

    // Kick
    if (commandName === "kick") {
      const user = interaction.options.getUser("member");
      const reason =
        interaction.options.getString("reason") || "لم يتم تحديد سبب";
      const target = await guild.members.fetch(user.id).catch(() => null);

      if (!target) {
        return interaction.reply({
          content: "❌ العضو غير موجود في السيرفر.",
          ephemeral: true
        });
      }

      if (!target.kickable) {
        return interaction.reply({
          content: "❌ لا أستطيع طرد هذا العضو. تحقق من صلاحياتي وترتيب الرتب.",
          ephemeral: true
        });
      }

      await target.kick(reason);
      return interaction.reply(`👢 تم طرد ${user}.\nالسبب: ${reason}`);
    }

    // Ban
    if (commandName === "ban") {
      const user = interaction.options.getUser("member");
      const reason =
        interaction.options.getString("reason") || "لم يتم تحديد سبب";

      const target = await guild.members.fetch(user.id).catch(() => null);

      if (target && !target.bannable) {
        return interaction.reply({
          content: "❌ لا أستطيع حظر هذا العضو. تحقق من ترتيب الرتب.",
          ephemeral: true
        });
      }

      await guild.members.ban(user.id, { reason });
      return interaction.reply(`🔨 تم حظر ${user}.\nالسبب: ${reason}`);
    }

    // Timeout
    if (commandName === "timeout") {
      const user = interaction.options.getUser("member");
      const minutes = interaction.options.getInteger("minutes");
      const reason =
        interaction.options.getString("reason") || "لم يتم تحديد سبب";

      const target = await guild.members.fetch(user.id).catch(() => null);

      if (!target || !target.moderatable) {
        return interaction.reply({
          content: "❌ لا أستطيع إسكات هذا العضو.",
          ephemeral: true
        });
      }

      await target.timeout(minutes * 60 * 1000, reason);

      return interaction.reply(
        `🔇 تم إسكات ${user} لمدة ${minutes} دقيقة.\nالسبب: ${reason}`
      );
    }

    // Clear messages
    if (commandName === "clear") {
      if (!interaction.channel?.bulkDelete) {
        return interaction.reply({
          content: "❌ لا يمكن حذف الرسائل في هذا الروم.",
          ephemeral: true
        });
      }

      const amount = interaction.options.getInteger("amount");
      const deleted = await interaction.channel.bulkDelete(amount, true);

      return interaction.reply({
        content: `🧹 تم حذف ${deleted.size} رسالة.`,
        ephemeral: true
      });
    }

  } catch (error) {
    console.error("VEX Guard error:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ حدث خطأ. تحقق من صلاحيات البوت وسجلات التشغيل.",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

client.login(TOKEN);
