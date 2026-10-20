
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ خطأ: تحقق من DISCORD_TOKEN و CLIENT_ID و GUILD_ID في GitHub Secrets.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages
  ]
});

const warnings = new Map();

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("عرض قائمة أوامر VEX Guard"),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("تحذير عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("سبب التحذير").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("عرض تحذيرات عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("حذف رسائل من الروم")
    .addIntegerOption(o => o.setName("amount").setDescription("عدد الرسائل من 1 إلى 100").setMinValue(1).setMaxValue(100).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("طرد عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("حظر عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("إسكات عضو مؤقتًا")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("المدة بالدقائق").setMinValue(1).setMaxValue(40320).setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("إزالة الإسكات عن عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("قفل الروم الحالي")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("فتح الروم الحالي")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("تحديد وقت بين الرسائل بالثواني")
    .addIntegerOption(o => o.setName("seconds").setDescription("من 0 إلى 21600").setMinValue(0).setMaxValue(21600).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("إرسال إعلان في روم")
    .addChannelOption(o => o.setName("channel").setDescription("روم الإعلان").addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("نص الإعلان").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("عرض معلومات عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true)),

  new SlashCommandBuilder()
    .setName("ticket-setup")
    .setDescription("إنشاء لوحة فتح التكت")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
].map(command => command.toJSON());

client.once("clientReady", async () => {
  console.log("==================================");
  console.log(`✅ دخل البوت: ${client.user.tag}`);
  console.log(`🛡️ السيرفر المستهدف: ${GUILD_ID}`);
  console.log("⚙️ جاري تسجيل أوامر Slash...");

  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log(`✅ تم تسجيل ${commands.length} أمرًا بنجاح.`);
  } catch (error) {
    console.error("❌ فشل تسجيل الأوامر:", error.message);
    console.error("تأكد من CLIENT_ID و GUILD_ID ومن إضافة البوت للسيرفر مع applications.commands.");
  }

  console.log("🟢 VEX Guard جاهز للعمل.");
  console.log("==================================");
});

client.on("interactionCreate", async interaction => {
  if (interaction.isButton()) {
    if (interaction.customId === "vex_ticket_open") {
      const existing = interaction.guild.channels.cache.find(
        c => c.type === ChannelType.GuildText &&
        c.name === `ticket-${interaction.user.id}`
      );

      if (existing) {
        return interaction.reply({
          content: `عندك تكت مفتوح بالفعل: ${existing}`,
          ephemeral: true
        });
      }

      try {
        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.id}`,
          type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
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

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("vex_ticket_close")
            .setLabel("إغلاق التكت")
            .setStyle(ButtonStyle.Danger)
        );

        await channel.send({
          content: `أهلًا ${interaction.user}، اشرح مشكلتك هنا وسيتم مساعدتك.`,
          components: [closeRow]
        });

        console.log(`🎫 فتح تكت بواسطة ${interaction.user.tag}`);
        return interaction.reply({
          content: `تم فتح التكت: ${channel}`,
          ephemeral: true
        });
      } catch (error) {
        console.error("❌ خطأ فتح التكت:", error.message);
        return interaction.reply({
          content: "تعذر فتح التكت. تأكد من صلاحيات البوت.",
          ephemeral: true
        });
      }
    }

    if (interaction.customId === "vex_ticket_close") {
      if (!interaction.channel.name.startsWith("ticket-")) {
        return interaction.reply({ content: "هذا ليس روم تكت.", ephemeral: true });
      }

      await interaction.reply("🔒 سيتم إغلاق التكت خلال 3 ثوانٍ.");
      console.log(`🔒 إغلاق تكت بطلب ${interaction.user.tag}`);
      setTimeout(() => {
        interaction.channel.delete().catch(error =>
          console.error("❌ تعذر حذف التكت:", error.message)
        );
      }, 3000);
    }

    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName, guild, member, user } = interaction;
  console.log(`📌 الأمر /${commandName} استعمله ${user.tag}`);

  try {
    if (commandName === "help") {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🛡️ VEX Guard — قائمة الأوامر")
        .setDescription([
          "`/help` — المساعدة",
          "`/warn` — تحذير عضو",
          "`/warnings` — عرض التحذيرات",
          "`/kick` — طرد عضو",
          "`/ban` — حظر عضو",
          "`/timeout` — إسكات مؤقت",
          "`/untimeout` — إزالة الإسكات",
          "`/clear` — حذف رسائل",
          "`/lock` و `/unlock` — قفل وفتح الروم",
          "`/slowmode` — تحديد سرعة الرسائل",
          "`/announce` — إرسال إعلان",
          "`/userinfo` — معلومات عضو",
          "`/ticket-setup` — إعداد التكت"
        ].join("\n"))
        .setFooter({ text: "XR • VEX Guard" });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (commandName === "warn") {
      const target = interaction.options.getUser("member");
      const reason = interaction.options.getString("reason");
      const key = `${guild.id}:${target.id}`;
      const list = warnings.get(key) || [];
      list.push({ reason, moderator: user.tag, date: new Date().toISOString() });
      warnings.set(key, list);

      console.log(`⚠️ تحذير ${target.tag}: ${reason}`);
      return interaction.reply(`⚠️ تم تحذير ${target}.\nالسبب: ${reason}`);
    }

    if (commandName === "warnings") {
      const target = interaction.options.getUser("member");
      const list = warnings.get(`${guild.id}:${target.id}`) || [];
      const description = list.length
        ? list.map((w, i) => `${i + 1}. ${w.reason} — بواسطة ${w.moderator}`).join("\n")
        : "لا توجد تحذيرات محفوظة لهذا العضو.";

      return interaction.reply({
        content: `📋 تحذيرات ${target}:\n${description}`,
        ephemeral: true
      });
    }

    if (commandName === "kick") {
      const target = interaction.options.getMember("member");
      const reason = interaction.options.getString("reason") || "لم يُذكر سبب";
      if (!target) return interaction.reply({ content: "العضو غير موجود في السيرفر.", ephemeral: true });
      if (!target.kickable) return interaction.reply({ content: "لا أستطيع طرد هذا العضو. تحقق من ترتيب الرتب وصلاحياتي.", ephemeral: true });

      await target.kick(reason);
      console.log(`👢 طرد ${target.user.tag}: ${reason}`);
      return interaction.reply(`👢 تم طرد **${target.user.tag}**.\nالسبب: ${reason}`);
    }

    if (commandName === "ban") {
      const target = interaction.options.getMember("member");
      const reason = interaction.options.getString("reason") || "لم يُذكر سبب";
      if (!target) return interaction.reply({ content: "العضو غير موجود في السيرفر.", ephemeral: true });
      if (!target.bannable) return interaction.reply({ content: "لا أستطيع حظر هذا العضو. تحقق من ترتيب الرتب وصلاحياتي.", ephemeral: true });

      await target.ban({ reason });
      console.log(`🔨 حظر ${target.user.tag}: ${reason}`);
      return interaction.reply(`🔨 تم حظر **${target.user.tag}**.\nالسبب: ${reason}`);
    }

    if (commandName === "timeout") {
      const target = interaction.options.getMember("member");
      const minutes = interaction.options.getInteger("minutes");
      const reason = interaction.options.getString("reason") || "لم يُذكر سبب";
      if (!target) return interaction.reply({ content: "العضو غير موجود.", ephemeral: true });
      if (!target.moderatable) return interaction.reply({ content: "لا أستطيع إسكات هذا العضو.", ephemeral: true });

      await target.timeout(minutes * 60 * 1000, reason);
      console.log(`🔇 إسكات ${target.user.tag} لمدة ${minutes} دقيقة`);
      return interaction.reply(`🔇 تم إسكات ${target} لمدة ${minutes} دقيقة.`);
    }

    if (commandName === "untimeout") {
      const target = interaction.options.getMember("member");
      if (!target) return interaction.reply({ content: "العضو غير موجود.", ephemeral: true });
      if (!target.moderatable) return interaction.reply({ content: "لا أستطيع تعديل هذا العضو.", ephemeral: true });

      await target.timeout(null);
      console.log(`🔊 إزالة الإسكات عن ${target.user.tag}`);
      return interaction.reply(`🔊 تم إزالة الإسكات عن ${target}.`);
    }

    if (commandName === "clear") {
      const amount = interaction.options.getInteger("amount");
      const deleted = await interaction.channel.bulkDelete(amount, true);
      console.log(`🧹 حذف ${deleted.size} رسالة في #${interaction.channel.name}`);
      return interaction.reply({
        content: `🧹 تم حذف ${deleted.size} رسالة.`,
        ephemeral: true
      });
    }

    if (commandName === "lock" || commandName === "unlock") {
      const locked = commandName === "lock";
      await interaction.channel.permissionOverwrites.edit(
        guild.roles.everyone,
        { SendMessages: !locked }
      );
      console.log(`${locked ? "🔒" : "🔓"} ${locked ? "قفل" : "فتح"} #${interaction.channel.name}`);
      return interaction.reply(locked ? "🔒 تم قفل الروم." : "🔓 تم فتح الروم.");
    }

    if (commandName === "slowmode") {
      const seconds = interaction.options.getInteger("seconds");
      await interaction.channel.setRateLimitPerUser(seconds);
      console.log(`⏱️ Slowmode في #${interaction.channel.name}: ${seconds}s`);
      return interaction.reply(`⏱️ تم ضبط Slowmode على ${seconds} ثانية.`);
    }

    if (commandName === "announce") {
      const channel = interaction.options.getChannel("channel");
      const message = interaction.options.getString("message");
      await channel.send({ embeds: [
        new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle("📢 إعلان XR")
          .setDescription(message)
          .setFooter({ text: `بواسطة ${user.tag}` })
          .setTimestamp()
      ] });
      console.log(`📢 إعلان أرسله ${user.tag} في #${channel.name}`);
      return interaction.reply({ content: "✅ تم إرسال الإعلان.", ephemeral: true });
    }

    if (commandName === "userinfo") {
      const target = interaction.options.getUser("member");
      const targetMember = await guild.members.fetch(target.id).catch(() => null);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`👤 معلومات ${target.tag}`)
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: "ID", value: target.id },
          { name: "تاريخ إنشاء الحساب", value: `<t:${Math.floor(target.createdTimestamp / 1000)}:F>` },
          { name: "تاريخ دخول السيرفر", value: targetMember ? `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:F>` : "غير معروف" }
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (commandName === "ticket-setup") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("vex_ticket_open")
          .setLabel("🎫 فتح تكت")
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("🎫 الدعم الفني — XR")
            .setDescription("اضغط على الزر أدناه لفتح تكت خاص مع فريق الدعم.")
        ],
        components: [row]
      });

      console.log(`🎫 إعداد لوحة التكت بواسطة ${user.tag}`);
      return interaction.reply({ content: "✅ تم إنشاء لوحة التكت.", ephemeral: true });
    }
  } catch (error) {
    console.error(`❌ خطأ في /${commandName}:`, error);

    const message = "❌ حدث خطأ أثناء تنفيذ الأمر. تأكد من صلاحيات البوت وترتيب الرتب.";
    if (interaction.replied || interaction.deferred) {
      return interaction.followUp({ content: message, ephemeral: true }).catch(() => {});
    }
    return interaction.reply({ content: message, ephemeral: true }).catch(() => {});
  }
});

client.on("error", error => {
  console.error("❌ خطأ في Discord Client:", error);
});

process.on("unhandledRejection", error => {
  console.error("❌ خطأ غير معالج:", error);
});

console.log("==================================");
console.log("🛡️ VEX Guard بدأ التشغيل");
console.log("📦 تم تحميل ملف vex.js");
console.log("⚙️ جاري الاتصال بـ Discord...");
console.log("==================================");

client.login(TOKEN).catch(error => {
  console.error("❌ فشل تسجيل الدخول:", error.message);
  process.exit(1);
});
