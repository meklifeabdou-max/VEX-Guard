
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  throw new Error(
    "❌ أضف DISCORD_TOKEN و CLIENT_ID و GUILD_ID إلى متغيرات البيئة."
  );
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration
  ]
});

const commands = [
  new SlashCommandBuilder()
    .setName("مساعدة")
    .setDescription("عرض أوامر VEX Guard"),

  new SlashCommandBuilder()
    .setName("تحذير")
    .setDescription("إرسال تحذير لعضو")
    .addUserOption(o =>
      o.setName("عضو").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("سبب التحذير").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("طرد")
    .setDescription("طرد عضو من السيرفر")
    .addUserOption(o =>
      o.setName("عضو").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("سبب الطرد"))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("حظر")
    .setDescription("حظر عضو من السيرفر")
    .addUserOption(o =>
      o.setName("عضو").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("سبب الحظر"))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("مهلة")
    .setDescription("إعطاء عضو مهلة")
    .addUserOption(o =>
      o.setName("عضو").setDescription("العضو").setRequired(true))
    .addIntegerOption(o =>
      o.setName("دقائق").setDescription("مدة المهلة بالدقائق")
        .setMinValue(1).setMaxValue(40320).setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("سبب المهلة"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("فك_المهلة")
    .setDescription("إزالة المهلة عن عضو")
    .addUserOption(o =>
      o.setName("عضو").setDescription("العضو").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("مسح")
    .setDescription("مسح رسائل من الروم الحالي")
    .addIntegerOption(o =>
      o.setName("العدد").setDescription("عدد الرسائل")
        .setMinValue(1).setMaxValue(100).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("قفل")
    .setDescription("قفل الروم الحالي")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("فتح")
    .setDescription("فتح الروم الحالي")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("معلومات")
    .setDescription("عرض معلومات عن عضو")
    .addUserOption(o =>
      o.setName("عضو").setDescription("العضو المطلوب")),

  new SlashCommandBuilder()
    .setName("خادم")
    .setDescription("عرض معلومات سيرفر XR"),

  new SlashCommandBuilder()
    .setName("صورة")
    .setDescription("عرض صورة حساب عضو")
    .addUserOption(o =>
      o.setName("عضو").setDescription("العضو المطلوب")),

  new SlashCommandBuilder()
    .setName("كت")
    .setDescription("إرسال سؤال للمشاركين"),

  new SlashCommandBuilder()
    .setName("روليت")
    .setDescription("اختيار فائز عشوائي من الأعضاء")
    .addUserOption(o =>
      o.setName("عضو1").setDescription("المشارك الأول").setRequired(true))
    .addUserOption(o =>
      o.setName("عضو2").setDescription("المشارك الثاني").setRequired(true))
    .addUserOption(o =>
      o.setName("عضو3").setDescription("المشارك الثالث"))
    .addUserOption(o =>
      o.setName("عضو4").setDescription("المشارك الرابع"))
    .addUserOption(o =>
      o.setName("عضو5").setDescription("المشارك الخامس"))
].map(command => command.toJSON());

const questions = [
  "ما أكثر لعبة تحبها؟",
  "من أفضل لاعب كرة قدم بالنسبة لك؟",
  "ما اللعبة التي لا تملّ منها؟",
  "لو ربحت مليونًا، ما أول شيء تشتريه؟",
  "ما أفضل ذكرى عندك مع أصدقائك؟",
  "ما هدفك الذي تريد تحقيقه؟",
  "من أكثر شخص يضحكك؟",
  "ما الفريق الذي تتوقع أن يفوز بالدوري؟",
  "ما أفضل أنمي شاهدته؟",
  "ما أكثر شيء تحبه في سيرفر XR؟"
];

async function registerCommands() {
  console.log("📤 تسجيل الأوامر في سيرفر XR فقط...");

  const rest = new REST({ version: "10", timeout: 120000 })
    .setToken(TOKEN);

  const result = await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log(`✅ تم تسجيل ${result.length} أمرًا في سيرفر XR.`);
}

client.once("ready", () => {
  console.log(`🛡️ VEX Guard يعمل باسم ${client.user.tag}`);
  client.user.setActivity("XR 🛡️");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (!interaction.guildId || interaction.guildId !== GUILD_ID) {
    return interaction.reply({
      content: "❌ هذا البوت مخصص لسيرفر XR فقط.",
      ephemeral: true
    });
  }

  const { commandName } = interaction;

  try {
    if (commandName === "مساعدة") {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🛡️ VEX Guard | المساعدة")
        .setDescription([
          "`/تحذير` — تحذير عضو",
          "`/طرد` — طرد عضو",
          "`/حظر` — حظر عضو",
          "`/مهلة` — إعطاء مهلة",
          "`/فك_المهلة` — إزالة المهلة",
          "`/مسح` — مسح رسائل",
          "`/قفل` و`/فتح` — إدارة الروم",
          "`/معلومات` — معلومات عضو",
          "`/خادم` — معلومات السيرفر",
          "`/صورة` — صورة الحساب",
          "`/كت` — سؤال عشوائي",
          "`/روليت` — اختيار فائز"
        ].join("\n"));

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === "تحذير") {
      const user = interaction.options.getUser("عضو");
      const reason = interaction.options.getString("السبب");

      await interaction.reply({
        content: `⚠️ تم تحذير ${user}.\n**السبب:** ${reason}`
      });

      try {
        await user.send(
          `⚠️ تلقيت تحذيرًا في سيرفر ${interaction.guild.name}.\nالسبب: ${reason}`
        );
      } catch {}
      return;
    }

    if (commandName === "طرد") {
      const user = interaction.options.getUser("عضو");
      const reason = interaction.options.getString("السبب") || "لم يُذكر سبب";
      const member = await interaction.guild.members.fetch(user.id);

      if (!member.kickable) {
        return interaction.reply({
          content: "❌ لا أستطيع طرد هذا العضو. تحقق من صلاحياتي وترتيب الرتب.",
          ephemeral: true
        });
      }

      await member.kick(`${reason} | بواسطة ${interaction.user.tag}`);
      return interaction.reply({
        content: `👢 تم طرد ${user.tag}.\nالسبب: ${reason}`
      });
    }

    if (commandName === "حظر") {
      const user = interaction.options.getUser("عضو");
      const reason = interaction.options.getString("السبب") || "لم يُذكر سبب";

      await interaction.guild.members.ban(user.id, {
        reason: `${reason} | بواسطة ${interaction.user.tag}`
      });

      return interaction.reply({
        content: `🔨 تم حظر ${user.tag}.\nالسبب: ${reason}`
      });
    }

    if (commandName === "مهلة") {
      const user = interaction.options.getUser("عضو");
      const minutes = interaction.options.getInteger("دقائق");
      const reason = interaction.options.getString("السبب") || "لم يُذكر سبب";
      const member = await interaction.guild.members.fetch(user.id);

      if (!member.moderatable) {
        return interaction.reply({
          content: "❌ لا أستطيع إعطاء هذا العضو مهلة. تحقق من ترتيب الرتب.",
          ephemeral: true
        });
      }

      await member.timeout(minutes * 60 * 1000, reason);
      return interaction.reply({
        content: `⏳ تم إعطاء ${user} مهلة لمدة ${minutes} دقيقة.\nالسبب: ${reason}`
      });
    }

    if (commandName === "فك_المهلة") {
      const user = interaction.options.getUser("عضو");
      const member = await interaction.guild.members.fetch(user.id);

      if (!member.moderatable) {
        return interaction.reply({
          content: "❌ لا أستطيع إزالة المهلة عن هذا العضو.",
          ephemeral: true
        });
      }

      await member.timeout(null);
      return interaction.reply({ content: `✅ تمت إزالة المهلة عن ${user}.` });
    }

    if (commandName === "مسح") {
      const amount = interaction.options.getInteger("العدد");

      if (!interaction.channel?.bulkDelete) {
        return interaction.reply({
          content: "❌ لا يمكن مسح الرسائل في هذا الروم.",
          ephemeral: true
        });
      }

      const deleted = await interaction.channel.bulkDelete(amount, true);
      return interaction.reply({
        content: `🧹 تم مسح ${deleted.size} رسالة. الرسائل الأقدم من 14 يومًا لا تُمسح بهذه الطريقة.`,
        ephemeral: true
      });
    }

    if (commandName === "قفل" || commandName === "فتح") {
      const channel = interaction.channel;

      if (!channel || !channel.permissionOverwrites) {
        return interaction.reply({
          content: "❌ لا يمكن تعديل صلاحيات هذا الروم.",
          ephemeral: true
        });
      }

      const lock = commandName === "قفل";
      await channel.permissionOverwrites.edit(
        interaction.guild.roles.everyone,
        { SendMessages: lock ? false : null }
      );

      return interaction.reply({
        content: lock ? "🔒 تم قفل الروم." : "🔓 تم فتح الروم."
      });
    }

    if (commandName === "معلومات") {
      const user = interaction.options.getUser("عضو") || interaction.user;
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`👤 معلومات ${user.username}`)
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "الاسم", value: user.tag, inline: true },
          { name: "المعرّف", value: user.id, inline: true },
          {
            name: "تاريخ إنشاء الحساب",
            value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`,
            inline: false
          }
        );

      if (member) {
        embed.addFields({
          name: "انضم إلى السيرفر",
          value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`,
          inline: false
        });
      }

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === "خادم") {
      const guild = interaction.guild;
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🏰 ${guild.name}`)
        .setThumbnail(guild.iconURL({ size: 256 }))
        .addFields(
          { name: "عدد الأعضاء", value: `${guild.memberCount}`, inline: true },
          { name: "عدد الرومات", value: `${guild.channels.cache.size}`, inline: true },
          { name: "تاريخ الإنشاء", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>` }
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === "صورة") {
      const user = interaction.options.getUser("عضو") || interaction.user;
      return interaction.reply({
        content: user.displayAvatarURL({ size: 1024 })
      });
    }

    if (commandName === "كت") {
      const question = questions[Math.floor(Math.random() * questions.length)];
      return interaction.reply(`🎲 **سؤال للجميع:** ${question}`);
    }

    if (commandName === "روليت") {
      const users = [1, 2, 3, 4, 5]
        .map(n => interaction.options.getUser(`عضو${n}`))
        .filter(Boolean);

      const winner = users[Math.floor(Math.random() * users.length)];
      return interaction.reply(`🎉 الفائز العشوائي هو ${winner}!`);
    }
  } catch (error) {
    console.error(`خطأ في /${commandName}:`, error);

    const message =
      "❌ حدث خطأ. تأكد من صلاحيات البوت وترتيب رتبته، ثم جرّب مجددًا.";

    if (interaction.replied || interaction.deferred) {
      return interaction.followUp({ content: message, ephemeral: true }).catch(() => {});
    }

    return interaction.reply({ content: message, ephemeral: true }).catch(() => {});
  }
});

async function main() {
  try {
    await registerCommands();
    await client.login(TOKEN);
  } catch (error) {
    console.error("❌ تعذر تشغيل VEX Guard:");
    console.error(error.stack || error.message);
  }
}

main();
