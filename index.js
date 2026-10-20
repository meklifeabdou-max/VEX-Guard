
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
  console.error("❌ تأكد من DISCORD_TOKEN و CLIENT_ID في GitHub Secrets.");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("مساعدة")
    .setDescription("عرض أوامر VEX Guard"),

  new SlashCommandBuilder()
    .setName("تحذير")
    .setDescription("تحذير عضو")
    .addUserOption(o =>
      o.setName("العضو").setDescription("اختر العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("سبب التحذير").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("طرد")
    .setDescription("طرد عضو من السيرفر")
    .addUserOption(o =>
      o.setName("العضو").setDescription("اختر العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("سبب الطرد").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("حظر")
    .setDescription("حظر عضو من السيرفر")
    .addUserOption(o =>
      o.setName("العضو").setDescription("اختر العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("سبب الحظر").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("مهلة")
    .setDescription("إسكات عضو لمدة 10 دقائق")
    .addUserOption(o =>
      o.setName("العضو").setDescription("اختر العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("سبب المهلة").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
].map(command => command.toJSON());

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  for (const command of commands) {
    try {
      await rest.post(
        Routes.applicationCommands(CLIENT_ID),
        { body: command }
      );
      console.log(`✅ تم تسجيل الأمر: ${command.name}`);
    } catch (error) {
      if (error.code === 50035) {
        console.error(
          `❌ اسم الأمر أو وصفه غير مقبول لدى Discord: ${command.name}`
        );
      } else {
        throw error;
      }
    }
  }
}

client.once("ready", () => {
  console.log(`🛡️ VEX Guard متصل باسم ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.commandName;

  if (command === "مساعدة") {
    return interaction.reply({
      content:
        "🛡️ **أوامر VEX Guard**\n\n" +
        "`/مساعدة` — عرض الأوامر\n" +
        "`/تحذير` — تحذير عضو\n" +
        "`/طرد` — طرد عضو\n" +
        "`/حظر` — حظر عضو\n" +
        "`/مهلة` — إسكات عضو لمدة 10 دقائق",
      ephemeral: true
    });
  }

  const user = interaction.options.getUser("العضو");
  const reason =
    interaction.options.getString("السبب") || "لم يُذكر السبب";

  if (command === "تحذير") {
    return interaction.reply(
      `⚠️ تحذير للعضو ${user}.\n📝 السبب: ${reason}`
    );
  }

  const member = await interaction.guild.members
    .fetch(user.id)
    .catch(() => null);

  if (!member) {
    return interaction.reply({
      content: "❌ لم أجد العضو في السيرفر.",
      ephemeral: true
    });
  }

  try {
    if (command === "طرد") {
      if (!member.kickable) {
        return interaction.reply({
          content: "❌ لا أستطيع طرد هذا العضو. تحقق من صلاحيات البوت وترتيب رتبته.",
          ephemeral: true
        });
      }

      await member.kick(reason);
      return interaction.reply(`👢 تم طرد **${user.tag}**.\n📝 السبب: ${reason}`);
    }

    if (command === "حظر") {
      if (!member.bannable) {
        return interaction.reply({
          content: "❌ لا أستطيع حظر هذا العضو. تحقق من صلاحيات البوت وترتيب رتبته.",
          ephemeral: true
        });
      }

      await member.ban({ reason });
      return interaction.reply(`🔨 تم حظر **${user.tag}**.\n📝 السبب: ${reason}`);
    }

    if (command === "مهلة") {
      if (!member.moderatable) {
        return interaction.reply({
          content: "❌ لا أستطيع إعطاء هذا العضو مهلة. تحقق من صلاحيات البوت وترتيب رتبته.",
          ephemeral: true
        });
      }

      await member.timeout(10 * 60 * 1000, reason);
      return interaction.reply(
        `🔇 تم إسكات **${user.tag}** لمدة 10 دقائق.\n📝 السبب: ${reason}`
      );
    }
  } catch (error) {
    console.error(error);
    if (!interaction.replied) {
      return interaction.reply({
        content: "❌ فشل تنفيذ الأمر. تحقق من صلاحيات البوت.",
        ephemeral: true
      });
    }
  }
});

(async () => {
  try {
    await registerCommands();
    await client.login(TOKEN);
  } catch (error) {
    console.error("❌ خطأ في تشغيل VEX Guard:", error);
    process.exit(1);
  }
})();
