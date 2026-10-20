const { Client, GatewayIntentBits, PermissionFlagsBits } = require("discord.js");

const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error("ERROR: DISCORD_TOKEN is missing. Add it in GitHub repository Secrets.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", () => {
  console.log(`VEX Guard is online as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const parts = message.content.trim().split(/\s+/);
  const command = (parts[0] || "").toLowerCase();

  if (command === "!help") {
    return message.reply(
      "**VEX Guard Commands**\n" +
      "`!help` — Show commands\n" +
      "`!warn @member [reason]` — Record a warning message\n" +
      "`!kick @member [reason]` — Kick a member\n" +
      "`!ban @member [reason]` — Ban a member"
    );
  }

  if (command === "!warn") {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return message.reply("You do not have permission to use this command.");
    }
    const member = message.mentions.members.first();
    if (!member) return message.reply("Usage: `!warn @member [reason]`");
    const reason = parts.slice(2).join(" ") || "No reason provided";
    return message.channel.send(`⚠️ ${member.user.tag} received a warning. Reason: ${reason}`);
  }

  if (command === "!kick") {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply("You do not have permission to use this command.");
    }
    const member = message.mentions.members.first();
    if (!member) return message.reply("Usage: `!kick @member [reason]`");
    if (!member.kickable) return message.reply("I cannot kick this member. Check my role position and permissions.");
    const reason = parts.slice(2).join(" ") || "No reason provided";
    try {
      await member.kick(reason);
      return message.channel.send(`👢 ${member.user.tag} was kicked. Reason: ${reason}`);
    } catch {
      return message.reply("Kick failed. Check the bot's permissions and role position.");
    }
  }

  if (command === "!ban") {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply("You do not have permission to use this command.");
    }
    const member = message.mentions.members.first();
    if (!member) return message.reply("Usage: `!ban @member [reason]`");
    if (!member.bannable) return message.reply("I cannot ban this member. Check my role position and permissions.");
    const reason = parts.slice(2).join(" ") || "No reason provided";
    try {
      await member.ban({ reason });
      return message.channel.send(`🔨 ${member.user.tag} was banned. Reason: ${reason}`);
    } catch {
      return message.reply("Ban failed. Check the bot's permissions and role position.");
    }
  }
});

client.on("error", (error) => console.error("Discord client error:", error));

client.login(token).catch((error) => {
  console.error("Failed to connect to Discord:", error.message);
  process.exit(1);
});
