
const D = require("discord.js");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  throw new Error("Add DISCORD_TOKEN and CLIENT_ID in GitHub Secrets.");
}

const bot = new D.Client({
  intents: [
    D.GatewayIntentBits.Guilds,
    D.GatewayIntentBits.GuildMessages,
    D.GatewayIntentBits.MessageContent,
    D.GatewayIntentBits.GuildMembers
  ]
});

const commands = [
  new D.SlashCommandBuilder()
    .setName("help")
    .setDescription("عرض أوامر VEX Guard"),

  new D.SlashCommandBuilder()
    .setName("warn")
    .setDescription("تحذير عضو")
    .addUserOption(o =>
      o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("reason").setDescription("السبب").setRequired(true)),

  new D.SlashCommandBuilder()
    .setName("kick")
    .setDescription("طرد عضو")
    .addUserOption(o =>
      o.setName("member").setDescription("العضو").setRequired(true)),

  new D.SlashCommandBuilder()
    .setName("ban")
    .setDescription("حظر عضو")
    .addUserOption(o =>
      o.setName("member").setDescription("العضو").setRequired(true)),

  new D.SlashCommandBuilder()
    .setName("clear")
    .setDescription("حذف الرسائل")
    .addIntegerOption(o =>
      o.setName("amount").setDescription("العدد")
        .setMinValue(1).setMaxValue(100).setRequired(true))
].map(c => c.toJSON());

bot.once("clientReady", async () => {
  console.log(`VEX Guard online: ${bot.user.tag}`);

  try {
    const rest = new D.REST({ version: "10" }).setToken(token);
    const route = guildId
      ? D.Routes.applicationGuildCommands(clientId, guildId)
      : D.Routes.applicationCommands(clientId);

    await rest.put(route, { body: commands });
    console.log("VEX Guard commands registered.");
  } catch (error) {
    console.error("Command registration failed:", error);
  }
});

bot.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;

  if (message.member?.permissions.has(
    D.PermissionFlagsBits.ManageMessages
  )) return;

  if (/https?:\/\/\S+|discord\.gg\/\S+/i.test(message.content)) {
    try {
      await message.delete();
    } catch (error) {
      console.error("Link protection error:", error);
    }
  }
});

bot.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const name = interaction.commandName;
    const admin = interaction.memberPermissions?.has(
      D.PermissionFlagsBits.Administrator
    );

    if (name === "help") {
      return interaction.reply({
        content: "🛡️ VEX Guard • XR\n/help — المساعدة\n/warn — تحذير\n/kick — طرد\n/ban — حظر\n/clear — حذف الرسائل",
        ephemeral: true
      });
    }

    if (!admin) {
      return interaction.reply({
        content: "❌ هذا الأمر للإدارة فقط.",
        ephemeral: true
      });
    }

    if (name === "warn") {
      const user = interaction.options.getUser("member");
      const reason = interaction.options.getString("reason");

      return interaction.reply(
        `⚠️ تحذير ${user}\nالسبب: ${reason}`
      );
    }

    if (name === "kick") {
      const user = interaction.options.getUser("member");
      const member = await interaction.guild.members.fetch(user.id);

      if (!member.kickable) {
        return interaction.reply({
          content: "لا أستطيع طرد العضو. تحقق من ترتيب الرتب.",
          ephemeral: true
        });
      }

      await member.kick("VEX Guard");
      return interaction.reply(`👢 تم طرد ${user}.`);
    }

    if (name === "ban") {
      const user = interaction.options.getUser("member");
      const member = await interaction.guild.members.fetch(user.id)
        .catch(() => null);

      if (member && !member.bannable) {
        return interaction.reply({
          content: "لا أستطيع حظر هذا العضو.",
          ephemeral: true
        });
      }

      await interaction.guild.members.ban(user.id, {
        reason: "VEX Guard"
      });

      return interaction.reply(`🔨 تم حظر ${user}.`);
    }

    if (name === "clear") {
      const amount = interaction.options.getInteger("amount");
      const deleted = await interaction.channel.bulkDelete(amount, true);

      return interaction.reply({
        content: `🧹 تم حذف ${deleted.size} رسالة.`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error("Command error:", error);

    const response = {
      content: "حدث خطأ. تحقق من صلاحيات البوت.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response).catch(() => {});
    } else {
      await interaction.reply(response).catch(() => {});
    }
  }
});

bot.login(token);
