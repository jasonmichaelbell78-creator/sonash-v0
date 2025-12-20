/**
 * Recovery Slogans & Sayings
 * For use in Daily Quotes admin panel
 * 
 * Attributions researched from AA literature and recovery resources
 */

export interface RecoverySlogan {
    text: string
    author: string
    source?: string
}

export const recoverySlogans: RecoverySlogan[] = [
    // =====================
    // AA LITERATURE QUOTES
    // =====================
    { text: "Half measures availed us nothing.", author: "Alcoholics Anonymous", source: "Big Book p. 59" },
    { text: "We are people who normally would not mix.", author: "Alcoholics Anonymous", source: "Big Book p. 17" },
    { text: "Alcoholism is an illness which only a spiritual experience will conquer.", author: "Alcoholics Anonymous", source: "Big Book" },
    { text: "If you want what we have... you are ready to take certain steps.", author: "Alcoholics Anonymous", source: "Big Book p. 58" },
    { text: "Faith without works is dead.", author: "James 2:26", source: "Big Book p. 88" },

    // =====================
    // TRADITIONAL SLOGANS
    // =====================
    { text: "One day at a time.", author: "Traditional", source: "AA Slogan" },
    { text: "Easy does it.", author: "Traditional", source: "AA Slogan" },
    { text: "First things first.", author: "Traditional", source: "AA Slogan" },
    { text: "Let go and let God.", author: "Traditional", source: "AA Slogan" },
    { text: "Keep coming back.", author: "Traditional", source: "AA Slogan" },
    { text: "Keep it simple.", author: "Traditional", source: "AA Slogan" },
    { text: "Live and let live.", author: "Traditional", source: "AA Slogan" },
    { text: "This too shall pass.", author: "Traditional", source: "Persian Proverb / Recovery" },
    { text: "Progress, not perfection.", author: "Traditional", source: "AA Slogan" },
    { text: "Meeting makers make it.", author: "Traditional", source: "AA Slogan" },
    { text: "To thine own self be true.", author: "William Shakespeare", source: "Hamlet / AA Medallion" },
    { text: "90 meetings in 90 days.", author: "Traditional", source: "AA Suggestion" },

    // =====================
    // WISDOM SAYINGS
    // =====================
    { text: "Bring the body and the mind will follow.", author: "Traditional", source: "AA Wisdom" },
    { text: "But for the grace of God.", author: "Traditional", source: "AA Expression" },
    { text: "Change playmates and playgrounds.", author: "Traditional", source: "Recovery Wisdom" },
    { text: "Denial is not a river in Egypt.", author: "Traditional", source: "Recovery Humor" },
    { text: "Don't quit 5 minutes before the miracle happens.", author: "Traditional", source: "AA Wisdom" },
    { text: "Don't work my program, or your program, work 'The Program'.", author: "Traditional", source: "AA Wisdom" },
    { text: "Faith chases away fear.", author: "Traditional", source: "Recovery Wisdom" },
    { text: "Fake it till you make it.", author: "Traditional", source: "AA Slogan" },
    { text: "If God seems far away, who moved?", author: "Traditional", source: "Recovery Wisdom" },
    { text: "If you find a path with no obstacles, it probably doesn't lead anywhere.", author: "Traditional", source: "Recovery Wisdom" },
    { text: "If you hang around the barbershop, you'll eventually get a haircut.", author: "Traditional", source: "AA Wisdom" },
    { text: "Insanity is doing the same thing over and over expecting different results.", author: "Traditional", source: "Commonly attributed to AA" },
    { text: "It works if you work it.", author: "Traditional", source: "AA Closing" },
    { text: "It's a simple program for complicated people.", author: "Traditional", source: "AA Wisdom" },
    { text: "Nothing is so bad a drink won't make it worse.", author: "Traditional", source: "AA Wisdom" },
    { text: "One drink is too many, and a thousand not enough.", author: "Traditional", source: "AA Wisdom" },
    { text: "Pain before sobriety and pain before serenity.", author: "Traditional", source: "AA Wisdom" },
    { text: "Play the tape forward.", author: "Traditional", source: "Recovery Wisdom" },
    { text: "Poor me, poor me, pour me a drink.", author: "Traditional", source: "AA Humor" },
    { text: "Principles before personalities.", author: "Alcoholics Anonymous", source: "Tradition 12" },
    { text: "Serenity isn't freedom from the storm; it is peace within the storm.", author: "Traditional", source: "Recovery Wisdom" },
    { text: "Stick with the winners.", author: "Traditional", source: "AA Wisdom" },
    { text: "Take what you need and leave the rest.", author: "Traditional", source: "AA Wisdom" },
    { text: "The elevator is broken... use the steps.", author: "Traditional", source: "AA Humor" },
    { text: "The mind is like a parachute, it works better when it's open.", author: "Traditional", source: "Recovery Wisdom" },
    { text: "There are no coincidences in recovery.", author: "Traditional", source: "AA Wisdom" },
    { text: "Three most dangerous words: 'I've been thinking'.", author: "Traditional", source: "AA Humor" },
    { text: "To keep what you have, you have to give it away.", author: "Traditional", source: "Step 12" },
    { text: "Turn it over.", author: "Traditional", source: "AA Slogan" },
    { text: "We're only as sick as our secrets.", author: "Traditional", source: "AA Wisdom" },
    { text: "Wherever you go, there you are.", author: "Traditional", source: "AA Wisdom" },
    { text: "You are not responsible for your disease, but you are responsible for your recovery.", author: "Traditional", source: "Recovery Wisdom" },

    // =====================
    // LONGER WISDOM
    // =====================
    { text: "I came, I came to, I came to believe.", author: "Traditional", source: "Steps 1-3 Summary" },
    { text: "I didn't get into trouble every time I drank, but every time I got in trouble I was drunk.", author: "Traditional", source: "AA Shares" },
    { text: "I don't always know what's right, but I always know what's wrong.", author: "Traditional", source: "AA Wisdom" },
    { text: "A.A. is a school in which we are all learners and all teachers.", author: "Traditional", source: "AA Wisdom" },
    { text: "A.A. is the last stop on the train.", author: "Traditional", source: "AA Wisdom" },
    { text: "An addict alone is in bad company.", author: "Traditional", source: "NA Wisdom" },
    { text: "A drug is a drug is a drug.", author: "Traditional", source: "NA Wisdom" },
    { text: "Death is not the worst thing, it's just the last thing.", author: "Traditional", source: "Recovery Wisdom" },
    { text: "God save me from being right.", author: "Traditional", source: "Recovery Prayer" },
    { text: "Hugs not drugs.", author: "Traditional", source: "NA Slogan" },

    // =====================
    // SPIRITUAL & PRAYER
    // =====================
    { text: "God, grant me the serenity to accept the things I cannot change, courage to change the things I can, and wisdom to know the difference.", author: "Reinhold Niebuhr", source: "Serenity Prayer" },
    { text: "Humility is not thinking less of yourself, but thinking of yourself less.", author: "C.S. Lewis", source: "Mere Christianity (adapted)" },
    { text: "The only way out is through.", author: "Robert Frost", source: "A Servant to Servants" },

    // =====================
    // REQUIREMENT
    // =====================
    { text: "A desire to stop drinking is the only requirement for membership.", author: "Alcoholics Anonymous", source: "Tradition 3" },
]
