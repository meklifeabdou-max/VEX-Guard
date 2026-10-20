
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ أضف DISCORD_TOKEN و CLIENT_ID في Environment Variables.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const commands = [];
const admin = PermissionFlagsBits.Administrator;
const moderate = PermissionFlagsBits.ModerateMembers;
const kickPerm = PermissionFlagsBits.KickMembers;
const banPerm = PermissionFlagsBits.BanMembers;
const manageMessages = PermissionFlagsBits.ManageMessages;
const manageChannels = PermissionFlagsBits.ManageChannels;
const manageRoles = PermissionFlagsBits.ManageRoles;

function add(name, description, options = [], permission = null) {
  const command = new SlashCommandBuilder()
    .setName(name)
    .setDescription(description);

  for (const option of options) {
    command.addStringOption(o =>
      o.setName(option.name)
        .setDescription(option.description)
        .setRequired(option.required ?? true)
    );
  }

  if (permission) {
    command.setDefaultMemberPermissions(permission);
  }

  commands.push(command);
}

const target = [{
  name: "user",
  description: "معرّف العضو أو منشنه",
  required: true
}];

const reason = [{
  name: "reason",
  description: "سبب الإجراء",
  required: false
}];

const targetReason = [...target, ...reason];

// 1–10: معلومات ومساعدة
add("help", "عرض قائمة أوامر VEX Guard");
add("ping", "فحص سرعة استجابة البوت");
add("botinfo", "معلومات البوت");
add("serverinfo", "معلومات السيرفر");
add("userinfo", "معلومات عضو", target);
add("avatar", "عرض صورة عضو", target);
add("membercount", "عدد أعضاء السيرفر");
add("roleinfo", "معلومات رتبة", [{
  name: "role",
  description: "اسم الرتبة أو معرّفها"
}]);
add("channelinfo", "معلومات الروم");
add("uptime", "مدة تشغيل البوت");

// 11–20: الإدارة
add("kick", "طرد عضو", targetReason, kickPerm);
add("ban", "حظر عضو", targetReason, banPerm);
add("unban", "فك الحظر عن عضو", target);
add("timeout", "إسكات عضو بالدقائق", [
  ...target,
  { name: "minutes", description: "المدة بالدقائق" },
  ...reason
], moderate);
add("untimeout", "إلغاء إسكات عضو", target, moderate);
add("warn", "تسجيل تحذير لعضو", targetReason, moderate);
add("clear", "مسح الرسائل", [{
  name: "amount",
  description: "عدد الرسائل من 1 إلى 100"
}], manageMessages);
add("lock", "قفل الروم الحالي", [], manageChannels);
add("unlock", "فتح الروم الحالي", [], manageChannels);
add("slowmode", "تحديد بطء المحادثة بالثواني", [{
  name: "seconds",
  description: "من 0 إلى 21600"
}], manageChannels);

// 21–30: الرتب والقنوات
add("nick", "تغيير لقب عضو", [
  ...target,
  { name: "nickname", description: "اللقب الجديد" }
], admin);
add("addrole", "إضافة رتبة لعضو", [
  ...target,
  { name: "role", description: "معرّف الرتبة" }
], manageRoles);
add("removerole", "نزع رتبة من عضو", [
  ...target,
  { name: "role", description: "معرّف الرتبة" }
], manageRoles);
add("announce", "إرسال إعلان في الروم الحالي", [{
  name: "message",
  description: "نص الإعلان"
}], admin);
add("embed", "إرسال رسالة منسقة", [{
  name: "message",
  description: "النص"
}], admin);
add("poll", "إنشاء تصويت بسيط", [{
  name: "question",
  description: "سؤال التصويت"
}]);
add("say", "إرسال رسالة باسم البوت", [{
  name: "message",
  description: "الرسالة"
}], admin);
add("servericon", "عرض صورة السيرفر");
add("serverroles", "عرض عدد الرتب");
add("channels", "عدد قنوات السيرفر");

// 31–40: الحماية والإشراف
add("purgeuser", "مسح رسائل عضو من آخر 100 رسالة", target, manageMessages);
add("deafen", "كتم عضو صوتيًا", target, moderate);
add("undeafen", "إلغاء الكتم الصوتي", target, moderate);
add("move", "نقل عضو إلى رومك الصوتي", target, moderate);
add("disconnect", "فصل عضو عن الصوت", target, moderate);
add("rolelist", "عرض قائمة الرتب");
add("botlist", "عرض البوتات الموجودة");
add("memberlist", "عرض عدد الأعضاء والبوتات");
add("checkperms", "عرض صلاحياتك");
add("report", "إرسال بلاغ للإدارة", [{
  name: "message",
  description: "تفاصيل البلاغ"
}]);

// 41–50: أدوات إضافية
add("coinflip", "رمي قطعة نقدية");
add("roll", "رمي نرد");
add("choose", "اختيار عشوائي بين خيارين", [
  { name: "first", description: "الخيار الأول" },
  { name: "second", description: "الخيار الثاني" }
]);
add("eightball", "اسأل الكرة السحرية", [{
  name: "question",
  description: "سؤالك"
}]);
add("hug", "إرسال تحية ودية لعضو", target);
add("ship", "توافق الصداقة بين عضوين", [
  ...target,
  { name: "other", description: "معرّف العضو الثاني" }
]);
add("joke", "نكتة عشوائية");
add("quote", "عبارة تحفيزية");
add("remind", "تذكير برسالة داخل السيرفر", [{
  name: "message",
  description: "التذكير"
}]);
add("support", "معلومات الدعم");

const rest = new REST({
  version: "10",
  timeout: 120000
}).setToken(TOKEN);

async function registerCommands() {
  console.log(`3️⃣ جاري تسجيل ${commands.length} أمرًا عالميًا...`);

  const route = Routes.applicationCommands(CLIENT_ID);
  let timer;

  try {
    const request = rest.put(route, {
      body: commands.map(command => command.toJSON())
    });

    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error("انتهت مهلة تسجيل الأوامر بعد دقيقتين."));
      }, 120000);
    });

    const result = await Promise.race([request, timeout]);
    clearTimeout(timer);

    console.log(`✅ تم تسجيل ${result.length} أمرًا عالميًا.`);
  } catch (error) {
    clearTimeout(timer);
    console.error("❌ فشل تسجيل الأوامر:");
    console.error(error.stack || error.message);

    if (error.status) console.error("HTTP status:", error.status);
    if (error.code) console.error("Error code:", error.code);

    throw error;
  }
}

client.once("ready", () => {
  console.log(`🤖 البوت متصل باسم ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, guild, member } = interaction;

  const reply = async message => {
    if (interaction.deferred || interaction.replied) {
      return interaction.followUp({
        content: message,
        ephemeral: true
      });
    }

    return interaction.reply({
      content: message,
      ephemeral: true
    });
  };

  try {
    if (!guild) {
      return reply("❌ هذا الأمر يعمل داخل السيرفرات فقط.");
    }

    if (commandName === "help") {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("VEX Guard | قائمة الأوامر")
        .setDescription(
          commands.map(c => `/${c.name} — ${c.description}`).join("\n")
        );

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (commandName === "ping") {
      return reply(`🏓 Pong! ${client.ws.ping}ms`);
    }

    if (commandName === "uptime") {
      const seconds = Math.floor(client.uptime / 1000);
      return reply(
        `⏱️ مدة التشغيل: ${Math.floor(seconds / 3600)}س ${Math.floor(seconds % 3600 / 60)}د`
      );
    }

    if (commandName === "botinfo") {
      return reply(`🤖 ${client.user.tag}\n📋 ${commands.length} أمرًا مسجلًا`);
    }

    if (commandName === "serverinfo") {
      return reply(
        `🏠 ${guild.name}\n👥 الأعضاء: ${guild.memberCount}\n🆔 ${guild.id}`
      );
    }

    if (commandName === "membercount" || commandName === "memberlist") {
      return reply(`👥 عدد الأعضاء: ${guild.memberCount}`);
    }

    if (commandName === "servericon") {
      return reply(guild.iconURL({ size: 1024 }) || "لا توجد صورة للسيرفر.");
    }

    if (commandName === "channels") {
      return reply(`📚 عدد القنوات: ${guild.channels.cache.size}`);
    }

    if (commandName === "serverroles" || commandName === "rolelist") {
      return reply(
        guild.roles.cache.map(r => r.name).slice(0, 50).join("، ") ||
        "لا توجد رتب."
      );
    }

    if (commandName === "botlist") {
      const members = await guild.members.fetch();
      const bots = members.filter(m => m.user.bot);
      return reply(`🤖 عدد البوتات: ${bots.size}`);
    }

    if (commandName === "checkperms") {
      return reply(`🔐 صلاحياتك:\n${member.permissions.toArray().join(", ")}`);
    }

    if (commandName === "userinfo" || commandName === "avatar") {
      const id = interaction.options.getString("user").replace(/[<@!>]/g, "");
      const user = await client.users.fetch(id);

      if (commandName === "avatar") {
        return reply(user.displayAvatarURL({ size: 1024 }));
      }

      return reply(
        `👤 ${user.tag}\n🆔 ${user.id}\n📅 إنشاء الحساب: <t:${Math.floor(user.createdTimestamp / 1000)}:D>`
      );
    }

    if (commandName === "roleinfo") {
      const input = interaction.options.getString("role");
      const role = guild.roles.cache.get(input) ||
        guild.roles.cache.find(r => r.name === input);

      return reply(role
        ? `🏷️ ${role.name}\n🆔 ${role.id}\n👥 ${role.members.size} عضو`
        : "❌ لم أجد الرتبة.");
    }

    if (commandName === "channelinfo") {
      return reply(
        `📍 ${interaction.channel.name}\n🆔 ${interaction.channel.id}`
      );
    }

    if (commandName === "lock" || commandName === "unlock") {
      const locked = commandName === "lock";

      await interaction.channel.permissionOverwrites.edit(
        guild.roles.everyone,
        { SendMessages: !locked }
      );

      return reply(locked ? "🔒 تم قفل الروم." : "🔓 تم فتح الروم.");
    }

    if (commandName === "slowmode") {
      const seconds = Number(interaction.options.getString("seconds"));

      if (!Number.isInteger(seconds) || seconds < 0 || seconds > 21600) {
        return reply("❌ اختر رقمًا من 0 إلى 21600.");
      }

      await interaction.channel.setRateLimitPerUser(seconds);
      return reply(`✅ تم ضبط Slowmode إلى ${seconds} ثانية.`);
    }

    if (commandName === "clear") {
      const amount = Number(interaction.options.getString("amount"));

      if (!Number.isInteger(amount) || amount < 1 || amount > 100) {
        return reply("❌ اختر عددًا من 1 إلى 100.");
      }

      await interaction.deferReply({ ephemeral: true });
      const deleted = await interaction.channel.bulkDelete(amount, true);

      return interaction.editReply(`🧹 تم حذف ${deleted.size} رسالة.`);
    }

    if (commandName === "purgeuser") {
      const id = interaction.options.getString("user").replace(/[<@!>]/g, "");
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const matches = messages.filter(m => m.author.id === id);
      const deleted = await interaction.channel.bulkDelete(matches, true);

      return reply(`🧹 تم حذف ${deleted.size} رسالة.`);
    }

    if ([
      "kick", "ban", "timeout", "untimeout", "unban", "warn"
    ].includes(commandName)) {
      const id = interaction.options.getString("user").replace(/[<@!>]/g, "");
      const why = interaction.options.getString("reason") || "لم يُذكر سبب";

      if (commandName === "unban") {
        await guild.members.unban(id, why);
        return reply("✅ تم فك الحظر.");
      }

      const targetMember = await guild.members.fetch(id).catch(() => null);
      if (!targetMember) return reply("❌ لم أجد العضو.");

      if (targetMember.id === interaction.user.id) {
        return reply("❌ لا يمكنك تطبيق هذا الإجراء على نفسك.");
      }

      if (!targetMember.manageable && commandName !== "warn") {
        return reply("❌ رتبة البوت يجب أن تكون أعلى من رتبة العضو.");
      }

      if (commandName === "kick") await targetMember.kick(why);
      if (commandName === "ban") await targetMember.ban({ reason: why });
      if (commandName === "untimeout") await targetMember.timeout(null, why);

      if (commandName === "timeout") {
        const minutes = Number(interaction.options.getString("minutes"));

        if (!Number.isInteger(minutes) || minutes < 1 || minutes > 40320) {
          return reply("❌ المدة يجب أن تكون من 1 إلى 40320 دقيقة.");
        }

        await targetMember.timeout(minutes * 60000, why);
      }

      if (commandName === "warn") {
        return reply(
          `⚠️ تحذير لـ ${targetMember.user.tag}\nالسبب: ${why}\nهذا التحذير غير محفوظ في قاعدة بيانات.`
        );
      }

      return reply(`✅ تم تنفيذ ${commandName} على ${targetMember.user.tag}.`);
    }

    if (commandName === "nick") {
      const id = interaction.options.getString("user").replace(/[<@!>]/g, "");
      const nickname = interaction.options.getString("nickname");
      const m = await guild.members.fetch(id);

      await m.setNickname(nickname);
      return reply("✅ تم تغيير اللقب.");
    }

    if (commandName === "addrole" || commandName === "removerole") {
      const id = interaction.options.getString("user").replace(/[<@!>]/g, "");
      const roleId = interaction.options.getString("role").replace(/[<@&>]/g, "");
      const m = await guild.members.fetch(id);
      const role = guild.roles.cache.get(roleId);

      if (!role) return reply("❌ لم أجد الرتبة.");

      if (
        role.managed ||
        role.position >= guild.members.me.roles.highest.position
      ) {
        return reply("❌ لا يستطيع البوت إدارة هذه الرتبة.");
      }

      if (commandName === "addrole") await m.roles.add(role);
      else await m.roles.remove(role);

      return reply("✅ تم تحديث الرتب.");
    }

    if (commandName === "announce" || commandName === "say") {
      await interaction.channel.send(
        interaction.options.getString("message")
      );
      return reply("✅ تم إرسال الرسالة.");
    }

    if (commandName === "embed") {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setDescription(interaction.options.getString("message"));

      await interaction.channel.send({ embeds: [embed] });
      return reply("✅ تم إرسال Embed.");
    }

    if (commandName === "poll") {
      const question = interaction.options.getString("question");
      const poll = await interaction.channel.send(
        `📊 **${question}**\n👍 = نعم\n👎 = لا`
      );

      await poll.react("👍");
      await poll.react("👎");

      return reply("✅ تم إنشاء التصويت.");
    }

    if (commandName === "report") {
      return reply("📩 استلمت البلاغ. ربطه بروم الإدارة يحتاج إعدادًا إضافيًا.");
    }

    if (commandName === "coinflip") {
      return reply(Math.random() < 0.5 ? "🪙 صورة!" : "🪙 كتابة!");
    }

    if (commandName === "roll") {
      return reply(`🎲 النتيجة: ${Math.floor(Math.random() * 6) + 1}`);
    }

    if (commandName === "choose") {
      return reply(
        Math.random() < 0.5
          ? interaction.options.getString("first")
          : interaction.options.getString("second")
      );
    }

    if (commandName === "eightball") {
      const answers = [
        "نعم بالتأكيد!",
        "لا أعتقد ذلك.",
        "ربما!",
        "اسألني لاحقًا.",
        "مستحيل!"
      ];

      return reply(answers[Math.floor(Math.random() * answers.length)]);
    }

    if (commandName === "joke") {
      return reply("😂 لماذا الكمبيوتر بردان؟ لأنه فاتح الويندوز!");
    }

    if (commandName === "quote") {
      return reply("💪 النجاح يحتاج صبرًا واستمرارًا، لا استسلامًا.");
    }

    if (commandName === "support") {
      return reply("🛡️ VEX Guard — للمساعدة، تواصل مع إدارة السيرفر.");
    }

    if (commandName === "hug" || commandName === "ship") {
      return reply("💙 انشروا المحبة والاحترام بين أعضاء السيرفر!");
    }

    if ([
      "deafen", "undeafen", "move", "disconnect"
    ].includes(commandName)) {
      const id = interaction.options.getString("user").replace(/[<@!>]/g, "");
      const m = await guild.members.fetch(id);

      if (!m.voice.channel) return reply("❌ العضو ليس في روم صوتي.");

      if (commandName === "deafen") await m.voice.setDeaf(true);
      if (commandName === "undeafen") await m.voice.setDeaf(false);
      if (commandName === "disconnect") await m.voice.disconnect();

      if (commandName === "move") {
        if (!member.voice.channel) return reply("❌ ادخل رومًا صوتيًا أولًا.");
        await m.voice.setChannel(member.voice.channel);
      }

      return reply("✅ تم تنفيذ الإجراء الصوتي.");
    }

    if (commandName === "remind") {
      return reply("⏰ التذكير التلقائي يحتاج نظام تخزين ومؤقتات إضافيًا.");
    }

    return reply("⚙️ هذا الأمر مسجل لكن وظيفته تحتاج استكمالًا.");
  } catch (error) {
    console.error(`خطأ في /${commandName}:`, error);

    const message = "❌ حدث خطأ. تحقق من صلاحيات البوت وترتيب الرتب.";

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({
        content: message,
        ephemeral: true
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: message,
        ephemeral: true
      }).catch(() => {});
    }
  }
});

async function main() {
  console.log("1️⃣ بدأ تشغيل VEX Guard");
  console.log("2️⃣ تجهيز الأوامر...");
  console.log(`📋 عدد الأوامر: ${commands.length}`);

  try {
    await registerCommands();
  } catch (error) {
    console.error("⚠️ لم يكتمل تسجيل الأوامر. أوقف التشغيل لتجنب حالة غير واضحة.");
    process.exitCode = 1;
    return;
  }

  try {
    await client.login(TOKEN);
  } catch (error) {
    console.error("❌ فشل اتصال البوت:", error.message);
    process.exitCode = 1;
  }
}

client.on("error", error => {
  console.error("Discord client error:", error);
});

process.on("unhandledRejection", error => {
  console.error("Unhandled rejection:", error);
});

main();
