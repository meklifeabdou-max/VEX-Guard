
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
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");

// ==================== الإعدادات ====================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || "";

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ تأكد من إعداد DISCORD_TOKEN و CLIENT_ID.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName("مساعدة")
    .setDescription("عرض جميع أوامر VEX Guard"),

  new SlashCommandBuilder()
    .setName("تحذير")
    .setDescription("تحذير عضو")
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("سبب التحذير").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("طرد")
    .setDescription("طرد عضو")
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("السبب").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("حظر")
    .setDescription("حظر عضو من السيرفر")
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("السبب").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("مهلة")
    .setDescription("إعطاء عضو مهلة")
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addIntegerOption(o =>
      o.setName("الدقائق").setDescription("مدة المهلة بالدقائق")
        .setRequired(true).setMinValue(1).setMaxValue(40320)
    )
    .addStringOption(o => o.setName("السبب").setDescription("السبب").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("إعداد-التكت")
    .setDescription("إنشاء لوحة التكت")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("قفل")
    .setDescription("قفل الروم الحالي")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("فتح")
    .setDescription("فتح الروم الحالي")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("مسح")
    .setDescription("حذف رسائل من الروم")
    .addIntegerOption(o =>
      o.setName("العدد").setDescription("عدد الرسائل من 1 إلى 100")
        .setRequired(true).setMinValue(1).setMaxValue(100)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("طرد-صامت")
    .setDescription("طرد عضو دون إعلان عام")
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("السبب").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("فك-الحظر")
    .setDescription("فك الحظر عن مستخدم")
    .addStringOption(o => o.setName("الايدي").setDescription("ID المستخدم المحظور").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("السبب").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("معلومات")
    .setDescription("عرض معلومات عضو")
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(false)),

  new SlashCommandBuilder()
    .setName("إحصائيات")
    .setDescription("عرض إحصائيات السيرفر"),

  new SlashCommandBuilder()
    .setName("إعلان")
    .setDescription("إرسال إعلان باسم البوت")
    .addStringOption(o => o.setName("النص").setDescription("محتوى الإعلان").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("إضافة-رتبة")
    .setDescription("إعطاء رتبة لعضو")
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addRoleOption(o => o.setName("الرتبة").setDescription("الرتبة").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("نزع-رتبة")
    .setDescription("سحب رتبة من عضو")
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addRoleOption(o => o.setName("الرتبة").setDescription("الرتبة").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  new SlashCommandBuilder()
    .setName("ألعاب")
    .setDescription("العب ألعابًا بسيطة داخل ديسكورد")
    .addStringOption(o =>
      o.setName("اللعبة").setDescription("اختر اللعبة").setRequired(true)
        .addChoices(
          { name: "تخمين الرقم", value: "guess" },
          { name: "حجر ورقة مقص", value: "rps" },
          { name: "سؤال ثقافي", value: "trivia" }
        )
    )
    .addIntegerOption(o =>
      o.setName("رقم").setDescription("تخمين رقم من 1 إلى 5")
        .setRequired(false).setMinValue(1).setMaxValue(5)
    )
    .addStringOption(o =>
      o.setName("اختيار").setDescription("حجر أو ورقة أو مقص، أو إجابتك الثقافية")
        .setRequired(false)
    ),
].map(command => command.toJSON());

// ==================== تسجيل الأوامر ====================

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  const route = Routes.applicationCommands(CLIENT_ID);
  const existing = await rest.get(route);

  for (const command of commands) {
    const found = existing.find(
      item => item.name === command.name && item.type === 1
    );

    try {
      if (found) {
        await rest.patch(
          Routes.applicationCommand(CLIENT_ID, found.id),
          { body: command }
        );
        console.log(`🔄 تم تحديث: ${command.name}`);
      } else {
        const created = await rest.post(route, { body: command });
        existing.push(created);
        console.log(`✅ تم تسجيل: ${command.name}`);
      }
    } catch (error) {
      console.error(`❌ فشل تسجيل ${command.name}:`, error.message);
      throw error;
    }
  }

  console.log("✅ اكتمل تسجيل أوامر VEX Guard.");
}

// ==================== أدوات مساعدة ====================

function isStaff(interaction) {
  return interaction.memberPermissions?.has(
    PermissionFlagsBits.Administrator
  ) || interaction.memberPermissions?.has(
    PermissionFlagsBits.ManageChannels
  );
}

async function replyPrivate(interaction, content) {
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply({ content });
  }

  return interaction.reply({
    content,
    flags: MessageFlags.Ephemeral,
  });
}

async function getTargetMember(interaction, user) {
  return interaction.guild.members.fetch(user.id).catch(() => null);
}

function canManageTarget(interaction, target, permission) {
  if (!interaction.memberPermissions?.has(permission)) return false;
  if (!target) return false;

  const executor = interaction.member;
  if (!executor || target.id === interaction.user.id) return false;
  if (target.id === interaction.guild.ownerId) return false;

  if (
    interaction.guild.ownerId !== interaction.user.id &&
    executor.roles.highest.comparePositionTo(target.roles.highest) <= 0
  ) return false;

  return true;
}

// ==================== تشغيل البوت ====================

client.once("clientReady", async () => {
  console.log(`🛡️ VEX Guard يعمل باسم ${client.user.tag}`);

  try {
    await registerCommands();
  } catch (error) {
    console.error("❌ تعذر تسجيل بعض الأوامر:", error.message);
  }
});

// ==================== حماية السبام والروابط ====================

const messageTimes = new Map();
const linkViolations = new Map();

const LINK_REGEX = /https?:\/\/\S+|www\.\S+|discord\.gg\/\S+/i;

client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot || !message.member) return;

  // نستثني الإدارة من إجراءات الحماية التلقائية
  if (
    message.member.permissions.has(PermissionFlagsBits.Administrator) ||
    message.member.permissions.has(PermissionFlagsBits.ManageMessages)
  ) return;

  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  const times = (messageTimes.get(key) || []).filter(t => now - t < 5000);

  times.push(now);
  messageTimes.set(key, times);

  // حماية السبام: 5 رسائل خلال 5 ثوانٍ
  if (times.length >= 5) {
    messageTimes.set(key, []);
    try {
      const recent = await message.channel.messages.fetch({ limit: 30 });
      const userMessages = recent.filter(
        m => m.author.id === message.author.id && Date.now() - m.createdTimestamp < 10000
      );

      const deletable = userMessages.filter(
        m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000
      );

      await Promise.allSettled(deletable.map(m => m.delete()));

      if (message.member.moderatable) {
        await message.member.timeout(10 * 60 * 1000, "VEX Guard: Spam");
      }

      const notice = await message.channel.send(
        `🛑 ${message.author} تم رصد السبام. الرجاء عدم تكرار الرسائل بسرعة.`
      );
      setTimeout(() => notice.delete().catch(() => {}), 7000);
    } catch (error) {
      console.error("خطأ حماية السبام:", error.message);
    }
    return;
  }

  // حماية الروابط: حذف الرابط وتسجيل المخالفة
  if (LINK_REGEX.test(message.content)) {
    try {
      await message.delete();

      const count = (linkViolations.get(key) || 0) + 1;
      linkViolations.set(key, count);

      let text = `🔗 ${message.author} الروابط ممنوعة هنا. تحذير ${count}/3.`;

      if (count >= 3) {
        linkViolations.set(key, 0);

        if (message.member.moderatable) {
          await message.member.timeout(10 * 60 * 1000, "VEX Guard: Repeated links");
          text = `⛔ ${message.author} كرر إرسال الروابط وتم منحه مهلة 10 دقائق.`;
        } else {
          text = `⛔ ${message.author} كرر إرسال الروابط، لكن البوت لا يستطيع منحه مهلة بسبب الصلاحيات أو ترتيب الرتب.`;
        }
      }

      const notice = await message.channel.send(text);
      setTimeout(() => notice.delete().catch(() => {}), 7000);
    } catch (error) {
      console.error("خطأ حماية الروابط:", error.message);
    }
  }
});

// ==================== أوامر التفاعل ====================

client.on("interactionCreate", async interaction => {
  try {
    // -------------------- الأوامر --------------------
    if (interaction.isChatInputCommand()) {
      const { commandName, guild } = interaction;

      if (commandName === "مساعدة") {
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle("🛡️ VEX Guard | قائمة الأوامر")
          .setDescription(
            "**الإدارة:**\n" +
            "`/تحذير` `/طرد` `/حظر` `/مهلة` `/طرد-صامت` `/فك-الحظر`\n\n" +
            "**الرومات:**\n" +
            "`/قفل` `/فتح` `/مسح` `/إعلان`\n\n" +
            "**الرتب والمعلومات:**\n" +
            "`/إضافة-رتبة` `/نزع-رتبة` `/معلومات` `/إحصائيات`\n\n" +
            "**التكت والألعاب:**\n" +
            "`/إعداد-التكت` `/ألعاب`\n\n" +
            "🛑 الحماية من السبام والروابط تعمل تلقائيًا."
          );

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }

      if (commandName === "تحذير") {
        const user = interaction.options.getUser("العضو");
        const reason = interaction.options.getString("السبب");
        return interaction.reply({
          embeds: [
            new EmbedBuilder().setColor(0xF1C40F)
              .setTitle("⚠️ تحذير إداري")
              .addFields(
                { name: "العضو", value: `${user}`, inline: true },
                { name: "المشرف", value: `${interaction.user}`, inline: true },
                { name: "السبب", value: reason }
              )
              .setTimestamp()
          ]
        });
      }

      if (commandName === "طرد" || commandName === "طرد-صامت") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const user = interaction.options.getUser("العضو");
        const reason = interaction.options.getString("السبب") || "لم يحدد سبب";
        const target = await getTargetMember(interaction, user);

        if (!target) return replyPrivate(interaction, "❌ العضو غير موجود في السيرفر.");
        if (!canManageTarget(interaction, target, PermissionFlagsBits.KickMembers)) {
          return replyPrivate(interaction, "❌ لا تملك الصلاحية أو أن رتبة العضو أعلى من رتبتك.");
        }
        if (!target.kickable) return replyPrivate(interaction, "❌ لا أستطيع طرد هذا العضو. تحقق من صلاحيات البوت وترتيب الرتب.");

        await target.kick(reason);
        return replyPrivate(interaction, `✅ تم طرد ${user.tag}.\nالسبب: ${reason}`);
      }

      if (commandName === "حظر") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const user = interaction.options.getUser("العضو");
        const reason = interaction.options.getString("السبب") || "لم يحدد سبب";
        const target = await getTargetMember(interaction, user);

        if (!interaction.memberPermissions?.has(PermissionFlagsBits.BanMembers)) {
          return replyPrivate(interaction, "❌ ليس لديك صلاحية الحظر.");
        }
        if (target && !canManageTarget(interaction, target, PermissionFlagsBits.BanMembers)) {
          return replyPrivate(interaction, "❌ لا يمكنك حظر عضو أعلى منك في ترتيب الرتب.");
        }
        if (target && !target.bannable) {
          return replyPrivate(interaction, "❌ لا أستطيع حظر هذا العضو بسبب صلاحيات البوت أو ترتيب الرتب.");
        }

        await guild.members.ban(user.id, { reason });
        return replyPrivate(interaction, `🔨 تم حظر ${user.tag}.\nالسبب: ${reason}`);
      }

      if (commandName === "مهلة") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const user = interaction.options.getUser("العضو");
        const minutes = interaction.options.getInteger("الدقائق");
        const reason = interaction.options.getString("السبب") || "لم يحدد سبب";
        const target = await getTargetMember(interaction, user);

        if (!target) return replyPrivate(interaction, "❌ العضو غير موجود في السيرفر.");
        if (!canManageTarget(interaction, target, PermissionFlagsBits.ModerateMembers)) {
          return replyPrivate(interaction, "❌ لا تملك الصلاحية أو أن رتبة العضو أعلى من رتبتك.");
        }
        if (!target.moderatable) return replyPrivate(interaction, "❌ لا أستطيع إعطاء هذا العضو مهلة.");

        await target.timeout(minutes * 60 * 1000, reason);
        return replyPrivate(interaction, `⏳ تم إعطاء ${user.tag} مهلة لمدة ${minutes} دقيقة.\nالسبب: ${reason}`);
      }

      if (commandName === "قفل" || commandName === "فتح") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
          return replyPrivate(interaction, "❌ تحتاج صلاحية إدارة الرومات.");
        }

        const everyone = guild.roles.everyone;
        const lock = commandName === "قفل";

        await interaction.channel.permissionOverwrites.edit(everyone, {
          SendMessages: lock ? false : null
        });

        return replyPrivate(interaction, lock ? "🔒 تم قفل الروم." : "🔓 تم فتح الروم.");
      }

      if (commandName === "مسح") {
        const amount = interaction.options.getInteger("العدد");
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        if (!interaction.channel?.isTextBased() || !("bulkDelete" in interaction.channel)) {
          return replyPrivate(interaction, "❌ هذا الأمر لا يعمل في هذا الروم.");
        }

        const deleted = await interaction.channel.bulkDelete(amount, true);
        return replyPrivate(interaction, `🧹 تم حذف ${deleted.size} رسالة. قد لا تُحذف الرسائل الأقدم من 14 يومًا.`);
      }

      if (commandName === "فك-الحظر") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const id = interaction.options.getString("الايدي").trim();
        const reason = interaction.options.getString("السبب") || "تم فك الحظر بواسطة الإدارة";

        if (!/^\d{17,20}$/.test(id)) {
          return replyPrivate(interaction, "❌ أدخل ID ديسكورد صحيحًا.");
        }

        await guild.members.unban(id, reason);
        return replyPrivate(interaction, `✅ تم فك الحظر عن المستخدم صاحب ID: ${id}`);
      }

      if (commandName === "معلومات") {
        const user = interaction.options.getUser("العضو") || interaction.user;
        const member = await guild.members.fetch(user.id).catch(() => null);

        const embed = new EmbedBuilder()
          .setColor(0x3498DB)
          .setTitle("👤 معلومات العضو")
          .setThumbnail(user.displayAvatarURL())
          .addFields(
            { name: "الاسم", value: user.tag, inline: true },
            { name: "ID", value: user.id, inline: true },
            { name: "تاريخ إنشاء الحساب", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: false },
            { name: "تاريخ الانضمام", value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` : "غير موجود في السيرفر", inline: false }
          );

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      }

      if (commandName === "إحصائيات") {
        const embed = new EmbedBuilder()
          .setColor(0x2ECC71)
          .setTitle(`📊 إحصائيات ${guild.name}`)
          .setThumbnail(guild.iconURL())
          .addFields(
            { name: "👥 الأعضاء", value: `${guild.memberCount}`, inline: true },
            { name: "💬 الرومات", value: `${guild.channels.cache.size}`, inline: true },
            { name: "🎭 الرتب", value: `${guild.roles.cache.size}`, inline: true }
          )
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }

      if (commandName === "إعلان") {
        const text = interaction.options.getString("النص");
        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle("📢 إعلان رسمي | XR")
          .setDescription(text)
          .setFooter({ text: `بواسطة ${interaction.user.tag}` })
          .setTimestamp();

        return interaction.reply({
          embeds: [embed],
          allowedMentions: { parse: [] }
        });
      }

      if (commandName === "إضافة-رتبة" || commandName === "نزع-رتبة") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const user = interaction.options.getUser("العضو");
        const role = interaction.options.getRole("الرتبة");
        const target = await getTargetMember(interaction, user);

        if (!target) return replyPrivate(interaction, "❌ العضو غير موجود.");
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
          return replyPrivate(interaction, "❌ تحتاج صلاحية إدارة الرتب.");
        }
        if (role.managed || role.position >= guild.members.me.roles.highest.position) {
          return replyPrivate(interaction, "❌ لا أستطيع تعديل هذه الرتبة. تحقق من ترتيب رتب البوت.");
        }
        if (
          interaction.guild.ownerId !== interaction.user.id &&
          role.position >= interaction.member.roles.highest.position
        ) {
          return replyPrivate(interaction, "❌ لا يمكنك تعديل رتبة أعلى من رتبتك أو مساوية لها.");
        }

        if (commandName === "إضافة-رتبة") {
          await target.roles.add(role);
          return replyPrivate(interaction, `✅ تمت إضافة الرتبة ${role} إلى ${user.tag}.`);
        }

        await target.roles.remove(role);
        return replyPrivate(interaction, `✅ تمت إزالة الرتبة ${role} من ${user.tag}.`);
      }

      if (commandName === "ألعاب") {
        const game = interaction.options.getString("اللعبة");
        const number = interaction.options.getInteger("رقم");
        const answer = (interaction.options.getString("اختيار") || "").trim().toLowerCase();

        if (game === "guess") {
          const secret = Math.floor(Math.random() * 5) + 1;

          if (number === null) {
            return interaction.reply({
              content: "🎯 خمن رقمًا من 1 إلى 5 باستعمال الخيار `رقم`.",
              flags: MessageFlags.Ephemeral
            });
          }

          return interaction.reply(
            number === secret
              ? `🎉 صحيح يا ${interaction.user}! الرقم كان **${secret}**!`
              : `😈 تخمين خاطئ! كان الرقم **${secret}**. جرّب مرة أخرى!`
          );
        }

        if (game === "rps") {
          const choices = ["حجر", "ورقة", "مقص"];
          const userChoice = choices.find(c => c === answer);

          if (!userChoice) {
            return interaction.reply({
              content: "🎮 اكتب في خيار `اختيار` إحدى الكلمات: **حجر** أو **ورقة** أو **مقص**.",
              flags: MessageFlags.Ephemeral
            });
          }

          const botChoice = choices[Math.floor(Math.random() * choices.length)];
          let result = "";

          if (userChoice === botChoice) result = "🤝 تعادل!";
          else if (
            (userChoice === "حجر" && botChoice === "مقص") ||
            (userChoice === "ورقة" && botChoice === "حجر") ||
            (userChoice === "مقص" && botChoice === "ورقة")
          ) result = "🏆 فزت!";
          else result = "😈 خسرت!";

          return interaction.reply(
            `🎮 **حجر ورقة مقص**\nاختيارك: **${userChoice}**\nاختياري: **${botChoice}**\n${result}`
          );
        }

        if (game === "trivia") {
          const questions = [
            { q: "ما عاصمة الجزائر؟", a: "الجزائر" },
            { q: "كم عدد أيام الأسبوع؟", a: "7" },
            { q: "ما الكوكب المعروف بالكوكب الأحمر؟", a: "المريخ" },
            { q: "كم يساوي 6 × 7؟", a: "42" },
            { q: "ما أكبر محيط في العالم؟", a: "الهادئ" }
          ];

          const question = questions[Math.floor(Math.random() * questions.length)];

          if (!answer) {
            return interaction.reply({
              content: `🧠 **سؤال ثقافي:** ${question.q}\nاستعمل خيار ` +
                "`اختيار` لإرسال إجابتك.",
              flags: MessageFlags.Ephemeral
            });
          }

          const normalized = answer.replace(/\s/g, "");
          const correct = question.a.replace(/\s/g, "").toLowerCase();

          return interaction.reply(
            normalized === correct
              ? `🎉 إجابة صحيحة يا ${interaction.user}!`
              : `❌ إجابة غير صحيحة! الجواب هو **${question.a}**.`
          );
        }
      }

      if (commandName === "إعداد-التكت") {
        if (!isStaff(interaction)) {
          return interaction.reply({
            content: "❌ هذا الأمر للإدارة فقط.",
            flags: MessageFlags.Ephemeral
          });
        }

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle("🎫 مركز التذاكر | XR")
          .setDescription(
            "مرحبًا بك في مركز التذاكر!\n\n" +
            "🎧 **الدعم الفني:** للمساعدة والاستفسارات.\n" +
            "🛒 **المتجر:** للشراء والطلبات.\n\n" +
            "اضغط الزر المناسب لفتح تذكرة خاصة."
          )
          .setFooter({ text: "VEX Guard • XR" });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("vex_ticket_support")
            .setLabel("الدعم الفني")
            .setEmoji("🎧")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId("vex_ticket_shop")
            .setLabel("المتجر")
            .setEmoji("🛒")
            .setStyle(ButtonStyle.Success)
        );

        return interaction.reply({ embeds: [embed], components: [row] });
      }
    }

    // -------------------- أزرار التكت --------------------

    if (interaction.isButton()) {
      const id = interaction.customId;

      if (id === "vex_ticket_support" || id === "vex_ticket_shop") {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const type = id === "vex_ticket_support" ? "support" : "shop";
        const existingTicket = interaction.guild.channels.cache.find(
          channel =>
            channel.type === ChannelType.GuildText &&
            channel.topic?.includes(`vex-owner=${interaction.user.id}`) &&
            channel.topic?.includes(`vex-type=${type}`)
        );

        if (existingTicket) {
          return replyPrivate(interaction, `❌ لديك تذكرة مفتوحة بالفعل: ${existingTicket}`);
        }

        const overwrites = [
          {
            id: interaction.guild.roles.everyone.id,
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
            id: client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.ManageMessages
            ]
          }
        ];

        for (const role of interaction.guild.roles.cache.values()) {
          if (
            role.id !== interaction.guild.roles.everyone.id &&
            (role.permissions.has(PermissionFlagsBits.ManageChannels) ||
             role.permissions.has(PermissionFlagsBits.Administrator))
          ) {
            overwrites.push({
              id: role.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory
              ]
            });
          }
        }

        const channelOptions = {
          name: `${type === "shop" ? "shop" : "support"}-${interaction.user.username}`
            .toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80),
          type: ChannelType.GuildText,
          topic: `vex-owner=${interaction.user.id};vex-type=${type}`,
          permissionOverwrites: overwrites
        };

        if (TICKET_CATEGORY_ID) channelOptions.parent = TICKET_CATEGORY_ID;

        const ticket = await interaction.guild.channels.create(channelOptions);

        const embed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle(type === "shop" ? "🛒 تذكرة المتجر" : "🎧 تذكرة الدعم الفني")
          .setDescription(
            `مرحبًا ${interaction.user}!\n` +
            "اكتب تفاصيل طلبك هنا، وسيقوم فريق الإدارة بمساعدتك.\n\n" +
            "لإغلاق التذكرة اضغط الزر أدناه."
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("vex_ticket_close")
            .setLabel("إغلاق التذكرة")
            .setEmoji("🔒")
            .setStyle(ButtonStyle.Danger)
        );

        await ticket.send({
          content: `${interaction.user}`,
          embeds: [embed],
          components: [row]
        });

        return replyPrivate(interaction, `✅ تم إنشاء تذكرتك: ${ticket}`);
      }

      if (id === "vex_ticket_close") {
        const channel = interaction.channel;
        const ownerId = channel?.topic?.match(/vex-owner=(\d+)/)?.[1];

        if (
          ownerId !== interaction.user.id &&
          !isStaff(interaction)
        ) {
          return interaction.reply({
            content: "❌ صاحب التذكرة والإدارة فقط يمكنهما إغلاقها.",
            flags: MessageFlags.Ephemeral
          });
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("vex_ticket_close_confirm")
            .setLabel("نعم، أغلقها")
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId("vex_ticket_close_cancel")
            .setLabel("إلغاء")
            .setStyle(ButtonStyle.Secondary)
        );

        return interaction.reply({
          content: "هل أنت متأكد من إغلاق التذكرة؟",
          components: [row],
          flags: MessageFlags.Ephemeral
        });
      }

      if (id === "vex_ticket_close_confirm") {
        const channel = interaction.channel;
        const ownerId = channel?.topic?.match(/vex-owner=(\d+)/)?.[1];

        if (ownerId !== interaction.user.id && !isStaff(interaction)) {
          return interaction.reply({
            content: "❌ لا تملك صلاحية إغلاق هذه التذكرة.",
            flags: MessageFlags.Ephemeral
          });
        }

        await interaction.update({
          content: "🔒 تم تأكيد الإغلاق. سيتم حذف التذكرة الآن.",
          components: []
        });

        await channel.delete("VEX Guard: Ticket closed").catch(error => {
          console.error("تعذر حذف التذكرة:", error.message);
        });
        return;
      }

      if (id === "vex_ticket_close_cancel") {
        return interaction.update({
          content: "✅ تم إلغاء إغلاق التذكرة.",
          components: []
        });
      }
    }
  } catch (error) {
    console.error("❌ خطأ في التفاعل:", error);

    const message = "❌ حدث خطأ. تأكد من صلاحيات البوت وإعداداته.";

    try {
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: message,
          flags: MessageFlags.Ephemeral
        });
      } else {
        await interaction.reply({
          content: message,
          flags: MessageFlags.Ephemeral
        });
      }
    } catch {}
  }
});

client.login(TOKEN);
