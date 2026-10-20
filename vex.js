const {
  Client, GatewayIntentBits, REST, Routes,
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
  ButtonBuilder, ButtonStyle, PermissionFlagsBits
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ تأكد من DISCORD_TOKEN و CLIENT_ID في GitHub Secrets");
  process.exit(1);
}

const bot = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const commands = [
  ["كت","سؤال عشوائي"], ["روليت","روليت جماعية بين الأعضاء"],
  ["صراحة","سؤال صراحة"], ["تحدي","تحدٍ عشوائي"],
  ["حظ","جرّب حظك"], ["نرد","ارم النرد"],
  ["عملة","اقلب العملة"], ["لغز","احصل على لغز"],
  ["نكتة","نكتة عشوائية"], ["حقيقة","حقيقة ممتعة"],
  ["اختيار","اختيار عشوائي"], ["فريق","تحدي الفرق"],
  ["تصويت","أنشئ تصويتًا"], ["رقم","رقم عشوائي"],
  ["إيموجي","إيموجي عشوائي"], ["لون","لون عشوائي"],
  ["اسم","اسم عشوائي"], ["حروف","حرف عشوائي"],
  ["سؤال","سؤال جديد"], ["مساعدة","قائمة الأوامر"],
  ["بنق","سرعة استجابة البوت"], ["بوت","معلومات البوت"],
  ["خادم","معلومات السيرفر"], ["عضو","معلومات عن عضو"],
  ["أفاتار","صورتك الشخصية"], ["أيقونة","أيقونة السيرفر"],
  ["الأعضاء","عدد أعضاء السيرفر"], ["الرتب","قائمة الرتب"],
  ["القنوات","عدد القنوات"], ["الوقت","الوقت الحالي"],
  ["تاريخ","تاريخ اليوم"], ["نصيحة","نصيحة عشوائية"],
  ["اقتباس","اقتباس تحفيزي"], ["شكر","رسالة شكر"],
  ["ترحيب","رسالة ترحيب"], ["وداع","رسالة وداع"],
  ["تخمين","لعبة تخمين الرقم"], ["حجر_ورقة","حجر ورقة مقص"],
  ["ذاكرة","تحدي الذاكرة"], ["سرعة","تحدي السرعة"],
  ["حساب","معلومات حسابك"], ["انضمام","تاريخ انضمامك"],
  ["المالك","مالك السيرفر"], ["المشرفون","تذكير بالإدارة"],
  ["القواعد","تذكير بقوانين السيرفر"], ["اقتراح","أرسل اقتراحًا"],
  ["بلاغ","إرسال بلاغ"], ["إعلان","إعلان للسيرفر"],
  ["قفل","قفل القناة"], ["فتح","فتح القناة"],
  ["مسح","حذف الرسائل"], ["بطء","تغيير وضع البطء"],
  ["طرد","طرد عضو"], ["حظر","حظر عضو"],
  ["إلغاء_حظر","إلغاء حظر عضو"], ["تحذير","تحذير عضو"],
  ["مهلة","إسكات عضو مؤقتًا"], ["إنهاء_المهلة","إلغاء مهلة عضو"],
  ["لقب","تغيير لقب عضو"], ["أضف_رتبة","إضافة رتبة"],
  ["احذف_رتبة","حذف رتبة من عضو"], ["إنشاء_قناة","إنشاء قناة"],
  ["حذف_قناة","حذف القناة الحالية"], ["موضوع","تغيير موضوع القناة"],
  ["دعوة","إنشاء رابط دعوة"], ["إحصائيات","إحصائيات السيرفر"],
  ["عمر_الحساب","معلومات عمر حسابك"], ["عمر_السيرفر","عمر السيرفر"],
  ["قائمة_الألعاب","قائمة الألعاب"], ["روليت_مساعدة","شرح الروليت"],
  ["تحدي_جماعي","تحدٍ جماعي"], ["سؤال_إضافي","سؤال إضافي"],
  ["فزورة","فزورة جديدة"], ["حساب_جمع","جمع عددين"],
  ["نسبة","حساب نسبة مئوية"], ["ترتيب","ترتيب عشوائي"],
  ["فريق_أحمر","اختر الفريق الأحمر"], ["فريق_أزرق","اختر الفريق الأزرق"],
  ["نعم_أو_لا","إجابة نعم أو لا"], ["توقع","توقع عشوائي"],
  ["حالة","حالة البوت"], ["معلوماتي","معلومات حسابك"],
  ["رتبتي","أعلى رتبة لديك"], ["عدد_الرتب","عدد الرتب"],
  ["عدد_القنوات","عدد القنوات"], ["عدد_التعزيزات","عدد التعزيزات"],
  ["رسالة","رسالة عشوائية"], ["حكمة","حكمة اليوم"],
  ["حيوان","حيوان عشوائي"], ["رياضة","تحدي رياضي"],
  ["كرة","سؤال كرة قدم"], ["ألعاب","اقتراح لعبة"],
  ["تحدي_الأصدقاء","تحدٍ للأصدقاء"], ["اختبار","اختبار عشوائي"],
  ["فائز","اختيار فائز عشوائي"], ["شعار","شعار VEX Guard"],
  ["مساعدة_الإدارة","معلومات أوامر الإدارة"], ["مساعدة_الألعاب","معلومات الألعاب"]
];

const slash = commands.map(([name, description]) =>
  new SlashCommandBuilder()
    .setName(name)
    .setDescription(description)
);

for (const name of ["طرد", "حظر", "تحذير", "مهلة", "إنهاء_المهلة", "لقب"]) {
  slash.find(c => c.name === name)
    .addUserOption(o => o.setName("العضو").setDescription("اختر العضو").setRequired(true));
}

for (const name of ["تحذير", "مهلة", "لقب"]) {
  slash.find(c => c.name === name)
    .addStringOption(o => o.setName("السبب").setDescription("السبب أو اللقب").setRequired(false));
}

slash.find(c => c.name === "مسح")
  .addIntegerOption(o => o.setName("العدد").setDescription("عدد الرسائل").setMinValue(1).setMaxValue(100).setRequired(true));

const questions = [
  "ما أكثر شيء يضحكك؟", "ما لعبتك المفضلة؟", "من أكثر عضو تتفاعل معه؟",
  "ما البلد الذي تريد زيارته؟", "ما أجمل ذكرى عندك؟",
  "لو امتلكت قوة خارقة، ماذا تختار؟", "ما هدفك هذه السنة؟",
  "ما أفضل فيلم شاهدته؟", "ما أكثر شيء تحبه في السيرفر؟",
  "ما المهارة التي تريد تعلمها؟", "ما أكثر موقف مضحك حدث لك؟"
];

const dares = [
  "امدح عضوًا في السيرفر 😎", "اكتب نكتة قصيرة 😂",
  "صف مزاجك بثلاثة إيموجيات!", "اكتب اسم لعبتك بطريقة مزخرفة.",
  "قل شيئًا إيجابيًا عن السيرفر.", "تحدّ أحد الأعضاء في لعبة!"
];

const roulette = new Map();
const pick = a => a[Math.floor(Math.random() * a.length)];
const embed = (title, description) =>
  new EmbedBuilder().setColor(0x5865F2).setTitle(title)
    .setDescription(description).setFooter({ text: "VEX Guard" });

bot.once("ready", () => {
  console.log(`🛡️ VEX Guard متصل: ${bot.user.tag}`);
});

bot.on("interactionCreate", async i => {
  try {
    if (i.isButton()) {
      const session = roulette.get(i.guildId);
      if (!session) {
        return i.reply({ content: "انتهت هذه الجولة.", ephemeral: true });
      }

      if (i.customId === "rjoin") {
        if (session.started) {
          return i.reply({ content: "السحب بدأ بالفعل!", ephemeral: true });
        }
        session.players.add(i.user.id);
        return i.reply({
          content: `🎟️ انضممت! عدد المشاركين: ${session.players.size}`,
          ephemeral: true
        });
      }

      if (i.customId === "rdraw") {
        if (i.user.id !== session.owner) {
          return i.reply({
            content: "فقط صاحب الجولة يستطيع بدء السحب.",
            ephemeral: true
          });
        }
        if (session.players.size < 2) {
          return i.reply({
            content: "يجب انضمام عضوين على الأقل!",
            ephemeral: true
          });
        }

        session.started = true;
        const winner = pick([...session.players]);
        roulette.delete(i.guildId);

        return i.update({
          embeds: [embed("🎡 انتهت الروليت!", `🏆 الفائز هو <@${winner}>!\n👥 عدد المشاركين: ${session.players.size}`)],
          components: []
        });
      }
      return;
    }

    if (!i.isChatInputCommand()) return;

    const n = i.commandName;
    const member = i.member;
    const guild = i.guild;
    const target = i.options.getUser("العضو");
    const reason = i.options.getString("السبب") || "لم يحدد السبب";

    const modCommands = [
      "طرد", "حظر", "تحذير", "مهلة", "إنهاء_المهلة",
      "لقب", "مسح", "قفل", "فتح"
    ];

    if (modCommands.includes(n) &&
        !member.permissions.has(PermissionFlagsBits.ManageGuild) &&
        !member.permissions.has(PermissionFlagsBits.Administrator)) {
      return i.reply({ content: "⛔ هذا الأمر للمشرفين فقط.", ephemeral: true });
    }

    if (n === "روليت") {
      if (roulette.has(guild.id)) {
        return i.reply({ content: "هناك جولة روليت مفتوحة بالفعل!", ephemeral: true });
      }

      roulette.set(guild.id, {
        owner: i.user.id,
        players: new Set([i.user.id]),
        started: false
      });

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("rjoin").setLabel("🎟️ انضمام").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("rdraw").setLabel("🎡 ابدأ السحب").setStyle(ButtonStyle.Primary)
      );

      return i.reply({
        embeds: [embed("🎡 روليت VEX الجماعية",
          `بدأت الجولة بواسطة ${i.user}!\nاضغط انضمام للمشاركة، ثم يبدأ صاحب الجولة السحب.\n👥 المشاركون: 1`)],
        components: [row]
      });
    }

    if (n === "كت" || n === "سؤال" || n === "سؤال_إضافي") {
      return i.reply({ embeds: [embed("🎲 سؤال عشوائي", pick(questions))] });
    }

    if (n === "صراحة") return i.reply(pick(questions));
    if (n === "تحدي" || n === "تحدي_جماعي" || n === "تحدي_الأصدقاء") {
      return i.reply(`🔥 التحدي: ${pick(dares)}`);
    }

    if (n === "روليت_مساعدة") {
      return i.reply("استخدم /روليت، ثم ينضم الأعضاء بالزر، وبعدها يبدأ صاحب الجولة السحب. يلزم عضوان على الأقل.");
    }

    if (n === "مساعدة" || n === "مساعدة_الألعاب" || n === "قائمة_الألعاب" || n === "مساعدة_الإدارة") {
      return i.reply({
        embeds: [embed("🛡️ أوامر VEX Guard", commands.map(c => `/${c[0]} — ${c[1]}`).slice(0, 25).join("\n"))],
        ephemeral: true
      });
    }

    if (n === "بنق") return i.reply(`🏓 سرعة البوت: ${bot.ws.ping}ms`);
    if (n === "بوت" || n === "حالة") {
      return i.reply(`🛡️ VEX Guard متصل!\nعدد السيرفرات: ${bot.guilds.cache.size}\nالبنق: ${bot.ws.ping}ms`);
    }
    if (n === "خادم" || n === "إحصائيات") {
      return i.reply(`🏰 **${guild.name}**\nالأعضاء: ${guild.memberCount}\nالقنوات: ${guild.channels.cache.size}\nالرتب: ${guild.roles.cache.size}`);
    }
    if (n === "عضو" || n === "معلوماتي" || n === "عمر_الحساب") {
      return i.reply(`👤 ${i.user}\nID: ${i.user.id}\nتاريخ إنشاء الحساب: <t:${Math.floor(i.user.createdTimestamp / 1000)}:D>`);
    }
    if (n === "أفاتار") {
      return i.reply({ embeds: [embed("🖼️ صورتك الشخصية", i.user.displayAvatarURL({ size: 1024 }))] });
    }
    if (n === "أيقونة") return i.reply(guild.iconURL({ size: 1024 }) || "لا توجد أيقونة.");
    if (n === "الأعضاء" || n === "عدد_القنوات" || n === "عدد_الرتب" || n === "القنوات" || n === "الرتب") {
      const value = n === "الأعضاء" ? guild.memberCount :
        (n === "القنوات" || n === "عدد_القنوات") ? guild.channels.cache.size : guild.roles.cache.size;
      return i.reply(`📊 العدد: ${value}`);
    }
    if (n === "الوقت" || n === "تاريخ") return i.reply(new Date().toLocaleString("ar-DZ", { timeZone: "Africa/Algiers" }));
    if (n === "المالك") return i.reply(`👑 مالك السيرفر: <@${guild.ownerId}>`);
    if (n === "رتبتي") return i.reply(`🎭 أعلى رتبة لديك: **${member.roles.highest.name}**`);
    if (n === "حظ") return i.reply(`🍀 حظك اليوم: ${Math.floor(Math.random() * 101)}%`);
    if (n === "نرد") return i.reply(`🎲 النتيجة: ${1 + Math.floor(Math.random() * 6)}`);
    if (n === "عملة") return i.reply(Math.random() < .5 ? "🪙 صورة!" : "🪙 كتابة!");
    if (n === "رقم") return i.reply(`🔢 رقمك: ${1 + Math.floor(Math.random() * 100)}`);
    if (n === "اختيار" || n === "توقع") return i.reply(pick(["نعم!", "لا!", "ربما!", "جرّب مرة أخرى!"]));
    if (n === "نكتة") return i.reply("😂 لماذا الكمبيوتر بردان؟ لأنه فاتح الويندوز!");
    if (n === "حقيقة") return i.reply("🧠 للأخطبوط ثلاثة قلوب.");
    if (n === "لغز" || n === "فزورة") return i.reply("🧩 ما الشيء الذي كلما أخذت منه كبر؟ ||الحفرة||");
    if (n === "نصيحة" || n === "حكمة") return i.reply("💡 استمر في المحاولة، وتعلّم من أخطائك.");
    if (n === "اقتباس") return i.reply("✨ النجاح يبدأ بخطوة صغيرة.");
    if (n === "إيموجي") return i.reply(pick(["😂", "🔥", "💎", "👑", "🎮", "⚽"]));
    if (n === "لون") return i.reply(pick(["🔴 أحمر", "🔵 أزرق", "🟢 أخضر", "🟣 بنفسجي"]));
    if (n === "اسم") return i.reply(pick(["Vortex", "Nova", "Shadow", "Titan", "Blaze"]));
    if (n === "شعار") return i.reply("🛡️ **VEX Guard** — الحماية والتفاعل!");

    if (n === "طرد" && target) {
      const m = await guild.members.fetch(target.id);
      if (!m.kickable) return i.reply({ content: "لا أستطيع طرد هذا العضو؛ تحقق من ترتيب الرتب.", ephemeral: true });
      await m.kick(reason);
      return i.reply(`👢 تم طرد ${target.tag}. السبب: ${reason}`);
    }
    if (n === "حظر" && target) {
      const m = await guild.members.fetch(target.id);
      if (!m.bannable) return i.reply({ content: "لا أستطيع حظر هذا العضو؛ تحقق من ترتيب الرتب.", ephemeral: true });
      await m.ban({ reason });
      return i.reply(`🔨 تم حظر ${target.tag}. السبب: ${reason}`);
    }
    if (n === "تحذير" && target) return i.reply(`⚠️ تم تسجيل تحذير لـ ${target.tag}. السبب: ${reason}`);
    if (n === "مهلة" && target) {
      const m = await guild.members.fetch(target.id);
      if (!m.moderatable) return i.reply({ content: "لا أستطيع إسكات هذا العضو.", ephemeral: true });
      await m.timeout(10 * 60 * 1000, reason);
      return i.reply(`⏳ تم وضع ${target.tag} في مهلة 10 دقائق.`);
    }
    if (n === "إنهاء_المهلة" && target) {
      const m = await guild.members.fetch(target.id);
      await m.timeout(null);
      return i.reply(`✅ انتهت المهلة عن ${target.tag}.`);
    }
    if (n === "لقب" && target) {
      const m = await guild.members.fetch(target.id);
      const nick = i.options.getString("السبب");
      if (!nick) return i.reply({ content: "اكتب اللقب في خيار السبب.", ephemeral: true });
      await m.setNickname(nick);
      return i.reply("✅ تم تغيير اللقب.");
    }
    if (n === "مسح") {
      const amount = i.options.getInteger("العدد");
      const deleted = await i.channel.bulkDelete(amount, true);
      return i.reply({ content: `🧹 تم حذف ${deleted.size} رسالة.`, ephemeral: true });
    }
    if (n === "قفل" || n === "فتح") {
      await i.channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: n === "قفل" ? false : null
      });
      return i.reply(n === "قفل" ? "🔒 تم قفل القناة." : "🔓 تم فتح القناة.");
    }

    return i.reply("✅ تم تنفيذ الأمر. هذه الميزة تحتاج تخصيصًا إضافيًا إذا كانت تتطلب وظيفة خاصة.");
  } catch (e) {
    console.error(e);
    const msg = "❌ حدث خطأ. تحقق من صلاحيات البوت وترتيب الرتب.";
    if (i.replied || i.deferred) {
      await i.followUp({ content: msg, ephemeral: true }).catch(() => {});
    } else {
      await i.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  }
});

async function start() {
  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);
    console.log(`تسجيل ${slash.length} أمرًا...`);
    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: slash.map(c => c.toJSON())
    });
    console.log("✅ تم تسجيل الأوامر عالميًا.");
    await bot.login(TOKEN);
  } catch (e) {
    console.error("❌ خطأ في التشغيل:", e);
    process.exit(1);
  }
}

start();
