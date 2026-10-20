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

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || null;

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ تأكد من DISCORD_TOKEN و CLIENT_ID في GitHub Secrets.");
  process.exit(1);
}

const bot = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const roulette = new Map();

const commandDescriptions = {
  "مساعدة": "عرض قائمة الأوامر",
  "مساعدة_الإدارة": "أوامر الإدارة",
  "مساعدة_الألعاب": "أوامر الألعاب",
  "بلاغ": "عرض لوحة التذاكر",
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
  "المشرفون": "عرض عدد المشرفين",
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
  "حساب": "عملية جمع عشوائية",
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

const commands = Object.entries(commandDescriptions).map(([name, description]) => {
  const cmd = new SlashCommandBuilder()
    .setName(name)
    .setDescription(description);

  if ([
    "عضو", "أفاتار", "طرد", "حظر", "تحذير", "مهلة",
    "إنهاء_المهلة", "لقب", "أضف_رتبة", "احذف_رتبة", "انضمام"
  ].includes(name)) {
    cmd.addUserOption(o =>
      o.setName("العضو")
        .setDescription("اختر العضو")
        .setRequired(false)
    );
  }

  if ([
    "تحذير", "مهلة", "لقب", "إعلان", "رسالة",
    "اقتراح", "موضوع", "طرد", "حظر"
  ].includes(name)) {
    cmd.addStringOption(o =>
      o.setName("النص")
        .setDescription("النص أو السبب")
        .setRequired(["إعلان", "رسالة", "اقتراح", "موضوع"].includes(name))
    );
  }

  if (name === "مسح") {
    cmd.addIntegerOption(o =>
      o.setName("العدد")
        .setDescription("عدد الرسائل من 1 إلى 100")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    );
  }

  if (name === "بطء") {
    cmd.addIntegerOption(o =>
      o.setName("الثواني")
        .setDescription("من 0 إلى 21600")
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    );
  }

  if (name === "إلغاء_حظر") {
    cmd.addStringOption(o =>
      o.setName("المعرف")
        .setDescription("معرف العضو")
        .setRequired(true)
    );
  }

  if (name === "إنشاء_قناة") {
    cmd.addStringOption(o =>
      o.setName("الاسم")
        .setDescription("اسم القناة")
        .setRequired(true)
    );
  }

  if (["أضف_رتبة", "احذف_رتبة"].includes(name)) {
    cmd.addStringOption(o =>
      o.setName("اسم_الرتبة")
        .setDescription("اسم الرتبة")
        .setRequired(true)
    );
  }

  if (name === "رقم") {
    cmd.addIntegerOption(o =>
      o.setName("من")
        .setDescription("الحد الأدنى")
        .setRequired(false)
    ).addIntegerOption(o =>
      o.setName("إلى")
        .setDescription("الحد الأعلى")
        .setRequired(false)
    );
  }

  if (name === "اختيار") {
    cmd.addStringOption(o =>
      o.setName("الخيار_الأول")
        .setDescription("الخيار الأول")
        .setRequired(true)
    ).addStringOption(o =>
      o.setName("الخيار_الثاني")
        .setDescription("الخيار الثاني")
        .setRequired(true)
    );
  }

  if (name === "تصويت") {
    cmd.addStringOption(o =>
      o.setName("السؤال")
        .setDescription("موضوع التصويت")
        .setRequired(true)
    );
  }

  if (name === "تخمين") {
    cmd.addIntegerOption(o =>
      o.setName("الرقم")
        .setDescription("اختر رقمًا من 1 إلى 10")
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(true)
    );
  }

  if (name === "فائز") {
    cmd.addStringOption(o =>
      o.setName("المشاركون")
        .setDescription("الأسماء مفصولة بفواصل")
        .setRequired(true)
    );
  }

  return cmd;
});

const makeEmbed = (title, description) =>
  new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

const pick = array => array[Math.floor(Math.random() * array.length)];

const isStaff = member => member &&
  (member.permissions.has(PermissionFlagsBits.ManageChannels) ||
   member.permissions.has(PermissionFlagsBits.Administrator));

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

async function sendTicketPanel(i) {
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

  return i.reply({
    embeds: [makeEmbed(
      "🎫 VEX GUARD | مركز التذاكر",
      "مرحبًا بك في مركز التذاكر!\n\n" +
      "💬 **الدعم والمساعدة:** للمشاكل والاستفسارات.\n" +
      "🛒 **الشراء:** لطلبات الشراء.\n\n" +
      "اختر الزر المناسب لفتح تكت خاص."
    )],
    components: [row]
  });
}

async function createTicket(i, type) {
  const guild = i.guild;
  const user = i.user;

  if (!guild) {
    return i.reply({
      content: "افتح التكت داخل السيرفر.",
      ephemeral: true
    });
  }

  const existing = guild.channels.cache.find(channel =>
    channel.type === ChannelType.GuildText &&
    channel.topic?.includes(`vex-owner=${user.id};vex-type=${type}`)
  );

  if (existing) {
    return i.reply({
      content: `عندك تكت مفتوح من هذا النوع: ${existing}`,
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
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages
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
    user.username.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 70) || user.id;

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
    embeds: [makeEmbed(
      type === "shop" ? "🛒 تكت الشراء" : "💬 تكت الدعم",
      `صاحب التكت: ${user}\nيرجى انتظار رد فريق الإدارة.`
    )],
    components: [closeRow]
  });

  return i.reply({
    content: `✅ تم فتح تكتك: ${channel}`,
    ephemeral: true
  });
}

bot.once("ready", () => {
  console.log(`✅ VEX Guard يعمل باسم ${bot.user.tag}`);
});

bot.on("interactionCreate", async i => {
  try {
    if (i.isButton()) {
      if (i.customId === "vote_yes" || i.customId === "vote_no") {
        const label = i.customId === "vote_yes" ? "👍 نعم" : "👎 لا";
        return i.reply({
          content: `صوّتَّ بـ ${label}.`,
          ephemeral: true
        });
      }

      if (
        i.customId === "vex_ticket_support" ||
        i.customId === "vex_ticket_shop"
      ) {
        return await createTicket(
          i,
          i.customId === "vex_ticket_shop" ? "shop" : "support"
        );
      }

      if (i.customId === "vex_ticket_close") {
        const owner = i.channel?.topic?.match(/vex-owner=(\d+)/)?.[1];

        if (!i.channel || i.channel.type !== ChannelType.GuildText) {
          return i.reply({
            content: "هذه ليست قناة تكت.",
            ephemeral: true
          });
        }

        if (i.user.id !== owner && !isStaff(i.member)) {
          return i.reply({
            content: "⛔ الإغلاق لصاحب التكت أو الإدارة فقط.",
            ephemeral: true
          });
        }

        await i.reply("🔒 سيتم حذف التكت بعد 5 ثوانٍ.");
        const channel = i.channel;

        setTimeout(() => {
          channel.delete("Ticket closed").catch(console.error);
        }, 5000);

        return;
      }

      if (i.customId === "rjoin") {
        const game = roulette.get(i.guildId);

        if (!game) {
          return i.reply({
            content: "لا توجد روليت نشطة.",
            ephemeral: true
          });
        }

        if (game.players.has(i.user.id)) {
          return i.reply({
            content: "أنت مشارك بالفعل.",
            ephemeral: true
          });
        }

        game.players.set(i.user.id, i.user);

        return i.reply({
          content: "✅ انضممت للروليت.",
          ephemeral: true
        });
      }

      if (i.customId === "rdraw") {
        const game = roulette.get(i.guildId);

        if (!game) {
          return i.reply({
            content: "لا توجد روليت نشطة.",
            ephemeral: true
          });
        }

        if (i.user.id !== game.hostId && !isStaff(i.member)) {
          return i.reply({
            content: "السحب لصاحب اللعبة أو الإدارة.",
            ephemeral: true
          });
        }

        if (game.players.size < 2) {
          return i.reply({
            content: "يلزم مشاركان على الأقل.",
            ephemeral: true
          });
        }

        const winner = pick([...game.players.values()]);
        roulette.delete(i.guildId);

        return i.update({
          embeds: [makeEmbed("🎡 الفائز", `🏆 الفائز هو ${winner}`)],
          components: []
        });
      }

      return;
    }

    if (!i.isChatInputCommand()) return;

    const name = i.commandName;
    const guild = i.guild;
    const member = i.member;
    const target = i.options.getUser("العضو");
    const text = i.options.getString("النص");
    const reply = content => i.reply({ content });

    if (name === "بلاغ") {
      return await sendTicketPanel(i);
    }

    if (adminCommands.includes(name) && !isStaff(member)) {
      return i.reply({
        content: "⛔ هذا الأمر مخصص للإدارة.",
        ephemeral: true
      });
    }

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
        hostId: i.user.id,
        players: new Map([[i.user.id, i.user]])
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

      return i.reply({
        embeds: [makeEmbed("🎡 الروليت الجماعية", `بدأت بواسطة ${i.user}`)],
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
      const min = i.options.getInteger("من") ?? 1;
      const max = i.options.getInteger("إلى") ?? 100;

      if (max < min) {
        return reply("❌ الحد الأعلى يجب أن يكون أكبر من الحد الأدنى.");
      }

      return reply(`🎯 ${Math.floor(Math.random() * (max - min + 1)) + min}`);
    }

    if (name === "اختيار") {
      return reply("🤔 أختار: **" + pick([
        i.options.getString("الخيار_الأول"),
        i.options.getString("الخيار_الثاني")
      ]) + "**");
    }

    if (name === "تخمين") {
      const answer = 1 + Math.floor(Math.random() * 10);

      return reply(i.options.getInteger("الرقم") === answer
        ? `🎉
