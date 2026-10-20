
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ تحقق من DISCORD_TOKEN و CLIENT_ID.");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("مساعدة")
    .setDescription("عرض أوامر VEX Guard"),

  new SlashCommandBuilder()
    .setName("تحذير")
    .setDescription("تحذير عضو")
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("السبب").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("طرد")
    .setDescription("طرد عضو")
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("السبب").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("حظر")
    .setDescription("حظر عضو")
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("السبب").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("مهلة")
    .setDescription("إسكات عضو لمدة 10 دقائق")
    .addUserOption(o => o.setName("العضو").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("السبب").setDescription("السبب").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
].map(c => c.toJSON());

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// إعدادات الحماية
const messageHistory = new Map();
const violations = new Map();

const SPAM_LIMIT = 5;       // خمس رسائل
const SPAM_WINDOW = 5000;   // خلال 5 ثوانٍ
const LINK_LIMIT = 3;       // ثلاث مخالفات قبل المهلة
const TIMEOUT_MS = 10 * 60 * 1000;

const linkRegex = /https?:\/\/\S+|www\.\S+|discord\.gg\/\S+/i;

client.once("ready", () => {
  console.log(`🛡️ VEX Guard يعمل باسم ${client.user.tag}`);
});

// حماية السبام والروابط
client.on("messageCreate", async message => {
  if (!message.guild || message.author.bot || !message.member) return;

  // الإدارة مستثناة من الحماية
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
      const recentMessages = await message.channel.messages.fetch({ limit: 10 });
      const userMessages = recentMessages.filter(
        m => m.author.id === message.author.id &&
        now - m.createdTimestamp < SPAM_WINDOW
      );

      if (userMessages.size >= SPAM_LIMIT) {
        await message.channel.bulkDelete(userMessages, true).catch(() => {});
        if (message.member.moderatable) {
          await message.member.timeout(TIMEOUT_MS, "حماية VEX Guard من السبام");
        }
        await message.channel.send(
          `🚨 ${message.author} تم رصد سبام. أُزيلت الرسائل الحديثة وأُعطي العضو مهلة 10 دقائق.`
        );
        messageHistory.delete(key);
      }
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

      if (count >= LINK_LIMIT && message.member.moderatable) {
        await message.member.timeout(TIMEOUT_MS, "تكرار نشر الروابط");
        violations.set(key, 0);

        await message.channel.send(
          `🔗 ${message.author} تم إعطاؤه مهلة 10 دقائق لتكرار نشر الروابط.`
        );
      } else {
        await message.channel.send({
          content: `⚠️ ${message.author} الروابط ممنوعة هنا. المخالفة ${count}/${LINK_LIMIT}.`,
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

  const command = interaction.commandName;

  if (command === "مساعدة") {
    return interaction.reply({
      content:
        "🛡️ **VEX Guard**\n" +
        "`/مساعدة` — الأوامر\n" +
        "`/تحذير` — تحذير عضو\n" +
        "`/طرد` — طرد عضو\n" +
        "`/حظر` — حظر عضو\n" +
        "`/مهلة` — مهلة 10 دقائق\n" +
        "🚨 حماية تلقائية من السبام والروابط",
      ephemeral: true
    });
  }

  const user = interaction.options.getUser("العضو");
  const reason = interaction.options.getString("السبب") || "لم يُذكر السبب";

  if (command === "تحذير") {
    return interaction.reply(`⚠️ تحذير للعضو ${user}.\n📝 السبب: ${reason}`);
  }

  const member = await interaction.guild.members.fetch(user.id).catch(() => null);

  if (!member) {
    return interaction.reply({ content: "❌ لم أجد العضو.", ephemeral: true });
  }

  try {
    if (command === "طرد") {
      if (!member.kickable) {
        return interaction.reply({ content: "❌ لا أستطيع طرد هذا العضو.", ephemeral: true });
      }
      await member.kick(reason);
      return interaction.reply(`👢 تم طرد **${user.tag}**.\n📝 السبب: ${reason}`);
    }

    if (command === "حظر") {
      if (!member.bannable) {
        return interaction.reply({ content: "❌ لا أستطيع حظر هذا العضو.", ephemeral: true });
      }
      await member.ban({ reason });
      return interaction.reply(`🔨 تم حظر **${user.tag}**.\n📝 السبب: ${reason}`);
    }

    if (command === "مهلة") {
      if (!member.moderatable) {
        return interaction.reply({ content: "❌ لا أستطيع إعطاءه مهلة.", ephemeral: true });
      }
      await member.timeout(TIMEOUT_MS, reason);
      return interaction.reply(`🔇 تم إسكات **${user.tag}** لمدة 10 دقائق.`);
    }
  } catch (error) {
    console.error(error);
    if (!interaction.replied) {
      await interaction.reply({ content: "❌ فشل الأمر. تحقق من صلاحيات البوت.", ephemeral: true });
    }
  }
});

// إضافة الأوامر دون حذف الأوامر الأخرى في التطبيق
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  for (const command of commands) {
    try {
      await rest.post(Routes.applicationCommands(CLIENT_ID), {
        body: command
      });
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

(async () => {
  try {
    await registerCommands();
    await client.login(TOKEN);
  } catch (error) {
    console.error("❌ فشل تشغيل VEX Guard:", error);
    process.exit(1);
  }
})();
