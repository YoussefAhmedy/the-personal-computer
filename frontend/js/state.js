"use strict";
/* ---------- personal content ----------
   These used to be the hardcoded ✎ EDIT ZONE constants. Now they start
   empty and are filled in by loadContent() during boot, right after the
   access code is accepted — everything downstream (window manager, each
   app) reads from these same names exactly as it did before, so almost
   none of that code needed to change. */

let USER = "";
let FINALE_HEADING = "HAPPY BIRTHDAY";
let FINAL_MESSAGE = "";
let MEMORIES = [];
let PHOTOS = [];
let NOTES = [];
let VIDEOS = [];
let TRACKS = [];
let MESSAGES = [];
let SECRET_MESSAGE = { title: "", body: "" };

// Chiptune note durations are stored as "beats"; this is seconds-per-beat.
const STEP = 0.17;

// Generic system chatter — not personal, so it stays static here rather
// than round-tripping through the database.
const BOOT_LINES_PRE = [
  ["PERSONAL COMPUTER  BIOS v2.11", "dim"],
  ["--------------------------------", "dim"],
  ["MEMORY CHECK ........ 640K OK", ""],
  ["DISPLAY ............. OK", ""],
  ["AUDIO ............... OK", ""],
  ["USER ARCHIVE ........ FOUND", ""],
  ["PERSONAL FILES ...... FOUND", ""],
  ["PHOTO DATABASE ...... FOUND", ""],
  ["MEMORIES ............ FOUND", ""],
  ["", ""],
];
const BOOT_LINES_POST = [
  ["LOADING PERSONAL ENVIRONMENT...", "dim"],
  ["ACCESS GRANTED", ""],
  ["", ""],
  ["WELCOME.", ""],
];
const FINALE_TERM = [
  "> SPECIAL EVENT DETECTED...",
  "> SCANNING PERSONAL ARCHIVE... 100%",
  "> TODAY IS NOT A NORMAL DAY.",
  "",
  "> INCOMING SYSTEM MESSAGE:",
];

let contentLoaded = false;

/** Fetches every content collection in one round trip and fills the
 * module-level arrays above. Safe to call more than once (e.g. a
 * returning visitor who skips the passcode prompt still calls this). */
async function loadContent() {
  const data = {
  "site": {
    "user": "GUEST",
    "finaleHeading": "HAPPY BIRTHDAY",
    "finalMessage": "I built this little world\njust so you could open it\nand find a piece of our memories\ninside.\n\nEvery photo. Every note. Every little moment.\nAll of it belongs here.\n\n— made for you, with love"
  },
  "memories": [
    {
      "rowId": 1,
      "id": "MEMORY_001",
      "date": "30 / 4 / 2026",
      "title": "Your Honor Day At College",
      "caption": "من اكتر الايام اللي كنت فخور بيك فيها ❤️",
      "tags": [
        "trip",
        "road"
      ],
      "secret": true,
      "art": "road",
      "media": "assets/uploads/images/ece68a11-f9ef-4d4f-9afc-2d9a4633966e.jpg",
      "sortOrder": 0
    },
    {
      "rowId": 2,
      "id": "MEMORY_002",
      "date": "17 / 11 / 2026",
      "title": "The Day We Left After We Got Back Together",
      "caption": "من أكتر الصورة اللي بحبها لينا سواا ✨",
      "tags": [
        "cozy",
        "rain"
      ],
      "secret": true,
      "art": "night",
      "media": "assets/uploads/images/6d1fd219-1c3d-4bca-9e48-a4fd9087f6eb.jpg",
      "sortOrder": 1
    },
    {
      "rowId": 3,
      "id": "MEMORY_003",
      "date": "4 / 10 / 2025",
      "title": "Your Birthday Last Year",
      "caption": "كان يوم حلو اوي بذات انه كان اول عيد ميلاد من اول رجعنا 😍❤️",
      "tags": [
        "night"
      ],
      "secret": true,
      "art": "sunset",
      "media": "assets/uploads/images/4377421f-3f9f-4613-9646-6ee30fa6a108.jpg",
      "sortOrder": 2
    },
    {
      "rowId": 4,
      "id": "MEMORY_004",
      "date": "19 / 3 / 2025",
      "title": "The Surprise Gift",
      "caption": "حرفيا في عز ما كننا متخانقين لقيتك بتفاجئني بيها 😂❤️❤️",
      "tags": [
        "winter"
      ],
      "secret": true,
      "art": "snow",
      "media": "assets/uploads/images/4bfbc308-81b6-461f-b52c-b8b9d01eb77d.jpg",
      "sortOrder": 3
    },
    {
      "rowId": 5,
      "id": "MEMORY_005",
      "date": "2 / 9 / 2023",
      "title": "The Birthday Photo",
      "caption": "من اكتر الخروجات العشوائية بس طلعت بيها بالصورة دي والله 😊❤️",
      "tags": [
        "hidden"
      ],
      "secret": true,
      "art": "glitch",
      "media": "assets/uploads/images/31f92b6b-7bbc-46b3-9314-d7162a39f8d3.jpg",
      "sortOrder": 4
    },
    {
      "rowId": 6,
      "id": "MEMORY_006",
      "date": "5 / 12 / 2023",
      "title": "The First Memory Of The First Day We Knew Each Other",
      "caption": "اول مرة نحتفل ب اول يوم اتعرفنا في علي بعض و كانت نعمة عليا الصراحة ✨❤️❤️❤️❤️❤️",
      "tags": [
        "trip",
        "road"
      ],
      "secret": true,
      "art": "clouds",
      "media": "assets/uploads/images/5054cebc-650e-4d0f-a240-a3ea3d8ed659.jpg",
      "sortOrder": 5
    },
    {
      "rowId": 7,
      "id": "MEMORY_007",
      "date": "15 / 5 / 2023",
      "title": "The First Photo Ever",
      "caption": "فاكر اليوم ده؟\nI still remember every little detail.",
      "tags": [],
      "secret": true,
      "art": "clouds",
      "media": "assets/uploads/images/a19cc1ae-9ed0-4c5a-ab5b-21ece6a495d9.jpg",
      "sortOrder": 6
    },
    {
      "rowId": 8,
      "id": "MEMORY_008",
      "date": "?? / ?? / ????",
      "title": "Unforgettable Memories Even For Me",
      "caption": "",
      "tags": [
        "trip",
        "road"
      ],
      "secret": true,
      "art": "clouds",
      "media": "assets/uploads/images/ce9ef4f7-881f-40f0-acf3-2158a271f247.jpg",
      "sortOrder": 7
    }
  ],
  "photos": [
    {
      "rowId": 1,
      "id": "PHOTO_001",
      "date": "",
      "title": "The picture and the memories I love ♥️",
      "desc": "",
      "cat": "trips",
      "art": "sunset",
      "media": "assets/uploads/images/8c1b707d-6746-49bc-9206-04a58e53b480.jpg",
      "sortOrder": 0
    },
    {
      "rowId": 2,
      "id": "PHOTO_002",
      "date": "",
      "title": "The picture and the memories I love ♥️",
      "desc": "",
      "cat": "trips",
      "art": "clouds",
      "media": "assets/uploads/images/4538c99c-d5c1-48d9-8c93-c139d95d035b.jpg",
      "sortOrder": 1
    },
    {
      "rowId": 3,
      "id": "PHOTO_003",
      "date": "",
      "title": "The picture and the memories I love ♥️",
      "desc": "",
      "cat": "special",
      "art": "city",
      "media": "assets/uploads/images/ace0cef3-af87-40f0-90f9-f9fdc472c325.jpg",
      "sortOrder": 2
    },
    {
      "rowId": 4,
      "id": "PHOTO_004",
      "date": "",
      "title": "The picture and the memories I love ♥️",
      "desc": "",
      "cat": "trips",
      "art": "beach",
      "media": "assets/uploads/images/094348ff-ec2f-4502-aa5e-83e8da0449cc.jpg",
      "sortOrder": 3
    },
    {
      "rowId": 5,
      "id": "PHOTO_005",
      "date": "",
      "title": "The picture and the memories I love ♥️",
      "desc": "",
      "cat": "special",
      "art": "snow",
      "media": "assets/uploads/images/fe583ea7-8f53-4084-98dc-8aeb35573957.jpg",
      "sortOrder": 4
    },
    {
      "rowId": 6,
      "id": "PHOTO_006",
      "date": "",
      "title": "The picture and the memories I love ♥️",
      "desc": "",
      "cat": "funny",
      "art": "glitch",
      "media": "assets/uploads/images/5e99e61f-824c-4fd7-aa24-6dc82ddf8c7e.jpg",
      "sortOrder": 5
    },
    {
      "rowId": 7,
      "id": "PHOTO_007",
      "date": "",
      "title": "The picture and the memories I love ♥️",
      "desc": "",
      "cat": "trips",
      "art": "desert",
      "media": "assets/uploads/images/054abb69-8a4d-46cf-a71c-d1184ba5c75c.jpg",
      "sortOrder": 6
    },
    {
      "rowId": 8,
      "id": "PHOTO_008",
      "date": "",
      "title": "The picture and the memories I love ♥️",
      "desc": "",
      "cat": "hidden",
      "art": "eyes",
      "media": "assets/uploads/images/37394132-31d9-4427-8d5a-e3b937366d10.jpg",
      "sortOrder": 7
    }
  ],
  "notes": [
    {
      "rowId": 1,
      "id": "NOTE_001",
      "title": "The Idea",
      "date": "SOME NIGHT, LATE",
      "body": "زي ما قلت قبل كده كذا مرة قدامك، أن إحنا مفيش memories بينا لوحدنا. مفيش اي memorie تكون حاجة بيني وبينك، عارفة إنتِ حاجة تخصنا إحنا بس، حاجة كأنها سر بيننا، للأسف دي حاجة مش موجودة.\n\nإن حاجة زي كده بيني وبينك ما بتبقاش موجودة حاجة من الحاجات اللي زعلتني، صحيح طبعاً إن إحنا مش إخوات بشكل فعلي، ف ده أكيد طبيعي إن هو ما بيبقاش موجود، لكن بما إن في ظروف تمنع إن إحنا ممكن نخرج مثلاً سوا او اي حاجة تاني، زي ما كنا بنعمل في الصيف وما اتضبطش للأسف، عشان التدريب، او عشان البيت.\n\nف قلت أعملها بنفسي وأحاول أخلي الحاجة إحنا بس اللي يشوفها بس بالضبط بالشكل اللي عاوزينه، ويبقى في حاجة سر بيننا.\n\nعشان كده ما كنتش حابب اعمل Share لأي فيديوهات أو أي reactions، وأحب إن كل ده يكون عبارة عن سرنا الصغير، وmemories ما تتنساش أبداً.",
      "rtl": true,
      "sortOrder": 0
    },
    {
      "rowId": 2,
      "id": "NOTE_002",
      "title": "The Moral",
      "date": "SOME NIGHT, LATE",
      "body": "العبرة من كل الشغل ده ياسلمي بكل بساطة، هو إن عايز أعمل memorie ما تنسيش.\n\nمش بس ب أحاول أعلي على نفسي كل سنة، لا مش دي الهدف العام عشان يا سلمى دي آخر اجازة لينا في الكلية، اخر عيد ميلاد ليكي وإحنا مع بعض في الكلية.\n\nبعد الكلية يا سلمى محدش يضمن إيه هيحصل، محدش هيضمن إن كل حاجة هتبقى زي الفل.\n\nكل الخطط إحنا حاطينها في حتة زي إن إحنا نظبط يوم في الأسبوع ونتقابل فيه او إن إحنا نحاول نشتغل سوا او إن إحنا مش عارف إيه وحاجات أتمنى تحصل المليارين في المية. أتمنى يا سلمى تفضلي جزء في يومي دايما و دايما موجودة كده في يومي كده طول العمر، حاجة نفسي فيها من قلبي وعيني و من كل حاجة بس، ولكن مش كل حاجة بنتمناها بتحصل، فممكن يحصل سيناريو كمثال، سيناريو سيئ كده : إن ممكن سمى ربنا يوفقك، وباباك يعرف يديك فرصة في السعودية كمثال، وهو شغال هناك تبقى فرصة ممتازة كشغل وكل حاجة بكل امتيازات، وكل حاجة. بس خلاص إنتِ تبقي هناك في السعودية، بصعب جدا أتعامل معاكي، الكلام معاكي بسبب وجود بابا، ومش هتقدر نعمل حاجة، لحد ما نقطتنا ممكن تضعف علاقتنا مع الوقت، حتى الكلام هيموت. ممكن السيناريو الحلو : يحصل عادي إنه نكون مع بعض في الشغل وشغالين سوا ونتقابل بعض ونكون في وش بعض 24 ساعة، ممكن السيناريو العادي : ممكن نتقابل أحيانًا وممكن أحيانًا لا.\n\nف أنا مش هستنى إني أشوف الوضع اللي إحنا اللي فيه، ف لا أنا هعمل احتياطي لكل الـcases اللي ممكنة، ف والله لو حصل ال case الوحش او ال case الحلو ال case العادي أنا عامل حسابي علي كله. ف حبيت أعمل حاجة ما تنسيش، memorie أقدر إن أنا أخليها تفضل في دماغنا. \n\nملحوظة : ال Website ده مش هيقفل بعد ما نخلص، بس دايمًا موجود وهفضل أزود فيه حاجات مع كل يوم، مع كل وقت لحد ما ال Website يكبر أو وما يعرفش نكمله ونعمل واحد غيره عادي جدًا.",
      "rtl": true,
      "sortOrder": 1
    },
    {
      "rowId": 3,
      "id": "NOTE_003",
      "title": "The Beginning",
      "date": "SOME NIGHT, LATE",
      "body": "كلمنا إحنا على لقطاتنا بشكل غريب شوية، يعني أظن أول مرة كلمتك فيها كان وقت ما كان دراعك مكسور في سكشن الكيمياء، كنت بطمن إيه اللي حصل وكده. ده كان يوم خمسة ديسمبر، أول يوم اتعرفنا فيه على بعض.\n\nفاتعرفنا كغرباء كده، وبقينا نتعامل ونتكلم، وكان كلامنا على قدّه، وكنا لسه عارفين بعض. لحد ما قعدنا نتكلم ونتكلم ونتكلم، ونهزر مع بعض.\n\nفجأة ظهرت في نص السنة مشكلة ليكي، كنتِ مش طايقة نفسك، منهارة، ومش فاهمة حاجة، وقعدنا نتكلم كتير. أظن إن ده قرّبنا من بعض، وقعدنا كده كذا مرة نتناقش مع بعض، وكلنا بعيد عن الأشخاص، يعني بنكلّمهم كلهم.\n\nبعدها خرجنا مرة واتنين وتلاتة. حقيقي، على قد ما البداية كانت غريبة، وكانت تحس إن إيه ده؟ في إيه؟ على قد ما كانت فيها حتة خير، وكانت حاجة حلوة أوي. مش عارف أقولها إزاي، بس كانت حاجة ما تتعوضش بصراحة.\n\nكنت بقعد أحد زي... كنت بقعد... هيبقى أي حد بقى بيحبه وكده، ما يبقاش حد فيه... مش... يبقى شخص مجرد إحنا بس بنحترم بعض، وإخوات، وفي مشاعر دي كلها، اللي هو... بس ما بقاش حد برا إخواتي البنات، فاهماني.\n\nفدي حاجة أقسم بالله اقدر اقول ان ده احلي قدر ممكن يكون حصل ليا حقيقي.",
      "rtl": true,
      "sortOrder": 2
    },
    {
      "rowId": 4,
      "id": "NOTE_004",
      "title": "The End",
      "date": "DO NOT READ UNTIL YOUR BIRTHDAY",
      "body": "عنوان غريب النهاية. مش قصدي هنا إن هي نهاية أختنا أو حاجة زي كده خالص نهائي، أنا قصدي نهاية المشروع بشكل عام أو نهاية كلامي.\n\nببساطة يا سوو، إنتِ مش أي حد، إنتِ حد غالي جدًا بالنسبة لي، حد يعني كتير، كصاحب، كأخت، ككل حاجة عامة. فحابب أقول إن أتمنى نهاية السنة دي تكون إن شاء الله، مش نهاية تعاملنا أو نهاية كلامنا أو مقابلتنا حتى، أتمنى دايمًا ما تكونش النهاية، وتكون مجرد بداية بس، والحياة بنغيّر بقى كلها قرف.\n\nوإن إحنا تعاملنا يكبر ويكبر ويكبر، لحد ما نبقى أصحاب عيلة. أهلي عارفينك، أهلك عارفيني، كده يعني. فده هيبقى لذيذ بإذن الله.\n\nكل ده أتمنى حقيقي، وإن شاء الله يعني هنعمل ده، نشتغل على إن إحنا نعمل ده مع بعض سوا بإذن الله.\n\nفأحب أقولك إن كل سنة وإنتِ طيبة، وأيام سعيدة، وإن شاء الله ما يبقاش آخر مرة أقول حاجة زي دي، وأقولها كل سنة ونقولها لبعض دايمًا يا رب.\n\nونقدر نقول ده لبعض لحد ما... مفيش حد فوقي كدا، إن شاء الله يكون ده مش قريب بأي طريقة كانت، يعني نقعد عقدين تلاتة كده يبقى زي الفل، يعني كده برضو هيبقى لسه معانا مدة قدامنا نمد القعد كمان \n\nإن شاء الله من الخير دايمًا، مبسوط في حياتي، دايمًا سعيدة، ودايمًا أحاول إن أنا أعمل أي حاجة تسعدك، أتمنى يعني، ودايمًا موجودة في حياتك أكيد.",
      "rtl": true,
      "sortOrder": 3
    }
  ],
  "videos": [
    {
      "rowId": 1,
      "id": "VIDEO_001",
      "file": "ROADTRIP_1998.REC",
      "title": "Your Moment Of Honor",
      "dur": 17,
      "art": "road",
      "media": "assets/uploads/videos/c0c28646-137d-429c-9d14-317bd9ed4160.mp4",
      "sortOrder": 0
    },
    {
      "rowId": 2,
      "id": "VIDEO_002",
      "file": "BIRTHDAY_EVE.REC",
      "title": "Receive Your Training Certificate",
      "dur": 2,
      "art": "party",
      "media": "assets/uploads/videos/090ac28d-0372-4674-81f3-da3e175fac53.mp4",
      "sortOrder": 1
    }
  ],
  "tracks": [
    {
      "rowId": 1,
      "id": "TRACK_001",
      "title": "our song",
      "artist": "UNKNOWN ARTIST",
      "art": "hearts",
      "notes": [
        [
          523,
          1
        ],
        [
          659,
          1
        ],
        [
          784,
          1
        ],
        [
          880,
          2
        ],
        [
          784,
          1
        ],
        [
          659,
          1
        ],
        [
          587,
          1
        ],
        [
          659,
          2
        ],
        [
          0,
          1
        ],
        [
          523,
          1
        ],
        [
          659,
          1
        ],
        [
          784,
          1
        ],
        [
          1047,
          2
        ],
        [
          880,
          1
        ],
        [
          784,
          1
        ],
        [
          698,
          1
        ],
        [
          659,
          2
        ]
      ],
      "media": null,
      "sortOrder": 0
    },
    {
      "rowId": 2,
      "id": "TRACK_002",
      "title": "midnight drive",
      "artist": "UNKNOWN ARTIST",
      "art": "night",
      "notes": [
        [
          392,
          2
        ],
        [
          440,
          1
        ],
        [
          523,
          2
        ],
        [
          587,
          1
        ],
        [
          659,
          3
        ],
        [
          0,
          1
        ],
        [
          587,
          1
        ],
        [
          523,
          1
        ],
        [
          440,
          2
        ],
        [
          392,
          1
        ],
        [
          330,
          3
        ],
        [
          0,
          2
        ]
      ],
      "media": null,
      "sortOrder": 1
    },
    {
      "rowId": 3,
      "id": "TRACK_003",
      "title": "pink cassette",
      "artist": "UNKNOWN ARTIST",
      "art": "sunset",
      "notes": [
        [
          659,
          1
        ],
        [
          587,
          1
        ],
        [
          523,
          1
        ],
        [
          587,
          1
        ],
        [
          659,
          2
        ],
        [
          659,
          2
        ],
        [
          587,
          2
        ],
        [
          587,
          2
        ],
        [
          659,
          2
        ],
        [
          659,
          2
        ],
        [
          523,
          1
        ],
        [
          587,
          1
        ],
        [
          659,
          3
        ]
      ],
      "media": null,
      "sortOrder": 2
    }
  ],
  "messages": [
    {
      "rowId": 1,
      "id": "MSG_001",
      "from": "Me",
      "subject": "The Live",
      "body": "Another year,\nanother memory,\nanother reason to be grateful that you're here.",
      "rtl": false,
      "sortOrder": 0
    },
    {
      "rowId": 2,
      "id": "MSG_002",
      "from": "Me",
      "subject": "Not Just Anyone",
      "body": "You’re not just anyone. You’re someone I’m genuinely grateful to have.",
      "rtl": true,
      "sortOrder": 1
    },
    {
      "rowId": 3,
      "id": "MSG_003",
      "from": "Me",
      "subject": "Just The Start",
      "body": "I hope this isn’t the end of anything, but only the beginning of more memories.",
      "rtl": false,
      "sortOrder": 2
    },
    {
      "rowId": 4,
      "id": "MSG_004",
      "from": "Me",
      "subject": "Always Around",
      "body": "No matter where life takes us, I hope we always find our way back to each other.",
      "rtl": false,
      "sortOrder": 3
    },
    {
      "rowId": 5,
      "id": "MSG_005",
      "from": "Me",
      "subject": "The Beginning",
      "body": "كل سنة وإنتِ أجمل جزء في الحكاية.",
      "rtl": true,
      "sortOrder": 4
    }
  ],
  "secret": {
    "title": "/SECRET/DO_NOT_OPEN.TXT",
    "body": "You found something you weren't supposed to find.\n\nOf course you did. You always do.\n\nThis machine has been keeping something for you —\na message at the very end of everything.\n\nWhen you're ready, press the button."
  }
};

  USER = data.site.user || "GUEST";
  FINALE_HEADING = data.site.finaleHeading || "HAPPY BIRTHDAY";
  FINAL_MESSAGE = data.site.finalMessage || "";
  MEMORIES = data.memories || [];
  PHOTOS = data.photos || [];
  NOTES = data.notes || [];
  VIDEOS = data.videos || [];
  TRACKS = data.tracks || [];
  MESSAGES = data.messages || [];
  SECRET_MESSAGE = data.secret || { title: "", body: "" };
  contentLoaded = true;
  return data;
}
