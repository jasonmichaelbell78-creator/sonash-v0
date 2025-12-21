// Deduplication Script for Recovery Quotes
// This file contains the 50 new quotes parsed from recovery_quotes_50.md

export interface Quote {
    text: string
    author: string
    source?: string
}

// New quotes from recovery_quotes_50.md
export const newRecoveryQuotes: Quote[] = [
    // AA/Al-Anon/12-Step sayings (1-25)
    { text: "Our common welfare should come first; personal recovery depends upon A.A. unity.", author: "Alcoholics Anonymous", source: "Twelve Traditions (Tradition One)" },
    { text: "Rarely have we seen a person fail who has thoroughly followed our path.", author: "Alcoholics Anonymous", source: "Big Book, Ch. 5 'How It Works'" },
    { text: "Half measures availed us nothing.", author: "Alcoholics Anonymous", source: "Big Book, Ch. 5 'How It Works'" },
    { text: "Those who do not recover are people who cannot or will not completely give themselves to this simple program…", author: "Alcoholics Anonymous", source: "Big Book, Ch. 5 'How It Works'" },
    { text: "If you have decided you want what we have and are willing to go to any length to get it—then you are ready to take certain steps.", author: "Alcoholics Anonymous", source: "Big Book, Ch. 5 'How It Works'" },
    { text: "God could and would if He were sought.", author: "Alcoholics Anonymous", source: "Big Book, Ch. 5 'How It Works'" },
    { text: "We claim spiritual progress rather than spiritual perfection.", author: "Alcoholics Anonymous", source: "Big Book, Ch. 5 'How It Works'" },
    { text: "We alcoholics are men and women who have lost the ability to control our drinking.", author: "Alcoholics Anonymous", source: "Big Book, Ch. 3 'More About Alcoholism'" },
    { text: "We are without defense against the first drink.", author: "Alcoholics Anonymous", source: "Big Book, Ch. 3 'More About Alcoholism'" },
    { text: "Practical experience shows that nothing will so much insure immunity from drinking as intensive work with other alcoholics.", author: "Alcoholics Anonymous", source: "Big Book, Ch. 7 'Working With Others'" },
    { text: "We will not regret the past nor wish to shut the door on it.", author: "Alcoholics Anonymous", source: "Big Book, Ch. 6 'Into Action'" },
    { text: "Sometimes quickly, sometimes slowly.", author: "Alcoholics Anonymous", source: "Big Book, Ch. 6 'Into Action'" },
    { text: "It works—it really does.", author: "Alcoholics Anonymous", source: "Big Book, Ch. 6 'Into Action'" },
    { text: "We are not a glum lot.", author: "Alcoholics Anonymous", source: "Big Book, Ch. 9 'The Family Afterward'" },
    { text: "A great turning point in our lives came when we sought for humility as something we really wanted…", author: "Alcoholics Anonymous", source: "Twelve Steps & Twelve Traditions, Step Seven" },
    { text: "One Day at a Time.", author: "Al‑Anon", source: "Fellowship slogan" },
    { text: "Live and Let Live.", author: "Al‑Anon", source: "Fellowship slogan" },
    { text: "Let It Begin with Me.", author: "Al‑Anon", source: "Fellowship saying" },
    { text: "Let Go and Let God.", author: "Anonymous", source: "Fellowship saying" },
    { text: "Easy Does It.", author: "Anonymous", source: "Fellowship saying" },
    { text: "First Things First.", author: "Anonymous", source: "Fellowship saying" },
    { text: "Keep It Simple.", author: "Anonymous", source: "Fellowship saying" },
    { text: "Think.", author: "Anonymous", source: "Fellowship saying" },
    { text: "Progress, Not Perfection.", author: "Anonymous", source: "Fellowship saying" },
    { text: "Just for today…", author: "Anonymous", source: "Fellowship saying" },

    // NA sayings (26-35)
    { text: "We do recover.", author: "Narcotics Anonymous", source: "Basic Text" },
    { text: "Lost dreams awaken and new possibilities arise.", author: "Narcotics Anonymous", source: "Basic Text" },
    { text: "There is no model of the recovering addict.", author: "Narcotics Anonymous", source: "Basic Text" },
    { text: "When the drugs go and the addict works the program, wonderful things happen.", author: "Narcotics Anonymous", source: "Basic Text" },
    { text: "We can lose the desire to use.", author: "Narcotics Anonymous", source: "Basic Text" },
    { text: "We have found a way out…", author: "Narcotics Anonymous", source: "Basic Text" },
    { text: "We learned that we must live without drugs in order to live.", author: "Narcotics Anonymous", source: "Basic Text" },
    { text: "Just for today my thoughts will be on my recovery…", author: "Narcotics Anonymous", source: "Just for Today" },
    { text: "Keep coming back.", author: "Anonymous", source: "Fellowship saying" },
    { text: "It works if you work it.", author: "Anonymous", source: "Fellowship saying" },

    // Named authors (36-50)
    { text: "God, give us grace to accept with serenity the things that cannot be changed…", author: "Reinhold Niebuhr", source: "Serenity Prayer" },
    { text: "Spiritus contra spiritum. (spirit against spirit)", author: "Carl Jung", source: "Recovery history" },
    { text: "The opposite of addiction is not sobriety. The opposite of addiction is connection.", author: "Johann Hari" },
    { text: "The mentality and behavior of drug addicts and alcoholics is wholly irrational…", author: "Russell Brand" },
    { text: "And so rock bottom became the solid foundation on which I rebuilt my life.", author: "J.K. Rowling" },
    { text: "Recovery is something that you have to work on every single day… it doesn't get a day off.", author: "Demi Lovato" },
    { text: "Nobody stays recovered unless the life they have created is more rewarding and satisfying than the one they left behind.", author: "Anne Fletcher" },
    { text: "The chains of habit are too weak to be felt until they are too strong to be broken.", author: "Samuel Johnson" },
    { text: "I can be changed by what happens to me. But I refuse to be reduced by it.", author: "Maya Angelou" },
    { text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius" },
    { text: "Between stimulus and response there is a space…", author: "Viktor Frankl" },
    { text: "The greatest discovery of my generation is that human beings can alter their lives by altering their attitudes of mind.", author: "William James" },
    { text: "Remember just because you hit bottom doesn't mean you have to stay there.", author: "Robert Downey Jr." },
    { text: "Sobriety delivers what alcohol promises.", author: "Anonymous", source: "Recovery saying" },
    { text: "You can't think your way into right acting; you can act your way into right thinking.", author: "Anonymous", source: "Recovery saying" }
]

// Existing quotes currently in the system (from browser check)
export const existingQuotes: Quote[] = [
    { text: "One day at a time", author: "Recovery Slogan", source: "Traditional" },
    { text: "We are people who normally would not mix.", author: "Alcoholics Anonymous", source: "Big Book p. 17" },
    { text: "Humility is not thinking less of yourself, but thinking of yourself less.", author: "C.S. Lewis" },
    { text: "The only way out is through.", author: "Robert Frost" },
    { text: "Recovery is about progression, not perfection.", author: "Unknown" },
    { text: "Faith is doing the footwork and letting go of the results.", author: "Unknown" },
    { text: "Serenity is not freedom from the storm, but peace amid the storm.", author: "Unknown" }
]

// Deduplication logic: check for similar text (normalized)
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove punctuation
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim()
}

export function findDuplicates(): { duplicates: Quote[], unique: Quote[] } {
    const duplicates: Quote[] = []
    const unique: Quote[] = []

    const existingNormalized = existingQuotes.map(q => normalizeText(q.text))

    for (const quote of newRecoveryQuotes) {
        const normalizedNew = normalizeText(quote.text)
        const isDuplicate = existingNormalized.some(existing =>
            existing.includes(normalizedNew.slice(0, 20)) ||
            normalizedNew.includes(existing.slice(0, 20))
        )

        if (isDuplicate) {
            duplicates.push(quote)
        } else {
            unique.push(quote)
        }
    }

    return { duplicates, unique }
}

// Run deduplication
const result = findDuplicates()
console.log(`Found ${result.duplicates.length} duplicates`)
console.log(`Found ${result.unique.length} unique quotes to add`)

// Log potential duplicates for manual review
if (result.duplicates.length > 0) {
    console.log('\nPotential Duplicates:')
    result.duplicates.forEach(q => console.log(`- "${q.text}" (${q.author})`))
}
