
const {
  Client, GatewayIntentBits, PermissionFlagsBits, ChannelType,
  SlashCommandBuilder, REST, Routes, EmbedBuilder
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ تحقق من أسرار GitHub الثلاثة.");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const warnings = new Map();
const games = new Map();

const cmd = (name, description) =>
  new SlashCommandBuilder().setName(name).setDescription(description);

const userOption = (c, name = "member") =>
  c.addUserOption(o => o.setName(name).setDescription("العضو").setRequired(true));

const stringOption = (c, name, description, required = true) =>
  c.addStringOption(o => o.setName(name).setDescription(description).setRequired(required));

const integerOption = (c, name, description, min, max, required = true) =>
  c.addIntegerOption(o => o.setName(name).setDescription(description)
    .setMinValue(min).setMaxValue(max).setRequired(required));

const roleOption = c =>
  c.addRoleOption(o => o.setName("role").setDescription("الرتبة").setRequired(true));

const channelOption = (c, name = "channel") =>
  c.addChannelOption(o => o.setName(name).setDescription("القناة")
    .addChannelTypes(ChannelType.GuildText).setRequired(false));

const commands = [
  cmd("help", "عرض جميع الأوامر"),
  cmd("ping", "فحص استجابة البوت"),
  cmd("serverinfo", "معلومات السيرفر"),
  cmd("userinfo", "معلومات عضو").addUserOption(o => o.setName("member").setDescription("العضو")),
  cmd("avatar", "عرض صورة عضو").addUserOption(o => o.setName("member").setDescription("العضو")),
  cmd("servericon", "عرض صورة السيرفر"),
  cmd("membercount", "عدد أعضاء السيرفر"),
  cmd("botinfo", "معلومات البوت"),
  cmd("roleinfo", "معلومات رتبة").addRoleOption(o => o.setName("role").setDescription("الرتبة").setRequired(true)),
  cmd("channelinfo", "معلومات القناة").addChannelOption(o => o.setName("channel").setDescription("القناة")),

  userOption(stringOption(cmd("warn", "تحذير عضو"), "reason", "السبب")),
  userOption(cmd("warnings", "عرض تحذيرات عضو")),
  userOption(stringOption(cmd("kick", "طرد عضو"), "reason", "السبب", false)),
  userOption(stringOption(cmd("ban", "حظر عضو"), "reason", "السبب", false)),
  stringOption(cmd("unban", "فك حظر مستخدم"), "userid", "معرف المستخدم"),
  userOption(integerOption(cmd("timeout", "تقييد عضو"), "minutes", "عدد الدقائق", 1, 40320)),
  userOption(cmd("untimeout", "إزالة التقييد")),
  integerOption(cmd("clear", "حذف رسائل"), "amount", "عدد الرسائل", 1, 100),
  cmd("banlist", "عرض قائمة المحظورين"),
  userOption(cmd("resetwarnings", "مسح تحذيرات عضو")),

  userOption(roleOption(cmd("role", "منح رتبة لعضو"))),
  userOption(roleOption(cmd("unrole", "إزالة رتبة من عضو"))),
  userOption(stringOption(cmd("setnick", "تغيير لقب عضو"), "nickname", "اللقب الجديد", true)),
  cmd("lock", "قفل القناة الحالية"),
  cmd("unlock", "فتح القناة الحالية"),
  integerOption(cmd("slowmode", "تحديد بطء المحادثة"), "seconds", "الثواني", 0, 21600),
  stringOption(cmd("announce", "إرسال إعلان"), "message", "نص الإعلان"),
  stringOption(cmd("say", "إرسال رسالة باسم البوت"), "message", "الرسالة"),
  stringOption(cmd("embed", "إرسال رسالة بتنسيق Embed"), "message", "محتوى الرسالة"),
  stringOption(cmd("poll", "إنشاء تصويت بسيط"), "question", "السؤال"),
  stringOption(cmd("createchannel", "إنشاء قناة نصية"), "name", "اسم القناة"),
  stringOption(cmd("createcategory", "إنشاء تصنيف"), "name", "اسم التصنيف"),
  stringOption(cmd("renamechannel", "تغيير اسم القناة الحالية"), "name", "الاسم الجديد"),
  cmd("createvoice", "إنشاء قناة صوتية").addStringOption(o => o.setName("name").setDescription("اسم القناة").setRequired(true)),
  cmd("deletechannel", "حذف القناة الحالية"),

  cmd("rps", "لعبة حجر ورقة مقص")
    .addStringOption(o => o.setName("choice").setDescription("اختيارك").setRequired(true)
      .addChoices({name:"حجر",value:"rock"},{name:"ورقة",value:"paper"},{name:"مقص",value:"scissors"})),
  integerOption(cmd("guess", "تخمين رقم"), "number", "رقم من 1 إلى 10", 1, 10, false),
  integerOption(cmd("math", "تحدي الحساب"), "answer", "الإجابة", -100000, 100000, false),
  cmd("dice", "رمي النرد"),
  cmd("coinflip", "وجه أو كتابة"),
  stringOption(cmd("choose", "اختر بين خيارات"), "options", "افصل الخيارات بفاصلة"),
  stringOption(cmd("8ball", "اسأل الكرة السحرية"), "question", "سؤالك"),
  integerOption(cmd("roll", "توليد رقم عشوائي"), "max", "أكبر رقم", 2, 100000),
  stringOption(cmd("repeat", "تكرار نص بشكل آمن"), "text", "النص"),
  cmd("hug", "إرسال تحية ودية لعضو").addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true)),
  cmd("emojiinfo", "عرض معلومات إيموجي").addStringOption(o => o.setName("emoji").setDescription("الإيموجي").setRequired(true)),
  cmd("rolelist", "عرض رتب السيرفر"),
  cmd("channellist", "عرض قنوات السيرفر"),
  cmd("uptime", "مدة تشغيل البوت"),
  cmd("date", "عرض التاريخ والوقت"),
  cmd("support", "معلومات مساعدة البوت")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

const publicReply = (interaction, content) =>
  interaction.reply({ content, allowedMentions: { parse: [] } });

client.once("ready", () => {
  console.log(`🛡️ VEX Guard متصل: ${client.user.tag}`);
});

client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;

  const name = i.commandName;
  const g = i.guild;
  const member = i.member;
  const opt = i.options;
  const say = text => publicReply(i, text);
  const targetUser = opt.getUser("member");
  const targetMember = targetUser
    ? await g.members.fetch(targetUser.id).catch(() => null)
    : null;

  const need = async permission => {
    if (!member.permissions.has(permission)) {
      await say("❌ لا تملك صلاحية تنفيذ هذا الأمر.");
      return false;
    }
    return true;
  };

  try {
    if (!g) return say("❌ استخدم الأمر داخل السيرفر.");

    // المعلومات والأوامر العامة
    if (name === "help") {
      const e = new EmbedBuilder().setColor(0x5865F2)
        .setTitle("🛡️ VEX Guard — 50 أمرًا")
        .setDescription(commands.map(c => `\`/${c.name}\``).join(" • "));
      return i.reply({ embeds: [e] });
    }

    if (name === "ping") return say(`🏓 Ping: ${client.ws.ping}ms`);
    if (name === "membercount") return say(`👥 عدد الأعضاء: **${g.memberCount}**`);
    if (name === "uptime") {
      const seconds = Math.floor(client.uptime / 1000);
      return say(`⏱️ مدة التشغيل: ${Math.floor(seconds / 3600)} ساعة و${Math.floor(seconds % 3600 / 60)} دقيقة.`);
    }
    if (name === "date") return say(`🕒 ${new Date().toLocaleString("ar-DZ", { timeZone: "Africa/Algiers" })}`);
    if (name === "support") return say("🛡️ VEX Guard — للمساعدة جرّب `/help` أو تواصل مع إدارة السيرفر.");
    if (name === "botinfo") return say(`🤖 ${client.user.tag}\n🟢 متصل\n⏱️ Ping: ${client.ws.ping}ms`);
    if (name === "servericon") return say(g.iconURL({ size: 1024 }) || "السيرفر ليس لديه صورة.");
    if (name === "avatar") {
      const u = targetUser || i.user;
      return i.reply({ embeds: [new EmbedBuilder().setTitle(`صورة ${u.username}`).setImage(u.displayAvatarURL({ size: 1024 })).setColor(0x5865F2)] });
    }
    if (name === "userinfo") {
      const u = targetUser || i.user;
      const m = await g.members.fetch(u.id).catch(() => null);
      const e = new EmbedBuilder().setColor(0x5865F2).setTitle(`معلومات ${u.tag}`)
        .setThumbnail(u.displayAvatarURL({ size: 512 }))
        .addFields({ name: "ID", value: u.id }, { name: "إنشاء الحساب", value: `<t:${Math.floor(u.createdTimestamp / 1000)}:D>` });
      if (m?.joinedTimestamp) e.addFields({ name: "الانضمام", value: `<t:${Math.floor(m.joinedTimestamp / 1000)}:D>` });
      return i.reply({ embeds: [e] });
    }
    if (name === "serverinfo") {
      return i.reply({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle(g.name)
        .setThumbnail(g.iconURL()).addFields(
          { name: "الأعضاء", value: String(g.memberCount), inline: true },
          { name: "القنوات", value: String(g.channels.cache.size), inline: true },
          { name: "الرتب", value: String(g.roles.cache.size), inline: true }
        )] });
    }
    if (name === "roleinfo") {
      const r = opt.getRole("role");
      return say(`🏷️ **${r.name}**\nID: ${r.id}\nعدد الأعضاء: ${r.members.size}\nلون الرتبة: ${r.hexColor}`);
    }
    if (name === "channelinfo") {
      const c = opt.getChannel("channel") || i.channel;
      return say(`📁 ${c}\nالاسم: ${c.name}\nID: ${c.id}`);
    }
    if (name === "rolelist") return say("🏷️ الرتب:\n" + g.roles.cache.map(r => r.name).slice(0, 50).join("، "));
    if (name === "channellist") return say("📁 القنوات:\n" + g.channels.cache.map(c => c.name).slice(0, 50).join("، "));

    // الألعاب
    if (name === "rps") {
      const choices = ["rock", "paper", "scissors"];
      const em = { rock: "🪨 حجر", paper: "📄 ورقة", scissors: "✂️ مقص" };
      const a = opt.getString("choice");
      const b = choices[Math.floor(Math.random() * 3)];
      const win = (a === "rock" && b === "scissors") ||
        (a === "paper" && b === "rock") || (a === "scissors" && b === "paper");
      return say(`أنت: ${em[a]}\nالبوت: ${em[b]}\n${a === b ? "🤝 تعادل!" : win ? "🏆 فزت!" : "😄 خسرت هذه المرة!"}`);
    }
    if (name === "guess") {
      const key = `${g.id}:${i.user.id}`;
      const n = opt.getInteger("number");
      if (n === null) {
        games.set(key, { type: "guess", answer: 1 + Math.floor(Math.random() * 10) });
        return say("🔢 بدأت اللعبة! استعمل `/guess number:` لتخمين رقم من 1 إلى 10.");
      }
      const game = games.get(key);
      if (!game || game.type !== "guess") return say("ابدأ أولًا باستعمال `/guess` من دون رقم.");
      games.delete(key);
      return say(n === game.answer ? "🎉 صحيح!" : `❌ الرقم الصحيح هو ${game.answer}.`);
    }
    if (name === "math") {
      const key = `${g.id}:${i.user.id}`;
      const n = opt.getInteger("answer");
      if (n === null) {
        const a = 1 + Math.floor(Math.random() * 20), b = 1 + Math.floor(Math.random() * 20);
        games.set(key, { type: "math", answer: a + b });
        return say(`🧠 احسب: **${a} + ${b}** ثم أرسل `/math answer:` مع إجابتك.`);
      }
      const game = games.get(key);
      if (!game || game.type !== "math") return say("ابدأ أولًا باستعمال `/math` من دون إجابة.");
      games.delete(key);
      return say(n === game.answer ? "🎉 إجابة صحيحة!" : `❌ الإجابة الصحيحة: ${game.answer}`);
    }
    if (name === "dice") return say(`🎲 النرد: ${1 + Math.floor(Math.random() * 6)}`);
    if (name === "coinflip") return say(`🪙 ${Math.random() < 0.5 ? "وجه" : "كتابة"}`);
    if (name === "roll") return say(`🎲 الرقم: ${1 + Math.floor(Math.random() * opt.getInteger("max"))}`);
    if (name === "choose") {
      const a = opt.getString("options").split(",").map(x => x.trim()).filter(Boolean);
      if (a.length < 2) return say("اكتب خيارين على الأقل وافصل بينهما بفاصلة.");
      return say(`🎯 اختياري: **${a[Math.floor(Math.random() * a.length)]}**`);
    }
    if (name === "8ball") return say(["🎱 نعم!", "🤔 ربما.", "❌ لا.", "✨ اسأل لاحقًا."][Math.floor(Math.random() * 4)]);
    if (name === "repeat") return say(opt.getString("text").slice(0, 1800));
    if (name === "hug") return say(`🤗 ${i.user} يرسل تحية ودية إلى ${targetUser}!`);
    if (name === "emojiinfo") return say(`😀 الإيموجي: ${opt.getString("emoji")}`);

    // إدارة الأعضاء
    if (name === "warn") {
      if (!await need(PermissionFlagsBits.ModerateMembers)) return;
      const reason = opt.getString("reason");
      const key = `${g.id}:${targetUser.id}`;
      const a = warnings.get(key) || [];
      a.push({ reason, moderator: i.user.tag });
      warnings.set(key, a);
      return say(`⚠️ تم تحذير ${targetUser.tag}.\nالسبب: ${reason}\nعدد التحذيرات: ${a.length}`);
    }
    if (name === "warnings") {
      if (!await need(PermissionFlagsBits.ModerateMembers)) return;
      const a = warnings.get(`${g.id}:${targetUser.id}`) || [];
      return say(a.length ? a.map((w, n) => `${n + 1}. ${w.reason} — ${w.moderator}`).join("\n") : "✅ لا توجد تحذيرات مسجلة.");
    }
    if (name === "resetwarnings") {
      if (!await need(PermissionFlagsBits.ModerateMembers)) return;
      warnings.delete(`${g.id}:${targetUser.id}`);
      return say(`✅ تم مسح التحذيرات المسجلة لـ ${targetUser.tag}.`);
    }
    if (name === "kick" || name === "ban") {
      if (!await need(name === "kick" ? PermissionFlagsBits.KickMembers : PermissionFlagsBits.BanMembers)) return;
      if (!targetMember) return say("❌ العضو غير موجود.");
      if (targetUser.id === i.user.id || targetUser.id === client.user.id) return say("❌ لا يمكن تنفيذ الأمر على نفسك أو البوت.");
      if (name === "kick") {
        if (!targetMember.kickable) return say("❌ رتبة البوت يجب أن تكون أعلى من رتبة العضو.");
        await targetMember.kick(opt.getString("reason") || "بدون سبب");
      } else {
        if (!targetMember.bannable) return say("❌ رتبة البوت يجب أن تكون أعلى من رتبة العضو.");
        await targetMember.ban({ reason: opt.getString("reason") || "بدون سبب" });
      }
      return say(`✅ تم ${name === "kick" ? "طرد" : "حظر"} ${targetUser.tag}.`);
    }
    if (name === "unban") {
      if (!await need(PermissionFlagsBits.BanMembers)) return;
      const id = opt.getString("userid").trim();
      if (!/^\d{17,20}$/.test(id)) return say("❌ معرف المستخدم غير صالح.");
      await g.members.unban(id);
      return say(`✅ تم فك الحظر عن ${id}.`);
    }
    if (name === "timeout" || name === "untimeout") {
      if (!await need(PermissionFlagsBits.ModerateMembers)) return;
      if (!targetMember?.moderatable) return say("❌ لا يمكن تعديل تقييد هذا العضو.");
      if (name === "timeout") {
        const mins = opt.getInteger("minutes");
        await targetMember.timeout(mins * 60000);
        return say(`⏳ تم تقييد ${targetUser.tag} لمدة ${mins} دقيقة.`);
      }
      await targetMember.timeout(null);
      return say(`✅ تم إزالة التقييد عن ${targetUser.tag}.`);
    }
    if (name === "banlist") {
      if (!await need(PermissionFlagsBits.BanMembers)) return;
      const bans = await g.bans.fetch();
      return say(bans.size ? "🔨 قائمة المحظورين:\n" + bans.map(b => `${b.user.tag} (${b.user.id})`).slice(0, 30).join("\n") : "لا توجد حسابات محظورة.");
    }
    if (name === "clear") {
      if (!await need(PermissionFlagsBits.ManageMessages)) return;
      const deleted = await i.channel.bulkDelete(opt.getInteger("amount"), true);
      return say(`🧹 تم حذف ${deleted.size} رسالة حديثة.`);
    }
    if (name === "setnick") {
      if (!await need(PermissionFlagsBits.ManageNicknames)) return;
      if (!targetMember?.manageable) return say("❌ لا يمكن تغيير لقب هذا العضو بسبب ترتيب الرتب.");
      await targetMember.setNickname(opt.getString("nickname").slice(0, 32));
      return say(`✅ تم تغيير لقب ${targetUser.tag}.`);
    }

    // الرتب والقنوات
    if (name === "role" || name === "unrole") {
      if (!await need(PermissionFlagsBits.ManageRoles)) return;
      const role = opt.getRole("role");
      if (!targetMember) return say("❌ العضو غير موجود.");
      if (!role.editable || role.managed || role.id === g.id) return say("❌ لا يمكن للبوت تعديل هذه الرتبة.");
      if (name === "role") await targetMember.roles.add(role);
      else await targetMember.roles.remove(role);
      return say(`✅ تم ${name === "role" ? "منح" : "إزالة"} رتبة ${role.name} ${name === "role" ? "لـ" : "من"} ${targetUser.tag}.`);
    }
    if (name === "lock" || name === "unlock") {
      if (!await need(PermissionFlagsBits.ManageChannels)) return;
      await i.channel.permissionOverwrites.edit(g.roles.everyone, {
        SendMessages: name === "lock" ? false : null
      });
      return say(name === "lock" ? "🔒 تم قفل القناة." : "🔓 تم فتح القناة.");
    }
    if (name === "slowmode") {
      if (!await need(PermissionFlagsBits.ManageChannels)) return;
      await i.channel.setRateLimitPerUser(opt.getInteger("seconds"));
      return say("⏱️ تم تحديث Slowmode.");
    }
    if (name === "announce" || name === "say" || name === "embed") {
      if (!await need(PermissionFlagsBits.ManageMessages)) return;
      const text = opt.getString("message");
      if (name === "announce") {
        await i.channel.send({ embeds: [new EmbedBuilder().setColor(0x5865F2).setTitle("📢 إعلان").setDescription(text)], allowedMentions: { parse: [] } });
      } else if (name === "embed") {
        await i.channel.send({ embeds: [new EmbedBuilder().setColor(0x5865F2).setDescription(text)], allowedMentions: { parse: [] } });
      } else {
        await i.channel.send({ content: text, allowedMentions: { parse: [] } });
      }
      return say("✅ تم إرسال الرسالة.");
    }
    if (name === "poll") {
      if (!await need(PermissionFlagsBits.ManageMessages)) return;
      const m = await i.channel.send(`📊 **تصويت**\n${opt.getString("question")}`);
      await m.react("👍");
      await m.react("👎");
      return say("✅ تم إنشاء التصويت.");
    }
    if (name === "createchannel" || name === "createvoice" || name === "createcategory") {
      if (!await need(PermissionFlagsBits.ManageChannels)) return;
      const type = name === "createvoice" ? ChannelType.GuildVoice : name === "createcategory" ? ChannelType.GuildCategory : ChannelType.GuildText;
      const channel = await g.channels.create({ name: opt.getString("name"), type });
      return say(`✅ تم إنشاء ${channel}.`);
    }
    if (name === "renamechannel") {
      if (!await need(PermissionFlagsBits.ManageChannels)) return;
      await i.channel.setName(opt.getString("name"));
      return say("✅ تم تغيير اسم القناة.");
    }
    if (name === "deletechannel") {
      if (!await need(PermissionFlagsBits.ManageChannels)) return;
      const channelName = i.channel.name;
      await i.reply({ content: `🗑️ جارٍ حذف القناة #${channelName}.` });
      await i.channel.delete("طلب حذف القناة بواسطة أمر VEX Guard");
      return;
    }

    return say("❓ لم يتم العثور على تنفيذ لهذا الأمر.");
  } catch (error) {
    console.error(`خطأ في /${name}:`, error);
    const message = "❌ فشل تنفيذ الأمر. تحقق من صلاحيات البوت وترتيب الرتب.";
    if (i.replied || i.deferred) {
      return i.followUp({ content: message, allowedMentions: { parse: [] } }).catch(() => {});
    }
    return i.reply({ content: message, allowedMentions: { parse: [] } }).catch(() => {});
  }
});

async function start() {
  try {
    console.log("⚙️ تسجيل الأوامر...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log(`✅ تم تسجيل ${commands.length} أمرًا.`);
  } catch (e) {
    console.error("❌ فشل تسجيل الأوامر:", e.message);
  }

  await client.login(TOKEN);
}

start().catch(console.error);
