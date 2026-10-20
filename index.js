
const Discord = require("discord.js");

const VexClient = Discord.Client;
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  throw new Error("Missing DISCORD_TOKEN or CLIENT_ID.");
}

const bot = new VexClient({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.MessageContent
  ]
});

const slashCommands = [
  new Discord.SlashCommandBuilder()
    .setName("help")
    .setDescription("عرض أوامر VEX Guard"),

  new Discord.SlashCommandBuilder()
    .setName("warn")
    .setDescription("تحذير عضو")
    .addUserOption(o =>
      o.setName("member").setDescription("العضو").setRequired(true))
    .addStringOption(o =>
      o.setName("reason").setDescription("السبب").setRequired(true)),

  new Discord.SlashCommandBuilder()
    .setName("kick")
    .setDescription("طرد عضو")
    .addUserOption(o =>
      o.setName("member").setDescription("العضو").setRequired(true)),

  new Discord.SlashCommandBuilder()
    .setName("ban")
    .setDescription("حظر عضو")
    .addUserOption(o =>
      o.setName("member").setDescription("العضو").setRequired(true)),

  new Discord.SlashCommandBuilder()
    .setName("clear")
    .setDescription("حذف رسائل")
    .addIntegerOption(o =>
      o.setName("amount").setDescription("العدد")
        .setMinValue(1).setMaxValue(100).setRequired(true))
].map(command => command.toJSON());

bot.once("clientReady", async () => {
  console.log(`VEX Guard online: ${bot.user.tag}`);

  try {
    const rest = new Discord.REST({ version: "10" }).setToken(TOKEN);
    const route = GUILD_ID
      ? Discord.Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID)
      : Discord.Routes.applicationCommands(CLIENT_ID);

    await rest.put(route, { body: slashCommands });
    console.log("Commands registered.");
  } catch (error) {
    console.error("Command registration error:", error);
  }
});

bot.on("messageCreate", async message => {
  if (!message.guild || message.author.bot) return;
  if (message.member?.permissions.has(
    Discord.PermissionFlagsBits.ManageMessages
  )) return;

  if (/https?:\/\/\S+|discord\.gg\/\S+/i.test(message.content)) {
    try {
      await message.delete();
    } catch (error) {
      console.error("Link protection:", error);
    }
  }
});

bot.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const { commandName } = interaction;
    const isAdmin = interaction.memberPermissions?.has(
      Discord.PermissionFlagsBits.Administrator
    );

    if (commandName === "help") {
      return interaction.reply({
        content: "🛡️ VEX Guard — XR\n/help • /warn • /kick • /ban • /clear",
        ephemeral: true
      });
    }

    if (!isAdmin) {
      return interaction.reply({
        content: "❌ هذا الأمر للإدارة فقط.",
        ephemeral: true
      });
    }

    if (commandName === "warn") {
      const user = interaction.options.getUser("member");
      const reason = interaction.options.getString("reason");

      return interaction.reply(
        `⚠️ تحذير ${user}\nالسبب: ${reason}`
      );
    }

    if (commandName === "kick") {
      const user = interaction.options.getUser("member");
      const member = await interaction.guild.members.fetch(user.id);

      if (!member.kickable) {
        return interaction.reply({
          content: "لا أستطيع طرد هذا العضو بسبب الصلاحيات أو ترتيب الرتب.",
          ephemeral: true
        });
      }

      await member.kick("VEX Guard moderation");
      return interaction.reply(`👢 تم طرد ${user}.`);
    }

    if (commandName === "ban") {
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
        reason: "VEX Guard moderation"
      });

      return interaction.reply(`🔨 تم حظر ${user}.`);
    }

    if (commandName === "clear") {
      const amount = interaction.options.getInteger("amount");
      const deleted = await interaction.channel.bulkDelete(amount, true);

      return interaction.reply({
        content: `🧹 تم حذف ${deleted.size} رسالة.`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error("VEX Guard command error:", error);

    const reply = {
      content: "حدث خطأ. تحقق من صلاحيات البوت وسجلات التشغيل.",
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

bot.login(TOKEN);
