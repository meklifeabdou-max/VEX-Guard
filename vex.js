const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits: P,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require("discord.js");

// ==================== إعدادات البوت ====================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const SERVER_NAME = "像 | 𝐌𝐫 𝐁𝐢𝐭 𝐄𝐦𝐩𝐢𝐫𝐞";

const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || "";
const SUPPORT_ROLE_ID = process.env.SUPPORT_ROLE_ID || "";

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  throw new Error(
    "أضف DISCORD_TOKEN و CLIENT_ID و GUILD_ID في متغيرات البيئة."
  );
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ==================== قائمة الأوامر ====================

const definitions = [
  ["help", "عرض الأوامر", "none"],
  ["ping", "فحص سرعة البوت", "none"],
  ["server", "معلومات السيرفر", "none"],
  ["avatar", "صورة الحساب", "user"],
  ["userinfo", "معلومات عضو", "user"],
  ["botinfo", "معلومات البوت", "none"],
  ["membercount", "عدد الأعضاء", "none"],
  ["roles", "عرض رتب السيرفر", "none"],
  ["channelinfo", "معلومات الروم", "none"],
  ["servericon", "أيقونة السيرفر", "none"],

  ["roll", "رمي النرد", "none"],
  ["coinflip", "صورة أم كتابة", "none"],
  ["rps", "حجر ورقة مقص", "choice"],
  ["guess", "خمن رقمًا من 1 إلى 10", "guess"],
  ["number", "رقم عشوائي", "none"],
  ["trivia", "سؤال معلومات عامة", "none"],
  ["quiz", "اختبار سريع", "none"],
  ["math", "حساب نتيجة عملية", "math"],
  ["dice", "رمي نردين", "none"],
  ["slots", "لعبة الحظ", "none"],
  ["choose", "اختر بين الخيارات", "text"],
  ["eightball", "اسأل الكرة السحرية", "text"],
  ["truth", "سؤال صراحة", "none"],
  ["dare", "تحدٍ ممتع", "none"],
  ["wouldyourather", "هذا أم ذاك", "none"],
  ["neverhaveiever", "لعبة لم أفعل قط", "none"],
  ["riddles", "لغز عشوائي", "none"],
  ["scramble", "كلمة حروفها مختلطة", "none"],
  ["memory", "اختبار ذاكرة", "none"],
  ["reaction", "تحدي سرعة رد الفعل", "none"],
  ["fasttype", "تحدي الكتابة السريعة", "none"],
  ["higherlower", "أعلى أم أقل", "none"],
  ["blackjack", "بطاقات حظ بسيطة", "none"],
  ["lottery", "قرعة عشوائية", "none"],
  ["roulette", "عجلة حظ نصية", "none"],
  ["rockpaper", "حجر ورقة مقص عشوائي", "none"],
  ["emojiquiz", "خمن معنى الرموز", "none"],
  ["flagquiz", "تحدي أعلام الدول", "none"],
  ["capitals", "تحدي عواصم الدول", "none"],
  ["animalquiz", "معلومات عن الحيوانات", "none"],
  ["footballquiz", "أسئلة كرة القدم", "none"],
  ["animequiz", "أسئلة الأنمي", "none"],
  ["gamingquiz", "أسئلة الألعاب", "none"],
  ["brawlstars", "تحدي براول ستارز", "none"],
  ["fortnite", "تحدي فورتنايت", "none"],
  ["minecraft", "تحدي ماينكرافت", "none"],
  ["efootball", "تحدي إي فوتبول", "none"],
  ["valorant", "تحدي فالورانت", "none"],
  ["chess", "نصيحة شطرنج", "none"],
  ["wordchain", "تحدي الكلمات", "none"],
  ["wordle", "كلمة اليوم", "none"],
  ["hangman", "كلمة مخفية", "none"],
  ["leaderboard", "لوحة المتصدرين", "none"],
  ["daily", "مكافأة يومية تجريبية", "none"],
  ["profile", "ملف اللاعب التجريبي", "none"],
  ["joke", "نكتة", "none"],
  ["fact", "معلومة عشوائية", "none"],
  ["quote", "اقتباس تحفيزي", "none"],
  ["compliment", "كلمة إيجابية لعضو", "user"],
  ["roast", "مزحة خفيفة", "user"],
  ["rate", "تقييم من 10", "text"],
  ["ship", "توافق عشوائي للمرح", "two_users"],
  ["hug", "إرسال تحية ودية", "user"],
  ["highfive", "تحية بالكف", "user"],
  ["slap", "مزحة تفاعلية", "user"],
  ["meme", "فكرة ميم", "none"],
  ["cat", "حقيقة عن القطط", "none"],
  ["dog", "حقيقة عن الكلاب", "none"],
  ["advice", "نصيحة عشوائية", "none"],
  ["motivation", "عبارة تحفيزية", "none"],

  ["warn", "تحذير عضو", "user_reason", P.ModerateMembers],
  ["kick", "طرد عضو", "user_reason", P.KickMembers],
  ["ban", "حظر عضو", "user_reason", P.BanMembers],
  ["unban", "فك حظر بمعرف العضو", "unban", P.BanMembers],
  ["timeout", "إعطاء مهلة", "duration", P.ModerateMembers],
  ["untimeout", "إزالة المهلة", "user", P.ModerateMembers],
  ["clear", "مسح الرسائل", "integer", P.ManageMessages],
  ["slowmode", "تحديد بطء الروم", "integer", P.ManageChannels],
  ["lock", "قفل الروم", "none", P.ManageChannels],
  ["unlock", "فتح الروم", "none", P.ManageChannels],
  ["hide", "إخفاء الروم", "none", P.ManageChannels],
  ["show", "إظهار الروم", "none", P.ManageChannels],
  ["nickname", "تغيير لقب عضو", "nickname", P.ManageNicknames],
  ["roleadd", "إعطاء رتبة", "role", P.ManageRoles],
  ["roleremove", "إزالة رتبة", "role", P.ManageRoles],

  ["ticket-panel", "إنشاء لوحة التكت", "none", P.ManageChannels],
  ["ticket-close", "إغلاق التكت الحالي", "none"],
  ["ticket-add", "إضافة عضو للتكت", "user", P.ManageChannels],
  ["ticket-remove", "إزالة عضو من التكت", "user", P.ManageChannels],
  ["ticket-claim", "استلام التكت الحالي", "none", P.ManageChannels],

  ["say", "إرسال رسالة", "text", P.ManageMessages],
  ["poll", "إنشاء تصويت", "text"],
  ["announce", "إرسال إعلان", "text", P.ManageMessages],
  ["embed", "إرسال Embed", "embed", P.ManageMessages],
  ["report", "إرسال بلاغ", "text"],
  ["suggest", "إرسال اقتراح", "text"],
  ["reverse", "عكس النص", "text"],
  ["repeat", "تكرار النص", "text"],
  ["remind", "إنشاء تذكير نصي", "text"],
  ["support", "معلومات الدعم", "none"]
];

// ==================== إنشاء أوامر Slash ====================

const commands = definitions.map(([name, description, kind, permission]) => {
  const builder = new SlashCommandBuilder()
    .setName(name)
    .setDescription(description);

  if (permission) {
    builder.setDefaultMemberPermissions(permission);
  }

  if (["user", "user_reason", "duration", "role", "nickname"].includes(kind)) {
    builder.addUserOption(option =>
      option
        .setName("member")
        .setDescription("العضو")
        .setRequired(true)
    );
  }

  if (kind === "user_reason") {
    builder.addStringOption(option =>
      option
        .setName("reason")
        .setDescription("سبب الإجراء")
        .setRequired(false)
    );
  }

  if (kind === "duration") {
    builder.addIntegerOption(option =>
      option
        .setName("minutes")
        .setDescription("مدة المهلة بالدقائق")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    );

    builder.addStringOption(option =>
      option
        .setName("reason")
        .setDescription("سبب المهلة")
        .setRequired(false)
    );
  }

  if (kind === "unban") {
    builder.addStringOption(option =>
      option
        .setName("user_id")
        .setDescription("معرف العضو")
        .setRequired(true)
    );
  }

  if (kind === "integer") {
    builder.addIntegerOption(option => {
      option
        .setName("amount")
        .setDescription(name === "slowmode" ? "عدد الثواني" : "عدد الرسائل")
        .setRequired(true);

      if (name === "slowmode") {
        option.setMinValue(0).setMaxValue(21600);
      } else {
        option.setMinValue(1).setMaxValue(100);
      }

      return option;
    });
  }

  if (kind === "guess") {
    builder.addIntegerOption(option =>
      option
        .setName("number")
        .setDescription("رقم من 1 إلى 10")
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(true)
    );
  }

  if (kind === "text") {
    builder.addStringOption(option =>
      option
        .setName("text")
        .setDescription("النص")
        .setMaxLength(1000)
        .setRequired(true)
    );
  }

  if (kind === "choice") {
    builder.addStringOption(option =>
      option
        .setName("choice")
        .setDescription("اختيارك")
        .setRequired(true)
        .addChoices(
          { name: "حجر", value: "حجر" },
          { name: "ورقة", value: "ورقة" },
          { name: "مقص", value: "مقص" }
        )
    );
  }

  if (kind === "math") {
    builder.addIntegerOption(option =>
      option.setName("a").setDescription("العدد الأول").setRequired(true)
    );

    builder.addIntegerOption(option =>
      option.setName("b").setDescription("العدد الثاني").setRequired(true)
    );

    builder.addStringOption(option =>
      option
        .setName("operation")
        .setDescription("العملية الحسابية")
        .setRequired(true)
        .addChoices(
          { name: "جمع", value: "add" },
          { name: "طرح", value: "subtract" },
          { name: "ضرب", value: "multiply" },
          { name: "قسمة", value: "divide" }
        )
    );
  }

  if (kind === "two_users") {
    builder.addUserOption(option =>
      option.setName("first").setDescription("العضو الأول").setRequired(true)
    );

    builder.addUserOption(option =>
      option.setName("second").setDescription("العضو الثاني").setRequired(true)
    );
  }

  if (kind === "role") {
    builder.addRoleOption(option =>
      option.setName("role").setDescription("الرتبة").setRequired(true)
    );
  }

  if (kind === "nickname") {
    builder.addStringOption(option =>
      option
        .setName("nickname")
        .setDescription("اللقب الجديد")
        .setMaxLength(32)
        .setRequired(true)
    );
  }

  if (kind === "embed") {
    builder.addStringOption(option =>
      option
        .setName("title")
        .setDescription("عنوان الرسالة")
        .setMaxLength(256)
        .setRequired(true)
    );

    builder.addStringOption(option =>
      option
        .setName("description")
        .setDescription("محتوى الرسالة")
        .setMaxLength(4000)
        .setRequired(true)
    );
  }

  return builder.toJSON();
});

// ==================== أدوات مساعدة ====================

const pick = array => array[Math.floor(Math.random() * array.length)];

function makeEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: SERVER_NAME })
    .setTimestamp();
}

function isStaff(interaction) {
  const member = interaction.member;

  const hasPermission =
    interaction.memberPermissions?.has(P.ManageChannels) ||
    interaction.memberPermissions?.has(P.Administrator);

  const hasSupportRole =
    Boolean(SUPPORT_ROLE_ID) &&
    member?.roles?.cache?.has(SUPPORT_ROLE_ID);

  return Boolean(hasPermission || hasSupportRole);
}

function isTicketChannel(channel) {
  return Boolean(
    channel &&
    channel.type === ChannelType.GuildText &&
    channel.topic?.startsWith("ticket-owner:")
  );
}const TICKET_TYPES = {
  support: {
    label: "دعم فني",
    emoji: "🛠️",
    slug: "support",
    description: "للمساعدة وحل المشاكل"
  },
  girl: {
    label: "توثيق بنت",
    emoji: "👩",
    slug: "girl",
    description: "لطلب توثيق بنت"
  },
  creator: {
    label: "توثيق صانع محتوى",
    emoji: "🎬",
    slug: "creator",
    description: "لطلب توثيق صانع محتوى"
  },
  partnership: {
    label: "شراكة",
    emoji: "🤝",
    slug: "partnership",
    description: "لطلب شراكة مع السيرفر"
  }
};

async function createTicket(interaction, typeKey) {
  if (!interaction.guild) {
    return interaction.reply({
      content: "❌ هذا النظام يعمل داخل السيرفر فقط.",
      ephemeral: true
    });
  }

  const type = TICKET_TYPES[typeKey];

  if (!type) {
    return interaction.reply({
      content: "❌ نوع التكت غير صحيح.",
      ephemeral: true
    });
  }

  const guild = interaction.guild;

  const existing = guild.channels.cache.find(channel =>
    channel.type === ChannelType.GuildText &&
    channel.topic?.startsWith(`ticket-owner:${interaction.user.id}`)
  );

  if (existing) {
    return interaction.reply({
      content: `❌ عندك تكت مفتوح بالفعل: ${existing}`,
      ephemeral: true
    });
  }

  if (TICKET_CATEGORY_ID) {
    const category = guild.channels.cache.get(TICKET_CATEGORY_ID);

    if (!category || category.type !== ChannelType.GuildCategory) {
      return interaction.reply({
        content: "❌ معرف تصنيف التكت غير صحيح. راجع TICKET_CATEGORY_ID.",
        ephemeral: true
      });
    }
  }

  await interaction.deferReply({ ephemeral: true });

  const safeName = interaction.user.username
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 35) || "member";

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [P.ViewChannel]
    },
    {
      id: interaction.user.id,
      allow: [
        P.ViewChannel,
        P.SendMessages,
        P.ReadMessageHistory,
        P.AttachFiles
      ]
    },
    {
      id: client.user.id,
      allow: [
        P.ViewChannel,
        P.SendMessages,
        P.ReadMessageHistory,
        P.ManageChannels
      ]
    }
  ];

  if (SUPPORT_ROLE_ID && guild.roles.cache.has(SUPPORT_ROLE_ID)) {
    overwrites.push({
      id: SUPPORT_ROLE_ID,
      allow: [
        P.ViewChannel,
        P.SendMessages,
        P.ReadMessageHistory,
        P.AttachFiles
      ]
    });
  }

  try {
    const channel = await guild.channels.create({
      name: `ticket-${type.slug}-${safeName}`.slice(0, 100),
      type: ChannelType.GuildText,
      topic: `ticket-owner:${interaction.user.id}`,
      parent: TICKET_CATEGORY_ID || undefined,
      permissionOverwrites: overwrites
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket:close")
        .setLabel("إغلاق التكت")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("ticket:claim")
        .setLabel("استلام التكت")
        .setEmoji("🛠️")
        .setStyle(ButtonStyle.Success)
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`${type.emoji} ${type.label}`)
      .setDescription(
        `مرحبًا ${interaction.user} 👋\n\n` +
        `تم فتح طلبك في قسم **${type.label}**.\n` +
        `${type.description}.\n\n` +
        "اكتب تفاصيل طلبك وانتظر فريق الإدارة."
      )
      .setFooter({ text: SERVER_NAME })
      .setTimestamp();

    await channel.send({
      content: `${interaction.user}`,
      embeds: [embed],
      components: [row]
    });

    return interaction.editReply({
      content: `✅ تم فتح تكت **${type.label}** بنجاح: ${channel}`
    });
  } catch (error) {
    console.error("خطأ في إنشاء التكت:", error);

    return interaction.editReply({
      content: "❌ تعذر إنشاء التكت. تحقق من صلاحيات البوت وإعدادات التصنيف."
    });
  }
}

// ==================== تسجيل الأوامر ====================

async function registerCommands() {
  const rest = new REST({
    version: "10",
    timeout: 120000
  }).setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log(`✅ تم تسجيل ${commands.length} أمرًا في ${SERVER_NAME}.`);
}

// ==================== تشغيل البوت ====================

client.once("ready", () => {
  console.log(`🛡️ ${client.user.tag} يعمل الآن في ${SERVER_NAME}.`);
  client.user.setActivity("Mr Bit Empire | Support");
});

// ==================== التعامل مع الأوامر ====================

client.on("interactionCreate", async interaction => {
  try {
    // ---------- قائمة أنواع التكت ----------

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "ticket:type"
    ) {
      return await createTicket(interaction, interaction.values[0]);
    }

    // ---------- أزرار التكت ----------

    if (interaction.isButton()) {
      if (interaction.customId === "ticket:create") {
        const menu = new StringSelectMenuBuilder()
          .setCustomId("ticket:type")
          .setPlaceholder("🎫 اختر نوع التكت")
          .addOptions(
            {
              label: "دعم فني",
              value: "support",
              emoji: "🛠️",
              description: "للمساعدة وحل المشاكل"
            },
            {
              label: "توثيق بنت",
              value: "girl",
              emoji: "👩",
              description: "لطلب توثيق بنت"
            },
            {
              label: "توثيق صانع محتوى",
              value: "creator",
              emoji: "🎬",
              description: "لطلب توثيق صانع محتوى"
            },
            {
              label: "شراكة",
              value: "partnership",
              emoji: "🤝",
              description: "لطلب شراكة مع السيرفر"
            }
          );

        return interaction.reply({
          content: "🎫 **اختر نوع التكت الذي تريد فتحه:**",
          components: [
            new ActionRowBuilder().addComponents(menu)
          ],
          ephemeral: true
        });
      }

      if (interaction.customId === "ticket:close") {
        if (!isTicketChannel(interaction.channel)) {
          return interaction.reply({
            content: "❌ هذا الروم ليس تكتًا.",
            ephemeral: true
          });
        }

        const ownerId = interaction.channel.topic.split(":")[1];
        const isOwner = interaction.user.id === ownerId;

        if (!isOwner && !isStaff(interaction)) {
          return interaction.reply({
            content: "❌ لا يمكنك إغلاق هذا التكت.",
            ephemeral: true
          });
        }

        await interaction.reply({
          content: "🔒 سيتم إغلاق التكت بعد 3 ثوانٍ."
        });

        setTimeout(async () => {
          try {
            await interaction.channel.delete("تم إغلاق التكت");
          } catch (error) {
            console.error("تعذر حذف التكت:", error.message);
          }
        }, 3000);

        return;
      }

      if (interaction.customId === "ticket:claim") {
        if (!isTicketChannel(interaction.channel)) {
          return interaction.reply({
            content: "❌ هذا الروم ليس تكتًا.",
            ephemeral: true
          });
        }

        if (!isStaff(interaction)) {
          return interaction.reply({
            content: "❌ هذا الزر لفريق الدعم والإدارة فقط.",
            ephemeral: true
          });
        }

        return interaction.reply({
          content: `🛠️ تم استلام التكت بواسطة ${interaction.user}.`
        });
      }

      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const name = interaction.commandName;
    const member = interaction.options.getUser("member");
    const reason =
      interaction.options.getString("reason") || "لم يتم تحديد سبب";

    // ---------- معلومات السيرفر والبوت ----------

    if (name === "help") {
      const embed = makeEmbed(
        `📚 أوامر ${SERVER_NAME}`,
        [
          "**المعلومات:** `/ping` `/server` `/avatar` `/userinfo` `/botinfo` `/membercount` `/roles` `/channelinfo` `/servericon`",
          "**الألعاب:** `/roll` `/coinflip` `/rps` `/guess` `/number` `/trivia` `/quiz` `/math` `/dice` `/slots` وغيرها.",
          "**الإدارة:** `/warn` `/kick` `/ban` `/unban` `/timeout` `/untimeout` `/clear` `/slowmode` `/lock` `/unlock` `/hide` `/show` `/nickname` `/roleadd` `/roleremove`",
          "**التكت:** `/ticket-panel` `/ticket-close` `/ticket-add` `/ticket-remove` `/ticket-claim`",
          "**الأدوات:** `/say` `/poll` `/announce` `/embed` `/report` `/suggest` `/reverse` `/repeat` `/remind` `/support`"
        ].join("\n\n")
      );

      return interaction.reply({
        embeds: [embed],
        ephemeral: true
      });
    }

    if (name === "ping") {
      return interaction.reply(`🏓 سرعة البوت: ${client.ws.ping}ms`);
    }

    if (name === "server") {
      const embed = makeEmbed(
        `🏰 ${SERVER_NAME}`,
        `**اسم السيرفر:** ${interaction.guild.name}\n` +
        `**عدد الأعضاء:** ${interaction.guild.memberCount}\n` +
        `**عدد الرومات:** ${interaction.guild.channels.cache.size}\n` +
        `**معرف السيرفر:** ${interaction.guild.id}`
      );

      return interaction.reply({ embeds: [embed] });
    }

    if (name === "avatar") {
      const user = member || interaction.user;
      return interaction.reply(user.displayAvatarURL({ size: 1024 }));
    }

    if (name === "userinfo") {
      const user = member || interaction.user;

      const embed = makeEmbed(
        "👤 معلومات العضو",
        `**الاسم:** ${user.tag}\n` +
        `**المعرف:** ${user.id}\n` +
        `**تاريخ إنشاء الحساب:** <t:${Math.floor(user.createdTimestamp / 1000)}:F>`
      );

      return interaction.reply({ embeds: [embed] });
    }

    if (name === "botinfo") {
      return interaction.reply({
        embeds: [
          makeEmbed(
            "🛡️ VEX Guard",
            `**السيرفر:** ${SERVER_NAME}\n` +
            `**الأوامر:** ${commands.length}\n` +
            `**عدد السيرفرات:** ${client.guilds.cache.size}\n` +
            `**مكتبة Discord.js:** ${require("discord.js").version}`
          )
        ]
      });
    }

    if (name === "membercount") {
      return interaction.reply(
        `👥 عدد أعضاء السيرفر: **${interaction.guild.memberCount}**`
      );
    }

    if (name === "roles") {
      const roles = interaction.guild.roles.cache
        .filter(role => role.id !== interaction.guild.id)
        .map(role => role.name);

      const output = roles.join("، ").slice(0, 1800) || "لا توجد رتب.";

      return interaction.reply(`🎭 **رتب السيرفر:**\n${output}`);
    }

    if (name === "channelinfo") {
      const channel = interaction.channel;

      return interaction.reply({
        embeds: [
          makeEmbed(
            "📍 معلومات الروم",
            `**الاسم:** ${channel.name}\n` +
            `**المعرف:** ${channel.id}\n` +
            `**النوع:** ${channel.type}`
          )
        ]
      });
    }

    if (name === "servericon") {
      const icon = interaction.guild.iconURL({ size: 1024 });

      if (!icon) {
        return interaction.reply("❌ السيرفر لا يملك أيقونة.");
      }

      return interaction.reply(icon);
    }

    // ---------- أوامر الإدارة ----------

    if (name === "warn") {
      if (!member) {
        return interaction.reply({
          content: "❌ حدد عضوًا.",
          ephemeral: true
        });
      }

      try {
        await member.send(
          `⚠️ تلقيت تحذيرًا في ${SERVER_NAME}.\nالسبب: ${reason}`
        );
      } catch {}

      return interaction.reply(
        `⚠️ تم تسجيل التحذير وإبلاغ ${member}.\n**السبب:** ${reason}`
      );
    }

    if (name === "kick") {
      const target = await interaction.guild.members
        .fetch(member.id)
        .catch(() => null);

      if (!target) {
        return interaction.reply({
          content: "❌ لم أجد العضو.",
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

      return interaction.reply(
        `👢 تم طرد **${member.tag}**.\n**السبب:** ${reason}`
      );
    }

    if (name === "ban") {
      const target = await interaction.guild.members
        .fetch(member.id)
        .catch(() => null);

      if (!target) {
        return interaction.reply({
          content: "❌ لم أجد العضو داخل السيرفر.",
          ephemeral: true
        });
      }

      if (!target.bannable) {
        return interaction.reply({
          content: "❌ لا أستطيع حظر هذا العضو. تحقق من صلاحياتي وترتيب الرتب.",
          ephemeral: true
        });
      }

      await target.ban({ reason });

      return interaction.reply(
        `🔨 تم حظر **${member.tag}**.\n**السبب:** ${reason}`
      );
    }

    if (name === "unban") {
      const userId = interaction.options.getString("user_id").trim();

      if (!/^\d{17,20}$/.test(userId)) {
        return interaction.reply({
          content: "❌ أدخل معرف مستخدم صحيحًا.",
          ephemeral: true
        });
      }

      await interaction.guild.members.unban(
        userId,
        "فك الحظر بواسطة VEX Guard"
      );

      return interaction.reply(
        `✅ تم فك الحظر عن صاحب المعرف \`${userId}\`.`
      );
    }

    if (name === "timeout") {
      const target = await interaction.guild.members
        .fetch(member.id)
        .catch(() => null);

      const minutes = interaction.options.getInteger("minutes");

      if (!target) {
        return interaction.reply({
          content: "❌ لم أجد العضو.",
          ephemeral: true
        });
      }

      if (!target.moderatable) {
        return interaction.reply({
          content: "❌ لا أستطيع إعطاء هذا العضو مهلة.",
          ephemeral: true
        });
      }

      await target.timeout(minutes * 60 * 1000, reason);

      return interaction.reply(
        `⏳ تم إعطاء ${member} مهلة لمدة **${minutes} دقيقة**.\n**السبب:** ${reason}`
      );
    }

    if (name === "untimeout") {
      const target = await interaction.guild.members
        .fetch(member.id)
        .catch(() => null);

      if (!target) {
        return interaction.reply({
          content: "❌ لم أجد العضو.",
          ephemeral: true
        });
      }

      if (!target.moderatable) {
        return interaction.reply({
          content: "❌ لا أستطيع إزالة المهلة عن هذا العضو.",
          ephemeral: true
        });
      }

      await target.timeout(null);

      return interaction.reply(`✅ تمت إزالة المهلة عن ${member}.`);
    }

    if (name === "clear") {
      const amount = interaction.options.getInteger("amount");
      const messages = await interaction.channel.bulkDelete(amount, true);

      return interaction.reply({
        content: `🧹 تم حذف ${messages.size} رسالة.`,
        ephemeral: true
      });
    }

    if (name === "slowmode") {
      const seconds = interaction.options.getInteger("amount");

      if (!interaction.channel.setRateLimitPerUser) {
        return interaction.reply({
          content: "❌ لا يمكن ضبط البطء في هذا الروم.",
          ephemeral: true
        });
      }

      await interaction.channel.setRateLimitPerUser(seconds);

      return interaction.reply(
        `🐢 تم ضبط بطء الروم على **${seconds} ثانية**.`
      );
    }

    if (name === "lock" || name === "unlock") {
      const locked = name === "lock";

      await interaction.channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { SendMessages: !locked }
      );

      return interaction.reply(
        locked ? "🔒 تم قفل الروم." : "🔓 تم فتح الروم."
      );
    }

    if (name === "hide" || name === "show") {
      const hidden = name === "hide";

      await interaction.channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { ViewChannel: !hidden }
      );

      return interaction.reply(
        hidden ? "👁️‍🗨️ تم إخفاء الروم." : "👁️ تم إظهار الروم."
      );
    }

    if (name === "nickname") {
      const target = await interaction.guild.members
        .fetch(member.id)
        .catch(() => null);

      const nickname = interaction.options.getString("nickname");

      if (!target) {
        return interaction.reply({
          content: "❌ لم أجد العضو.",
          ephemeral: true
        });
      }

      await target.setNickname(nickname);

      return interaction.reply(
        `✅ تم تغيير لقب ${member} إلى **${nickname}**.`
      );
    }

    if (name === "roleadd" || name === "roleremove") {
      const target = await interaction.guild.members
        .fetch(member.id)
        .catch(() => null);

      const role = interaction.options.getRole("role");

      if (!target) {
        return interaction.reply({
          content: "❌ لم أجد العضو.",
          ephemeral: true
        });
      }

      if (
        role.managed ||
        role.position >= interaction.guild.members.me.roles.highest.position
      ) {
        return interaction.reply({
          content: "❌ لا أستطيع تعديل هذه الرتبة بسبب ترتيب الرتب أو لأنها مُدارة.",
          ephemeral: true
        });
      }

      if (name === "roleadd") {
        await target.roles.add(role);
        return interaction.reply(`✅ تم إعطاء رتبة ${role} إلى ${member}.`);
      }

      await target.roles.remove(role);

      return interaction.reply(`✅ تمت إزالة رتبة ${role} من ${member}.`);
    }

    // ---------- نظام التكت ----------

    if (name === "ticket-panel") {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🎫 مركز الدعم | ${SERVER_NAME}`)
        .setDescription(
          "هل تحتاج إلى مساعدة؟\n" +
          "اضغط على الزر أدناه لفتح تكت خاص والتواصل مع فريق الدعم."
        )
        .setFooter({ text: "VEX Guard • Support System" });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket:create")
          .setLabel("فتح تكت")
          .setEmoji("🎫")
          .setStyle(ButtonStyle.Primary)
      );

      return interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }

    if (name === "ticket-close") {
      if (!isTicketChannel(interaction.channel)) {
        return interaction.reply({
          content: "❌ هذا الأمر يعمل داخل روم التكت فقط.",
          ephemeral: true
        });
      }

      const ownerId = interaction.channel.topic.split(":")[1];

      if (interaction.user.id !== ownerId && !isStaff(interaction)) {
        return interaction.reply({
          content: "❌ لا يمكنك إغلاق هذا التكت.",
          ephemeral: true
        });
      }

      await interaction.reply("🔒 سيتم إغلاق التكت بعد 3 ثوانٍ.");

      setTimeout(async () => {
        try {
          await interaction.channel.delete("تم إغلاق التكت");
        } catch (error) {
          console.error("تعذر حذف التكت:", error.message);
        }
      }, 3000);

      return;
    }

    if (name === "ticket-add" || name === "ticket-remove") {
      if (!isTicketChannel(interaction.channel)) {
        return interaction.reply({
          content: "❌ استخدم الأمر داخل روم التكت.",
          ephemeral: true
        });
      }

      if (!isStaff(interaction)) {
        return interaction.reply({
          content: "❌ هذا الأمر لفريق الدعم والإدارة فقط.",
          ephemeral: true
        });
      }

      const target = interaction.options.getUser("member");

      if (name === "ticket-add") {
        await interaction.channel.permissionOverwrites.edit(target.id, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          AttachFiles: true
        });

        return interaction.reply(`✅ تمت إضافة ${target} إلى التكت.`);
      }

      await interaction.channel.permissionOverwrites
        .delete(target.id)
        .catch(() => null);

      return interaction.reply(`✅ تمت إزالة صلاحيات ${target} من التكت.`);
    }

    if (name === "ticket-claim") {
      if (!isTicketChannel(interaction.channel)) {
        return interaction.reply({
          content: "❌ هذا الأمر يعمل داخل روم التكت فقط.",
          ephemeral: true
        });
      }

      if (!isStaff(interaction)) {
        return interaction.reply({
          content: "❌ هذا الأمر لفريق الدعم والإدارة فقط.",
          ephemeral: true
        });
      }

      return interaction.reply(
        `🛠️ تم استلام التكت بواسطة ${interaction.user}.`
      );
    }

    // ---------- أدوات الرسائل ----------

    if (name === "say") {
      const text = interaction.options.getString("text");

      await interaction.channel.send({ content: text });

      return interaction.reply({
        content: "✅ تم إرسال الرسالة.",
        ephemeral: true
      });
    }

    if (name === "poll") {
      const text = interaction.options.getString("text");

      const message = await interaction.channel.send({
        embeds: [makeEmbed("📊 تصويت", text)]
      });

      await message.react("👍");
      await message.react("👎");

      return interaction.reply({
        content: "✅ تم إنشاء التصويت.",
        ephemeral: true
      });
    }

    if (name === "announce") {
      const text = interaction.options.getString("text");

      await interaction.channel.send({
        embeds: [
          makeEmbed(`📢 إعلان | ${SERVER_NAME}`, text)
        ]
      });

      return interaction.reply({
        content: "✅ تم إرسال الإعلان.",
        ephemeral: true
      });
    }

    if (name === "embed") {
      const title = interaction.options.getString("title");
      const description = interaction.options.getString("description");

      await interaction.channel.send({
        embeds: [makeEmbed(title, description)]
      });

      return interaction.reply({
        content: "✅ تم إرسال Embed.",
        ephemeral: true
      });
    }

    if (name === "report") {
      const text = interaction.options.getString("text");

      return interaction.reply({
        content: `✅ تم استلام بلاغك:\n${text}`,
        ephemeral: true
      });
    }

    if (name === "suggest") {
      const text = interaction.options.getString("text");

      return interaction.reply({
        embeds: [
          makeEmbed(
            "💡 اقتراح جديد",
            `**من:** ${interaction.user}\n**الاقتراح:** ${text}`
          )
        ]
      });
    }

    if (name === "reverse") {
      const text = interaction.options.getString("text");
      return interaction.reply(text.split("").reverse().join(""));
    }

    if (name === "repeat") {
      const text = interaction.options.getString("text");
      return interaction.reply(text.slice(0, 1900));
    }

    if (name === "remind") {
      const text = interaction.options.getString("text");

      return interaction.reply({
        content:
          `📝 تذكيرك محفوظ في هذه الرسالة:\n${text}\n\n` +
          "ملاحظة: هذا الأمر لا يرسل تذكيرًا تلقائيًا لاحقًا.",
        ephemeral: true
      });
    }

    if (name === "support") {
      return interaction.reply({
        embeds: [
          makeEmbed(
            "🛠️ الدعم الفني",
            "لفتح طلب دعم، استخدم لوحة التكت التي ينشئها الأمر `/ticket-panel`."
          )
        ],
        ephemeral: true
      });
    }

    // ---------- أوامر الألعاب والترفيه ----------

    if (name === "roll" || name === "number") {
      return interaction.reply(
        `🎲 الرقم العشوائي: **${Math.floor(Math.random() * 100) + 1}**`
      );
    }

    if (name === "coinflip") {
      return interaction.reply(`🪙 النتيجة: **${pick(["صورة", "كتابة"])}**`);
    }

    if (name === "rps" || name === "rockpaper") {
      const userChoice = name === "rps"
        ? interaction.options.getString("choice")
        : pick(["حجر", "ورقة", "مقص"]);

      const botChoice = pick(["حجر", "ورقة", "مقص"]);

      let result = "تعادل! 🤝";

      if (
        (userChoice === "حجر" && botChoice === "مقص") ||
        (userChoice === "ورقة" && botChoice === "حجر") ||
        (userChoice === "مقص" && botChoice === "ورقة")
      ) {
        result = "لقد فزت! 🎉";
      } else if (userChoice !== botChoice) {
        result = "لقد خسرت! 😅";
      }

      return interaction.reply(
        `اختيارك: **${userChoice}**\nاختياري: **${botChoice}**\n${result}`
      );
    }

    if (name === "guess") {
      const guess = interaction.options.getInteger("number");
      const answer = Math.floor(Math.random() * 10) + 1;

      return interaction.reply(
        guess === answer
          ? `🎉 صحيح! الرقم هو ${answer}.`
          : `😅 ليس صحيحًا! الرقم كان ${answer}.`
      );
    }

    if (name === "math") {
      const a = interaction.options.getInteger("a");
      const b = interaction.options.getInteger("b");
      const operation = interaction.options.getString("operation");

      let result;

      if (operation === "add") result = a + b;
      if (operation === "subtract") result = a - b;
      if (operation === "multiply") result = a * b;

      if (operation === "divide") {
        if (b === 0) {
          return interaction.reply({
            content: "❌ لا يمكن القسمة على صفر.",
            ephemeral: true
          });
        }

        result = a / b;
      }

      return interaction.reply(`🧮 النتيجة: **${result}**`);
    }

    if (name === "dice") {
      const a = Math.floor(Math.random() * 6) + 1;
      const b = Math.floor(Math.random() * 6) + 1;

      return interaction.reply(
        `🎲 النرد الأول: **${a}**\nالنرد الثاني: **${b}**\nالمجموع: **${a + b}**`
      );
    }

    if (name === "slots") {
      const symbols = [
        pick(["🍒", "🍋", "🍇", "⭐", "💎"]),
        pick(["🍒", "🍋", "🍇", "⭐", "💎"]),
        pick(["🍒", "🍋", "🍇", "⭐", "💎"])
      ];

      return interaction.reply(
        `${symbols.join(" | ")}\n` +
        (symbols[0] === symbols[1] && symbols[1] === symbols[2]
          ? "🎉 ثلاثة متطابقة!"
          : "جرّب مرة أخرى!")
      );
    }

    if (name === "choose") {
      const choices = interaction.options.getString("text")
        .split(/[،,|]/)
        .map(item => item.trim())
        .filter(Boolean);

      return interaction.reply(
        choices.length
          ? `🤔 اختياري هو: **${pick(choices)}**`
          : "❌ اكتب خيارين أو أكثر وافصل بينها بفاصلة."
      );
    }

    if (name === "eightball") {
      return interaction.reply(
        `🔮 جواب الكرة السحرية: **${pick([
          "نعم!",
          "لا.",
          "ربما.",
          "اسألني لاحقًا.",
          "الأمر يعتمد عليك!",
          "بالتأكيد!"
        ])}**`
      );
    }

    if (name === "truth") {
      return interaction.reply(`🎤 صراحة: ${pick([
        "ما أكثر شيء يجعلك تضحك؟",
        "ما لعبتك المفضلة؟",
        "ما أفضل ذكرى لديك؟",
        "ما المهارة التي تريد تعلمها؟"
      ])}`);
    }

    if (name === "dare") {
      return interaction.reply(`🎯 تحدٍ ممتع: ${pick([
        "اكتب جملة من دون حرف الألف.",
        "اذكر ثلاث ألعاب تحبها.",
        "اكتب خمسة إيموجيات تعبّر عن يومك.",
        "قل معلومة جديدة تعلمتها مؤخرًا."
      ])}`);
    }

    if (name === "wouldyourather") {
      return interaction.reply(`🤔 ${pick([
        "تفضّل اللعب أم مشاهدة الأنمي؟",
        "تفضّل السفر إلى الماضي أم المستقبل؟",
        "تفضّل الفوز في لعبة أم تعلم مهارة جديدة؟"
      ])}`);
    }

    if (name === "neverhaveiever") {
      return interaction.reply(`🙈 لم أفعل قط: ${pick([
        "لعبت لعبة حتى نسيت الوقت.",
        "ضحكت في وقت غير مناسب.",
        "نسيت أين وضعت شيئًا مهمًا.",
        "جربت لعبة جديدة ثم أصبحت مفضلة لدي."
      ])}`);
    }

    if (name === "riddles") {
      return interaction.reply(`🧩 لغز: ${pick([
        "ما الشيء الذي له أسنان ولا يعض؟ — المشط.",
        "ما الشيء الذي يكتب ولا يقرأ؟ — القلم.",
        "ما الشيء الذي كلما أخذت منه كبر؟ — الحفرة."
      ])}`);
    }

    if (name === "scramble") {
      const word = pick(["DISCORD", "GAMING", "BRAWL", "FORTNITE", "MINECRAFT"]);
      const scrambled = word.split("").sort(() => Math.random() - 0.5).join("");

      return interaction.reply(
        `🔤 رتّب الحروف لتكتشف الكلمة:\n**${scrambled}**`
      );
    }

    if (name === "memory") {
      return interaction.reply(
        "🧠 تحدي ذاكرة: احفظ هذه الرموز لمدة 10 ثوانٍ: 🍎 🚀 ⭐ 🐺 💎"
      );
    }

    if (name === "reaction") {
      return interaction.reply(
        "⚡ تحدي رد الفعل: عندما ترى رسالة جديدة، حاول أن تكون من أوائل من يردون عليها!"
      );
    }

    if (name === "fasttype") {
      return interaction.reply("⌨️ تحدي الكتابة: **VEX Guard يحمي السيرفر**");
    }

    if (name === "higherlower") {
      return interaction.reply(
        `📈 الرقم الحالي: **${Math.floor(Math.random() * 100) + 1}**. هل الرقم التالي أعلى أم أقل؟`
      );
    }

    if (name === "blackjack") {
      const total = Math.floor(Math.random() * 11) + 11;
      return interaction.reply(`🃏 مجموع بطاقاتك التجريبي: **${total}**`);
    }

    if (name === "lottery") {
      return interaction.reply(
        `🎟️ الفائز العشوائي اليوم: ${interaction.guild.members.cache.random()?.user || interaction.user}`
      );
    }

    if (name === "roulette") {
      return interaction.reply(
        `🎡 توقفت العجلة عند: **${Math.floor(Math.random() * 37)}**`
      );
    }

    if (name === "emojiquiz") {
      return interaction.reply("🤔 خمن المعنى: **⚽🏆**");
    }

    if (name === "flagquiz") {
      return interaction.reply("🌍 خمن الدولة: 🇩🇿");
    }

    if (name === "capitals") {
      return interaction.reply(
        "🌍 سؤال: ما عاصمة الجزائر؟ الجواب: الجزائر العاصمة."
      );
    }

    if (name === "animalquiz") {
      return interaction.reply(
        "🐬 معلومة: الدلافين ثدييات وليست أسماكًا."
      );
    }

    if (name === "trivia" || name === "quiz") {
      return interaction.reply(`🧠 سؤال: ${pick([
        "ما أكبر كوكب في المجموعة الشمسية؟ — المشتري.",
        "كم عدد أيام الأسبوع؟ — سبعة.",
        "ما الكوكب المعروف بالكوكب الأحمر؟ — المريخ."
      ])}`);
    }

    if (name === "footballquiz") {
      return interaction.reply(
        "⚽ سؤال: كم لاعبًا من الفريق الواحد يبدأ المباراة داخل الملعب؟ الجواب: 11 لاعبًا."
      );
    }

    if (name === "animequiz") {
      return interaction.reply(
        "🍥 سؤال أنمي: ما اسم بطل أنمي Naruto؟ الجواب: ناروتو أوزوماكي."
      );
    }

    if (name === "gamingquiz") {
      return interaction.reply(
        "🎮 سؤال ألعاب: ما اسم الشركة المطورة للعبة Minecraft؟ الجواب: Mojang."
      );
    }

    if (name === "brawlstars") {
      return interaction.reply(`⭐ تحدي براول ستارز: ${pick([
        "اذكر شخصية أسطورية في اللعبة.",
        "ما الشخصية التي تفضل اللعب بها؟",
        "جرّب الفوز بمباراة باستخدام شخصية مختلفة."
      ])}`);
    }

    if (name === "fortnite") {
      return interaction.reply(`🎮 تحدي فورتنايت: ${pick([
        "حاول تحسين دقة التصويب في مباراة تدريبية.",
        "جرّب الهبوط في مكان جديد.",
        "العب مباراة وركّز على التعاون مع فريقك."
      ])}`);
    }

    if (name === "minecraft") {
      return interaction.reply(
        "⛏️ تحدي ماينكرافت: ابنِ منزلًا صغيرًا باستخدام ثلاثة أنواع من الكتل."
      );
    }

    if (name === "efootball") {
      return interaction.reply(
        "⚽ تحدي إي فوتبول: جرّب بناء هجمة باستخدام التمريرات القصيرة."
      );
    }

    if (name === "valorant") {
      return interaction.reply(
        "🎯 تحدي فالورانت: تدرب على التصويب والتحرك قبل دخول مباراة."
      );
    }

    if (name === "chess") {
      return interaction.reply(
        "♟️ نصيحة شطرنج: حاول السيطرة على وسط الرقعة وتطوير قطعك مبكرًا."
      );
    }

    if (name === "wordchain") {
      return interaction.reply(
        "🔠 تحدي الكلمات: اكتب كلمة تبدأ بآخر حرف من كلمة «مدرسة»."
      );
    }

    if (name === "wordle") {
      return interaction.reply(
        "🟩 كلمة اليوم التجريبية: حاول تخمين كلمة من خمسة أحرف!"
      );
    }

    if (name === "hangman") {
      return interaction.reply("🔤 كلمة مخفية من 5 أحرف: _ _ _ _ _");
    }

    if (name === "leaderboard") {
      return interaction.reply(
        "🏆 لوحة المتصدرين التجريبية: لا توجد نقاط محفوظة بعد."
      );
    }

    if (name === "daily") {
      return interaction.reply(
        "🎁 هذه مكافأة تجريبية فقط؛ لا توجد عملة أو نقاط محفوظة في قاعدة بيانات."
      );
    }

    if (name === "profile") {
      return interaction.reply(
        `👤 ملف اللاعب: ${interaction.user}\n**النقاط التجريبية:** 0`
      );
    }

    if (name === "joke") {
      return interaction.reply(pick([
        "لماذا الكمبيوتر بردان؟ لأنه فتح النوافذ! 😂",
        "ذهبت النكتة إلى المدرسة، فعادت بدرجة ممتازة!",
        "قال الكتاب للقلم: أنت تكتب وأنا أتحمل المسؤولية! 😄"
      ]));
    }

    if (name === "fact") {
      return interaction.reply(`💡 معلومة: ${pick([
        "الأخطبوط لديه ثلاثة قلوب.",
        "ضوء الشمس يستغرق نحو 8 دقائق و20 ثانية ليصل إلى الأرض.",
        "العسل يمكن أن يبقى صالحًا مدة طويلة إذا حُفظ بطريقة مناسبة."
      ])}`);
    }

    if (name === "quote") {
      return interaction.reply(
        "✨ «النجاح هو الاستمرار في المحاولة والتعلم من الأخطاء.»"
      );
    }

    if (name === "compliment") {
      return interaction.reply(
        `💙 ${member} شخص رائع، ووجوده يضيف جوًا جميلًا للسيرفر!`
      );
    }

    if (name === "roast") {
      return interaction.reply(
        `😂 مزحة خفيفة لـ ${member}: حتى الإنترنت ينتظر منك أن تتحرك أسرع!`
      );
    }

    if (name === "rate") {
      const text = interaction.options.getString("text");

      return interaction.reply(
        `⭐ تقييم **${text}** للمرح فقط: **${Math.floor(Math.random() * 10) + 1}/10**`
      );
    }

    if (name === "ship") {
      const first = interaction.options.getUser("first");
      const second = interaction.options.getUser("second");

      return interaction.reply(
        `💫 نسبة التوافق العشوائية بين ${first} و${second}: **${Math.floor(Math.random() * 101)}%** (للمرح فقط).`
      );
    }

    if (name === "hug") {
      return interaction.reply(
        `🤗 ${interaction.user} يرسل تحية ودية إلى ${member}!`
      );
    }

    if (name === "highfive") {
      return interaction.reply(
        `🖐️ ${interaction.user} يحيّي ${member} بالكف!`
      );
    }

    if (name === "slap") {
      return interaction.reply(
        `😂 مزحة بين الأصدقاء: ${interaction.user} يرسل حركة كرتونية مرحة إلى ${member}.`
      );
    }

    if (name === "meme") {
      return interaction.reply(
        "😂 فكرة ميم: عندما تقول «آخر مباراة» ثم تكتشف أن الوقت صار متأخرًا!"
      );
    }

    if (name === "cat") {
      return interaction.reply(
        "🐱 حقيقة: القطط تستخدم شواربها للمساعدة في تقدير المسافات."
      );
    }

    if (name === "dog") {
      return interaction.reply(
        "🐶 حقيقة: حاسة الشم لدى الكلاب قوية جدًا."
      );
    }

    if (name === "advice") {
      return interaction.reply(
        "💡 نصيحة: لا تتردد في طلب المساعدة عندما تحتاج إليها."
      );
    }

    if (name === "motivation") {
      return interaction.reply(
        "🔥 كل خطوة صغيرة تتعلم منها تقربك من هدفك. استمر!"
      );
    }

    return interaction.reply({
      content: "❌ لم أتمكن من تنفيذ هذا الأمر.",
      ephemeral: true
    });

  } catch (error) {
    console.error("خطأ في تنفيذ الأمر:", error);

    const message = {
      content: "❌ حدث خطأ. تحقق من صلاحيات البوت وإعداداته ثم حاول مجددًا.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(message).catch(() => {});
    } else {
      await interaction.reply(message).catch(() => {});
    }
  }
});

// ==================== تسجيل الأوامر ثم تشغيل البوت ====================

(async () => {
  try {
    await registerCommands();
    await client.login(TOKEN);
  } catch (error) {
    console.error("❌ تعذر تشغيل VEX Guard:", error);
  }
})();
