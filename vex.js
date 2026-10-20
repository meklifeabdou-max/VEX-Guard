const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} = require("discord.js");

// =============================
// إعدادات VEX GUARD
// =============================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || null;

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ أضف DISCORD_TOKEN و CLIENT_ID في GitHub Secrets.");
  process.exit(1);
}

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const roulette = new Map();
const warnings = new Map();

// =============================
// قائمة الأوامر
// =============================

const commandDescriptions = {
  "مساعدة": "عرض قائمة الأوامر",
  "مساعدة_الإدارة": "أوامر الإدارة",
  "مساعدة_الألعاب": "أوامر الألعاب",
  "بلاغ": "فتح لوحة التذاكر",
  "بنق": "سرعة استجابة البوت",
  "بوت": "معلومات البوت",
  "خادم": "معلومات السيرفر",
  "إحصائيات": "إحصائيات السيرفر",
  "عضو": "معلومات عضو",
  "معلوماتي": "معلومات حسابك",
  "أفاتار": "عرض صورة عضو",
  "أيقونة": "أيقونة السيرفر",
  "الأعضاء": "عدد الأعضاء",
  "الرتب": "عدد الرتب",
  "القنوات": "عدد القنوات",
  "الوقت": "الوقت الحالي",
  "تاريخ": "تاريخ اليوم",
  "المالك": "مالك السيرفر",
  "المشرفون": "عرض المشرفين",
  "رتبتي": "عرض أعلى رتبة لديك",
  "عمر_الحساب": "عمر حسابك",
  "عمر_السيرفر": "عمر السيرفر",
  "كت": "سؤال عشوائي",
  "سؤال": "سؤال عشوائي",
  "سؤال_إضافي": "سؤال إضافي",
  "صراحة": "سؤال صراحة",
  "تحدي": "تحدٍ عشوائي",
  "تحدي_جماعي": "تحدٍ جماعي",
  "تحدي_الأصدقاء": "تحدٍ للأصدقاء",
  "روليت": "بدء روليت جماعية",
  "روليت_مساعدة": "شرح الروليت",
  "حظ": "نسبة الحظ",
  "نرد": "رمي النرد",
  "عملة": "قلب العملة",
  "لغز": "لغز عشوائي",
  "فزورة": "فزورة عشوائية",
  "نكتة": "نكتة عشوائية",
  "حقيقة": "حقيقة عشوائية",
  "نصيحة": "نصيحة عشوائية",
  "حكمة": "حكمة عشوائية",
  "اقتباس": "اقتباس عشوائي",
  "رقم": "اختيار رقم عشوائي",
  "اختيار": "اختيار بين خيارين",
  "تصويت": "إنشاء تصويت",
  "تخمين": "تخمين رقم",
  "حجر_ورقة": "حجر ورقة مقص",
  "إيموجي": "إيموجي عشوائي",
  "لون": "لون عشوائي",
  "اسم": "اسم عشوائي",
  "حروف": "حرف عشوائي",
  "نعم_أو_لا": "إجابة نعم أو لا",
  "فائز": "اختيار فائز",
  "حيوان": "حيوان عشوائي",
  "رياضة": "رياضة عشوائية",
  "كرة": "نصيحة كرة قدم",
  "ألعاب": "اقتراح لعبة",
  "اختبار": "اختبار سريع",
  "ذاكرة": "اختبار ذاكرة",
  "سرعة": "تحدي سرعة",
  "شعار": "عرض شعار XR",
  "ترحيب": "رسالة ترحيب",
  "وداع": "رسالة وداع",
  "شكر": "رسالة شكر",
  "القواعد": "عرض قواعد السيرفر",
  "اقتراح": "إرسال اقتراح",
  "إعلان": "إرسال إعلان",
  "رسالة": "إرسال رسالة",
  "قفل": "قفل القناة",
  "فتح": "فتح القناة",
  "مسح": "حذف رسائل",
  "بطء": "تغيير مهلة الكتابة",
  "طرد": "طرد عضو",
  "حظر": "حظر عضو",
  "إلغاء_حظر": "إلغاء حظر عضو",
  "تحذير": "تحذير عضو",
  "مهلة": "إعطاء عضو مهلة",
  "إنهاء_المهلة": "إنهاء مهلة عضو",
  "لقب": "تغيير لقب عضو",
  "أضف_رتبة": "إضافة رتبة لعضو",
  "احذف_رتبة": "إزالة رتبة من عضو",
  "إنشاء_قناة": "إنشاء قناة نصية",
  "حذف_قناة": "حذف القناة الحالية",
  "موضوع": "تغيير موضوع القناة",
  "دعوة": "إنشاء رابط دعوة",
  "فريق": "اختيار فريق",
  "فريق_أحمر": "الانضمام للفريق الأحمر",
  "فريق_أزرق": "الانضمام للفريق الأزرق",
  "توقع": "توقع عشوائي",
  "نسبة": "نسبة عشوائية",
  "حساب": "عملية حسابية عشوائية",
  "حساب_جمع": "سؤال جمع",
  "ترتيب": "ترتيب عشوائي",
  "انضمام": "تاريخ انضمام عضو",
  "عدد_الرتب": "عدد الرتب",
  "عدد_القنوات": "عدد القنوات",
  "عدد_التعزيزات": "عدد التعزيزات"
};

const adminCommands = [
  "إعلان", "رسالة", "قفل", "فتح", "مسح", "بطء",
  "طرد", "حظر", "إلغاء_حظر", "تحذير", "مهلة",
  "إنهاء_المهلة", "لقب", "أضف_رتبة", "احذف_رتبة",
  "إنشاء_قناة", "حذف_قناة", "موضوع"
];

// =============================
// إنشاء أوامر Slash
// =============================

const commands = Object.entries(commandDescriptions).map(
  ([name, description]) => {
    const cmd = new SlashCommandBuilder()
      .setName(name)
      .setDescription(description);

    if ([
      "عضو", "أفاتار", "طرد", "حظر", "تحذير",
      "مهلة", "إنهاء_المهلة", "لقب",
      "أضف_رتبة", "احذف_رتبة", "انضمام"
    ].includes(name)) {
      cmd.addUserOption(option =>
        option.setName("العضو")
          .setDescription("اختر العضو")
          .setRequired(false)
      );
    }

    if ([
      "تحذير", "مهلة", "لقب", "إعلان",
      "رسالة", "اقتراح", "موضوع", "طرد", "حظر"
    ].includes(name)) {
      cmd.addStringOption(option =>
        option.setName("النص")
          .setDescription("النص أو السبب")
          .setRequired([
            "إعلان", "رسالة", "اقتراح", "موضوع"
          ].includes(name))
      );
    }

    if (name === "مسح") {
      cmd.addIntegerOption(option =>
        option.setName("العدد")
          .setDescription("عدد الرسائل من 1 إلى 100")
          .setMinValue(1)
          .setMaxValue(100)
          .setRequired(true)
      );
    }

    if (name === "بطء") {
      cmd.addIntegerOption(option =>
        option.setName("الثواني")
          .setDescription("من 0 إلى 21600")
          .setMinValue(0)
          .setMaxValue(21600)
          .setRequired(true)
      );
    }

    if (name === "إلغاء_حظر") {
      cmd.addStringOption(option =>
        option.setName("المعرف")
          .setDescription("معرف العضو")
          .setRequired(true)
      );
    }

    if (name === "إنشاء_قناة") {
      cmd.addStringOption(option =>
        option.setName("الاسم")
          .setDescription("اسم القناة")
          .setRequired(true)
      );
    }

    if (["أضف_رتبة", "احذف_رتبة"].includes(name)) {
      cmd.addStringOption(option =>
        option.setName("اسم_الرتبة")
          .setDescription("اسم الرتبة")
          .setRequired(true)
      );
    }

    if (name === "رقم") {
      cmd.addIntegerOption(option =>
        option.setName("من")
          .setDescription("الحد الأدنى")
          .setRequired(false)
      );

      cmd.addIntegerOption(option =>
        option.setName("إلى")
          .setDescription("الحد الأعلى")
          .setRequired(false)
      );
    }

    if (name === "اختيار") {
      cmd.addStringOption(option =>
        option.setName("الخيار_الأول")
          .setDescription("الخيار الأول")
          .setRequired(true)
      );

      cmd.addStringOption(option =>
        option.setName("الخيار_الثاني")
          .setDescription("الخيار الثاني")
          .setRequired(true)
      );
    }

    if (name === "تصويت") {
      cmd.addStringOption(option =>
        option.setName("السؤال")
          .setDescription("موضوع التصويت")
          .setRequired(true)
      );
    }

    if (name === "تخمين") {
      cmd.addIntegerOption(option =>
        option.setName("الرقم")
          .setDescription("اختر رقمًا من 1 إلى 10")
          .setMinValue(1)
          .setMaxValue(10)
          .setRequired(true)
      );
    }

    if (name === "فائز") {
      cmd.addStringOption(option =>
        option.setName("المشاركون")
          .setDescription("الأسماء مفصولة بفواصل")
          .setRequired(true)
      );
    }

    return cmd;
  }
);

// =============================
// أدوات مساعدة
// =============================

const makeEmbed = (title, description) =>
  new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

const pick = array =>
  array[Math.floor(Math.random() * array.length)];

const isStaff = member =>
  member &&
  (
    member.permissions.has(PermissionFlagsBits.ManageChannels) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  );

const questions = [
  "ما لعبتك المفضلة؟",
  "ما هدفك الأكبر؟",
  "ما أجمل ذكرى عندك؟",
  "ما المهارة التي تريد تعلمها؟"
];

const dares = [
  "اكتب مجاملة لطيفة لأحد الأعضاء.",
  "اكتب اسم لعبتك المفضلة مع إيموجي.",
  "أرسل رسالة إيجابية في الدردشة."
];

// =============================
// نظام التذاكر
// =============================

async function sendTicketPanel(interaction) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("vex_ticket_support")
      .setLabel("💬 الدعم والمساعدة")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("vex_ticket_shop")
      .setLabel("🛒 الشراء")
      .setStyle(ButtonStyle.Success)
  );

  return interaction.reply({
    embeds: [
      makeEmbed(
        "🎫 VEX GUARD | مركز التذاكر",
        "مرحبًا بك في مركز التذاكر!\n\n" +
        "💬 **الدعم والمساعدة:** للمشاكل والاستفسارات.\n" +
        "🛒 **الشراء:** لطلبات الشراء.\n\n" +
        "اختر الزر المناسب لفتح تكت خاص."
      )
    ],
    components: [row]
  });
}

async function createTicket(interaction, type) {
  const guild = interaction.guild;
  const user = interaction.user;

  if (!guild) {
    return interaction.reply({
      content: "افتح التكت داخل السيرفر.",
      ephemeral: true
    });
  }

  const existing = guild.channels.cache.find(channel =>
    channel.type === ChannelType.GuildText &&
    channel.topic?.includes(
      `vex-owner=${user.id};vex-type=${type}`
    )
  );

  if (existing) {
    return interaction.reply({
      content: `عندك تكت مفتوح بالفعل: ${existing}`,
      ephemeral: true
    });
  }

  const botMember = guild.members.me || await guild.members.fetchMe();

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: user.id,
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
        PermissionFlagsBits.ManageChannels
      ]
    }
  ];

  for (const role of guild.roles.cache.values()) {
    if (
      role.id !== guild.roles.everyone.id &&
      (
        role.permissions.has(PermissionFlagsBits.ManageChannels) ||
        role.permissions.has(PermissionFlagsBits.Administrator)
      )
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

  const safeUsername =
    user.username.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 70) ||
    user.id;

  const options = {
    name: `${type === "shop" ? "shop" : "support"}-${safeUsername}`,
    type: ChannelType.GuildText,
    topic: `vex-owner=${user.id};vex-type=${type}`,
    permissionOverwrites: overwrites
  };

  if (TICKET_CATEGORY_ID) {
    const category = guild.channels.cache.get(TICKET_CATEGORY_ID);

    if (category?.type === ChannelType.GuildCategory) {
      options.parent = category.id;
    }
  }

  const channel = await guild.channels.create(options);

  const closeRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("vex_ticket_close")
      .setLabel("🔒 إغلاق التكت")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `${user} مرحبًا بك! ${
      type === "shop"
        ? "اكتب تفاصيل طلب الشراء."
        : "اشرح مشكلتك لفريق الإدارة."
    }`,
    embeds: [
      makeEmbed(
        type === "shop" ? "🛒 تكت الشراء" : "💬 تكت الدعم",
        `صاحب التكت: ${user}\nيرجى انتظار رد فريق الإدارة.`
      )
    ],
    components: [closeRow]
  });

  return interaction.reply({
    content: `✅ تم فتح تكتك: ${channel}`,
    ephemeral: true
  });
}

// =============================
// تشغيل البوت
// =============================

bot.once("ready", () => {
  console.log(`✅ VEX Guard يعمل باسم ${bot.user.tag}`);
});

bot.on("interactionCreate", async interaction => {
  try {
    // الأزرار
    if (interaction.isButton()) {
      if (
        interaction.customId === "vote_yes" ||
        interaction.customId === "vote_no"
      ) {
        const label =
          interaction.customId === "vote_yes" ? "👍 نعم" : "👎 لا";

        return interaction.reply({
          content: `صوّتَّ بـ ${label}.`,
          ephemeral: true
        });
      }

      if (
        interaction.customId === "vex_ticket_support" ||
        interaction.customId === "vex_ticket_shop"
      ) {
        return await createTicket(
          interaction,
          interaction.customId === "vex_ticket_shop" ? "shop" : "support"
        );
      }

      if (interaction.customId === "vex_ticket_close") {
        const owner =
          interaction.channel?.topic?.match(/vex-owner=(\d+)/)?.[1];

        if (
          interaction.user.id !== owner &&
          !isStaff(interaction.member)
        ) {
          return interaction.reply({
            content: "⛔ الإغلاق لصاحب التكت أو الإدارة فقط.",
            ephemeral: true
          });
        }

        await interaction.reply("🔒 سيتم حذف التكت بعد 5 ثوانٍ.");

        const channel = interaction.channel;

        setTimeout(() => {
          channel.delete("Ticket closed").catch(console.error);
        }, 5000);

        return;
      }

      if (interaction.customId === "rjoin") {
        const game = roulette.get(interaction.guildId);

        if (!game) {
          return interaction.reply({
            content: "لا توجد روليت نشطة.",
            ephemeral: true
          });
        }

        if (game.players.has(interaction.user.id)) {
          return interaction.reply({
            content: "أنت مشارك بالفعل.",
            ephemeral: true
          });
        }

        game.players.set(interaction.user.id, interaction.user);

        return interaction.reply({
          content: "✅ انضممت للروليت.",
          ephemeral: true
        });
      }

      if (interaction.customId === "rdraw") {
        const game = roulette.get(interaction.guildId);

        if (!game) {
          return interaction.reply({
            content: "لا توجد روليت نشطة.",
            ephemeral: true
          });
        }

        if (
          interaction.user.id !== game.hostId &&
          !isStaff(interaction.member)
        ) {
          return interaction.reply({
            content: "السحب لصاحب اللعبة أو الإدارة.",
            ephemeral: true
          });
        }

        if (game.players.size < 2) {
          return interaction.reply({
            content: "يلزم مشاركان على الأقل.",
            ephemeral: true
          });
        }

        const winner = pick([...game.players.values()]);
        roulette.delete(interaction.guildId);

        return interaction.update({
          embeds: [makeEmbed("🎡 الفائز", `🏆 الفائز هو ${winner}`)],
          components: []
        });
      }

      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const name = interaction.commandName;
    const guild = interaction.guild;
    const member = interaction.member;
    const target = interaction.options.getUser("العضو");
    const text = interaction.options.getString("النص");

    const reply = content =>
      interaction.reply({ content });

    // التذاكر
    if (name === "بلاغ") {
      return await sendTicketPanel(interaction);
    }

    // حماية أوامر الإدارة
    if (adminCommands.includes(name) && !isStaff(member)) {
      return interaction.reply({
        content: "⛔ هذا الأمر مخصص للإدارة.",
        ephemeral: true
      });
    }

    // أوامر المساعدة
    if (name === "مساعدة") {
      return reply(
        "🛡️ **VEX GUARD — XR**\n" +
        "🎫 /بلاغ — التذاكر\n" +
        "🏓 /بنق — سرعة البوت\n" +
        "🎡 /روليت — لعبة جماعية\n" +
        "🎲 /نرد — رمي النرد\n" +
        "🎯 /تخمين — تخمين رقم\n" +
        "🛡️ /مساعدة_الإدارة — أوامر الإدارة\n" +
        "🎮 /مساعدة_الألعاب — أوامر الألعاب"
      );
    }

    if (name === "مساعدة_الإدارة") {
      return reply(
        "🛡️ أوامر الإدارة:\n" +
        adminCommands.map(command => `/${command}`).join("، ")
      );
    }

    if (name === "مساعدة_الألعاب") {
      return reply(
        "🎮 /نرد، /عملة، /حظ، /نكتة، /لغز، /تخمين، /اختيار، /روليت"
      );
    }

    // معلومات البوت والسيرفر
    if (name === "بنق") {
      return reply(`🏓 سرعة الاستجابة: ${bot.ws.ping}ms`);
    }

    if (name === "بوت") {
      return reply(`🤖 أنا VEX Guard\n🏠 السيرفر: XR\n⚡ البوت يعمل.`);
    }

    if (name === "خادم" || name === "إحصائيات") {
      if (!guild) return reply("هذا الأمر داخل السيرفر فقط.");

      return reply(
        `📊 **إحصائيات ${guild.name}**\n` +
        `👥 الأعضاء: ${guild.memberCount}\n` +
        `📁 القنوات: ${guild.channels.cache.size}\n` +
        `🎭 الرتب: ${guild.roles.cache.size}`
      );
    }

    if (name === "معلوماتي") {
      return reply(
        `👤 حسابك: ${interaction.user.tag}\n` +
        `🆔 المعرف: ${interaction.user.id}\n` +
        `📅 تاريخ الحساب: <t:${Math.floor(interaction.user.createdTimestamp / 1000)}:D>`
      );
    }

    if (name === "عضو" || name === "انضمام") {
      const user = target || interaction.user;
      const guildMember = guild
        ? await guild.members.fetch(user.id).catch(() => null)
        : null;

      return reply(
        `👤 العضو: ${user.tag}\n` +
        `📅 إنشاء الحساب: <t:${Math.floor(user.createdTimestamp / 1000)}:D>\n` +
        (
          guildMember
            ? `📥 انضم للسيرفر: <t:${Math.floor(guildMember.joinedTimestamp / 1000)}:D>`
            : ""
        )
      );
    }

    if (name === "أفاتار") {
      const user = target || interaction.user;

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`🖼️ صورة ${user.username}`)
            .setImage(user.displayAvatarURL({ size: 1024 }))
            .setColor(0x5865F2)
        ]
      });
    }

    if (name === "أيقونة") {
      if (!guild?.icon) return reply("لا توجد أيقونة للسيرفر.");

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`أيقونة ${guild.name}`)
            .setImage(guild.iconURL({ size: 1024 }))
            .setColor(0x5865F2)
        ]
      });
    }

    if (name === "الأعضاء") {
      return reply(`👥 عدد الأعضاء: ${guild?.memberCount ?? "غير متاح"}`);
    }

    if (name === "الرتب" || name === "عدد_الرتب") {
      return reply(`🎭 عدد الرتب: ${guild?.roles.cache.size ?? 0}`);
    }

    if (name === "القنوات" || name === "عدد_القنوات") {
      return reply(`📁 عدد القنوات: ${guild?.channels.cache.size ?? 0}`);
    }

    if (name === "عدد_التعزيزات") {
      return reply(`🚀 التعزيزات: ${guild?.premiumSubscriptionCount ?? 0}`);
    }

    if (name === "المالك") {
      const owner = guild
        ? await guild.fetchOwner().catch(() => null)
        : null;

      return reply(owner ? `👑 مالك السيرفر: ${owner.user}` : "غير متاح.");
    }

    if (name === "المشرفون") {
      if (!guild) return reply("هذا الأمر داخل السيرفر فقط.");

      const moderators = guild.members.cache
        .filter(m => m.permissions.has(PermissionFlagsBits.ManageGuild))
        .map(m => m.user.tag);

      return reply(
        moderators.length
          ? `🛡️ المشرفون: ${moderators.slice(0, 20).join("، ")}`
          : "لم يتم العثور على مشرفين في الذاكرة الحالية."
      );
    }

    if (name === "رتبتي") {
      if (!guild) return reply("هذا الأمر داخل السيرفر فقط.");

      const currentMember = await guild.members.fetch(interaction.user.id);
      const role = currentMember.roles.highest;

      return reply(`🎭 أعلى رتبة لديك: **${role.name}**`);
    }

    if (name === "عمر_الحساب") {
      const days = Math.floor(
        (Date.now() - interaction.user.createdTimestamp) / 86400000
      );

      return reply(`📅 عمر حسابك: ${days} يومًا.`);
    }

    if (name === "عمر_السيرفر") {
      if (!guild) return reply("هذا الأمر داخل السيرفر فقط.");

      const days = Math.floor(
        (Date.now() - guild.createdTimestamp) / 86400000
      );

      return reply(`🏠 عمر السيرفر: ${days} يومًا.`);
    }

    if (name === "الوقت") {
      return reply(`🕒 الوقت الحالي: ${new Date().toLocaleTimeString("ar-DZ")}`);
    }

    if (name === "تاريخ") {
      return reply(`📅 التاريخ: ${new Date().toLocaleDateString("ar-DZ")}`);
    }

    // ألعاب وترفيه
    if (["كت", "سؤال", "سؤال_إضافي"].includes(name)) {
      return reply("❓ " + pick(questions));
    }

    if (name === "صراحة") {
      return reply("🗣️ " + pick([
        "ما أكثر موقف مضحك حدث لك؟",
        "ما هدفك لهذه السنة؟",
        "ما اللعبة التي تحبها أكثر؟"
      ]));
    }

    if (["تحدي", "تحدي_جماعي", "تحدي_الأصدقاء"].includes(name)) {
      return reply("🔥 " + pick(dares));
    }

    if (name === "روليت") {
      if (!guild) return reply("هذا الأمر داخل السيرفر فقط.");

      if (roulette.has(guild.id)) {
        return reply("هناك روليت جارية بالفعل.");
      }

      roulette.set(guild.id, {
        hostId: interaction.user.id,
        players: new Map([[interaction.user.id, interaction.user]])
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("rjoin")
          .setLabel("🎟️ انضمام")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("rdraw")
          .setLabel("🎡 سحب الفائز")
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({
        embeds: [
          makeEmbed("🎡 الروليت الجماعية", `بدأت بواسطة ${interaction.user}`)
        ],
        components: [row]
      });
    }

    if (name === "روليت_مساعدة") {
      return reply("استخدم /روليت، ثم اضغط انضمام. يلزم مشاركان على الأقل.");
    }

    if (name === "نرد") {
      return reply("🎲 " + (1 + Math.floor(Math.random() * 6)));
    }

    if (name === "عملة") {
      return reply("🪙 " + pick(["صورة", "كتابة"]));
    }

    if (name === "حظ" || name === "نسبة") {
      return reply(`🍀 ${Math.floor(Math.random() * 101)}%`);
    }

    if (name === "نكتة") {
      return reply("😂 لماذا الكمبيوتر بارد؟ لأنه يترك النوافذ مفتوحة!");
    }

    if (name === "حقيقة") {
      return reply("💡 الأخطبوط لديه ثلاثة قلوب.");
    }

    if (name === "لغز" || name === "فزورة") {
      return reply("🧩 ما الشيء الذي له أسنان ولا يعض؟ ||المشط||");
    }

    if (name === "نصيحة") {
      return reply("💙 ابدأ بخطوة صغيرة واستمر.");
    }

    if (name === "حكمة" || name === "اقتباس") {
      return reply("✨ النجاح يبدأ بخطوة.");
    }

    if (name === "رقم") {
      const min = interaction.options.getInteger("من") ?? 1;
      const max = interaction.options.getInteger("إلى") ?? 100;

      if (max < min) {
        return reply("❌ الحد الأعلى يجب أن يكون أكبر من الحد الأدنى.");
      }

      return reply(
        `🎯 ${Math.floor(Math.random() * (max - min + 1)) + min}`
      );
    }

    if (name === "اختيار") {
      return reply(
        "🤔 أختار: **" + pick([
          interaction.options.getString("الخيار_الأول"),
          interaction.options.getString("الخيار_الثاني")
        ]) + "**"
      );
    }

    if (name === "تخمين") {
      const answer = 1 + Math.floor(Math.random() * 10);
      const guess = interaction.options.getInteger("الرقم");

      return reply(
        guess === answer
          ? "🎉 صحيح! خمنت الرقم."
          : `❌ خطأ! الرقم الصحيح هو ${answer}.`
      );
    }

    if (name === "تصويت") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("vote_yes")
          .setLabel("👍 نعم")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("vote_no")
          .setLabel("👎 لا")
          .setStyle(ButtonStyle.Danger)
      );

      return interaction.reply({
        embeds: [
          makeEmbed("📊 تصويت XR", interaction.options.getString("السؤال"))
        ],
        components: [row]
      });
    }

    if (name === "فائز") {
      const participants = interaction.options
        .getString("المشاركون")
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);

      if (!participants.length) {
        return reply("❌ أضف أسماء المشاركين أولًا.");
      }

      return reply(`🏆 الفائز هو: **${pick(participants)}**`);
    }

    if (name === "إيموجي") {
      return reply(pick(["😂", "🔥", "💎", "👑", "🚀", "🎮", "⚡"]));
    }

    if (name === "لون") {
      return reply(
        `🎨 اللون العشوائي: #${Math.floor(Math.random() * 16777215)
          .toString(16).padStart(6, "0")}`
      );
    }

    if (name === "اسم") {
      return reply("✨ " + pick(["Shadow", "Vortex", "Phantom", "Nova", "Legend"]));
    }

    if (name === "حروف") {
      return reply("🔠 " + pick("ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")));
    }

    if (name === "نعم_أو_لا") {
      return reply(pick(["✅ نعم!", "❌ لا!", "🤔 ربما!"]));
    }

    if (name === "حيوان") {
      return reply("🐾 " + pick(["أسد", "نمر", "ذئب", "صقر", "دلفين"]));
    }

    if (name === "رياضة") {
      return reply("🏆 " + pick(["كرة القدم", "كرة السلة", "التنس", "السباحة"]));
    }

    if (name === "كرة") {
      return reply("⚽ تدرب باستمرار، العب بروح الفريق، ولا تستسلم!");
    }

    if (name === "ألعاب") {
      return reply("🎮 جرّب: Minecraft أو Fortnite أو Brawl Stars!");
    }

    if (name === "اختبار" || name === "ذاكرة" || name === "سرعة") {
      return reply("🧠 التحدي: اكتب اسم لعبة تبدأ بحرف M!");
    }

    if (name === "شعار") {
      return reply("⚡ أهلاً بك في XR — powered by VEX Guard 🛡️");
    }

    if (name === "ترحيب") {
      return reply(`👋 أهلاً بك في ${guild?.name ?? "XR"}!`);
    }

    if (name === "وداع") {
      return reply("💔 نتمنى لك التوفيق، ونراك قريبًا!");
    }

    if (name === "شكر") {
      return reply("💙 شكرًا لك على وجودك معنا!");
    }

    if (name === "القواعد") {
      return reply(
        "📜 **قواعد XR**\n" +
        "1️⃣ الاحترام المتبادل.\n" +
        "2️⃣ ممنوع السب والإزعاج.\n" +
        "3️⃣ ممنوع السبام.\n" +
        "4️⃣ اتبع تعليمات الإدارة."
      );
    }

    if (name === "اقتراح") {
      return reply(`💡 اقتراح من ${interaction.user}:\n${text}`);
    }

    if (name === "توقع") {
      return reply("🔮 أتوقع أن القادم سيكون أفضل!");
    }

    if (name === "حساب" || name === "حساب_جمع") {
      const a = Math.floor(Math.random() * 50) + 1;
      const b = Math.floor(Math.random() * 50) + 1;

      return reply(`🧮 ${a} + ${b} = ${a + b}`);
    }

    if (name === "ترتيب") {
      return reply("🔀 " + pick(["المركز الأول 🥇", "المركز الثاني 🥈", "المركز الثالث 🥉"]));
    }

    if (name === "فريق") {
      return reply("🔴 للفريق الأحمر استخدم /فريق_أحمر\n🔵 للفريق الأزرق استخدم /فريق_أزرق");
    }

    if (name === "فريق_أحمر") {
      return reply("🔴 اخترت الفريق الأحمر!");
    }

    if (name === "فريق_أزرق") {
      return reply("🔵 اخترت الفريق الأزرق!");
    }

    // =============================
    // أوامر الإدارة
    // =============================

    if (name === "إعلان" || name === "رسالة") {
      return interaction.reply({
        content: `📢 ${text}`,
        allowedMentions: { parse: [] }
      });
    }

    if (name === "مسح") {
      const amount = interaction.options.getInteger("العدد");

      if (!interaction.channel?.bulkDelete) {
        return reply("لا يمكن مسح الرسائل في هذه القناة.");
      }

      const deleted = await interaction.channel.bulkDelete(amount, true);

      return reply(`🧹 تم مسح ${deleted.size} رسالة.`);
    }

    if (name === "قفل" || name === "فتح") {
      const locked = name === "قفل";

      await interaction.channel.permissionOverwrites.edit(
        guild.roles.everyone,
        { SendMessages: locked ? false : null }
      );

      return reply(locked ? "🔒 تم قفل القناة." : "🔓 تم فتح القناة.");
    }

    if (name === "بطء") {
      const seconds = interaction.options.getInteger("الثواني");

      await interaction.channel.setRateLimitPerUser(seconds);

      return reply(`⏱️ تم ضبط مهلة الكتابة على ${seconds} ثانية.`);
    }

    if (name === "طرد") {
      if (!target) return reply("❌ اختر العضو.");

      const targetMember = await guild.members.fetch(target.id).catch(() => null);

      if (!targetMember) return reply("❌ لم أجد العضو في السيرفر.");
      if (!targetMember.kickable) return reply("❌ لا أستطيع طرد هذا العضو.");

      await targetMember.kick(text || "تم الطرد بواسطة الإدارة.");

      return reply(`👢 تم طرد ${target.tag}.`);
    }

    if (name === "حظر") {
      if (!target) return reply("❌ اختر العضو.");

      const targetMember = await guild.members.fetch(target.id).catch(() => null);

      if (!targetMember) return reply("❌ لم أجد العضو في السيرفر.");
      if (!targetMember.bannable) return reply("❌ لا أستطيع حظر هذا العضو.");

      await targetMember.ban({ reason: text || "تم الحظر بواسطة الإدارة." });

      return reply(`🔨 تم حظر ${target.tag}.`);
    }

    if (name === "إلغاء_حظر") {
      const userId = interaction.options.getString("المعرف").trim();

      await guild.members.unban(userId);

      return reply(`✅ تم إلغاء حظر العضو ذي المعرف ${userId}.`);
    }

    if (name === "تحذير") {
      if (!target) return reply("❌ اختر العضو.");

      const key = `${guild.id}:${target.id}`;
      const count = (warnings.get(key) || 0) + 1;

      warnings.set(key, count);

      return reply(
        `⚠️ تم تحذير ${target.tag}.\n` +
        `📌 عدد التحذيرات في ذاكرة البوت: ${count}\n` +
        `📝 السبب: ${text || "لم يُذكر سبب"}.`
      );
    }

    if (name === "مهلة") {
      if (!target) return reply("❌ اختر العضو.");

      const targetMember = await guild.members.fetch(target.id).catch(() => null);

      if (!targetMember) return reply("❌ لم أجد العضو.");
      if (!targetMember.moderatable) return reply("❌ لا أستطيع إعطاء هذا العضو مهلة.");

      await targetMember.timeout(10 * 60 * 1000, text || "مهلة من الإدارة.");

      return reply(`⏳ تم إعطاء ${target.tag} مهلة لمدة 10 دقائق.`);
    }

    if (name === "إنهاء_المهلة") {
      if (!target) return reply("❌ اختر العضو.");

      const targetMember = await guild.members.fetch(target.id).catch(() => null);

      if (!targetMember) return reply("❌ لم أجد العضو.");

      await targetMember.timeout(null);

      return reply(`✅ تم إنهاء المهلة عن ${target.tag}.`);
    }

    if (name === "لقب") {
      if (!target) return reply("❌ اختر العضو.");

      const targetMember = await guild.members.fetch(target.id).catch(() => null);

      if (!targetMember) return reply("❌ لم أجد العضو.");

      await targetMember.setNickname(text || null);

      return reply(`✅ تم تحديث لقب ${target.tag}.`);
    }

    if (name === "أضف_رتبة" || name === "احذف_رتبة") {
      if (!target) return reply("❌ اختر العضو.");

      const roleName = interaction.options.getString("اسم_الرتبة");
      const role = guild.roles.cache.find(r => r.name === roleName);

      if (!role) return reply("❌ لم أجد الرتبة بهذا الاسم.");

      const targetMember = await guild.members.fetch(target.id).catch(() => null);

      if (!targetMember) return reply("❌ لم أجد العضو.");

      if (name === "أضف_رتبة") {
        await targetMember.roles.add(role);
        return reply(`✅ تمت إضافة رتبة ${role.name} إلى ${target.tag}.`);
      }

      await targetMember.roles.remove(role);

      return reply(`✅ تمت إزالة رتبة ${role.name} من ${target.tag}.`);
    }

    if (name === "إنشاء_قناة") {
      const channelName = interaction.options.getString("الاسم");

      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText
      });

      return reply(`✅ تم إنشاء القناة ${channel}.`);
    }

    if (name === "حذف_قناة") {
      const channel = interaction.channel;

      await interaction.reply({
        content: "⚠️ سيتم حذف القناة بعد 3 ثوانٍ."
      });

      setTimeout(() => {
        channel.delete("Deleted by server staff").catch(console.error);
      }, 3000);

      return;
    }

    if (name === "موضوع") {
      await interaction.channel.setTopic(text);

      return reply("✅ تم تحديث موضوع القناة.");
    }

    if (name === "دعوة") {
      const channel = interaction.channel;

      if (!channel?.createInvite) {
        return reply("لا يمكن إنشاء دعوة من هذه القناة.");
      }

      const invite = await channel.createInvite({
        maxAge: 86400,
        maxUses: 0
      });

      return reply(`🔗 رابط الدعوة: ${invite.url}`);
    }

    return reply("✅ الأمر موجود، لكن لم تتم إضافة وظيفة خاصة له بعد.");

  } catch (error) {
    console.error("❌ Interaction error:", error);

    const message =
      "❌ حدث خطأ أثناء تنفيذ الأمر. تأكد من صلاحيات البوت ورتبته.";

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: message,
        ephemeral: true
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: message,
        ephemeral: true
      }).catch(() => {});
    }
  }
});

// =============================
// تسجيل الأوامر وتشغيل البوت
// =============================

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    const route = Routes.applicationCommands(CLIENT_ID);
    const currentCommands = await rest.get(route);

    // الاحتفاظ بأمر Entry Point إن كان موجودًا
    const entryPoint = currentCommands.find(command => command.type === 4);

    const body = commands.map(command => command.toJSON());

    if (entryPoint) {
      body.push(entryPoint);
    }

    await rest.put(route, { body });

    console.log(`✅ تم تسجيل ${commands.length} أمرًا.`);
    await bot.login(TOKEN);

  } catch (error) {
    console.error("❌ فشل تشغيل VEX Guard:", error);
    process.exit(1);
  }
})();
