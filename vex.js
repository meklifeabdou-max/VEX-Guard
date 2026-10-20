
const {
  Client, GatewayIntentBits, REST, Routes,
  SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits,
  ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || "";

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ ناقص DISCORD_TOKEN أو CLIENT_ID في GitHub Secrets.");
  process.exit(1);
}

const bot = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const definitions = [
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
  ["رابط_صورة", "عرض صورة عضو"],
  ["منشن", "منشن عضو"],
  ["قوانين", "عرض القوانين"],
  ["دعوة", "إنشاء رابط دعوة للسيرفر"]
];

const adminCommands = new Set([
  "تكت", "اغلاق_التكت", "طرد", "حظر", "الغاء_حظر",
  "تحذير", "مسح_تحذيرات", "مسح", "مهلة", "الغاء_المهلة",
  "قفل", "فتح", "بطء", "اعلان", "انشاء_قناة",
  "حذف_قناة", "اضافة_رتبة", "حذف_رتبة", "لقب"
]);

const builders = {
  "عضو": b => b.addUserOption(o =>
    o.setName("العضو").setDescription("العضو").setRequired(false)),
  "صورة": b => b.addUserOption(o =>
    o.setName("العضو").setDescription("العضو").setRequired(false)),
  "رابط_صورة": b => b.addUserOption(o =>
    o.setName("العضو").setDescription("العضو").setRequired(false)),
  "طرد": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("سبب الطرد")),
  "حظر": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("سبب الحظر")),
  "الغاء_حظر": b => b.addStringOption(o =>
    o.setName("الايدي").setDescription("ID العضو").setRequired(true)),
  "تحذير": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("سبب التحذير")),
  "تحذيرات": b => b.addUserOption(o =>
    o.setName("العضو").setDescription("العضو").setRequired(true)),
  "مسح_تحذيرات": b => b.addUserOption(o =>
    o.setName("العضو").setDescription("العضو").setRequired(true)),
  "مسح": b => b.addIntegerOption(o =>
    o.setName("العدد").setDescription("عدد الرسائل")
      .setMinValue(1).setMaxValue(100).setRequired(true)),
  "مهلة": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addIntegerOption(o => o.setName("الدقائق").setDescription("مدة المهلة")
      .setMinValue(1).setMaxValue(40320).setRequired(true)),
  "الغاء_المهلة": b => b.addUserOption(o =>
    o.setName("العضو").setDescription("العضو").setRequired(true)),
  "بطء": b => b.addIntegerOption(o =>
    o.setName("الثواني").setDescription("0 إلى 21600")
      .setMinValue(0).setMaxValue(21600).setRequired(true)),
  "اعلان": b => b.addStringOption(o =>
    o.setName("النص").setDescription("نص الإعلان").setRequired(true)),
  "انشاء_قناة": b => b.addStringOption(o =>
    o.setName("الاسم").setDescription("اسم القناة").setRequired(true)),
  "اضافة_رتبة": b => b
    .addStringOption(o => o.setName("اسم_الرتبة").setDescription("اسم الرتبة").setRequired(true))
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true)),
  "حذف_رتبة": b => b
    .addStringOption(o => o.setName("اسم_الرتبة").setDescription("اسم الرتبة").setRequired(true))
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true)),
  "لقب": b => b
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("النص").setDescription("اللقب الجديد").setRequired(true)),
  "اختيار": b => b.addStringOption(o =>
    o.setName("الخيارات").setDescription("افصل الخيارات بفواصل").setRequired(true)),
  "رقم": b => b
    .addIntegerOption(o => o.setName("من").setDescription("الحد الأدنى").setRequired(true))
    .addIntegerOption(o => o.setName("الى").setDescription("الحد الأعلى").setRequired(true)),
  "تخمين": b => b.addIntegerOption(o =>
    o.setName("الرقم").setDescription("رقم من 1 إلى 10")
      .setMinValue(1).setMaxValue(10).setRequired(true)),
  "تصويت": b => b.addStringOption(o =>
    o.setName("السؤال").setDescription("سؤال التصويت").setRequired(true)),
  "فائز": b => b.addStringOption(o =>
    o.setName("المشاركون").setDescription("أسماء مفصولة بفواصل").setRequired(true)),
  "زخرفة": b => b.addStringOption(o =>
    o.setName("الاسم").setDescription("الاسم").setRequired(true)),
  "ثمانية": b => b.addStringOption(o =>
    o.setName("السؤال").setDescription("سؤالك").setRequired(true)),
  "حروف": b => b.addIntegerOption(o =>
    o.setName("العدد").setDescription("عدد الحروف")
      .setMinValue(1).setMaxValue(50).setRequired(true)),
  "عكس": b => b.addStringOption(o =>
    o.setName("النص").setDescription("النص").setRequired(true)),
  "كرر": b => b.addStringOption(o =>
    o.setName("النص").setDescription("النص").setRequired(true)),
  "منشن": b => b.addUserOption(o =>
    o.setName("العضو").setDescription("العضو").setRequired(true))
};

const slashCommands = definitions.map(([name, description]) => {
  const b = new SlashCommandBuilder().setName(name).setDescription(description);
  if (builders[name]) builders[name](b);
  return b;
});

function makeEmbed(title, description, color = 0x5865F2) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

function isStaff(i) {
  return i.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
    i.memberPermissions?.has(PermissionFlagsBits.ManageGuild);
}

const warnings = new Map();

const randomItem = array => array[Math.floor(Math.random() * array.length)];
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
  "نعم بالتأكيد ✅", "ممكن جدًا 🤔", "لا أظن ذلك ❌",
  "اسألني لاحقًا 🔮", "الاحتمال كبير 😎"
];

async function sendTicketPanel(i) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("xr_ticket_open")
      .setLabel("فتح تكت")
      .setEmoji("🎫")
      .setStyle(ButtonStyle.Primary)
  );
  await i.reply({
    embeds: [makeEmbed("🎫 نظام التكت", "اضغط على الزر لفتح تكت خاص مع الإدارة.")],
    components: [row]
  });
}

async function createTicket(i) {
  const guild = i.guild;
  const existing = guild.channels.cache.find(c =>
    c.type === ChannelType.GuildText &&
    c.name === `ticket-${i.user.id}`
  );

  if (existing) {
    return i.reply({ content: `لديك تكت مفتوح بالفعل: ${existing}`, ephemeral: true });
  }

  const options = {
    name: `ticket-${i.user.id}`,
    type: ChannelType.GuildText,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: i.user.id,
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
          PermissionFlagsBits.ReadMessageHistory,
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
    content: `${i.user} أهلًا بك! اشرح مشكلتك هنا.`,
    components: [row]
  });
  await i.reply({ content: `✅ تم إنشاء التكت: ${channel}`, ephemeral: true });
}

bot.on("interactionCreate", async i => {
  try {
    if (i.isButton()) {
      if (i.customId === "xr_ticket_open") {
        return await createTicket(i);
      }

      if (i.customId === "xr_ticket_close") {
        if (!i.channel?.name.startsWith("ticket-")) {
          return i.reply({ content: "هذا ليس تكت.", ephemeral: true });
        }
        if (!isStaff(i) && i.channel.name !== `ticket-${i.user.id}`) {
          return i.reply({ content: "ليس لديك صلاحية إغلاق هذا التكت.", ephemeral: true });
        }
        await i.reply("🔒 سيتم إغلاق التكت بعد 3 ثوانٍ.");
        setTimeout(() => i.channel.delete().catch(console.error), 3000);
        return;
      }

      if (i.customId === "vote_yes" || i.customId === "vote_no") {
        return i.reply({
          content: i.customId === "vote_yes" ? "✅ اخترت نعم." : "❌ اخترت لا.",
          ephemeral: true
        });
      }
    }

    if (!i.isChatInputCommand()) return;

    const name = i.commandName;
    const guild = i.guild;
    const user = i.user;
    const target = i.options.getUser("العضو");
    const reason = i.options.getString("السبب") || "لم يذكر سبب";
    const targetMember = target
      ? await guild.members.fetch(target.id).catch(() => null)
      : null;

    if (adminCommands.has(name) && !isStaff(i)) {
      return i.reply({ content: "❌ تحتاج صلاحيات الإدارة لاستخدام هذا الأمر.", ephemeral: true });
    }

    if (name === "مساعدة") {
      const list = definitions.map(([n, d], index) => `${index + 1}. **/${n}** — ${d}`).join("\n");
      return i.reply({ embeds: [makeEmbed("📚 VEX Guard — 50 أمرًا", list)] });
    }

    if (name === "تكت") return await sendTicketPanel(i);

    if (name === "اغلاق_التكت") {
      if (!i.channel.name.startsWith("ticket-")) {
        return i.reply({ content: "هذا ليس تكت.", ephemeral: true });
      }
      await i.reply("🔒 سيتم إغلاق التكت بعد 3 ثوانٍ.");
      setTimeout(() => i.channel.delete().catch(console.error), 3000);
      return;
    }

    if (name === "معلومات") {
      return i.reply({
        embeds: [makeEmbed("🤖 VEX Guard",
          `**السيرفرات:** ${bot.guilds.cache.size}\n**الأوامر:** ${definitions.length}\n**البنق:** ${bot.ws.ping}ms`)]
      });
    }

    if (name === "سيرفر") {
      return i.reply({
        embeds: [makeEmbed(`📌 ${guild.name}`,
          `**الأعضاء:** ${guild.memberCount}\n**القنوات:** ${guild.channels.cache.size}\n**تاريخ الإنشاء:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>`)]
      });
    }

    if (name === "عضو") {
      const u = target || user;
      const m = await guild.members.fetch(u.id).catch(() => null);
      return i.reply({
        embeds: [makeEmbed("👤 معلومات العضو",
          `**الاسم:** ${u.tag}\n**ID:** ${u.id}\n**انضم:** ${m?.joinedTimestamp ? `<t:${Math.floor(m.joinedTimestamp / 1000)}:D>` : "غير معروف"}\n**تاريخ الحساب:** <t:${Math.floor(u.createdTimestamp / 1000)}:D>`)]
      });
    }

    if (name === "صورة" || name === "رابط_صورة") {
      const u = target || user;
      return i.reply({
        embeds: [new EmbedBuilder().setTitle("🖼️ صورة العضو")
          .setImage(u.displayAvatarURL({ size: 1024 })).setColor(0x5865F2)]
      });
    }

    if (name === "بنق") return i.reply(`🏓 البنق: ${bot.ws.ping}ms`);
    if (name === "وقت") return i.reply(`🕒 <t:${Math.floor(Date.now() / 1000)}:F>`);

    if (name === "رابط") {
      return i.reply(`رابط إضافة البوت: https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&scope=bot%20applications.commands&permissions=8`);
    }

    if (name === "دعوة") {
      const channel = guild.channels.cache.find(c =>
        c.type === ChannelType.GuildText &&
        c.permissionsFor(guild.members.me).has(PermissionFlagsBits.CreateInstantInvite)
      );
      if (!channel) return i.reply({ content: "لا أملك صلاحية إنشاء دعوة.", ephemeral: true });
      const invite = await channel.createInvite({ maxAge: 86400, maxUses: 0 });
      return i.reply(`🔗 رابط الدعوة: ${invite.url}`);
    }

    if (name === "طرد") {
      if (!targetMember) return i.reply({ content: "لم أجد العضو.", ephemeral: true });
      await targetMember.kick(reason);
      return i.reply(`✅ تم طرد ${target.tag}. السبب: ${reason}`);
    }

    if (name === "حظر") {
      if (!targetMember) return i.reply({ content: "لم أجد العضو.", ephemeral: true });
      await targetMember.ban({ reason });
      return i.reply(`🔨 تم حظر ${target.tag}. السبب: ${reason}`);
    }

    if (name === "الغاء_حظر") {
      const id = i.options.getString("الايدي");
      await guild.members.unban(id);
      return i.reply(`✅ تم إلغاء الحظر عن ID: ${id}`);
    }

    if (name === "تحذير") {
      const list = warnings.get(target.id) || [];
      list.push({ reason, moderator: user.id, date: Date.now() });
      warnings.set(target.id, list);
      return i.reply(`⚠️ تم تحذير ${target.tag}. عدد التحذيرات: ${list.length}`);
    }

    if (name === "تحذيرات") {
      const list = warnings.get(target.id) || [];
      return i.reply({
        embeds: [makeEmbed("⚠️ تحذيرات العضو",
          list.length ? list.map((w, n) => `${n + 1}. ${w.reason}`).join("\n") : "لا توجد تحذيرات مسجلة.")]
      });
    }

    if (name === "مسح_تحذيرات") {
      warnings.delete(target.id);
      return i.reply(`✅ تم مسح التحذيرات المسجلة لـ ${target.tag}.`);
    }

    if (name === "مسح") {
      const count = i.options.getInteger("العدد");
      const deleted = await i.channel.bulkDelete(count, true);
      return i.reply({ content: `🧹 تم حذف ${deleted.size} رسالة.`, ephemeral: true });
    }

    if (name === "مهلة") {
      const minutes = i.options.getInteger("الدقائق");
      await targetMember.timeout(minutes * 60000, "مهلة من VEX Guard");
      return i.reply(`⏳ تم إعطاء ${target.tag} مهلة ${minutes} دقيقة.`);
    }

    if (name === "الغاء_المهلة") {
      await targetMember.timeout(null);
      return i.reply(`✅ تم إلغاء المهلة عن ${target.tag}.`);
    }

    if (name === "قفل" || name === "فتح") {
      const locked = name === "قفل";
      await i.channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: locked ? false : null
      });
      return i.reply(locked ? "🔒 تم قفل القناة." : "🔓 تم فتح القناة.");
    }

    if (name === "بطء") {
      const seconds = i.options.getInteger("الثواني");
      await i.channel.setRateLimitPerUser(seconds);
      return i.reply(`🐢 تم ضبط البطء على ${seconds} ثانية.`);
    }

    if (name === "اعلان") {
      await i.channel.send({ embeds: [makeEmbed("📢 إعلان", i.options.getString("النص"))] });
      return i.reply({ content: "✅ تم إرسال الإعلان.", ephemeral: true });
    }

    if (name === "انشاء_قناة") {
      const channel = await guild.channels.create({
        name: i.options.getString("الاسم"),
        type: ChannelType.GuildText
      });
      return i.reply(`✅ تم إنشاء القناة ${channel}`);
    }

    if (name === "حذف_قناة") {
      await i.reply("🗑️ سيتم حذف القناة الحالية.");
      return i.channel.delete();
    }

    if (name === "اضافة_رتبة" || name === "حذف_رتبة") {
      const roleName = i.options.getString("اسم_الرتبة");
      const role = guild.roles.cache.find(r => r.name === roleName);
      if (!role) return i.reply({ content: "لم أجد الرتبة بهذا الاسم.", ephemeral: true });

      if (name === "اضافة_رتبة") {
        await targetMember.roles.add(role);
        return i.reply(`✅ أضفت رتبة **${role.name}** إلى ${target.tag}.`);
      }

      await targetMember.roles.remove(role);
      return i.reply(`✅ حذفت رتبة **${role.name}** من ${target.tag}.`);
    }

    if (name === "لقب") {
      await targetMember.setNickname(i.options.getString("النص"));
      return i.reply(`✅ تم تغيير لقب ${target.tag}.`);
    }

    if (name === "رولات") {
      const roles = guild.roles.cache.filter(r => r.id !== guild.id).map(r => r.name);
      return i.reply({ embeds: [makeEmbed("🎭 رتب السيرفر", roles.slice(0, 80).join("، ") || "لا توجد رتب.")] });
    }

    if (name === "اعضاء") return i.reply(`👥 عدد أعضاء السيرفر: **${guild.memberCount}**`);

    if (name === "اختيار") {
      const values = i.options.getString("الخيارات").split(",").map(x => x.trim()).filter(Boolean);
      if (!values.length) return i.reply("اكتب خيارات مفصولة بفواصل.");
      return i.reply(`🎯 الاختيار هو: **${randomItem(values)}**`);
    }

    if (name === "رقم") {
      const min = i.options.getInteger("من");
      const max = i.options.getInteger("الى");
      if (max < min) return i.reply({ content: "الحد الأعلى يجب أن يكون أكبر من الحد الأدنى.", ephemeral: true });
      return i.reply(`🎲 الرقم العشوائي: **${Math.floor(Math.random() * (max - min + 1)) + min}**`);
    }

    if (name === "عملة") return i.reply(Math.random() < 0.5 ? "🪙 صورة!" : "🪙 كتابة!");
    if (name === "نرد") return i.reply(`🎲 نتيجتك: **${Math.floor(Math.random() * 6) + 1}**`);
    if (name === "نكتة") return i.reply(randomItem(jokes));
    if (name === "حقيقة") return i.reply(randomItem(truths));
    if (name === "تحدي") return i.reply(randomItem(dares));

    if (name === "تخمين") {
      const guess = i.options.getInteger("الرقم");
      const answer = Math.floor(Math.random() * 10) + 1;
      return i.reply(guess === answer
        ? `🎉 صحيح! الرقم هو ${answer}.`
        : `😄 خطأ! الرقم كان ${answer}.`);
    }

    if (name === "تصويت") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("vote_yes").setLabel("نعم").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("vote_no").setLabel("لا").setStyle(ButtonStyle.Danger)
      );
      await i.channel.send({
        embeds: [makeEmbed("📊 تصويت", i.options.getString("السؤال"))],
        components: [row]
      });
      return i.reply({ content: "✅ تم إنشاء التصويت.", ephemeral: true });
    }

    if (name === "فائز") {
      const people = i.options.getString("المشاركون").split(",").map(x => x.trim()).filter(Boolean);
      if (!people.length) return i.reply("أدخل أسماء المشاركين مفصولة بفواصل.");
      return i.reply(`🏆 الفائز هو: **${randomItem(people)}**`);
    }

    if (name === "زخرفة") {
      const text = i.options.getString("الاسم");
      return i.reply(`『 ${text} 』\n꧁༺ ${text} ༻꧂\n★彡 ${text} 彡★`);
    }

    if (name === "ثمانية") return i.reply(`🔮 ${randomItem(magicAnswers)}`);
    if (name === "تاريخ") return i.reply(`📅 ${new Date().toLocaleDateString("ar-DZ")}`);

    if (name === "حروف") {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let result = "";
      for (let n = 0; n < i.options.getInteger("العدد"); n++) {
        result += letters[Math.floor(Math.random() * letters.length)];
      }
      return i.reply(`🔤 ${result}`);
    }

    if (name === "عكس") {
      return i.reply(i.options.getString("النص").split("").reverse().join(""));
    }

    if (name === "كرر") {
      return i.reply(i.options.getString("النص").slice(0, 1800));
    }

    if (name === "منشن") return i.reply(`${target}`);

    if (name === "قوانين") {
      return i.reply({
        embeds: [makeEmbed("📜 قوانين السيرفر",
          "1. الاحترام بين الأعضاء.\n2. ممنوع السب والإزعاج.\n3. ممنوع السبام.\n4. اتبع تعليمات الإدارة.\n5. استمتع بوقتك في XR.")]
      });
    }
  } catch (error) {
    console.error(`❌ خطأ في الأمر ${i.commandName || i.customId}:`, error);
    const message = "❌ حدث خطأ أثناء تنفيذ الطلب. تحقق من صلاحيات البوت.";

    if (i.isRepliable() && !i.replied && !i.deferred) {
      await i.reply({ content: message, ephemeral: true }).catch(() => {});
    }
  }
});

bot.once("ready", () => {
  console.log(`✅ VEX Guard متصل باسم ${bot.user.tag}`);
  console.log(`📡 البنق: ${bot.ws.ping}ms`);
});

async function start() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  const route = Routes.applicationCommands(CLIENT_ID);

  console.log("1️⃣ بدأ تشغيل VEX Guard");
  console.log("2️⃣ تجهيز الأوامر...");

  if (slashCommands.length !== 50) {
    throw new Error(`عدد الأوامر غير صحيح: ${slashCommands.length}`);
  }

  const body = slashCommands.map(command => {
    const data = command.toJSON();

    if (data.options) {
      data.options.sort((a, b) =>
        Number(Boolean(b.required)) - Number(Boolean(a.required))
      );
    }

    return data;
  });

  console.log(`3️⃣ جاري تسجيل ${body.length} أمرًا في Discord...`);
  await rest.put(route, { body });

  console.log("4️⃣ تم تسجيل الأوامر بنجاح.");
  console.log("5️⃣ جاري تسجيل دخول البوت...");

  await bot.login(TOKEN);
  console.log("6️⃣ تم قبول تسجيل الدخول. البوت سيبقى يعمل ما دام متصلًا.");
}

start().catch(error => {
  console.error("❌ فشل تشغيل VEX Guard:");
  console.error(error);
  process.exit(1);
});
