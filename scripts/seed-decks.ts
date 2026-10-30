import { prisma } from "../lib/prisma";

type SeedWord = {
    term: string;
    partOfSpeech: string;
    meaning: string;
    meaningBn: string;
    example: string;
};

type SeedDeck = {
    slug: string;
    title: string;
    description: string;
    level: string;
    words: SeedWord[];
};

const decks: SeedDeck[] = [
{
    slug: "everyday-verbs",
    title: "Everyday Verbs",
    description: "প্রতিদিনের কথাবার্তায় সবচেয়ে বেশি ব্যবহৃত ১০টি ক্রিয়া।",
    level: "Beginner",
    words: [
        { term: "borrow", partOfSpeech: "verb", meaning: "to take something from someone and give it back later", meaningBn: "ধার নেওয়া", example: "May I borrow your pen?" },
        { term: "lend", partOfSpeech: "verb", meaning: "to give something to someone for a short time", meaningBn: "ধার দেওয়া", example: "Can you lend me some money?" },
        { term: "explain", partOfSpeech: "verb", meaning: "to make something clear by giving details", meaningBn: "বুঝিয়ে বলা", example: "Please explain this word to me." },
        { term: "suggest", partOfSpeech: "verb", meaning: "to offer an idea or plan for someone to consider", meaningBn: "প্রস্তাব দেওয়া", example: "I suggest we start early." },
        { term: "agree", partOfSpeech: "verb", meaning: "to have the same opinion as someone", meaningBn: "একমত হওয়া", example: "I agree with your idea." },
        { term: "invite", partOfSpeech: "verb", meaning: "to ask someone to come to an event", meaningBn: "আমন্ত্রণ জানানো", example: "She invited me to her birthday party." },
        { term: "forget", partOfSpeech: "verb", meaning: "to not remember something", meaningBn: "ভুলে যাওয়া", example: "Don't forget your keys." },
        { term: "remember", partOfSpeech: "verb", meaning: "to keep something in your mind", meaningBn: "মনে রাখা", example: "I remember his name." },
        { term: "wait", partOfSpeech: "verb", meaning: "to stay somewhere until something happens", meaningBn: "অপেক্ষা করা", example: "Please wait here for a moment." },
        { term: "choose", partOfSpeech: "verb", meaning: "to pick one thing from several options", meaningBn: "বেছে নেওয়া", example: "You can choose any color." },
    ],
},
{
    slug: "feelings-and-emotions",
    title: "Feelings & Emotions",
    description: "নিজের অনুভূতি ইংরেজিতে প্রকাশ করার ১০টি শব্দ।",
    level: "Beginner",
    words: [
        { term: "happy", partOfSpeech: "adjective", meaning: "feeling pleasure or joy", meaningBn: "খুশি", example: "She is happy today." },
        { term: "sad", partOfSpeech: "adjective", meaning: "feeling unhappy", meaningBn: "মন খারাপ", example: "He felt sad after the news." },
        { term: "angry", partOfSpeech: "adjective", meaning: "feeling strong displeasure toward someone or something", meaningBn: "রাগান্বিত", example: "Dad was angry about the mess." },
        { term: "nervous", partOfSpeech: "adjective", meaning: "worried or a little afraid about something", meaningBn: "উদ্বিগ্ন", example: "I feel nervous before exams." },
        { term: "proud", partOfSpeech: "adjective", meaning: "feeling pleased about an achievement", meaningBn: "গর্বিত", example: "I'm proud of you." },
        { term: "lonely", partOfSpeech: "adjective", meaning: "sad because you are alone or have no friends nearby", meaningBn: "একাকী", example: "She felt lonely in the new city." },
        { term: "excited", partOfSpeech: "adjective", meaning: "very happy and full of energy about something", meaningBn: "উচ্ছ্বসিত", example: "The kids are excited about the trip." },
        { term: "tired", partOfSpeech: "adjective", meaning: "needing rest or sleep", meaningBn: "ক্লান্ত", example: "I am tired after a long day." },
        { term: "surprised", partOfSpeech: "adjective", meaning: "feeling shock because something was unexpected", meaningBn: "অবাক", example: "I was surprised to see him there." },
        { term: "jealous", partOfSpeech: "adjective", meaning: "unhappy because someone else has something you want", meaningBn: "ঈর্ষান্বিত", example: "He was jealous of his friend's new bike." },
    ],
},
];

async function main() {
for (const { words, ...deckData } of decks) {
    const deck = await prisma.deck.upsert({
    where: { slug: deckData.slug },
    update: deckData,
    create: deckData,
    });

    for (const word of words) {
    await prisma.deckWord.upsert({
        where: { deckId_term: { deckId: deck.id, term: word.term } },
        update: word,
        create: { ...word, deckId: deck.id },
    });
    }

    console.log(`✓ ${deck.title}: ${words.length} words`);
}
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });