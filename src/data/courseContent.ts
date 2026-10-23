import type { Course, LessonNode, Unit } from "@/types/curriculum";

const lesson = (id: string, title: string, description: string, topic: string, focusPoints: string[]): LessonNode => ({
    id, title, description, type: 'lesson',
    content: { topic, level: 'A1', focusPoints },
});

const checkpoint = (unitNumber: number, covers: string): LessonNode => ({
    id: `u${unitNumber}-quiz`,
    title: "Checkpoint",
    description: `Review Unit ${unitNumber}`,
    type: 'quiz',
    content: {
        topic: `Unit ${unitNumber} review`,
        level: 'A1',
        focusPoints: [`Mixed review of: ${covers}`, "No new vocabulary — recycle what was taught"],
    },
});

// A1 path ordered so each lesson only relies on earlier ones. Grammar is front-loaded
// with the areas learners struggle with most: gender, cases, aspect and motion verbs.
const units: Unit[] = [
    {
        id: "unit-1",
        title: "The Basics",
        description: "Cyrillic, sounds and first words",
        nodes: [
            lesson("u1-l1", "Easy Letters", "А, К, М, О, Т", "Cyrillic letters that look and sound like English",
                ["Letters А К М О Т", "Words built only from these letters: кот, мама, том, ток", "Stress and unstressed О sounding like А"]),
            lesson("u1-l2", "False Friends", "В, Н, Р, С, У, Х, Е", "Cyrillic letters that look like English letters but sound different",
                ["Letters В Н Р С У Х Е", "Short words: нос, рука, сок, метро", "Do not introduce letters not yet taught"]),
            lesson("u1-l3", "New Shapes", "Б, Д, Л, П, И, Я…", "New Cyrillic letter shapes",
                ["Letters Б Г Д Ж З И Й Л П Ф Ц Ч Ш Щ Ы Э Ю Я", "Soft sign Ь and hard sign Ъ", "Familiar loanwords: банк, парк, такси"]),
            lesson("u1-l4", "Greetings", "Hello, goodbye, thank you", "Greetings and polite phrases",
                ["Привет vs Здравствуйте (informal vs formal)", "Пока, До свидания, Спасибо, Пожалуйста", "Ты vs Вы"]),
            checkpoint(1, "the Cyrillic alphabet and greetings"),
        ],
    },
    {
        id: "unit-2",
        title: "Meeting People",
        description: "Introductions and who's who",
        nodes: [
            lesson("u2-l1", "Who Is It?", "I, you, he, she", "Personal pronouns and sentences without 'to be'",
                ["я ты он она мы вы они", "Это …: 'this is'", "No present-tense 'to be' in Russian"]),
            lesson("u2-l2", "My Name Is", "Меня зовут…", "Introducing yourself",
                ["Как тебя/вас зовут? Меня зовут …", "Очень приятно", "Fixed phrase — do not teach accusative yet"]),
            lesson("u2-l3", "He, She, It", "Noun gender", "Grammatical gender of nouns",
                ["Masculine (consonant), feminine (-а/-я), neuter (-о/-е)", "он / она / оно replacing nouns", "Common exceptions: папа is masculine"]),
            lesson("u2-l4", "Where From?", "Countries & languages", "Where are you from and what languages do you speak",
                ["Я из … (fixed phrase with countries)", "Я говорю по-русски / по-английски", "Nationalities: русский / русская"]),
            checkpoint(2, "pronouns, introductions, noun gender and countries"),
        ],
    },
    {
        id: "unit-3",
        title: "Everyday Life",
        description: "Numbers, family and where things are",
        nodes: [
            lesson("u3-l1", "Numbers", "1 to 20", "Numbers from one to twenty",
                ["один, два, три … двадцать", "Сколько? (how many/how much)", "Write numbers as words in Russian text"]),
            lesson("u3-l2", "My Family", "Мой, моя, моё", "Family members and possessives",
                ["мама папа брат сестра сын дочь", "мой/моя/моё/мои agreeing with gender", "У меня есть … (fixed phrase)"]),
            lesson("u3-l3", "What I Do", "Present tense verbs", "Present tense of -ать verbs",
                ["читать, работать, знать, понимать", "Endings: -ю -ешь -ет -ем -ете -ют", "Я работаю / Ты работаешь"]),
            lesson("u3-l4", "Where Is It?", "в/на + prepositional", "Prepositional case for location",
                ["Где? — в/на + -е: в парке, на столе", "Feminine -а → -е: в школе", "Minimal pairs: стол → на столе"]),
            checkpoint(3, "numbers, family, present tense and location"),
        ],
    },
    {
        id: "unit-4",
        title: "Out and About",
        description: "Food, shopping and getting around",
        nodes: [
            lesson("u4-l1", "I Want…", "Accusative objects", "Accusative case for direct objects",
                ["Я хочу / Я вижу + object", "Feminine -а → -у: воду, книгу", "Masculine inanimate and neuter unchanged"]),
            lesson("u4-l2", "At the Café", "Ordering food", "Ordering at a café",
                ["кофе, чай, вода, суп, хлеб", "Можно …, пожалуйста? / Я буду …", "Счёт, пожалуйста"]),
            lesson("u4-l3", "On the Move", "Идти vs ехать", "Motion verbs: going on foot vs by transport",
                ["идти (on foot) vs ехать (by vehicle)", "Куда? в/на + accusative: в магазин, на работу", "Contrast Где? (location) vs Куда? (direction)"]),
            lesson("u4-l4", "More Than One", "Plurals", "Plural nouns in the nominative",
                ["-ы / -и endings: столы, книги", "Spelling rule: no ы after к г х ж ш ч щ", "Neuter -о → -а: окна"]),
            checkpoint(4, "accusative, ordering food, motion verbs and plurals"),
        ],
    },
    {
        id: "unit-5",
        title: "Past and Plans",
        description: "Talking about time, yesterday and likes",
        nodes: [
            lesson("u5-l1", "Days & Time", "Week days, today, tomorrow", "Days of the week and time words",
                ["понедельник … воскресенье", "сегодня, завтра, вчера", "в + day: в понедельник"]),
            lesson("u5-l2", "Yesterday", "Past tense", "Past tense of verbs",
                ["-л / -ла / -ло / -ли agreeing with the subject", "Я читал (male) / Я читала (female)", "Был / была / были"]),
            lesson("u5-l3", "Done or Doing?", "Verb aspect", "Introduction to verb aspect",
                ["делать vs сделать, читать vs прочитать", "Process / repeated action vs completed result", "Minimal pairs in the past tense"]),
            lesson("u5-l4", "I Like It", "Мне нравится", "Expressing likes and dislikes",
                ["Мне нравится + singular / Мне нравятся + plural", "Я люблю + infinitive", "Тебе нравится?"]),
            checkpoint(5, "time words, past tense, aspect and likes"),
        ],
    },
];

export const COURSE_CONTENT: Course = {
    id: "russian-foundation",
    title: "Russian Foundation",
    units,
};

export const ALL_NODES: LessonNode[] = units.flatMap(u => u.nodes);

export const findNode = (id: string | undefined) => ALL_NODES.find(n => n.id === id);
