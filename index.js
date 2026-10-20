
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ تحقق من DISCORD_TOKEN و CLIENT_ID.");
  process.exit(1);
}

const TIMEOUT_MS = 10 * 60 * 1000;
const SPAM_LIMIT = 5;
const SPAM_WINDOW = 5000;
const LINK_LIMIT = 3;

const linkRegex = /https?:\/\/\S+|www\.\S+|discord\.gg\/\S+/i;

const commands = [
  new SlashCommandBuilder()
    .setName("مساعدة")
    .setDescription("عرض أوامر VEX Guard"),

  new SlashCommandBuilder()
    .setName("تحذير")
    .setDescription("تحذير عضو")
    .addUserOption(o =>
      o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("السبب").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("طرد")
    .setDescription("طرد عضو")
    .addUserOption(o =>
      o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("السبب").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("حظر")
    .setDescription("حظر عضو")
    .addUserOption(o =>
      o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("السبب").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("مهلة")
    .setDescription("إسكات عضو لمدة 10 دقائق")
    .addUserOption(o =>
      o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("السبب").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
].map(command => command.toJSON());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const messageHistory = new Map();
const violations = new Map();

client.once("clientReady", () => {
  console.log(`🛡️ VEX Guard يعمل باسم ${client.user.tag}`);
});

// حماية السبام والروابط
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot || !message.member) return;

  if (
    message.member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    message.member.permissions.has(PermissionFlagsBits.Administrator)
  ) return;

  const key = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();

  // كشف السبام
  const times = (messageHistory.get(key) || [])
    .filter(time => now - time < SPAM_WINDOW);

  times.push(now);
  messageHistory.set(key, times);

  if (times.length >= SPAM_LIMIT) {
    try {
      const recentMessages = await message.channel.messages.fetch({
        limit: 10
      });

      const userMessages = recentMessages.filter(
        m =>
          m.author.id === message.author.id &&
          now - m.createdTimestamp < SPAM_WINDOW
      );

      if (userMessages.size >= SPAM_LIMIT) {
        await message.channel.bulkDelete(userMessages, true);

        if (message.member.moderatable) {
          await message.member.timeout(
            TIMEOUT_MS,
            "VEX Guard: Spam"
          );
        }

        await message.channel.send(
          `🚨 ${message.author} تم رصد السبام وإزالة الرسائل الحديثة.`
        );
      }

      messageHistory.delete(key);
    } catch (error) {
      console.error("خطأ في حماية السبام:", error.message);
    }

    return;
  }

  // حماية الروابط
  if (linkRegex.test(message.content)) {
    try {
      await message.delete();

      const count = (violations.get(key) || 0) + 1;
      violations.set(key, count);

      if (count >= LINK_LIMIT) {
        if (message.member.moderatable) {
          await message.member.timeout(
            TIMEOUT_MS,
            "VEX Guard: تكرار نشر الروابط"
          );

          violations.set(key, 0);

          await message.channel.send(
            `🔗 ${message.author} تلقى مهلة 10 دقائق لتكرار نشر الروابط.`
          );
        } else {
          await message.channel.send(
            `⚠️ ${message.author} الروابط ممنوعة. لا أملك صلاحية إعطاء المهلة.`
          );
        }
      } else {
        await message.channel.send({
          content:
            `⚠️ ${message.author} الروابط ممنوعة هنا. ` +
            `المخالفة ${count}/${LINK_LIMIT}.`,
          allowedMentions: { users: [message.author.id] }
        });
      }
    } catch (error) {
      console.error("خطأ في حماية الروابط:", error.message);
    }
  }
});

// أوامر الإدارة
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand() || !interaction.guild) return;

  try {
    // نؤكد استلام الأمر قبل تنفيذ أي عملية قد تستغرق وقتًا
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral
    });

    const command = interaction.commandName;

    if (command === "مساعدة") {
      return await interaction.editReply(
        "🛡️ **VEX Guard**\n" +
        "`/مساعدة` — عرض الأوامر\n" +
        "`/تحذير` — تحذير عضو\n" +
        "`/طرد` — طرد عضو\n" +
        "`/حظر` — حظر عضو\n" +
        "`/مهلة` — إسكات عضو لمدة 10 دقائق\n" +
        "🚨 حماية تلقائية من السبام والروابط"
      );
    }

    const user = interaction.options.getUser("العضو");
    const reason =
      interaction.options.getString("السبب") || "لم يُذكر السبب";

    if (command === "تحذير") {
      return await interaction.editReply(
        `⚠️ تم إصدار تحذير للعضو ${user}.\n📝 السبب: ${reason}`
      );
    }

    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);

    if (!member) {
      return await interaction.editReply("❌ لم أجد العضو في السيرفر.");
    }

    if (member.id === interaction.user.id) {
      return await interaction.editReply(
        "❌ لا يمكنك تطبيق هذا الأمر على نفسك."
      );
    }

    if (member.id === client.user.id) {
      return await interaction.editReply(
        "❌ لا يمكنك تطبيق هذا الأمر على البوت نفسه."
      );
    }

    if (command === "طرد") {
      if (!member.kickable) {
        return await interaction.editReply(
          "❌ لا أستطيع طرد هذا العضو. تحقق من صلاحياتي وترتيب الرتب."
        );
      }

      await member.kick(reason);

      return await interaction.editReply(
        `👢 تم طرد **${user.tag}**.\n📝 السبب: ${reason}`
      );
    }

    if (command === "حظر") {
      if (!member.bannable) {
        return await interaction.editReply(
          "❌ لا أستطيع حظر هذا العضو. تحقق من صلاحياتي وترتيب الرتب."
        );
      }

      await member.ban({ reason });

      return await interaction.editReply(
        `🔨 تم حظر **${user.tag}**.\n📝 السبب: ${reason}`
      );
    }

    if (command === "مهلة") {
      if (!member.moderatable) {
        return await interaction.editReply(
          "❌ لا أستطيع إعطاءه مهلة. تحقق من صلاحياتي وترتيب الرتب."
        );
      }

      await member.timeout(TIMEOUT_MS, reason);

      return await interaction.editReply(
        `🔇 تم إسكات **${user.tag}** لمدة 10 دقائق.\n📝 السبب: ${reason}`
      );
    }

  } catch (error) {
    console.error("خطأ في الأمر:", error);

    // إذا سبق تأكيد التفاعل، نعدّل الرد بدل إرسال رد جديد
    if (interaction.deferred) {
      await interaction.editReply({
        content: "❌ فشل تنفيذ الأمر. تحقق من صلاحيات البوت."
      }).catch(() => {});
    } else if (!interaction.replied) {
      await interaction.reply({
        content: "❌ حدث خطأ أثناء تنفيذ الأمر.",
        flags: MessageFlags.Ephemeral
      }).catch(() => {});
    }
  }
});

// تسجيل أوامر التطبيق
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  for (const command of commands) {
    try {
      await rest.post(
        Routes.applicationCommands(CLIENT_ID),
        { body: command }
      );

      console.log(`✅ تم تسجيل: ${command.name}`);
    } catch (error) {
      if (error.code === 50035) {
        console.error(`❌ اسم الأمر غير مقبول: ${command.name}`);
      } else {
        throw error;
      }
    }
  }
}

client.on("error", error => {
  console.error("خطأ في عميل Discord:", error);
});

(async () => {
  try {
    await registerCommands();
    await client.login(TOKEN);
  } catch (error) {
    console.error("❌ فشل تشغيل VEX Guard:", error);
    process.exitCode = 1;
  }
})();
