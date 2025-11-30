// Centralized emoji definitions for icon picker
// Organized by category for easy navigation

// Emoji to keywords mapping for search functionality
export const EMOJI_KEYWORDS: Record<string, string[]> = {
    // Productivity
    '💼': ['briefcase', 'work', 'business', 'job', 'office'],
    '📊': ['chart', 'graph', 'analytics', 'data', 'statistics'],
    '📁': ['folder', 'file', 'organize', 'documents'],
    '📋': ['clipboard', 'list', 'checklist', 'tasks'],
    '✅': ['check', 'done', 'complete', 'task', 'todo'],
    '📝': ['note', 'memo', 'write', 'document'],
    '💡': ['idea', 'bulb', 'light', 'creative', 'think'],
    '🎯': ['target', 'goal', 'aim', 'focus', 'dart'],
    '📈': ['growth', 'increase', 'up', 'chart', 'profit'],
    '📉': ['decrease', 'down', 'chart', 'loss'],
    '💰': ['money', 'finance', 'budget', 'cash', 'dollar'],
    '🏢': ['office', 'building', 'company', 'corporate'],
    '📧': ['email', 'mail', 'message', 'inbox'],
    '📞': ['phone', 'call', 'telephone', 'contact'],
    '🤝': ['handshake', 'deal', 'meeting', 'agreement', 'partner'],
    '📆': ['calendar', 'date', 'schedule', 'plan'],
    '⏰': ['clock', 'time', 'alarm', 'timer'],
    '🔔': ['bell', 'notification', 'alert', 'reminder'],
    '📌': ['pin', 'pushpin', 'important', 'mark'],
    '🗂️': ['dividers', 'organize', 'tabs', 'index'],

    // Fitness
    '🏃': ['run', 'running', 'jog', 'exercise', 'cardio'],
    '🏃‍♂️': ['run', 'running', 'jog', 'exercise', 'cardio', 'man'],
    '🏃‍♀️': ['run', 'running', 'jog', 'exercise', 'cardio', 'woman'],
    '🧘': ['yoga', 'meditation', 'zen', 'relax', 'mindfulness'],
    '🧘‍♂️': ['yoga', 'meditation', 'zen', 'relax', 'man'],
    '🧘‍♀️': ['yoga', 'meditation', 'zen', 'relax', 'woman'],
    '💪': ['muscle', 'strong', 'strength', 'gym', 'workout', 'arm'],
    '🚴': ['bike', 'cycling', 'bicycle', 'ride'],
    '🚴‍♂️': ['bike', 'cycling', 'bicycle', 'ride', 'man'],
    '🏋️': ['weight', 'gym', 'lift', 'training', 'fitness'],
    '🏋️‍♂️': ['weight', 'gym', 'lift', 'training', 'man'],
    '🤸': ['gymnastics', 'cartwheel', 'acrobat', 'flexible'],
    '🤸‍♂️': ['gymnastics', 'cartwheel', 'acrobat', 'man'],
    '⚽': ['soccer', 'football', 'ball', 'sport'],
    '🏀': ['basketball', 'ball', 'sport', 'nba'],
    '🎾': ['tennis', 'ball', 'racket', 'sport'],
    '🏊': ['swim', 'swimming', 'pool', 'water'],
    '🏊‍♂️': ['swim', 'swimming', 'pool', 'water', 'man'],
    '🚶': ['walk', 'walking', 'stroll', 'steps'],
    '🚶‍♂️': ['walk', 'walking', 'stroll', 'steps', 'man'],
    '🧗': ['climb', 'climbing', 'rock', 'mountain'],
    '🧗‍♂️': ['climb', 'climbing', 'rock', 'mountain', 'man'],
    '⛹️': ['basketball', 'bounce', 'ball', 'sport'],
    '🏌️': ['golf', 'sport', 'swing', 'club'],

    // Creative
    '🎨': ['art', 'paint', 'palette', 'creative', 'draw', 'design'],
    '🎵': ['music', 'note', 'song', 'audio', 'sound'],
    '🎶': ['music', 'notes', 'song', 'melody'],
    '📸': ['photo', 'camera', 'picture', 'snapshot'],
    '✏️': ['pencil', 'write', 'draw', 'sketch', 'edit'],
    '🎬': ['movie', 'film', 'video', 'cinema', 'action'],
    '🎭': ['theater', 'drama', 'acting', 'masks', 'perform'],
    '🖌️': ['brush', 'paint', 'art', 'draw'],
    '📐': ['ruler', 'design', 'measure', 'triangle', 'draft'],
    '🎹': ['piano', 'keyboard', 'music', 'keys'],
    '🎸': ['guitar', 'music', 'rock', 'instrument'],
    '🎺': ['trumpet', 'music', 'brass', 'jazz'],
    '🎻': ['violin', 'music', 'classical', 'strings'],
    '🥁': ['drum', 'music', 'beat', 'percussion'],
    '🎤': ['microphone', 'sing', 'karaoke', 'voice', 'podcast'],
    '📷': ['camera', 'photo', 'picture'],
    '🎥': ['video', 'camera', 'film', 'record', 'movie'],
    '✍️': ['write', 'writing', 'hand', 'signature'],
    '🖼️': ['picture', 'frame', 'art', 'gallery'],
    '🎪': ['circus', 'carnival', 'tent', 'show'],

    // Learning
    '📚': ['books', 'study', 'read', 'library', 'learn', 'education'],
    '📖': ['book', 'read', 'open', 'study'],
    '🎓': ['graduate', 'education', 'school', 'university', 'cap'],
    '🔬': ['science', 'microscope', 'research', 'lab'],
    '💻': ['laptop', 'computer', 'code', 'programming', 'tech'],
    '📱': ['phone', 'mobile', 'smartphone', 'app'],
    '🧮': ['abacus', 'math', 'calculate', 'count'],
    '🔢': ['numbers', 'math', 'count', 'digits'],
    '📰': ['newspaper', 'news', 'article', 'press'],
    '🗞️': ['newspaper', 'news', 'rolled'],
    '📕': ['book', 'red', 'read', 'closed'],
    '📗': ['book', 'green', 'read'],
    '📘': ['book', 'blue', 'read'],
    '📙': ['book', 'orange', 'read'],
    '🔎': ['search', 'magnify', 'find', 'look', 'research'],
    '🧠': ['brain', 'think', 'mind', 'smart', 'intelligence'],
    '💭': ['thought', 'think', 'bubble', 'idea'],
    '📓': ['notebook', 'journal', 'write', 'diary'],
    '📒': ['ledger', 'notebook', 'yellow'],

    // Lifestyle
    '🍽️': ['food', 'eat', 'meal', 'dinner', 'plate', 'dining'],
    '☕': ['coffee', 'tea', 'drink', 'cafe', 'morning'],
    '🍳': ['cooking', 'breakfast', 'egg', 'fry', 'kitchen'],
    '🛒': ['shopping', 'cart', 'grocery', 'store', 'buy'],
    '🏠': ['home', 'house', 'family', 'domestic'],
    '🚗': ['car', 'drive', 'commute', 'travel', 'vehicle'],
    '✈️': ['plane', 'travel', 'flight', 'airport', 'vacation'],
    '💤': ['sleep', 'rest', 'nap', 'tired', 'zzz'],
    '🧹': ['clean', 'broom', 'sweep', 'chores', 'housework'],
    '👔': ['clothes', 'shirt', 'dress', 'formal', 'work'],
    '💊': ['medicine', 'health', 'pill', 'vitamin', 'pharmacy'],
    '🛁': ['bath', 'bathroom', 'relax', 'tub', 'wash'],
    '🧺': ['laundry', 'basket', 'clothes', 'wash'],
    '🛏️': ['bed', 'sleep', 'bedroom', 'rest'],
    '🚿': ['shower', 'bathroom', 'wash', 'clean'],
    '🪥': ['toothbrush', 'dental', 'teeth', 'hygiene'],
    '👶': ['baby', 'child', 'kids', 'parenting', 'family'],
    '🐕': ['dog', 'pet', 'walk', 'animal'],
    '🐈': ['cat', 'pet', 'animal', 'feline'],
    '🌱': ['plant', 'garden', 'grow', 'nature', 'seedling'],

    // Tools
    '🛠️': ['tools', 'fix', 'repair', 'build', 'hardware'],
    '⚙️': ['gear', 'settings', 'config', 'mechanical'],
    '🔧': ['wrench', 'fix', 'repair', 'tool'],
    '🔨': ['hammer', 'build', 'construct', 'tool'],
    '📦': ['package', 'box', 'delivery', 'ship'],
    '📎': ['paperclip', 'attach', 'office'],
    '✂️': ['scissors', 'cut', 'craft'],
    '🔒': ['lock', 'secure', 'privacy', 'password'],
    '💾': ['save', 'disk', 'floppy', 'storage'],
    '🖥️': ['computer', 'desktop', 'monitor', 'screen'],
    '⌨️': ['keyboard', 'type', 'computer', 'input'],
    '🖱️': ['mouse', 'click', 'computer', 'cursor'],
    '🔌': ['plug', 'electric', 'power', 'connect'],
    '💿': ['cd', 'disk', 'music', 'data'],
    '📀': ['dvd', 'disk', 'movie', 'video'],
    '🔋': ['battery', 'power', 'charge', 'energy'],
    '📡': ['satellite', 'signal', 'antenna', 'broadcast'],
    '🧰': ['toolbox', 'tools', 'repair', 'fix'],
    '⚡': ['lightning', 'electric', 'power', 'energy', 'fast', 'quick'],

    // Social
    '👥': ['people', 'group', 'team', 'users', 'community'],
    '👨‍👩‍👧': ['family', 'parents', 'child', 'home'],
    '👨‍👩‍👧‍👦': ['family', 'parents', 'children', 'home'],
    '💑': ['couple', 'love', 'relationship', 'romance'],
    '👫': ['couple', 'friends', 'people', 'holding hands'],
    '🗣️': ['speak', 'talk', 'voice', 'speech', 'communicate'],
    '💬': ['chat', 'message', 'talk', 'conversation', 'speech bubble'],
    '❤️': ['heart', 'love', 'like', 'favorite'],
    '🎉': ['party', 'celebrate', 'confetti', 'birthday'],
    '🎂': ['cake', 'birthday', 'celebrate', 'dessert'],
    '🎁': ['gift', 'present', 'birthday', 'surprise'],
    '🥳': ['party', 'celebrate', 'birthday', 'happy'],
    '🤗': ['hug', 'happy', 'warm', 'embrace'],
    '😊': ['smile', 'happy', 'friendly', 'joy'],
    '🙏': ['pray', 'thanks', 'please', 'grateful', 'namaste'],
    '👋': ['wave', 'hello', 'goodbye', 'hi', 'bye'],
    '✌️': ['peace', 'victory', 'two', 'fingers'],
    '🤙': ['call', 'shaka', 'hang loose', 'phone'],
    '🎊': ['confetti', 'party', 'celebrate', 'ball']
};

export const EMOJI_CATEGORIES = {
    recent: {
        label: 'Recent',
        icon: '🕐',
        emojis: [] as string[] // Populated from localStorage
    },
    productivity: {
        label: 'Work',
        icon: '💼',
        emojis: [
            '💼',
            '📊',
            '📁',
            '📋',
            '✅',
            '📝',
            '💡',
            '🎯',
            '📈',
            '📉',
            '💰',
            '🏢',
            '📧',
            '📞',
            '🤝',
            '📆',
            '⏰',
            '🔔',
            '📌',
            '🗂️'
        ]
    },
    fitness: {
        label: 'Fitness',
        icon: '🏃',
        emojis: [
            '🏃',
            '🏃‍♂️',
            '🏃‍♀️',
            '🧘',
            '🧘‍♂️',
            '🧘‍♀️',
            '💪',
            '🚴',
            '🚴‍♂️',
            '🏋️',
            '🏋️‍♂️',
            '🤸',
            '🤸‍♂️',
            '⚽',
            '🏀',
            '🎾',
            '🏊',
            '🏊‍♂️',
            '🚶',
            '🚶‍♂️',
            '🧗',
            '🧗‍♂️',
            '⛹️',
            '🏌️'
        ]
    },
    creative: {
        label: 'Creative',
        icon: '🎨',
        emojis: [
            '🎨',
            '🎵',
            '🎶',
            '📸',
            '✏️',
            '🎬',
            '🎭',
            '🖌️',
            '📐',
            '🎹',
            '🎸',
            '🎺',
            '🎻',
            '🥁',
            '🎤',
            '📷',
            '🎥',
            '✍️',
            '🖼️',
            '🎪'
        ]
    },
    learning: {
        label: 'Learning',
        icon: '📚',
        emojis: [
            '📚',
            '📖',
            '✍️',
            '🎓',
            '🔬',
            '💻',
            '📱',
            '🧮',
            '🔢',
            '📰',
            '🗞️',
            '📕',
            '📗',
            '📘',
            '📙',
            '🔎',
            '🧠',
            '💭',
            '📓',
            '📒'
        ]
    },
    lifestyle: {
        label: 'Life',
        icon: '🏠',
        emojis: [
            '🍽️',
            '☕',
            '🍳',
            '🛒',
            '🏠',
            '🚗',
            '✈️',
            '💤',
            '🧹',
            '👔',
            '💊',
            '🛁',
            '🧺',
            '🛏️',
            '🚿',
            '🪥',
            '👶',
            '🐕',
            '🐈',
            '🌱'
        ]
    },
    tools: {
        label: 'Tools',
        icon: '🛠️',
        emojis: [
            '🛠️',
            '⚙️',
            '🔧',
            '🔨',
            '📦',
            '🗂️',
            '📎',
            '✂️',
            '🔒',
            '💾',
            '🖥️',
            '⌨️',
            '🖱️',
            '🔌',
            '💿',
            '📀',
            '🔋',
            '📡',
            '🧰',
            '⚡'
        ]
    },
    social: {
        label: 'Social',
        icon: '👥',
        emojis: [
            '👥',
            '👨‍👩‍👧',
            '👨‍👩‍👧‍👦',
            '💑',
            '👫',
            '🗣️',
            '💬',
            '❤️',
            '🎉',
            '🎂',
            '🎁',
            '🥳',
            '🤗',
            '😊',
            '🙏',
            '👋',
            '✌️',
            '🤙',
            '💪',
            '🎊'
        ]
    }
} as const;

export type EmojiCategory = keyof typeof EMOJI_CATEGORIES;

// Search emojis by keyword
export function searchEmojis(query: string): string[] {
    if (!query.trim()) return [];
    const lowerQuery = query.toLowerCase();
    const allEmojis = getAllEmojis();

    return allEmojis.filter((emoji) => {
        const keywords = EMOJI_KEYWORDS[emoji] || [];
        return keywords.some((keyword) => keyword.includes(lowerQuery));
    });
}

// Get all emojis as a flat array for search
export function getAllEmojis(): string[] {
    return Object.values(EMOJI_CATEGORIES)
        .flatMap((category) => category.emojis)
        .filter((emoji, index, self) => self.indexOf(emoji) === index); // Remove duplicates
}

// Local storage key for recent emojis
const RECENT_EMOJIS_KEY = 'ordo-recent-emojis';
const MAX_RECENT_EMOJIS = 12;

// Get recent emojis from localStorage
export function getRecentEmojis(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

// Add emoji to recent list
export function addRecentEmoji(emoji: string): void {
    if (typeof window === 'undefined') return;
    try {
        const recent = getRecentEmojis();
        // Remove if already exists, then add to front
        const filtered = recent.filter((e) => e !== emoji);
        const updated = [emoji, ...filtered].slice(0, MAX_RECENT_EMOJIS);
        localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
    } catch {
        // Ignore localStorage errors
    }
}

// Default emojis for categories and activities
export const DEFAULT_CATEGORY_EMOJI = '📁';
export const DEFAULT_ACTIVITY_EMOJI = '⚡';
