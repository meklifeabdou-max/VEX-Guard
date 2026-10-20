
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
const uptimeStarted = Date.now();

const cmd = (name, description) =>
  new SlashCommandBuilder().setName(name).setDescription(description);

const addUser = c =>
  c.addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true));

const addText = (c, name, description, required = true) =>
  c.addStringOption(o => o.setName(name).setDescription(description).setRequired(required));

const addNumber = (c, name, description, min, max, required = true) =>
  c.addIntegerOption(o => o.setName(name).setDescription(description)
    .setMinValue(min).setMaxValue(max).setRequired(required));

const addRole = c =>
  c.addRoleOption(o => o.setName("role").setDescription("الرتبة").setRequired(true));

const commands = [
  cmd("help", "عرض قائمة الأوامر"),
  cmd("ping", "فحص استجابة البوت"),
  cmd("serverinfo", "معلومات السيرفر"),
  cmd("userinfo", "معلومات عضو").addUserOption(o => o.setName("member").setDescription("العضو")),
  cmd("avatar", "عرض صورة عضو").addUserOption(o => o.setName("member").setDescription("العضو")),
  cmd("servericon", "عرض صورة السيرفر"),
  cmd("membercount", "عدد أعضاء السيرفر"),
  cmd("botinfo", "معلومات البوت"),
  cmd("roleinfo", "معلومات رتبة").addRoleOption(o => o.setName("role").setDescription("الرتبة").setRequired(true)),
  cmd("channelinfo", "معلومات القناة").addChannelOption(o => o.setName("channel").setDescription("القناة")),

  addText(addUser(cmd("warn", "تحذير عضو")), "reason", "سبب التحذير"),
  addUser(cmd("warnings", "عرض تحذيرات عضو")),
  addText(addUser(cmd("kick", "طرد عضو")), "reason", "السبب", false),
  addText(addUser(cmd("ban", "حظر عضو")), "reason", "السبب", false),
  addText(cmd("unban", "فك حظر مستخدم"), "userid", "معرف المستخدم"),
  addNumber(addUser(cmd("timeout", "تقييد عضو")), "minutes", "عدد الدقائق", 1, 40320),
  addUser(cmd("untimeout", "إزالة التقييد")),
  addNumber(cmd("clear", "حذف رسائل"), "amount", "عدد الرسائل", 1, 100),
  cmd("banlist", "عرض قائمة المحظورين"),
  addUser(cmd("resetwarnings", "مسح تحذيرات عضو")),

  addRole(addUser(cmd("role", "منح رتبة لعضو"))),
  addRole(addUser(cmd("unrole", "إزالة رتبة من عضو"))),
  addText(addUser(cmd("setnick", "تغيير لقب عضو")), "nickname", "اللقب الجديد"),
  cmd("lock", "قفل القناة الحالية"),
  cmd("unlock", "فتح القناة الحالية"),
  addNumber(cmd("slowmode", "تحديد بطء المحادثة"), "seconds", "الثواني", 0, 21600),
  addText(cmd("announce", "إرسال إعلان"), "message", "نص الإعلان"),
  addText(cmd("say", "إرسال رسالة باسم البوت"), "message", "الرسالة"),
  addText(cmd("embed", "إرسال رسالة بتنسيق Embed"), "message", "محتوى الرسالة"),
  addText(cmd("poll", "إنشاء تصويت"), "question", "السؤال"),
  addText(cmd("createchannel", "إنشاء قناة نصية"), "name", "اسم القناة"),
  addText(cmd("createcategory", "إنشاء تصنيف"), "name", "اسم التصنيف"),
  addText(cmd("renamechannel", "تغيير اسم القناة الحالية"), "name", "الاسم الجديد"),
  addText(cmd("createvoice", "إنشاء قناة صوتية"), "name", "اسم القناة"),
  cmd("deletechannel", "حذف القناة الحالية"),

  cmd("rps", "حجر ورقة مقص").addStringOption(o => o.setName("choice").setDescription("اختيارك").setRequired(true)
    .addChoices({name:"حجر",value:"rock"},{name:"ورقة",value:"paper"},{name:"مقص",value:"scissors"})),
  addNumber(cmd("guess", "تخمين رقم"), "number", "رقم من 1 إلى 10", 1, 10, false),
  addNumber(cmd("math", "تحدي الحساب"), "answer", "الإجابة", -100000, 100000, false),
  cmd("dice", "رمي النرد"),
  cmd("coinflip", "وجه أو كتابة"),
  addText(cmd("choose", "الاختيار بين خيارات"), "options", "افصل الخيارات بفاصلة"),
  addText(cmd("8ball", "اسأل الكرة السحرية"), "question", "سؤالك"),
  addNumber(cmd("roll", "رقم عشوائي"), "max", "أكبر رقم", 2, 100000),
  addText(cmd("repeat", "تكرار نص"), "text", "النص"),
  cmd("hug", "تحية ودية لعضو").addUserOption(o => o.setName("member").setDescription("العضو").setRequired(true)),
  addText(cmd("emojiinfo", "معلومات إيموجي"), "emoji", "الإيموجي"),
  cmd("rolelist", "عرض رتب السيرفر"),
  cmd("channellist", "عرض قنوات السيرفر"),
  cmd("uptime", "مدة تشغيل البوت"),
  cmd("date", "التاريخ والوقت"),
  cmd("support", "مساعدة البوت")
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);

client.once("ready", () => {
  console.log(`🛡️ VEX Guard متصل: ${client.user.tag}`);
  console.log(`🏠 السيرفر: ${GUILD_ID}`);
});

client.on("interactionCreate", async i => {
  if (!i.isChatInputCommand()) return;

  const name = i.commandName;
  const g = i.guild;
  const opt = i.options;
  const say = text => i.reply({
    content: text,
    allowedMentions: { parse: [] }
  });

  try {
    if (!g) return say("❌ استخدم الأمر داخل السيرفر.");

    const user = opt.getUser("member");
    const member = user ? await g.members.fetch(user.id).catch(() => null) : null;

    const need = async permission => {
      if (!i.memberPermissions.has(permission)) {
        await say("❌ لا تملك صلاحية تنفيذ هذا الأمر.");
        return false;
      }
      return true;
    };

    // معلومات عامة
    if (name === "help") {
      const e = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle("🛡️ VEX Guard — 50 أمرًا")
        .setDescription(commands.map(c => `/${c.name}`).join(" • "));
      return i.reply({ embeds: [e] });
    }

    if (name === "ping") return say(`🏓 Ping: ${client.ws.ping}ms`);
    if (name === "membercount") return say(`👥 عدد الأعضاء: ${g.memberCount}`);
    if (name === "date") return say(`🕒 ${new Date().toLocaleString("ar-DZ", {timeZone:"Africa/Algiers"})}`);
    if (name === "uptime") {
      const s = Math.floor((Date.now() - uptimeStarted) / 1000);
      return say(`⏱️ مدة التشغيل: ${Math.floor(s / 3600)} ساعة و${Math.floor(s % 3600 / 60)} دقيقة.`);
    }
    if (name === "support") return say("🛡️ للمساعدة جرّب /help أو تواصل مع إدارة السيرفر.");
    if (name === "botinfo") return say(`🤖 ${client.user.tag}\n🟢 البوت متصل\n🏓 Ping: ${client.ws.ping}ms`);
    if (name === "servericon") return say(g.iconURL({size:1024}) || "لا توجد صورة للسيرفر.");
    if (name === "serverinfo") {
      return i.reply({embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle(g.name)
        .setThumbnail(g.iconURL()).addFields(
          {name:"الأعضاء",value:String(g.memberCount),inline:true},
          {name:"القنوات",value:String(g.channels.cache.size),inline:true},
          {name:"الرتب",value:String(g.roles.cache.size),inline:true}
        )]});
    }
    if (name === "userinfo") {
      const u = user || i.user;
      const m = await g.members.fetch(u.id).catch(() => null);
      const e = new EmbedBuilder().setColor(0x5865F2).setTitle(`معلومات ${u.tag}`)
        .setThumbnail(u.displayAvatarURL({size:512}))
        .addFields({name:"ID",value:u.id},
          {name:"إنشاء الحساب",value:`<t:${Math.floor(u.createdTimestamp/1000)}:D>`});
      if (m?.joinedTimestamp) e.addFields({name:"تاريخ الانضمام",value:`<t:${Math.floor(m.joinedTimestamp/1000)}:D>`});
      return i.reply({embeds:[e]});
    }
    if (name === "avatar") {
      const u = user || i.user;
      return i.reply({embeds:[new EmbedBuilder().setColor(0x5865F2)
        .setTitle(`صورة ${u.username}`).setImage(u.displayAvatarURL({size:1024}))]});
    }
    if (name === "roleinfo") {
      const r = opt.getRole("role");
      return say(`🏷️ ${r.name}\nID: ${r.id}\nالأعضاء: ${r.members.size}\nاللون: ${r.hexColor}`);
    }
    if (name === "channelinfo") {
      const c = opt.getChannel("channel") || i.channel;
      return say(`📁 ${c.name}\nID: ${c.id}`);
    }
    if (name === "rolelist") return say("🏷️ الرتب:\n" + g.roles.cache.map(r => r.name).slice(0,50).join("، "));
    if (name === "channellist") return say("📁 القنوات:\n" + g.channels.cache.map(c => c.name).slice(0,50).join("، "));

    // الألعاب
    if (name === "rps") {
      const a = opt.getString("choice");
      const choices = ["rock","paper","scissors"];
      const b = choices[Math.floor(Math.random()*3)];
      const labels = {rock:"🪨 حجر",paper:"📄 ورقة",scissors:"✂️ مقص"};
      const win = (a==="rock"&&b==="scissors")||(a==="paper"&&b==="rock")||(a==="scissors"&&b==="paper");
      return say(`أنت: ${labels[a]}\nالبوت: ${labels[b]}\n${a===b?"🤝 تعادل!":win?"🏆 فزت!":"😅 خسرت هذه المرة!"}`);
    }
    if (name === "guess") {
      const key = `${g.id}:${i.user.id}`;
      const n = opt.getInteger("number");
      if (n === null) {
        games.set(key,{type:"guess",answer:1+Math.floor(Math.random()*10)});
        return say("🔢 بدأت اللعبة! خمن رقمًا باستعمال /guess number:");
      }
      const game = games.get(key);
      if (!game || game.type!=="guess") return say("ابدأ أولًا باستعمال /guess من دون رقم.");
      games.delete(key);
      return say(n===game.answer?"🎉 صحيح!":`❌ الرقم الصحيح هو ${game.answer}.`);
    }
    if (name === "math") {
      const key = `${g.id}:${i.user.id}`;
      const n = opt.getInteger("answer");
      if (n === null) {
        const a=1+Math.floor(Math.random()*20), b=1+Math.floor(Math.random()*20);
        games.set(key,{type:"math",answer:a+b});
        return say(`🧠 احسب: **${a} + ${b}** ثم أرسل الأمر /math answer: مع إجابتك.`);
      }
      const game=games.get(key);
      if (!game || game.type!=="math") return say("ابدأ أولًا باستعمال /math من دون إجابة.");
      games.delete(key);
      return say(n===game.answer?"🎉 إجابة صحيحة!":`❌ الإجابة الصحيحة: ${game.answer}`);
    }
    if (name === "dice") return say(`🎲 النرد: ${1+Math.floor(Math.random()*6)}`);
    if (name === "coinflip") return say(`🪙 ${Math.random()<0.5?"وجه":"كتابة"}`);
    if (name === "roll") return say(`🎲 الرقم: ${1+Math.floor(Math.random()*opt.getInteger("max"))}`);
    if (name === "choose") {
      const choices=opt.getString("options").split(",").map(x=>x.trim()).filter(Boolean);
      if (choices.length<2) return say("اكتب خيارين على الأقل وافصل بينهما بفاصلة.");
      return say(`🎯 اختياري: **${choices[Math.floor(Math.random()*choices.length)]}**`);
    }
    if (name === "8ball") return say(["🎱 نعم!","🤔 ربما.","❌ لا.","✨ اسأل لاحقًا."][Math.floor(Math.random()*4)]);
    if (name === "repeat") return say(opt.getString("text").slice(0,1800));
    if (name === "hug") return say(`🤗 ${i.user} يرسل تحية ودية إلى ${user}!`);
    if (name === "emojiinfo") return say(`😀 الإيموجي: ${opt.getString("emoji")}`);

    // الإدارة
    if (name === "warn") {
      if (!await need(PermissionFlagsBits.ModerateMembers)) return;
      const key=`${g.id}:${user.id}`, arr=warnings.get(key)||[];
      arr.push({reason:opt.getString("reason"),by:i.user.tag});
      warnings.set(key,arr);
      return say(`⚠️ تم تحذير ${user.tag}\nالسبب: ${opt.getString("reason")}\nعدد التحذيرات: ${arr.length}`);
    }
    if (name === "warnings") {
      if (!await need(PermissionFlagsBits.ModerateMembers)) return;
      const arr=warnings.get(`${g.id}:${user.id}`)||[];
      return say(arr.length?arr.map((w,n)=>`${n+1}. ${w.reason} — ${w.by}`).join("\n"):"✅ لا توجد تحذيرات.");
    }
    if (name === "resetwarnings") {
      if (!await need(PermissionFlagsBits.ModerateMembers)) return;
      warnings.delete(`${g.id}:${user.id}`);
      return say(`✅ تم مسح تحذيرات ${user.tag}.`);
    }
    if (name === "kick" || name === "ban") {
      if (!await need(name==="kick"?PermissionFlagsBits.KickMembers:PermissionFlagsBits.BanMembers)) return;
      if (!member) return say("❌ العضو غير موجود.");
      if (user.id===i.user.id || user.id===client.user.id) return say("❌ لا يمكنك استهداف نفسك أو البوت.");
      if (name==="kick") {
        if (!member.kickable) return say("❌ رتبة البوت يجب أن تكون أعلى من رتبة العضو.");
        await member.kick(opt.getString("reason")||"بدون سبب");
      } else {
        if (!member.bannable) return say("❌ رتبة البوت يجب أن تكون أعلى من رتبة العضو.");
        await member.ban({reason:opt.getString("reason")||"بدون سبب"});
      }
      return say(`✅ تم ${name==="kick"?"طرد":"حظر"} ${user.tag}.`);
    }
    if (name === "unban") {
      if (!await need(PermissionFlagsBits.BanMembers)) return;
      const id=opt.getString("userid").trim();
      if (!/^\d{17,20}$/.test(id)) return say("❌ معرف المستخدم غير صالح.");
      await g.members.unban(id);
      return say(`✅ تم فك الحظر عن ${id}.`);
    }
    if (name === "banlist") {
      if (!await need(PermissionFlagsBits.BanMembers)) return;
      const bans=await g.bans.fetch();
      return say(bans.size?bans.map(b=>`${b.user.tag} (${b.user.id})`).slice(0,25).join("\n"):"لا توجد حسابات محظورة.");
    }
    if (name === "timeout" || name === "untimeout") {
      if (!await need(PermissionFlagsBits.ModerateMembers)) return;
      if (!member?.moderatable) return say("❌ لا يمكن تعديل تقييد هذا العضو.");
      if (name==="timeout") {
        const minutes=opt.getInteger("minutes");
        await member.timeout(minutes*60000);
        return say(`⏳ تم تقييد ${user.tag} لمدة ${minutes} دقيقة.`);
      }
      await member.timeout(null);
      return say(`✅ تم إزالة التقييد عن ${user.tag}.`);
    }
    if (name === "clear") {
      if (!await need(PermissionFlagsBits.ManageMessages)) return;
      const deleted=await i.channel.bulkDelete(opt.getInteger("amount"),true);
      return say(`🧹 تم حذف ${deleted.size} رسالة حديثة.`);
    }
    if (name === "setnick") {
      if (!await need(PermissionFlagsBits.ManageNicknames)) return;
      if (!member?.manageable) return say("❌ لا يمكن تغيير لقب هذا العضو بسبب ترتيب الرتب.");
      await member.setNickname(opt.getString("nickname").slice(0,32));
      return say(`✅ تم تغيير لقب ${user.tag}.`);
    }
    if (name === "role" || name === "unrole") {
      if (!await need(PermissionFlagsBits.ManageRoles)) return;
      const role=opt.getRole("role");
      if (!member) return say("❌ العضو غير موجود.");
      if (!role.editable || role.managed || role.id===g.id) return say("❌ لا يمكن تعديل هذه الرتبة.");
      if (name==="role") await member.roles.add(role);
      else await member.roles.remove(role);
      return say(`✅ تم ${name==="role"?"منح":"إزالة"} رتبة ${role.name} ${name==="role"?"لـ":"من"} ${user.tag}.`);
    }
    if (name === "lock" || name === "unlock") {
      if (!await need(PermissionFlagsBits.ManageChannels)) return;
      await i.channel.permissionOverwrites.edit(g.roles.everyone,{SendMessages:name==="lock"?false:null});
      return say(name==="lock"?"🔒 تم قفل القناة.":"🔓 تم فتح القناة.");
    }
    if (name === "slowmode") {
      if (!await need(PermissionFlagsBits.ManageChannels)) return;
      await i.channel.setRateLimitPerUser(opt.getInteger("seconds"));
      return say("⏱️ تم تحديث Slowmode.");
    }
    if (name === "announce" || name === "say" || name === "embed") {
      if (!await need(PermissionFlagsBits.ManageMessages)) return;
      const text=opt.getString("message");
      if (name==="embed") {
        await i.channel.send({embeds:[new EmbedBuilder().setColor(0x5865F2).setDescription(text)],allowedMentions:{parse:[]}});
      } else if (name==="announce") {
        await i.channel.send({embeds:[new EmbedBuilder().setColor(0x5865F2).setTitle("📢 إعلان").setDescription(text)],allowedMentions:{parse:[]}});
      } else {
        await i.channel.send({content:text,allowedMentions:{parse:[]}});
      }
      return say("✅ تم إرسال الرسالة.");
    }
    if (name === "poll") {
      if (!await need(PermissionFlagsBits.ManageMessages)) return;
      const msg=await i.channel.send(`📊 **تصويت**\n${opt.getString("question")}`);
      await msg.react("👍");
      await msg.react("👎");
      return say("✅ تم إنشاء التصويت.");
    }
    if (["createchannel","createcategory","createvoice"].includes(name)) {
      if (!await need(PermissionFlagsBits.ManageChannels)) return;
      const type=name==="createvoice"?ChannelType.GuildVoice:name==="createcategory"?ChannelType.GuildCategory:ChannelType.GuildText;
      const c=await g.channels.create({name:opt.getString("name"),type});
      return say(`✅ تم إنشاء ${c}.`);
    }
    if (name === "renamechannel") {
      if (!await need(PermissionFlagsBits.ManageChannels)) return;
      await i.channel.setName(opt.getString("name"));
      return say("✅ تم تغيير اسم القناة.");
    }
    if (name === "deletechannel") {
      if (!await need(PermissionFlagsBits.ManageChannels)) return;
      const channel=i.channel;
      await i.reply({content:`🗑️ جارٍ حذف القناة #${channel.name}.`});
      await channel.delete("طلب حذف القناة بواسطة VEX Guard");
      return;
    }

    return say("❓ لم يتم العثور على تنفيذ لهذا الأمر.");
  } catch (error) {
    console.error(`خطأ في /${name}:`,error);
    const msg="❌ فشل تنفيذ الأمر. تحقق من صلاحيات البوت وترتيب الرتب.";
    if (i.replied || i.deferred) {
      return i.followUp({content:msg,allowedMentions:{parse:[]}}).catch(()=>{});
    }
    return i.reply({content:msg,allowedMentions:{parse:[]}}).catch(()=>{});
  }
});

async function start() {
  try {
    console.log(`⚙️ جاري تسجيل ${commands.length} أمرًا...`);
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID,GUILD_ID),{body:commands});
    console.log(`✅ تم تسجيل ${commands.length} أمرًا.`);
  } catch (e) {
    console.error("❌ فشل تسجيل الأوامر:",e.message);
  }
  await client.login(TOKEN);
}

start().catch(e => {
  console.error("❌ فشل تشغيل البوت:",e);
  process.exit(1);
});
