
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  ChannelType,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ تحقق من DISCORD_TOKEN و CLIENT_ID و GUILD_ID");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const warnings = new Map();
const mathGames = new Map();
const guessGames = new Map();

const commands = [
  new SlashCommandBuilder().setName("help").setDescription("عرض قائمة الأوامر"),
  new SlashCommandBuilder().setName("ping").setDescription("فحص استجابة البوت"),

  new SlashCommandBuilder().setName("warn").setDescription("تحذير عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(true)),

  new SlashCommandBuilder().setName("warnings").setDescription("عرض تحذيرات عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true)),

  new SlashCommandBuilder().setName("kick").setDescription("طرد عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب")),

  new SlashCommandBuilder().setName("ban").setDescription("حظر عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب")),

  new SlashCommandBuilder().setName("unban").setDescription("فك الحظر عن مستخدم")
    .addStringOption(o => o.setName("userid").setDescription("معرف المستخدم").setRequired(true)),

  new SlashCommandBuilder().setName("timeout").setDescription("تقييد عضو بالدقائق")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("من 1 إلى 40320 دقيقة").setMinValue(1).setMaxValue(40320).setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب")),

  new SlashCommandBuilder().setName("untimeout").setDescription("إزالة التقييد")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true)),

  new SlashCommandBuilder().setName("clear").setDescription("حذف رسائل")
    .addIntegerOption(o => o.setName("amount").setDescription("من 1 إلى 100").setMinValue(1).setMaxValue(100).setRequired(true)),

  new SlashCommandBuilder().setName("userinfo").setDescription("معلومات عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو")),

  new SlashCommandBuilder().setName("serverinfo").setDescription("معلومات السيرفر"),

  new SlashCommandBuilder().setName("avatar").setDescription("عرض صورة عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو")),

  new SlashCommandBuilder().setName("announce").setDescription("إرسال إعلان")
    .addChannelOption(o => o.setName("channel").setDescription("القناة النصية").addChannelTypes(ChannelType.GuildText).setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("نص الإعلان").setMaxLength(2000).setRequired(true)),

  new SlashCommandBuilder().setName("say").setDescription("إرسال رسالة باسم البوت")
    .addStringOption(o => o.setName("message").setDescription("الرسالة").setMaxLength(2000).setRequired(true)),

  new SlashCommandBuilder().setName("lock").setDescription("قفل قناة")
    .addChannelOption(o => o.setName("channel").setDescription("القناة النصية").addChannelTypes(ChannelType.GuildText)),

  new SlashCommandBuilder().setName("unlock").setDescription("فتح قناة")
    .addChannelOption(o => o.setName("channel").setDescription("القناة النصية").addChannelTypes(ChannelType.GuildText)),

  new SlashCommandBuilder().setName("slowmode").setDescription("تحديد Slowmode")
    .addIntegerOption(o => o.setName("seconds").setDescription("من 0 إلى 21600 ثانية").setMinValue(0).setMaxValue(21600).setRequired(true))
    .addChannelOption(o => o.setName("channel").setDescription("القناة النصية").addChannelTypes(ChannelType.GuildText)),

  new SlashCommandBuilder().setName("role").setDescription("منح رتبة لعضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addRoleOption(o => o.setName("role").setDescription("الرتبة").setRequired(true)),

  new SlashCommandBuilder().setName("unrole").setDescription("إزالة رتبة من عضو")
    .addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true))
    .addRoleOption(o => o.setName("role").setDescription("الرتبة").setRequired(true)),

  new SlashCommandBuilder().setName("rps").setDescription("حجر ورقة مقص")
    .addStringOption(o => o.setName("choice").setDescription("اختيارك").setRequired(true)
      .addChoices(
        { name: "حجر 🪨", value: "rock" },
        { name: "ورقة 📄", value: "paper" },
        { name: "مقص ✂️", value: "scissors" }
      )),

  new SlashCommandBuilder().setName("guess").setDescription("ابدأ لعبة تخمين الرقم أو أرسل تخمينك")
    .addIntegerOption(o => o.setName("number").setDescription("رقم من 1 إلى 10").setMinValue(1).setMaxValue(10)),

  new SlashCommandBuilder().setName("math").setDescription("ابدأ تحدي الحساب أو أرسل إجابتك")
    .addIntegerOption(o => o.setName("answer").setDescription("إجابتك")),

  new SlashCommandBuilder().setName("dice").setDescription("ارمِ النرد 🎲"),

  new SlashCommandBuilder().setName("coinflip").setDescription("وجه أو كتابة 🪙")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("ready", () => {
  console.log(`🛡️ VEX Guard متصل: ${client.user.tag}`);
  console.log(`🏠 السيرفر المستهدف: ${GUILD_ID}`);
  console.log("✅ البوت جاهز للعمل");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const name = interaction.commandName;
  const guild = interaction.guild;

  const reply = async content =>
    interaction.reply({ content, ephemeral: true });

  try {
    // الألعاب متاحة لجميع الأعضاء
    if (name === "rps") {
      const options = ["rock", "paper", "scissors"];
      const emoji = { rock: "🪨", paper: "📄", scissors: "✂️" };
      const label = { rock: "حجر", paper: "ورقة", scissors: "مقص" };
      const player = interaction.options.getString("choice");
      const bot = options[Math.floor(Math.random() * 3)];

      let result = player === bot ? "🤝 تعادل!" :
        ((player === "rock" && bot === "scissors") ||
         (player === "paper" && bot === "rock") ||
         (player === "scissors" && bot === "paper"))
          ? "🏆 فزت!" : "😅 فزت عليك هذه المرة!";

      return reply(`${emoji[player]} أنت: ${label[player]}\n${emoji[bot]} البوت: ${label[bot]}\n${result}`);
    }

    if (name === "guess") {
      const key = `${guild.id}:${interaction.user.id}`;
      const number = interaction.options.getInteger("number");

      if (number === null) {
        const secret = Math.floor(Math.random() * 10) + 1;
        guessGames.set(key, secret);
        return reply("🔢 اختر رقمًا من 1 إلى 10 باستعمال `/guess number:`");
      }

      const secret = guessGames.get(key);
      if (secret === undefined) {
        return reply("ابدأ أولًا باستعمال `/guess` من دون رقم.");
      }

      guessGames.delete(key);
      if (number === secret) return reply("🎉 صحيح! أحسنت يا بطل!");
      return reply(`😄 ليس الرقم الصحيح! كان الرقم ${secret}. ابدأ جولة جديدة بـ \`/guess\`.`);
    }

    if (name === "math") {
      const key = `${guild.id}:${interaction.user.id}`;
      const answer = interaction.options.getInteger("answer");

      if (answer === null) {
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        mathGames.set(key, { answer: a + b, question: `${a} + ${b}` });
        return reply(`🧠 **تحدي الحساب**\nكم يساوي **${a} + ${b}**؟\nأرسل إجابتك باستعمال \`/math answer:\``);
      }

      const game = mathGames.get(key);
      if (!game) return reply("ابدأ تحديًا أولًا باستعمال `/math` من دون إجابة.");
      mathGames.delete(key);

      return reply(answer === game.answer
        ? "🎉 إجابة صحيحة! عبقري!"
        : `❌ إجابة خاطئة! ${game.question} = ${game.answer}`);
    }

    if (name === "dice") {
      return reply(`🎲 النتيجة: **${Math.floor(Math.random() * 6) + 1}**`);
    }

    if (name === "coinflip") {
      return reply(`🪙 النتيجة: **${Math.random() < 0.5 ? "وجه" : "كتابة"}**`);
    }

    if (name === "ping") return reply(`🏓 Ping: ${client.ws.ping} ms`);

    if (name === "help") {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🛡️ VEX Guard | 25 أمرًا")
        .setDescription(
          "**الإدارة**\n" +
          "`/warn` `/warnings` `/kick` `/ban` `/unban`\n" +
          "`/timeout` `/untimeout` `/clear`\n" +
          "`/role` `/unrole` `/lock` `/unlock` `/slowmode`\n" +
          "`/announce` `/say`\n\n" +
          "**المعلومات**\n`/userinfo` `/serverinfo` `/avatar` `/ping`\n\n" +
          "**الألعاب**\n`/rps` `/guess` `/math` `/dice` `/coinflip`"
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (name === "userinfo") {
      const user = interaction.options.getUser("member") || interaction.user;
      const member = await guild.members.fetch(user.id).catch(() => null);
      const embed = new EmbedBuilder().setColor(0x5865F2)
        .setTitle(`معلومات ${user.username}`)
        .setThumbnail(user.displayAvatarURL({ size: 512 }))
        .addFields(
          { name: "الاسم", value: user.tag, inline: true },
          { name: "ID", value: user.id, inline: true },
          { name: "إنشاء الحساب", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>` }
        );
      if (member?.joinedTimestamp) {
        embed.addFields({ name: "الانضمام", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` });
      }
      return interaction.reply({ embeds: [embed] });
    }

    if (name === "serverinfo") {
      const embed = new EmbedBuilder().setColor(0x5865F2)
        .setTitle(guild.name)
        .setThumbnail(guild.iconURL({ size: 512 }))
        .addFields(
          { name: "معرف السيرفر", value: guild.id },
          { name: "عدد الأعضاء", value: String(guild.memberCount), inline: true },
          { name: "تاريخ الإنشاء", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true }
        );
      return interaction.reply({ embeds: [embed] });
    }

    if (name === "avatar") {
      const user = interaction.options.getUser("member") || interaction.user;
      const embed = new EmbedBuilder().setColor(0x5865F2)
        .setTitle(`صورة ${user.username}`)
        .setImage(user.displayAvatarURL({ size: 1024 }));
      return interaction.reply({ embeds: [embed] });
    }

    const perms = {
      warn: PermissionFlagsBits.ModerateMembers,
      warnings: PermissionFlagsBits.ModerateMembers,
      kick: PermissionFlagsBits.KickMembers,
      ban: PermissionFlagsBits.BanMembers,
      unban: PermissionFlagsBits.BanMembers,
      timeout: PermissionFlagsBits.ModerateMembers,
      untimeout: PermissionFlagsBits.ModerateMembers,
      clear: PermissionFlagsBits.ManageMessages,
      announce: PermissionFlagsBits.ManageMessages,
      say: PermissionFlagsBits.ManageMessages,
      lock: PermissionFlagsBits.ManageChannels,
      unlock: PermissionFlagsBits.ManageChannels,
      slowmode: PermissionFlagsBits.ManageChannels,
      role: PermissionFlagsBits.ManageRoles,
      unrole: PermissionFlagsBits.ManageRoles
    };

    if (perms[name] && !interaction.memberPermissions.has(perms[name])) {
      return reply("❌ لا تملك الصلاحية اللازمة لهذا الأمر.");
    }

    if (name === "warn") {
      const user = interaction.options.getUser("member");
      if (user.id === interaction.user.id) return reply("❌ لا يمكنك تحذير نفسك.");
      const reason = interaction.options.getString("reason");
      const key = `${guild.id}:${user.id}`;
      const list = warnings.get(key) || [];
      list.push({ reason, by: interaction.user.tag });
      warnings.set(key, list);
      return reply(`⚠️ تم تحذير ${user.tag}\nالسبب: ${reason}\nعدد التحذيرات: ${list.length}`);
    }

    if (name === "warnings") {
      const user = interaction.options.getUser("member");
      const list = warnings.get(`${guild.id}:${user.id}`) || [];
      return reply(list.length
        ? `⚠️ تحذيرات ${user.tag}:\n${list.map((w, i) => `${i + 1}. ${w.reason} — ${w.by}`).join("\n")}`
        : `✅ لا توجد تحذيرات مسجلة لـ ${user.tag}.`);
    }

    if (["kick", "ban", "timeout", "untimeout"].includes(name)) {
      const user = interaction.options.getUser("member");
      if (user.id === interaction.user.id || user.id === client.user.id) {
        return reply("❌ لا يمكنك تنفيذ هذا الأمر على نفسك أو على البوت.");
      }

      const member = await guild.members.fetch(user.id).catch(() => null);
      if (!member) return reply("❌ العضو غير موجود في السيرفر.");

      if (name === "kick") {
        if (!member.kickable) return reply("❌ لا أستطيع طرد هذا العضو. تحقق من ترتيب الرتب.");
        await member.kick(interaction.options.getString("reason") || "بدون سبب");
        return reply(`👢 تم طرد ${user.tag}.`);
      }

      if (name === "ban") {
        if (!member.bannable) return reply("❌ لا أستطيع حظر هذا العضو. تحقق من ترتيب الرتب.");
        await member.ban({ reason: interaction.options.getString("reason") || "بدون سبب" });
        return reply(`🔨 تم حظر ${user.tag}.`);
      }

      if (!member.moderatable) return reply("❌ لا أستطيع تعديل تقييد هذا العضو.");

      if (name === "timeout") {
        const minutes = interaction.options.getInteger("minutes");
        await member.timeout(minutes * 60000, interaction.options.getString("reason") || "بدون سبب");
        return reply(`⏳ تم تقييد ${user.tag} لمدة ${minutes} دقيقة.`);
      }

      await member.timeout(null);
      return reply(`✅ تم إزالة التقييد عن ${user.tag}.`);
    }

    if (name === "unban") {
      const id = interaction.options.getString("userid").trim();
      if (!/^\d{17,20}$/.test(id)) return reply("❌ أدخل User ID صحيحًا.");
      await guild.members.unban(id);
      return reply(`✅ تم فك الحظر عن ${id}.`);
    }

    if (name === "clear") {
      const amount = interaction.options.getInteger("amount");
      const deleted = await interaction.channel.bulkDelete(amount, true);
      return reply(`🧹 تم حذف ${deleted.size} رسالة. لا يمكن حذف الرسائل الأقدم من 14 يومًا بهذا الأمر.`);
    }

    if (name === "announce") {
      const channel = interaction.options.getChannel("channel");
      const message = interaction.options.getString("message");
      await channel.send({
        embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle("📢 إعلان").setDescription(message)]
      });
      return reply("✅ تم إرسال الإعلان.");
    }

    if (name === "say") {
      const message = interaction.options.getString("message");
      await interaction.channel.send({ content: message, allowedMentions: { parse: [] } });
      return reply("✅ تم إرسال الرسالة.");
    }

    if (name === "lock" || name === "unlock") {
      const channel = interaction.options.getChannel("channel") || interaction.channel;
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: name === "lock" ? false : null
      });
      return reply(name === "lock" ? `🔒 تم قفل ${channel}.` : `🔓 تم فتح ${channel}.`);
    }

    if (name === "slowmode") {
      const channel = interaction.options.getChannel("channel") || interaction.channel;
      const seconds = interaction.options.getInteger("seconds");
      await channel.setRateLimitPerUser(seconds);
      return reply(`⏱️ تم ضبط Slowmode إلى ${seconds} ثانية في ${channel}.`);
    }

    if (name === "role" || name === "unrole") {
      const user = interaction.options.getUser("member");
      const role = interaction.options.getRole("role");

      if (role.managed || role.id === guild.id) return reply("❌ لا يمكن تعديل هذه الرتبة.");
      if (!role.editable) return reply("❌ رتبة البوت يجب أن تكون أعلى من الرتبة المطلوبة.");

      const member = await guild.members.fetch(user.id).catch(() => null);
      if (!member) return reply("❌ العضو غير موجود في السيرفر.");

      if (name === "role") {
        await member.roles.add(role);
        return reply(`✅ تم منح رتبة ${role.name} إلى ${user.tag}.`);
      }

      await member.roles.remove(role);
      return reply(`✅ تم إزالة رتبة ${role.name} من ${user.tag}.`);
    }
  } catch (error) {
    console.error(`❌ خطأ في /${name}:`, error);
    const message = "❌ تعذّر تنفيذ الأمر. تحقق من صلاحيات البوت وترتيب الرتب.";
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: message, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => {});
    }
  }
});

async function start() {
  try {
    console.log("⚙️ جاري تسجيل 25 أمرًا...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ تم تسجيل 25 أمرًا بنجاح.");
  } catch (error) {
    console.error("❌ فشل تسجيل الأوامر:", error.message);
  }

  await client.login(TOKEN);
}

start().catch(error => {
  console.error("❌ فشل تشغيل VEX Guard:", error);
  process.exit(1);
});
