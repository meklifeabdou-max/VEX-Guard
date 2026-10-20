
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
  console.error("❌ أضف DISCORD_TOKEN و CLIENT_ID في GitHub Secrets.");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("مساعدة")
    .setDescription("عرض أوامر VEX Guard"),

  new SlashCommandBuilder()
    .setName("تحذير")
    .setDescription("إرسال تحذير لعضو")
    .addUserOption(o =>
      o.setName("العضو").setDescription("العضو المطلوب").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("سبب التحذير").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("طرد")
    .setDescription("طرد عضو من السيرفر")
    .addUserOption(o =>
      o.setName("العضو").setDescription("العضو المطلوب").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("سبب الطرد").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("حظر")
    .setDescription("حظر عضو من السيرفر")
    .addUserOption(o =>
      o.setName("العضو").setDescription("العضو المطلوب").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("سبب الحظر").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("مهلة")
    .setDescription("إسكات عضو لمدة 10 دقائق")
    .addUserOption(o =>
      o.setName("العضو").setDescription("العضو المطلوب").setRequired(true))
    .addStringOption(o =>
      o.setName("السبب").setDescription("سبب المهلة").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
].map(command => command.toJSON());

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);

  await rest.put(
    Routes.applicationCommands(CLIENT_ID),
    { body: commands }
  );

  console.log("✅ تم تسجيل أوامر VEX Guard.");
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
        " `/مساعدة` — عرض الأوامر\n" +
        " `/تحذير` — تحذير عضو\n" +
        " `/طرد` — طرد عضو\n" +
        " `/حظر` — حظر عضو\n" +
        " `/مهلة` — إسكات عضو لمدة 10 دقائق",
      ephemeral: true
    });
  }

  const memberUser = interaction.options.getUser("العضو");
  const reason = interaction.options.getString("السبب") || "لم يُذكر السبب";
  const member = await interaction.guild.members.fetch(memberUser.id).catch(() => null);

  if (!member) {
    return interaction.reply({
      content: "❌ لم أتمكن من العثور على العضو في السيرفر.",
      ephemeral: true
    });
  }

  if (command === "تحذير") {
    return interaction.reply({
      content: `⚠️ تم تسجيل تحذير للعضو ${memberUser}.\n📝 السبب: ${reason}`,
      allowedMentions: { users: [] }
    });
  }

  if (command === "طرد") {
    if (!member.kickable) {
      return interaction.reply({
        content: "❌ لا أستطيع طرد هذا العضو. تحقق من صلاحياتي وترتيب رتبتي.",
        ephemeral: true
      });
    }

    try {
      await member.kick(reason);
      return interaction.reply(`👢 تم طرد **${memberUser.tag}**.\n📝 السبب: ${reason}`);
    } catch {
      return interaction.reply({
        content: "❌ فشل الطرد. تحقق من صلاحيات البوت.",
        ephemeral: true
      });
    }
  }

  if (command === "حظر") {
    if (!member.bannable) {
      return interaction.reply({
        content: "❌ لا أستطيع حظر هذا العضو. تحقق من صلاحياتي وترتيب رتبتي.",
        ephemeral: true
      });
    }

    try {
      await member.ban({ reason });
      return interaction.reply(`🔨 تم حظر **${memberUser.tag}**.\n📝 السبب: ${reason}`);
    } catch {
      return interaction.reply({
        content: "❌ فشل الحظر. تحقق من صلاحيات البوت.",
        ephemeral: true
      });
    }
  }

  if (command === "مهلة") {
    if (!member.moderatable) {
      return interaction.reply({
        content: "❌ لا أستطيع إعطاء هذا العضو مهلة. تحقق من صلاحياتي وترتيب رتبتي.",
        ephemeral: true
      });
    }

    try {
      await member.timeout(10 * 60 * 1000, reason);
      return interaction.reply(
        `🔇 تم إسكات **${memberUser.tag}** لمدة 10 دقائق.\n📝 السبب: ${reason}`
      );
    } catch {
      return interaction.reply({
        content: "❌ فشل إعطاء المهلة. تحقق من صلاحيات البوت.",
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
