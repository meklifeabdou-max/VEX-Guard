
const {
  Client,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ تحقق من DISCORD_TOKEN و CLIENT_ID و GUILD_ID في GitHub Secrets.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const warnings = new Map();
const shortcuts = new Map();

const commands = [
  new SlashCommandBuilder().setName("help").setDescription("عرض أوامر VEX Guard"),

  new SlashCommandBuilder()
    .setName("warn").setDescription("تحذير عضو")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("warnings").setDescription("عرض تحذيرات عضو")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("kick").setDescription("طرد عضو")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName("ban").setDescription("حظر عضو")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("السبب"))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("unban").setDescription("فك حظر مستخدم")
    .addStringOption(o => o.setName("userid").setDescription("أيدي المستخدم").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName("timeout").setDescription("إسكات عضو مؤقتًا")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("المدة بالدقائق").setMinValue(1).setMaxValue(40320).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("untimeout").setDescription("إزالة الإسكات")
    .addUserOption(o => o.setName("user").setDescription("العضو").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName("clear").setDescription("حذف رسائل")
    .addIntegerOption(o => o.setName("amount").setDescription("العدد من 1 إلى 100").setMinValue(1).setMaxValue(100).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder().setName("lock").setDescription("قفل الروم")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder().setName("unlock").setDescription("فتح الروم")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("slowmode").setDescription("تحديد وقت الانتظار")
    .addIntegerOption(o => o.setName("seconds").setDescription("الثواني").setMinValue(0).setMaxValue(21600).setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("announce").setDescription("إرسال إعلان")
    .addStringOption(o => o.setName("text").setDescription("نص الإعلان").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder().setName("userinfo").setDescription("معلومات عضو")
    .addUserOption(o => o.setName("user").setDescription("العضو")),

  new SlashCommandBuilder().setName("ticket-setup").setDescription("إعداد لوحة التكتات")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder().setName("game").setDescription("لعبة تخمين رقم"),
  new SlashCommandBuilder().setName("games").setDescription("عرض الألعاب"),

  new SlashCommandBuilder().setName("shortcuts").setDescription("عرض الاختصارات"),

  new SlashCommandBuilder().setName("shortcut-create").setDescription("إنشاء اختصار")
    .addStringOption(o => o.setName("name").setDescription("اسم الاختصار").setRequired(true))
    .addStringOption(o => o.setName("text").setDescription("الرسالة").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder().setName("shortcut-delete").setDescription("حذف اختصار")
    .addStringOption(o => o.setName("name").setDescription("اسم الاختصار").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder().setName("shortcut-use").setDescription("استخدام اختصار")
    .addStringOption(o => o.setName("name").setDescription("اسم الاختصار").setRequired(true))
].map(c => c.toJSON());

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: commands
  });
  console.log("✅ تم تسجيل أوامر XR بنجاح.");
}

client.once(Events.ClientReady, async bot => {
  console.log(`✅ ${bot.user.tag} متصل بـ Discord`);
  console.log("🛡️ VEX Guard جاهز للعمل.");

  try {
    await registerCommands();
  } catch (error) {
    console.error("❌ فشل تسجيل الأوامر:", error.message);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton()) {
    if (interaction.customId === "vex_open_ticket") {
      await interaction.deferReply({ ephemeral: true });

      try {
        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80),
          type: ChannelType.GuildText,
          permissionOverwrites: [
            { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
            { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] }
          ]
        });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("vex_close_ticket").setLabel("إغلاق التكت").setStyle(ButtonStyle.Danger)
        );

        await channel.send({ content: `مرحبًا ${interaction.user}، اشرح طلبك هنا.`, components: [row] });
        return interaction.editReply(`✅ تم إنشاء التكت: ${channel}`);
      } catch (error) {
        console.error(error);
        return interaction.editReply("❌ تعذر إنشاء التكت. تحقق من صلاحيات البوت.");
      }
    }

    if (interaction.customId === "vex_close_ticket") {
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.reply({ content: "❌ تحتاج صلاحية إدارة القنوات لإغلاق التكت.", ephemeral: true });
      }

      await interaction.reply("🔒 سيتم إغلاق التكت.");
      return interaction.channel.delete().catch(console.error);
    }

    return;
  }

  if (!interaction.isChatInputCommand()) return;

  try {
    const { commandName, options, guild, member } = interaction;
    const ephemeral = ["warn", "warnings", "kick", "ban", "unban", "timeout", "untimeout", "clear", "lock", "unlock", "slowmode", "shortcut-create", "shortcut-delete", "shortcut-use"].includes(commandName);

    await interaction.deferReply({ ephemeral });
    const reply = content => interaction.editReply(content);

    if (commandName === "help") {
      return reply("🛡️ **VEX Guard**\n`/warn` `/warnings` `/kick` `/ban` `/unban` `/timeout` `/untimeout` `/clear` `/lock` `/unlock` `/slowmode` `/announce` `/userinfo` `/ticket-setup` `/game` `/games` `/shortcuts` `/shortcut-create` `/shortcut-delete` `/shortcut-use`");
    }

    if (commandName === "warn") {
      const user = options.getUser("user");
      const list = warnings.get(user.id) || [];
      list.push(options.getString("reason"));
      warnings.set(user.id, list);
      return reply(`⚠️ تم تحذير ${user}. عدد التحذيرات: ${list.length}`);
    }

    if (commandName === "warnings") {
      const user = options.getUser("user");
      const list = warnings.get(user.id) || [];
      return reply(list.length ? `تحذيرات ${user.tag}:\n${list.map((w, i) => `${i + 1}. ${w}`).join("\n")}` : `لا توجد تحذيرات لـ ${user.tag}.`);
    }

    if (["kick", "ban", "timeout", "untimeout"].includes(commandName)) {
      const user = options.getUser("user");
      const target = await guild.members.fetch(user.id).catch(() => null);
      if (!target) return reply("❌ العضو غير موجود في السيرفر.");
      if (user.id === interaction.user.id || user.id === client.user.id) return reply("❌ لا يمكنك تنفيذ الأمر على هذا المستخدم.");
      if (!target.manageable) return reply("❌ رتبة البوت يجب أن تكون أعلى من رتبة العضو.");

      const reason = options.getString("reason") || `بواسطة ${interaction.user.tag}`;

      if (commandName === "kick") {
        if (!target.kickable) return reply("❌ لا أملك صلاحية الطرد.");
        await target.kick(reason);
        return reply(`✅ تم طرد ${user.tag}.`);
      }

      if (commandName === "ban") {
        if (!target.bannable) return reply("❌ لا أملك صلاحية الحظر.");
        await target.ban({ reason });
        return reply(`✅ تم حظر ${user.tag}.`);
      }

      if (commandName === "timeout") {
        await target.timeout(options.getInteger("minutes") * 60000, reason);
        return reply(`✅ تم إسكات ${user.tag}.`);
      }

      await target.timeout(null, reason);
      return reply(`✅ تمت إزالة الإسكات عن ${user.tag}.`);
    }

    if (commandName === "unban") {
      try {
        await guild.members.unban(options.getString("userid"));
        return reply("✅ تم فك الحظر.");
      } catch {
        return reply("❌ تعذر فك الحظر. تحقق من ID والصلاحيات.");
      }
    }

    if (commandName === "clear") {
      const amount = options.getInteger("amount");
      const deleted = await interaction.channel.bulkDelete(amount, true);
      return reply(`🧹 تم حذف ${deleted.size} رسالة.`);
    }

    if (commandName === "lock" || commandName === "unlock") {
      await interaction.channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: commandName === "lock" ? false : null
      });
      return reply(commandName === "lock" ? "🔒 تم قفل الروم." : "🔓 تم فتح الروم.");
    }

    if (commandName === "slowmode") {
      await interaction.channel.setRateLimitPerUser(options.getInteger("seconds"));
      return reply("✅ تم تحديث Slowmode.");
    }

    if (commandName === "announce") {
      await interaction.channel.send({
        embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle("📢 إعلان XR").setDescription(options.getString("text")).setTimestamp()]
      });
      return reply("✅ تم إرسال الإعلان.");
    }

    if (commandName === "userinfo") {
      const user = options.getUser("user") || interaction.user;
      return reply(`👤 **${user.tag}**\nID: \`${user.id}\`\nأنشئ الحساب: <t:${Math.floor(user.createdTimestamp / 1000)}:D>`);
    }

    if (commandName === "ticket-setup") {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("vex_open_ticket").setLabel("فتح تكت").setEmoji("🎫").setStyle(ButtonStyle.Primary)
      );

      await interaction.channel.send({
        embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle("🎫 تكتات XR").setDescription("اضغط على الزر لفتح تكت خاص مع الإدارة.")],
        components: [row]
      });

      return reply("✅ تم إنشاء لوحة التكتات.");
    }

    if (commandName === "game") {
      return reply(`🎲 الرقم الذي اخترته هو: **${Math.floor(Math.random() * 5) + 1}**.`);
    }

    if (commandName === "games") {
      return reply("🎮 لعبة متاحة: `/game` — تخمين رقم.");
    }

    if (commandName === "shortcut-create") {
      const name = options.getString("name").toLowerCase().trim();
      const text = options.getString("text").trim();

      if (!/^[a-z0-9_-]{1,30}$/.test(name)) return reply("❌ اسم الاختصار يجب أن يستخدم حروفًا إنجليزية صغيرة أو أرقامًا أو - أو _.");
      if (text.length > 1800) return reply("❌ الرسالة طويلة جدًا.");
      shortcuts.set(name, text);
      return reply(`✅ تم إنشاء الاختصار ${name}.`);
    }

    if (commandName === "shortcut-delete") {
      const name = options.getString("name").toLowerCase().trim();
      if (!shortcuts.delete(name)) return reply("❌ الاختصار غير موجود.");
      return reply(`✅ تم حذف الاختصار ${name}.`);
    }

    if (commandName === "shortcuts") {
      return reply(shortcuts.size ? [...shortcuts.keys()].join(", ") : "لا توجد اختصارات.");
    }

    if (commandName === "shortcut-use") {
      const name = options.getString("name").toLowerCase().trim();
      return reply(shortcuts.get(name) || "❌ الاختصار غير موجود.");
    }
  } catch (error) {
    console.error("❌ خطأ أثناء تنفيذ الأمر:", error);
    const message = "❌ حدث خطأ أثناء تنفيذ الأمر. تحقق من صلاحيات البوت.";
    try {
      if (interaction.deferred || interaction.replied) await interaction.editReply(message);
      else await interaction.reply({ content: message, ephemeral: true });
    } catch {}
  }
});

process.on("unhandledRejection", error => console.error("❌ Promise:", error));

client.login(TOKEN).catch(error => {
  console.error("❌ فشل تسجيل الدخول:", error.message);
  process.exit(1);
});
