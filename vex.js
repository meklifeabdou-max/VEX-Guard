const {
  Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder,
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  PermissionFlagsBits, ChannelType
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || null;

if (!TOKEN || !CLIENT_ID) {
  console.error("❌ أضف DISCORD_TOKEN و CLIENT_ID في GitHub Secrets.");
  process.exit(1);
}

const bot = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const roulette = new Map();

const descriptions = {
  "كت": "احصل على سؤال عشوائي",
  "روليت": "ابدأ روليت جماعي",
  "صراحة": "سؤال صراحة عشوائي",
  "تحدي": "احصل على تحدٍ",
  "حظ": "اعرف نسبة حظك",
  "نرد": "ارمِ النرد",
  "عملة": "اقلب العملة",
  "لغز": "احصل على لغز",
  "نكتة": "احصل على نكتة",
  "حقيقة": "معلومة عشوائية",
  "اختيار": "اختر بين خيارين",
  "فريق": "اختيار فريق",
  "تصويت": "أنشئ تصويتًا",
  "رقم": "اختر رقمًا عشوائيًا",
  "إيموجي": "إيموجي عشوائي",
  "لون": "لون عشوائي",
  "اسم": "اسم عشوائي",
  "حروف": "حرف عشوائي",
  "سؤال": "سؤال عشوائي",
  "مساعدة": "عرض قائمة الأوامر",
  "بنق": "سرعة استجابة البوت",
  "بوت": "معلومات البوت",
  "خادم": "معلومات السيرفر",
  "عضو": "معلومات عضو",
  "أفاتار": "عرض صورة عضو",
  "أيقونة": "عرض أيقونة السيرفر",
  "الأعضاء": "عدد الأعضاء",
  "الرتب": "عدد الرتب",
  "القنوات": "عدد القنوات",
  "الوقت": "الوقت الحالي",
  "تاريخ": "التاريخ الحالي",
  "نصيحة": "نصيحة عشوائية",
  "اقتباس": "اقتباس عشوائي",
  "شكر": "رسالة شكر",
  "ترحيب": "رسالة ترحيب",
  "وداع": "رسالة وداع",
  "تخمين": "خمن رقمًا من 1 إلى 10",
  "حجر_ورقة": "حجر ورقة مقص",
  "ذاكرة": "اختبار ذاكرة",
  "سرعة": "اختبار سرعة",
  "حساب": "عملية حسابية",
  "انضمام": "تاريخ انضمام عضو",
  "المالك": "مالك السيرفر",
  "المشرفون": "عدد المشرفين",
  "القواعد": "تذكير بالقواعد",
  "اقتراح": "إرسال اقتراح",
  "بلاغ": "لوحة التذاكر",
  "إعلان": "إرسال إعلان إداري",
  "قفل": "قفل القناة",
  "فتح": "فتح القناة",
  "مسح": "حذف رسائل",
  "بطء": "تغيير مهلة القناة",
  "طرد": "طرد عضو",
  "حظر": "حظر عضو",
  "إلغاء_حظر": "إلغاء حظر باستخدام ID",
  "تحذير": "تحذير عضو",
  "مهلة": "إعطاء عضو مهلة",
  "إنهاء_المهلة": "إنهاء مهلة عضو",
  "لقب": "تغيير لقب عضو",
  "أضف_رتبة": "إضافة رتبة لعضو",
  "احذف_رتبة": "حذف رتبة من عضو",
  "إنشاء_قناة": "إنشاء قناة",
  "حذف_قناة": "حذف القناة الحالية",
  "موضوع": "تغيير موضوع القناة",
  "دعوة": "إنشاء رابط دعوة",
  "إحصائيات": "إحصائيات السيرفر",
  "عمر_الحساب": "عمر الحساب",
  "عمر_السيرفر": "عمر السيرفر",
  "قائمة_الألعاب": "قائمة الألعاب",
  "روليت_مساعدة": "شرح الروليت",
  "تحدي_جماعي": "تحدٍ جماعي",
  "سؤال_إضافي": "سؤال إضافي",
  "فزورة": "فزورة عشوائية",
  "حساب_جمع": "سؤال جمع",
  "نسبة": "نسبة عشوائية",
  "ترتيب": "اختيار ترتيب عشوائي",
  "فريق_أحمر": "اختيار الفريق الأحمر",
  "فريق_أزرق": "اختيار الفريق الأزرق",
  "نعم_أو_لا": "إجابة نعم أو لا",
  "توقع": "توقع عشوائي",
  "حالة": "حالة البوت",
  "معلوماتي": "معلوماتك",
  "رتبتي": "أعلى رتبة لديك",
  "عدد_الرتب": "عدد الرتب",
  "عدد_القنوات": "عدد القنوات",
  "عدد_التعزيزات": "عدد التعزيزات",
  "رسالة": "إرسال رسالة إدارية",
  "حكمة": "حكمة عشوائية",
  "حيوان": "حيوان عشوائي",
  "رياضة": "رياضة عشوائية",
  "كرة": "معلومة كرة قدم",
  "ألعاب": "اقتراح لعبة",
  "تحدي_الأصدقاء": "تحدٍ للأصدقاء",
  "اختبار": "اختبار سريع",
  "فائز": "اختيار فائز",
  "شعار": "شعار نصي",
  "مساعدة_الإدارة": "أوامر الإدارة",
  "مساعدة_الألعاب": "أوامر الألعاب"
};

const staffOnly = [
  "إعلان", "قفل", "فتح", "مسح", "بطء", "طرد", "حظر",
  "إلغاء_حظر", "تحذير", "مهلة", "إنهاء_المهلة", "لقب",
  "أضف_رتبة", "احذف_رتبة", "إنشاء_قناة", "حذف_قناة",
  "موضوع", "رسالة"
];

const commands = Object.entries(descriptions).map(([name, desc]) => {
  const c = new SlashCommandBuilder()
    .setName(name)
    .setDescription(desc);

  if ([
    "عضو", "أفاتار", "طرد", "حظر", "تحذير", "مهلة",
    "إنهاء_المهلة", "لقب", "أضف_رتبة", "احذف_رتبة", "انضمام"
  ].includes(name)) {
    c.addUserOption(o =>
      o.setName("العضو").setDescription("اختر العضو").setRequired(false)
    );
  }

  if ([
    "تحذير", "مهلة", "لقب", "إعلان", "اقتراح",
    "موضوع", "رسالة", "طرد", "حظر"
  ].includes(name)) {
    c.addStringOption(o =>
      o.setName("النص").setDescription("النص أو السبب")
        .setRequired(["إعلان", "اقتراح", "موضوع", "رسالة"].includes(name))
    );
  }

  if (name === "مسح") {
    c.addIntegerOption(o =>
      o.setName("العدد").setDescription("من 1 إلى 100")
        .setMinValue(1).setMaxValue(100).setRequired(true)
    );
  }

  if (name === "بطء") {
    c.addIntegerOption(o =>
      o.setName("الثواني").setDescription("من 0 إلى 21600")
        .setMinValue(0).setMaxValue(21600).setRequired(true)
    );
  }

  if (name === "رقم") {
    c.addIntegerOption(o =>
      o.setName("من").setDescription("أصغر رقم").setRequired(false)
    ).addIntegerOption(o =>
      o.setName("إلى").setDescription("أكبر رقم").setRequired(false)
    );
  }

  if (name === "اختيار") {
    c.addStringOption(o =>
      o.setName("الخيار_الأول").setDescription("الخيار الأول").setRequired(true)
    ).addStringOption(o =>
      o.setName("الخيار_الثاني").setDescription("الخيار الثاني").setRequired(true)
    );
  }

  if (name === "تصويت") {
    c.addStringOption(o =>
      o.setName("السؤال").setDescription("موضوع التصويت").setRequired(true)
    );
  }

  if (name === "تخمين") {
    c.addIntegerOption(o =>
      o.setName("الرقم").setDescription("من 1 إلى 10")
        .setMinValue(1).setMaxValue(10).setRequired(true)
    );
  }

  if (name === "إنشاء_قناة") {
    c.addStringOption(o =>
      o.setName("الاسم").setDescription("اسم القناة").setRequired(true)
    );
  }

  if (name === "إلغاء_حظر") {
    c.addStringOption(o =>
      o.setName("المعرف").setDescription("ID العضو").setRequired(true)
    );
  }

  if (["أضف_رتبة", "احذف_رتبة"].includes(name)) {
    c.addStringOption(o =>
      o.setName("اسم_الرتبة").setDescription("اسم الرتبة").setRequired(true)
    );
  }

  if (name === "فائز") {
    c.addStringOption(o =>
      o.setName("المشاركون").setDescription("أسماء مفصولة بفواصل").setRequired(true)
    );
  }

  return c;
});

const embed = (title, description) =>
  new EmbedBuilder().setColor(0x5865F2)
    .setTitle(title).setDescription(description).setTimestamp();

const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const isStaff = member => member &&
  (member.permissions.has(PermissionFlagsBits.ManageChannels) ||
   member.permissions.has(PermissionFlagsBits.Administrator));

const questions = [
  "ما هدفك الأكبر؟", "ما أجمل ذكرى عندك؟",
  "ما اللعبة التي لا تمل منها؟", "ما المهارة التي تريد تعلمها؟",
  "ما الشيء الذي يجعلك تضحك؟", "ما أفضل نصيحة سمعتها؟"
];

const truths = [
  "ما أكثر موقف مضحك حدث لك؟", "ما هدفك لهذه السنة؟",
  "ما أكثر لعبة تحبها؟", "ما صفة تحبها في نفسك؟"
];

const dares = [
  "اكتب مجاملة لطيفة لشخص في السيرفر.",
  "اكتب اسم لعبتك المفضلة مع إيموجي.",
  "أرسل رسالة إيجابية للجميع.",
  "اكتب جملة دون حرف الألف."
];

const riddles = [
  ["ما الشيء الذي له أسنان ولا يعض؟", "المشط"],
  ["ما الشيء الذي كلما أخذت منه كبر؟", "الحفرة"],
  ["ما الشيء الذي يكتب ولا يقرأ؟", "القلم"]
];

async function sendTicketPanel(i) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("vex_ticket_support")
      .setLabel("💬 الدعم والمساعدة").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("vex_ticket_shop")
      .setLabel("🛒 الشراء").setStyle(ButtonStyle.Success)
  );

  return i.reply({
    embeds: [embed(
      "🎫 VEX GUARD | مركز التذاكر",
      "مرحبًا بك في مركز التذاكر!\n\n" +
      "💬 **الدعم والمساعدة:** للمشاكل والاستفسارات.\n" +
      "🛒 **الشراء:** لطلبات الشراء.\n\n" +
      "اختر الزر المناسب لفتح تكت خاص."
    )],
    components: [row]
  });
}

async function createTicket(i, type) {
  const guild = i.guild;
  const user = i.user;

  if (!guild) {
    return i.reply({ content: "افتح التكت داخل السيرفر.", ephemeral: true });
  }

  const existing = guild.channels.cache.find(ch =>
    ch.type === ChannelType.GuildText &&
    ch.topic?.includes(`vex-owner=${user.id};vex-type=${type}`)
  );
