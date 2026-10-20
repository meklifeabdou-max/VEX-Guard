
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || "";

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ أضف DISCORD_TOKEN و CLIENT_ID في Secrets.");
  process.exit(1);
}

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const commands = [
  ["مساعدة", "عرض قائمة الأوامر"],
  ["معلومات", "معلومات البوت"],
  ["سيرفر", "معلومات السيرفر"],
  ["عضو", "معلومات عضو"],
  ["صورة", "صورة عضو"],
  ["بنق", "سرعة استجابة البوت"],
  ["وقت", "الوقت الحالي"],
  ["رابط", "رابط دعوة البوت"],
  ["تكت", "إرسال لوحة التكت"],
  ["اغلاق_التكت", "إغلاق التكت الحالي"],
  ["طرد", "طرد عضو"],
  ["حظر", "حظر عضو"],
  ["الغاء_حظر", "إلغاء حظر عضو"],
  ["تحذير", "تحذير عضو"],
  ["تحذيرات", "عرض تحذيرات عضو"],
  ["مسح_تحذيرات", "مسح تحذيرات عضو"],
  ["مسح", "مسح رسائل"],
  ["مهلة", "إعطاء عضو مهلة"],
  ["الغاء_المهلة", "إزالة المهلة"],
  ["قفل", "قفل القناة"],
  ["فتح", "فتح القناة"],
  ["بطء", "تحديد وضع البطء"],
  ["اعلان", "إرسال إعلان"],
  ["انشاء_قناة", "إنشاء قناة"],
  ["حذف_قناة", "حذف القناة الحالية"],
  ["اضافة_رتبة", "إضافة رتبة لعضو"],
  ["حذف_رتبة", "حذف رتبة من عضو"],
  ["لقب", "تغيير لقب عضو"],
  ["رولات", "عرض رتب السيرفر"],
  ["اعضاء", "عدد أعضاء السيرفر"],
  ["اختيار", "اختيار عشوائي"],
  ["رقم", "اختيار رقم عشوائي"],
  ["عملة", "رمي عملة"],
  ["نرد", "رمي النرد"],
  ["نكتة", "نكتة عشوائية"],
  ["حقيقة", "حقيقة عشوائية"],
  ["تحدي", "تحدي عشوائي"],
  ["تخمين", "لعبة تخمين رقم"],
  ["تصويت", "إنشاء تصويت"],
  ["فائز", "اختيار فائز عشوائي"],
  ["زخرفة", "زخرفة اسم"],
  ["ثمانية", "اسأل الكرة السحرية"],
  ["تاريخ", "تاريخ اليوم"],
  ["حروف", "حروف عشوائية"],
  ["عكس", "عكس نص"],
  ["كرر", "تكرار نص"],
  ["رابط_صورة", "عرض رابط صورة عضو"],
  ["منشن", "عرض منشن عضو"],
  ["قوانين", "عرض القوانين"],
  ["دعوة", "رابط دعوة السيرفر"]
];

const adminCommands = new Set([
  "طرد", "حظر", "الغاء_حظر", "تحذير",
  "مسح_تحذيرات", "مسح", "مهلة", "الغاء_المهلة",
  "قفل", "فتح", "بطء", "اعلان", "انشاء_قناة",
  "حذف_قناة", "اضافة_رتبة", "حذف_رتبة", "لقب",
  "تكت", "اغلاق_التكت", "قوانين"
]);

const builders = {
  "طرد": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("سبب الطرد")),
  "حظر": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("سبب الحظر")),
  "الغاء_حظر": b => b
    .addStringOption(o => o.setName("الايدي").setDescription("ID العضو").setRequired(true)),
  "تحذير": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("السبب")),
  "تحذيرات": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true)),
  "مسح_تحذيرات": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true)),
  "مسح": b => b
    .addIntegerOption(o => o.setName("العدد").setDescription("من 1 إلى 100").setMinValue(1).setMaxValue(100).setRequired(true)),
  "مهلة": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addIntegerOption(o => o.setName("الدقائق").setDescription("مدة المهلة بالدقائق").setMinValue(1).setMaxValue(40320).setRequired(true)),
  "الغاء_المهلة": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true)),
  "بطء": b => b
    .addIntegerOption(o => o.setName("الثواني").setDescription("من 0 إلى 21600").setMinValue(0).setMaxValue(21600).setRequired(true)),
  "اعلان": b => b
    .addStringOption(o => o.setName("النص").setDescription("نص الإعلان").setRequired(true)),
  "انشاء_قناة": b => b
    .addStringOption(o => o.setName("الاسم").setDescription("اسم القناة").setRequired(true)),
  "اضافة_رتبة": b => b
    .addStringOption(o => o.setName("اسم_الرتبة").setDescription("اسم الرتبة").setRequired(true))
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true)),
  "حذف_رتبة": b => b
    .addStringOption(o => o.setName("اسم_الرتبة").setDescription("اسم الرتبة").setRequired(true))
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true)),
  "لقب": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("النص").setDescription("اللقب الجديد").setRequired(true)),
  "اختيار": b => b
    .addStringOption(o => o.setName("الخيارات").setDescription("افصل الخيارات بفاصلة").setRequired(true)),
  "رقم": b => b
    .addIntegerOption(o => o.setName("من").setDescription("الحد الأدنى").setRequired(true))
    .addIntegerOption(o => o.setName("الى").setDescription("الحد الأعلى").setRequired(true)),
  "تخمين": b => b
    .addIntegerOption(o => o.setName("الرقم").setDescription("خمّن رقمًا من 1 إلى 10").setMinValue(1).setMaxValue(10).setRequired(true)),
  "تصويت": b => b
    .addStringOption(o => o.setName("السؤال").setDescription("سؤال التصويت").setRequired(true)),
  "فائز": b => b
    .addStringOption(o => o.setName("المشاركون").setDescription("افصل الأسماء بفاصلة").setRequired(true)),
  "زخرفة": b => b
    .addStringOption(o => o.setName("الاسم").setDescription("الاسم المراد زخرفته").setRequired(true)),
  "ثمانية": b => b
    .addStringOption(o => o.setName("السؤال").setDescription("سؤالك").setRequired(true)),
  "حروف": b => b
    .addIntegerOption(o => o.setName("العدد").setDescription("عدد الحروف").setMinValue(1).setMaxValue(50).setRequired(true)),
  "عكس": b => b
    .addStringOption(o => o.setName("النص").setDescription("النص").setRequired(true)),
  "كرر": b => b
    .addStringOption(o => o.setName("النص").setDescription("النص").setRequired(true)),
  "منشن": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true)),
  "رابط_صورة": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو"))
};

const slashCommands = commands.map(([name, description]) => {
  const builder = new SlashCommandBuilder()
    .setName(name)
    .setDescription(description);

  if (builders[name]) builders[name](builder);
  return builder;
});

function embed(title, description, color = 0x5865F2) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

function staff(interaction) {
  return interaction.memberPermissions?.has(
    PermissionFlagsBits.Administrator
  ) || interaction.memberPermissions?.has(
    PermissionFlagsBits.ManageGuild
  );
}

const warnings = new Map();
const games = new Map();

const jokes = [
  "واحد راح للطبيب قاله: كل ما نشرب قهوة توجعني عيني، قاله نحي الملعقة من الكأس 😂",
  "واحد اشترى ساعة ذكية، ولات هي تقول له وقتاش يرقد 😂",
  "واحد بخيل طفى الضوء باش ما يشوفش فاتورة الكهرباء 😭"
];

const truths = [
  "ما هو أكثر شيء تحب تتعلمه؟",
  "ما هي لعبتك المفضلة؟",
  "ما هو هدفك لهذا العام؟"
];

const dares = [
  "اكتب جملة مضحكة في الدردشة 😂",
  "امدح عضوًا من السيرفر ⭐",
  "اكتب اسم لعبتك المفضلة 🎮"
];

const magicAnswers = [
  "نعم بالتأكيد ✅",
  "ممكن جدًا 🤔",
  "لا أظن ذلك ❌",
  "اسألني لاحقًا 🔮",
  "الاحتمال كبير 😎"
];

async function ticketPanel(interaction) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("xr_ticket_open")
      .setLabel("فتح تكت")
      .setEmoji("🎫")
      .setStyle(ButtonStyle.Primary)
  );

  await interaction.reply({
    embeds: [embed("🎫 نظام التكت", "اضغط على الزر لفتح تكت خاص مع الإدارة.")],
    components: [row]
  });
}

async function createTicket(interaction) {
  const guild = interaction.guild;
  const existing = guild.channels.cache.find(channel =>
    channel.name === `ticket-${interaction.user.id}` &&
    channel.type === ChannelType.GuildText
  );

  if (existing) {
    return interaction.reply({
      content: `لديك تكت مفتوح بالفعل: ${existing}`,
      ephemeral: true
    });
  }

  const options = {
    name: `ticket-${interaction.user.id}`,
    type: ChannelType.GuildText,
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
        id: bot.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels
        ]
      }
    ]
  };

  if (TICKET_CATEGORY_ID) options.parent = TICKET_CATEGORY_ID;

  const channel = await guild.channels.create(options);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("xr_ticket_close")
      .setLabel("إغلاق التكت")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `${interaction.user} أهلًا بك! اشرح مشكلتك هنا.`,
    components: [row]
  });

  await interaction.reply({
    content: `تم إنشاء التكت: ${channel}`,
    ephemeral: true
  });
}

bot.on("interactionCreate", async interaction => {
  try {
    if (interaction.isButton()) {
      if (interaction.customId === "xr_ticket_open") {
        return await createTicket(interaction);
      }

      if (interaction.customId === "xr_ticket_close") {
        if (!interaction.channel.name.startsWith("ticket-")) {
          return interaction.reply({
            content: "هذا ليس تكت.",
            ephemeral: true
          });
        }

        await interaction.reply("🔒 سيتم إغلاق التكت بعد 3 ثوانٍ.");
        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 3000);
        return;
      }

      if (interaction.customId.startsWith("vote_")) {
        return interaction.reply({
          content: "تم تسجيل تفاعلك مع التصويت.",
          ephemeral: true
        });
      }
    }

    if (!interaction.isChatInputCommand()) return;

    const { commandName: name, guild, member, user } = interaction;
    const target = interaction.options.getUser("العضو");
    const reason = interaction.options.getString("السبب") || "لم يذكر سبب";
    const targetMember = target
      ? await guild.members.fetch(target.id).catch(() => null)
      : null;

    if (adminCommands.has(name) && !staff(interaction)) {
      return interaction.reply({
        content: "❌ تحتاج صلاحيات الإدارة لاستخدام هذا الأمر.",
        ephemeral: true
      });
    }

    if (name === "مساعدة") {
      const list = commands.map(([n, d], i) => `\`${i + 1}.\` **/${n}** — ${d}`).join("\n");
      return interaction.reply({
        embeds: [embed("📚 أوامر VEX Guard — 50 أمرًا", list)]
      });
    }

    if (name === "تكت") return await ticketPanel(interaction);

    if (name === "اغلاق_التكت") {
      if (!interaction.channel.name.startsWith("ticket-")) {
        return interaction.reply({ content: "هذا ليس تكت.", ephemeral: true });
      }
      await interaction.reply("🔒 سيتم إغلاق التكت بعد 3 ثوانٍ.");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
      return;
    }

    if (name === "معلومات") {
      return interaction.reply({
        embeds: [embed("🤖 VEX Guard", `**السيرفر:** ${bot.guilds.cache.size}\n**الأوامر:** ${commands.length}\n**البنق:** ${bot.ws.ping}ms`)]
      });
    }

    if (name === "سيرفر") {
      return interaction.reply({
        embeds: [embed(`📌 ${guild.name}`, `**الأعضاء:** ${guild.memberCount}\n**القنوات:** ${guild.channels.cache.size}\n**أنشئ في:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>`)]
      });
    }

    if (name === "عضو") {
      const u = target || user;
      const m = await guild.members.fetch(u.id).catch(() => null);
      return interaction.reply({
        embeds: [embed("👤 معلومات العضو", `**الاسم:** ${u.tag}\n**ID:** ${u.id}\n**انضم:** ${m ? `<t:${Math.floor(m.joinedTimestamp / 1000)}:D>` : "غير معروف"}\n**الحساب:** <t:${Math.floor(u.createdTimestamp / 1000)}:D>`)]
      });
    }

    if (name === "صورة" || name === "رابط_صورة") {
      const u = target || user;
      return interaction.reply({
        embeds: [new EmbedBuilder().setTitle("🖼️ صورة العضو").setImage(u.displayAvatarURL({ size: 1024 })).setColor(0x5865F2)]
      });
    }

    if (name === "بنق") {
      return interaction.reply(`🏓 البنق: ${bot.ws.ping}ms`);
    }

    if (name === "وقت") {
      return interaction.reply(`🕒 <t:${Math.floor(Date.now() / 1000)}:F>`);
    }

    if (name === "رابط" || name === "دعوة") {
      return interaction.reply(`رابط السيرفر: https://discord.com/channels/${guild.id}`);
    }

    if (name === "طرد") {
      if (!targetMember) return interaction.reply({ content: "لم أجد العضو.", ephemeral: true });
      await targetMember.kick(reason);
      return interaction.reply(`✅ تم طرد ${target.tag}. السبب: ${reason}`);
    }

    if (name === "حظر") {
      if (!targetMember) return interaction.reply({ content: "لم أجد العضو.", ephemeral: true });
      await targetMember.ban({ reason });
      return interaction.reply(`🔨 تم حظر ${target.tag}. السبب: ${reason}`);
    }

    if (name === "الغاء_حظر") {
      const id = interaction.options.getString("الايدي");
      await guild.members.unban(id);
      return interaction.reply(`✅ تم إلغاء الحظر عن ID: ${id}`);
    }

    if (name === "تحذير") {
      if (!target) return interaction.reply({ content: "حدد العضو.", ephemeral: true });
      const arr = warnings.get(target.id) || [];
      arr.push({ reason, moderator: user.id, date: Date.now() });
      warnings.set(target.id, arr);
      return interaction.reply(`⚠️ تم تحذير ${target.tag}. عدد تحذيراته: ${arr.length}`);
    }

    if (name === "تحذيرات") {
      const arr = warnings.get(target.id) || [];
      return interaction.reply({
        embeds: [embed("⚠️ تحذيرات العضو", arr.length ? arr.map((w, i) => `${i + 1}. ${w.reason}`).join("\n") : "لا توجد تحذيرات مسجلة.")]
      });
    }

    if (name === "مسح_تحذيرات") {
      warnings.delete(target.id);
      return interaction.reply(`✅ تم مسح التحذيرات المسجلة لـ ${target.tag}.`);
    }

    if (name === "مسح") {
      const count = interaction.options.getInteger("العدد");
      const deleted = await interaction.channel.bulkDelete(count, true);
      return interaction.reply({ content: `🧹 تم حذف ${deleted.size} رسالة.`, ephemeral: true });
    }

    if (name === "مهلة") {
      const minutes = interaction.options.getInteger("الدقائق");
      await targetMember.timeout(minutes * 60 * 1000, "مهلة من VEX Guard");
      return interaction.reply(`⏳ تم إعطاء ${target.tag} مهلة ${minutes} دقيقة.`);
    }

    if (name === "الغاء_المهلة") {
      await targetMember.timeout(null);
      return interaction.reply(`✅ تم إلغاء المهلة عن ${target.tag}.`);
    }

    if (name === "قفل" || name === "فتح") {
      const deny = name === "قفل";
      await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: deny ? false : null
      });
      return interaction.reply(deny ? "🔒 تم قفل القناة." : "🔓 تم فتح القناة.");
    }

    if (name === "بطء") {
      const seconds = interaction.options.getInteger("الثواني");
      await interaction.channel.setRateLimitPerUser(seconds);
      return interaction.reply(`🐢 تم ضبط البطء على ${seconds} ثانية.`);
    }

    if (name === "اعلان") {
      const text = interaction.options.getString("النص");
      await interaction.channel.send({ embeds: [embed("📢 إعلان", text)] });
      return interaction.reply({ content: "✅ تم إرسال الإعلان.", ephemeral: true });
    }

    if (name === "انشاء_قناة") {
      const channelName = interaction.options.getString("الاسم");
      const channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText
      });
      return interaction.reply(`✅ تم إنشاء القناة ${channel}`);
    }

    if (name === "حذف_قناة") {
      const channelName = interaction.channel.name;
      await interaction.reply(`🗑️ سيتم حذف #${channelName}.`);
      return interaction.channel.delete();
    }

    if (name === "اضافة_رتبة" || name === "حذف_رتبة") {
      const roleName = interaction.options.getString("اسم_الرتبة");
      const roleMember = await guild.members.fetch(target.id);
      const role = guild.roles.cache.find(r => r.name === roleName);

      if (!role) return interaction.reply({ content: "لم أجد الرتبة بهذا الاسم.", ephemeral: true });

      if (name === "اضافة_رتبة") {
        await roleMember.roles.add(role);
        return interaction.reply(`✅ أضفت رتبة **${role.name}** إلى ${target.tag}.`);
      }

      await roleMember.roles.remove(role);
      return interaction.reply(`✅ حذفت رتبة **${role.name}** من ${target.tag}.`);
    }

    if (name === "لقب") {
      const text = interaction.options.getString("النص");
      await targetMember.setNickname(text);
      return interaction.reply(`✅ تم تغيير لقب ${target.tag}.`);
    }

    if (name === "رولات") {
      const roles = guild.roles.cache.filter(r => r.id !== guild.id).map(r => r.name);
      return interaction.reply({ embeds: [embed("🎭 رتب السيرفر", roles.slice(0, 80).join("، ") || "لا توجد رتب.")] });
    }

    if (name === "اعضاء") {
      return interaction.reply(`👥 عدد أعضاء السيرفر: **${guild.memberCount}**`);
    }

    if (name === "اختيار") {
      const values = interaction.options.getString("الخيارات").split(",").map(x => x.trim()).filter(Boolean);
      if (!values.length) return interaction.reply("اكتب خيارات مفصولة بفواصل.");
      return interaction.reply(`🎯 الاختيار هو: **${values[Math.floor(Math.random() * values.length)]}**`);
    }

    if (name === "رقم") {
      const min = interaction.options.getInteger("من");
      const max = interaction.options.getInteger("الى");
      if (max < min) return interaction.reply({ content: "الحد الأعلى يجب أن يكون أكبر من الحد الأدنى.", ephemeral: true });
      return interaction.reply(`🎲 الرقم العشوائي: **${Math.floor(Math.random() * (max - min + 1)) + min}**`);
    }

    if (name === "عملة") {
      return interaction.reply(Math.random() < 0.5 ? "🪙 صورة!" : "🪙 كتابة!");
    }

    if (name === "نرد") {
      return interaction.reply(`🎲 نتيجتك: **${Math.floor(Math.random() * 6) + 1}**`);
    }

    if (name === "نكتة") {
      return interaction.reply(jokes[Math.floor(Math.random() * jokes.length)]);
    }

    if (name === "حقيقة") {
      return interaction.reply(truths[Math.floor(Math.random() * truths.length)]);
    }

    if (name === "تحدي") {
      return interaction.reply(dares[Math.floor(Math.random() * dares.length)]);
    }

    if (name === "تخمين") {
      const guess = interaction.options.getInteger("الرقم");
      const answer = Math.floor(Math.random() * 10) + 1;
      return interaction.reply(guess === answer
        ? `🎉 صحيح! الرقم هو ${answer}.`
        : `😄 خطأ! الرقم كان ${answer}.`);
    }

    if (name === "تصويت") {
      const question = interaction.options.getString("السؤال");
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("vote_yes").setLabel("نعم").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("vote_no").setLabel("لا").setStyle(ButtonStyle.Danger)
      );
      await interaction.channel.send({ embeds: [embed("📊 تصويت", question)], components: [row] });
      return interaction.reply({ content: "✅ تم إنشاء التصويت.", ephemeral: true });
    }

    if (name === "فائز") {
      const people = interaction.options.getString("المشاركون").split(",").map(x => x.trim()).filter(Boolean);
      if (!people.length) return interaction.reply("أدخل أسماء المشاركين مفصولة بفواصل.");
      return interaction.reply(`🏆 الفائز هو: **${people[Math.floor(Math.random() * people.length)]}**`);
    }

    if (name === "زخرفة") {
      const text = interaction.options.getString("الاسم");
      return interaction.reply(`『 ${text} 』\n꧁༺ ${text} ༻꧂\n★彡 ${text} 彡★`);
    }

    if (name === "ثمانية") {
      return interaction.reply(`🔮 ${magicAnswers[Math.floor(Math.random() * magicAnswers.length)]}`);
    }

    if (name === "تاريخ") {
      return interaction.reply(`📅 ${new Date().toLocaleDateString("ar-DZ")}`);
    }

    if (name === "حروف") {
      const count = interaction.options.getInteger("العدد");
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let result = "";
      for (let i = 0; i < count; i++) result += letters[Math.floor(Math.random() * letters.length)];
      return interaction.reply(`🔤 ${result}`);
    }

    if (name === "عكس") {
      return interaction.reply(interaction.options.getString("النص").split("").reverse().join(""));
    }

    if (name === "كرر") {
      return interaction.reply(interaction.options.getString("النص").slice(0, 1800));
    }

    if (name === "منشن") {
      return interaction.reply(`${target}`);
    }

    if (name === "قوانين") {
      return interaction.reply({
        embeds: [embed("📜 قوانين السيرفر", "1. الاحترام بين الأعضاء.\n2. ممنوع السب والإزعاج.\n3. ممنوع السبام.\n4. اتبع تعليمات الإدارة.\n5. استمتع بوقتك في XR.")]
      });
    }
  } catch (error) {
    console.error(error);
    const message = "❌ حدث خطأ. تحقق من صلاحيات البوت وإعدادات الأمر.";

    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
    }
  }
});

bot.once("ready", () => {
  console.log(`✅ VEX Guard يعمل باسم ${bot.user.tag}`);
});

async function start() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  const route = Routes.applicationCommands(CLIENT_ID);

  // ترتيب الخيارات المطلوبة قبل الاختيارية لتجنب خطأ Discord 50035
  const body = slashCommands.map(command => {
    const data = command.toJSON();
    if (data.options) {
      data.options.sort((a, b) =>
        Number(Boolean(b.required)) - Number(Boolean(a.required))
      );
    }
    return data;
  });

  await rest.put(route, { body });
  console.log(`✅ تم تسجيل ${body.length} أمرًا.`);
  await bot.login(TOKEN);
}

start().catch(error => {
  console.error("❌ فشل تشغيل VEX Guard:", error);
  process.exit(1);
});
