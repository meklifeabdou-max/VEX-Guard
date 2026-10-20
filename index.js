
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || "";

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ تحقق من DISCORD_TOKEN و CLIENT_ID.");
  process.exit(1);
}

const TIMEOUT_MS = 10 * 60 * 1000;
const SPAM_LIMIT = 5;
const SPAM_WINDOW = 5000;
const LINK_LIMIT = 3;

const linkRegex = /https?:\/\/\S+|www\.\S+|discord\.gg\/\S+/i;

const commands = [
  new SlashCommandBuilder()
    .setName("مساعدة")
    .setDescription("عرض أوامر VEX Guard"),

  new SlashCommandBuilder()
    .setName("تحذير")
    .setDescription("تحذير عضو")
    .addUserOption(o =>
      o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("طرد")
    .setDescription("طرد عضو")
    .addUserOption(o =>
      o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("حظر")
    .setDescription("حظر عضو")
    .addUserOption(o =>
      o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("مهلة")
    .setDescription("إسكات عضو لمدة 10 دقائق")
    .addUserOption(o =>
      o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("إعداد-التكت")
    .setDescription("نشر لوحة التكت")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
].map(c => c.toJSON());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const messageHistory = new Map();
const violations = new Map();

function isStaff(member) {
  return member.permissions.has(PermissionFlagsBits.ManageChannels) ||
    member.permissions.has(PermissionFlagsBits.Administrator);
}

function getTicketInfo(channel) {
  if (!channel?.topic) return null;

  const owner = channel.topic.match(/vex-owner=(\d+)/);
  const type = channel.topic.match(/vex-type=(support|shop)/);

  if (!owner || !type) return null;

  return { ownerId: owner[1], type: type[1] };
}

function ticketPanel() {
  const embed = new EmbedBuilder()
    .setColor(0x7C3AED)
    .setTitle("🎫 VEX GUARD | مركز التذاكر")
    .setDescription(
      "مرحبًا بك في مركز الدعم الرسمي لسيرفر **XR**!\n\n" +
      "اختر نوع التكت المناسب من الأزرار بالأسفل.\n" +
      "ستُنشأ قناة خاصة بك وبالإدارة."
    )
    .addFields(
      {
        name: "💬 الدعم والمساعدة",
        value: "للاستفسارات والمشاكل وطلب المساعدة."
      },
      {
        name: "🛒 الشراء والخدمات",
        value: "للطلبات والأسعار والاستفسار عن الخدمات."
      },
      {
        name: "🔒 الخصوصية",
        value: "التكت خاص بصاحبه والإدارة المخوّلة فقط."
      }
    )
    .setFooter({ text: "XR • VEX Guard" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("vex_ticket_support")
      .setLabel("الدعم والمساعدة")
      .setEmoji("💬")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("vex_ticket_shop")
      .setLabel("الشراء")
      .setEmoji("🛒")
      .setStyle(ButtonStyle.Success)
  );

  return { embeds: [embed], components: [row] };
}

function closeButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("vex_ticket_close")
      .setLabel("إغلاق التكت")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)
  );
}

// تسجيل الأوامر دون حذف Entry Point أو الأوامر الأخرى
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  const route = Routes.applicationCommands(CLIENT_ID);

  const existingCommands = await rest.get(route);

  for (const command of commands) {
    const existing = existingCommands.find(
      item => item.name === command.name && item.type === 1
    );

    try {
      if (existing) {
        await rest.patch(
          Routes.applicationCommand(CLIENT_ID, existing.id),
          { body: command }
        );

        console.log(`🔄 تم تحديث: ${command.name}`);
      } else {
        const created = await rest.post(route, { body: command });
        existingCommands.push(created);

        console.log(`✅ تم تسجيل: ${command.name}`);
      }
    } catch (error) {
      console.error(
        `❌ فشل تسجيل ${command.name}:`,
        error.message
      );
      throw error;
    }
  }

  console.log("✅ اكتمل تسجيل أوامر VEX Guard دون حذف الأوامر الأخرى.");
}

client.once("clientReady", () => {
  console.log(`🛡️ VEX Guard يعمل باسم ${client.user.tag}`);
});

// حماية السبام والروابط
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot || !message.member) return;

  if (
    message.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    message.member.permissions.has(PermissionFlagsBits.Administrator)
  ) return;

  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();

  const times = (messageHistory.get(key) || [])
    .filter(time => now - time < SPAM_WINDOW);

  times.push(now);
  messageHistory.set(key, times);

  if (times.length >= SPAM_LIMIT) {
    try {
      const recent = await message.channel.messages.fetch({ limit: 10 });

      const userMessages = recent.filter(
        m => m.author.id === message.author.id &&
          now - m.createdTimestamp < SPAM_WINDOW
      );

      if (userMessages.size >= SPAM_LIMIT) {
        await message.channel.bulkDelete(userMessages, true);

        if (message.member.moderatable) {
          await message.member.timeout(
            TIMEOUT_MS,
            "VEX Guard: Spam"
          );
        }

        await message.channel.send(
          `🚨 ${message.author} تم رصد السبام وإزالة الرسائل الحديثة.`
        );
      }

      messageHistory.delete(key);
    } catch (error) {
      console.error("خطأ في حماية السبام:", error.message);
    }

    return;
  }

  if (linkRegex.test(message.content)) {
    try {
      await message.delete();

      const count = (violations.get(key) || 0) + 1;
      violations.set(key, count);

      if (count >= LINK_LIMIT) {
        if (message.member.moderatable) {
          await message.member.timeout(
            TIMEOUT_MS,
            "VEX Guard: تكرار نشر الروابط"
          );

          violations.set(key, 0);

          await message.channel.send(
            `🔗 ${message.author} تلقى مهلة 10 دقائق لتكرار نشر الروابط.`
          );
        } else {
          await message.channel.send(
            `⚠️ ${message.author} الروابط ممنوعة.`
          );
        }
      } else {
        await message.channel.send({
          content:
            `⚠️ ${message.author} الروابط ممنوعة. ` +
            `المخالفة ${count}/${LINK_LIMIT}.`,
          allowedMentions: { users: [message.author.id] }
        });
      }
    } catch (error) {
      console.error("خطأ في حماية الروابط:", error.message);
    }
  }
});

// الأوامر والأزرار
client.on("interactionCreate", async interaction => {
  try {
    // أزرار التكت
    if (interaction.isButton()) {
      const id = interaction.customId;

      if (
        id === "vex_ticket_support" ||
        id === "vex_ticket_shop"
      ) {
        await interaction.deferReply({
          flags: MessageFlags.Ephemeral
        });

        const guild = interaction.guild;
        if (!guild) {
          return await interaction.editReply(
            "❌ هذا الزر يعمل داخل السيرفر فقط."
          );
        }

        const type = id === "vex_ticket_support" ? "support" : "shop";
        const typeName = type === "support" ? "الدعم" : "الشراء";

        const existing = guild.channels.cache.find(channel => {
          const info = getTicketInfo(channel);

          return channel.type === ChannelType.GuildText &&
            info?.ownerId === interaction.user.id &&
            info?.type === type;
        });

        if (existing) {
          return await interaction.editReply(
            `⚠️ لديك تكت ${typeName} مفتوح بالفعل: ${existing}`
          );
        }

        const botMember = guild.members.me ||
          await guild.members.fetchMe();

        if (!botMember.permissions.has(
          PermissionFlagsBits.ManageChannels
        )) {
          return await interaction.editReply(
            "❌ البوت يحتاج صلاحية Manage Channels."
          );
        }

        let parent;

        if (TICKET_CATEGORY_ID) {
          parent = await guild.channels.fetch(TICKET_CATEGORY_ID)
            .catch(() => null);

          if (!parent || parent.type !== ChannelType.GuildCategory) {
            return await interaction.editReply(
              "❌ معرّف تصنيف التكت غير صحيح. صحّح TICKET_CATEGORY_ID أو اتركه فارغًا."
            );
          }
        }

        const overwrites = [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.EmbedLinks
            ]
          },
          {
            id: botMember.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ManageMessages
            ]
          }
        ];

        const staffRoles = guild.roles.cache.filter(role =>
          role.id !== guild.roles.everyone.id &&
          (
            role.permissions.has(PermissionFlagsBits.ManageChannels) ||
            role.permissions.has(PermissionFlagsBits.Administrator)
          )
        );

        for (const role of staffRoles.values()) {
          overwrites.push({
            id: role.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          });
        }

        const safeName = interaction.user.username
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "")
          .slice(0, 40) || "member";

        const channel = await guild.channels.create({
          name: `${type}-${safeName}`.slice(0, 90),
          type: ChannelType.GuildText,
          topic: `vex-owner=${interaction.user.id};vex-type=${type}`,
          permissionOverwrites: overwrites,
          ...(parent ? { parent: parent.id } : {})
        });

        const embed = new EmbedBuilder()
          .setColor(type === "support" ? 0x5865F2 : 0x2ECC71)
          .setTitle(
            type === "support"
              ? "💬 تكت الدعم والمساعدة"
              : "🛒 تكت الشراء والخدمات"
          )
          .setDescription(
            `أهلًا ${interaction.user}!\n\n` +
            `تم فتح تكت **${typeName}** بنجاح.\n` +
            "اكتب طلبك بالتفصيل وانتظر رد الإدارة.\n\n" +
            "🔒 القناة خاصة بك وبالإدارة."
          )
          .addFields({
            name: "📌 تعليمات",
            value:
              "• اشرح طلبك بوضوح.\n" +
              "• لا تكرر الرسائل دون داعٍ.\n" +
              "• استخدم زر الإغلاق عند الانتهاء."
          })
          .setFooter({ text: "XR • VEX Guard" })
          .setTimestamp();

        await channel.send({
          content: `${interaction.user}`,
          embeds: [embed],
          components: [closeButton()],
          allowedMentions: { users: [interaction.user.id] }
        });

        return await interaction.editReply(
          `✅ تم إنشاء تكت ${typeName}: ${channel}`
        );
      }

      if (id === "vex_ticket_close") {
        const info = getTicketInfo(interaction.channel);

        if (!info) {
          return await interaction.reply({
            content: "❌ هذه ليست قناة تكت صالحة.",
            flags: MessageFlags.Ephemeral
          });
        }

        if (
          interaction.user.id !== info.ownerId &&
          !isStaff(interaction.member)
        ) {
          return await interaction.reply({
            content: "❌ لا يمكنك إغلاق هذا التكت.",
            flags: MessageFlags.Ephemeral
          });
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("vex_ticket_confirm_close")
            .setLabel("نعم، أغلق التكت")
            .setStyle(ButtonStyle.Danger),

          new ButtonBuilder()
            .setCustomId("vex_ticket_cancel_close")
            .setLabel("إلغاء")
            .setStyle(ButtonStyle.Secondary)
        );

        return await interaction.reply({
          content: "⚠️ هل أنت متأكد؟ سيتم حذف قناة التكت نهائيًا.",
          components: [row],
          flags: MessageFlags.Ephemeral
        });
      }

      if (
        id === "vex_ticket_confirm_close" ||
        id === "vex_ticket_cancel_close"
      ) {
        const info = getTicketInfo(interaction.channel);

        if (!info) {
          return await interaction.reply({
            content: "❌ قناة التكت غير صالحة.",
            flags: MessageFlags.Ephemeral
          });
        }

        if (
          interaction.user.id !== info.ownerId &&
          !isStaff(interaction.member)
        ) {
          return await interaction.reply({
            content: "❌ لا يمكنك تنفيذ هذا الإجراء.",
            flags: MessageFlags.Ephemeral
          });
        }

        if (id === "vex_ticket_cancel_close") {
          return await interaction.update({
            content: "✅ تم إلغاء إغلاق التكت.",
            components: []
          });
        }

        const channel = interaction.channel;

        await interaction.deferUpdate();
        await channel.delete("إغلاق التكت بواسطة صاحبه أو الإدارة")
          .catch(error => {
            console.error("تعذر حذف التكت:", error.message);
          });

        return;
      }

      return;
    }

    if (!interaction.isChatInputCommand() || !interaction.guild) return;

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral
    });

    const command = interaction.commandName;

    if (command === "إعداد-التكت") {
      if (!isStaff(interaction.member)) {
        return await interaction.editReply("❌ هذا الأمر للإدارة فقط.");
      }

      await interaction.channel.send(ticketPanel());

      return await interaction.editReply(
        "✅ تم نشر لوحة التكت بنجاح."
      );
    }

    if (command === "مساعدة") {
      return await interaction.editReply(
        "🛡️ **VEX Guard | XR**\n\n" +
        "`/مساعدة` — عرض الأوامر\n" +
        "`/تحذير` — تحذير عضو\n" +
        "`/طرد` — طرد عضو\n" +
        "`/حظر` — حظر عضو\n" +
        "`/مهلة` — إسكات عضو 10 دقائق\n" +
        "`/إعداد-التكت` — نشر لوحة التكت\n\n" +
        "🎫 نظام تكت للدعم والشراء\n" +
        "🚨 حماية تلقائية من السبام والروابط"
      );
    }

    const user = interaction.options.getUser("العضو");
    const reason =
      interaction.options.getString("السبب") || "لم يُذكر السبب";

    if (command === "تحذير") {
      if (!interaction.memberPermissions.has(
        PermissionFlagsBits.ModerateMembers
      )) {
        return await interaction.editReply("❌ لا تملك صلاحية التحذير.");
      }

      return await interaction.editReply(
        `⚠️ تم إصدار تحذير للعضو ${user}.\n📝 السبب: ${reason}`
      );
    }

    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);

    if (!member) {
      return await interaction.editReply("❌ لم أجد العضو في السيرفر.");
    }

    if (member.id === interaction.user.id || member.id === client.user.id) {
      return await interaction.editReply(
        "❌ لا يمكنك تطبيق هذا الأمر على نفسك أو على البوت."
      );
    }

    if (command === "طرد") {
      if (!interaction.memberPermissions.has(
        PermissionFlagsBits.KickMembers
      )) {
        return await interaction.editReply("❌ لا تملك صلاحية الطرد.");
      }

      if (!member.kickable) {
        return await interaction.editReply(
          "❌ لا أستطيع طرد هذا العضو. تحقق من ترتيب الرتب."
        );
      }

      await member.kick(reason);

      return await interaction.editReply(
        `👢 تم طرد **${user.tag}**.\n📝 السبب: ${reason}`
      );
    }

    if (command === "حظر") {
      if (!interaction.memberPermissions.has(
        PermissionFlagsBits.BanMembers
      )) {
        return await interaction.editReply("❌ لا تملك صلاحية الحظر.");
      }

      if (!member.bannable) {
        return await interaction.editReply(
          "❌ لا أستطيع حظر هذا العضو. تحقق من ترتيب الرتب."
        );
      }

      await member.ban({ reason });

      return await interaction.editReply(
        `🔨 تم حظر **${user.tag}**.\n📝 السبب: ${reason}`
      );
    }

    if (command === "مهلة") {
      if (!interaction.memberPermissions.has(
        PermissionFlagsBits.ModerateMembers
      )) {
        return await interaction.editReply("❌ لا تملك صلاحية المهلة.");
      }

      if (!member.moderatable) {
        return await interaction.editReply(
          "❌ لا أستطيع إعطاءه مهلة. تحقق من ترتيب الرتب."
        );
      }

      await member.timeout(TIMEOUT_MS, reason);

      return await interaction.editReply(
        `🔇 تم إسكات **${user.tag}** لمدة 10 دقائق.\n📝 السبب: ${reason}`
      );
    }
  } catch (error) {
    console.error("خطأ في التفاعل:", error);

    if (interaction.deferred) {
      await interaction.editReply({
        content: "❌ حدث خطأ. تحقق من صلاحيات البوت وإعدادات القنوات."
      }).catch(() => {});
    } else if (!interaction.replied) {
      await interaction.reply({
        content: "❌ حدث خطأ أثناء تنفيذ العملية.",
        flags: MessageFlags.Ephemeral
      }).catch(() => {});
    }
  }
});

client.on("error", error => {
  console.error("خطأ في عميل Discord:", error);
});

(async () => {
  try {
    await registerCommands();
    await client.login(TOKEN);
  } catch (error) {
    console.error("❌ فشل تشغيل VEX Guard:", error);
    process.exitCode = 1;
  }
})();
