
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const warnings = new Map();

client.once("ready", () => {
  console.log(`VEX Guard online: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  const args = message.content.trim().split(/\s+/);
  const command = args[0].toLowerCase();

  if (!command.startsWith("!")) return;

  if (
    !message.member.permissions.has(
      PermissionsBitField.Flags.ModerateMembers
    )
  ) {
    return message.reply("❌ ما عندكش صلاحية الإدارة.");
  }

  if (command === "!help") {
    return message.reply(
      "**🛡️ VEX Guard**\n" +
      "`!help` — المساعدة\n" +
      "`!warn @عضو السبب` — تحذير\n" +
      "`!warnings @عضو` — عرض التحذيرات\n" +
      "`!kick @عضو السبب` — طرد\n" +
      "`!ban @عضو السبب` — حظر\n" +
      "`!timeout @عضو 10` — إسكات 10 دقائق"
    );
  }

  const member = message.mentions.members.first();

  if (!member) {
    if (command !== "!help") {
      return message.reply("❌ منشن العضو أولًا.");
    }
    return;
  }

  if (member.id === message.author.id) {
    return message.reply("❌ لا يمكنك استعمال الأمر على نفسك.");
  }

  const reason = args.slice(2).join(" ") || "لم يُحدد السبب";

  try {
    if (command === "!warn") {
      const list = warnings.get(member.id) || [];
      list.push(reason);
      warnings.set(member.id, list);

      return message.reply(`⚠️ تم تحذير ${member.user.tag}: ${reason}`);
    }

    if (command === "!warnings") {
      const list = warnings.get(member.id) || [];

      return message.reply(
        list.length
          ? list.map((w, i) => `${i + 1}. ${w}`).join("\n")
          : "✅ لا توجد تحذيرات مسجلة في هذه الجلسة."
      );
    }

    if (command === "!kick") {
      if (!member.kickable) {
        return message.reply("❌ لا أستطيع طرد هذا العضو.");
      }

      await member.kick(reason);
      return message.reply(`👢 تم طرد العضو. السبب: ${reason}`);
    }

    if (command === "!ban") {
      if (!member.bannable) {
        return message.reply("❌ لا أستطيع حظر هذا العضو.");
      }

      await member.ban({ reason });
      return message.reply(`🔨 تم حظر العضو. السبب: ${reason}`);
    }

    if (command === "!timeout") {
      const minutes = Number(args[2]);

      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 40320) {
        return message.reply("❌ مثال صحيح: `!timeout @عضو 10`");
      }

      if (!member.moderatable) {
        return message.reply("❌ لا أستطيع إسكات هذا العضو.");
      }

      await member.timeout(minutes * 60 * 1000, "إجراء إداري");
      return message.reply(`🔇 تم إسكات العضو ${minutes} دقيقة.`);
    }
  } catch (error) {
    console.error(error);
    return message.reply("❌ فشل الأمر. تحقق من صلاحيات البوت.");
  }
});

client.login(process.env.DISCORD_TOKEN);
