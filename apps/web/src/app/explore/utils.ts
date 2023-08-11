// Language Assistant
const LA = [
  '884PItmQHsl4', // Translate English text into French
  'cYnwDNpUcR2o', // Chinese Translator
  'G0kCCxQ8EoTq', // Essay Improver
  'HXo4cna4e5xj', // As an English language teacher
]

// Famous Character
const FC = [
  'J7Mtwdm74SxL', // Play Spider-Man
  'SWWCi3VYv5Qu', // Play Harry potter
  '0O2nJnSpQURk', // Sun Wukong
]

// Writing
const WR = [
  'fkuqiMciaE1t', // A title generator for written pieces
  't2lOpfSmCnB0', // Youtube Title(SEO optimized)
  '2a5wLkRBF72N', // Perfect Article
]

// Useful Assistant
const UA = [
  'BE5sDxITFdze', // Code Error Fixer
  'kkWDKtFqkELc', // Video Script Outline
  'cEHybwkO6lDR', // Text Similarity Comparison
  '220Pf5KV5oXx', // Prompt Improvement
  'ax4kQ4S3eblG', // Master of Color Matching
  'fk1q6BYGP47A', // Little Red Book Hot Item Copy Generator
]

// Professional
const PR = [
  '3LMAJyVVSAgQ', // Virtual Doctor
  'wr9Xf9GAhnx6', // Product Manager
  'eV7uEzpMRzw1', // legal advisor
  'iBidZhqJSsBX', // Roleplay - Interviewer
]

// Search Document
const SD = [
  'LC2yEFdovW4B', // American history
]

// All Categories
const ALL = [...LA, ...FC, ...WR, ...UA, ...PR, ...SD]

const CATEGORY_DATA = {
  LA: {
    title: 'Language Assistant',
    ids: LA,
  },
  FC: {
    title: 'Famous Character',
    ids: FC,
  },
  WR: {
    title: 'Writing',
    ids: WR,
  },
  UA: {
    title: 'Useful Assistant',
    ids: UA,
  },
  PR: {
    title: 'Professional',
    ids: PR,
  },
  SD: {
    title: 'Search Document',
    ids: SD,
  },
  ALL: {
    title: 'All Categories',
    ids: ALL,
  },
}

type CategoryIds = keyof typeof CATEGORY_DATA

export const CATEGORY_IDS = Object.keys(CATEGORY_DATA)

export const getFeaturedAppIds = (categoryId: string) => {
  const capitalizedId = categoryId.toUpperCase() as CategoryIds
  return CATEGORY_DATA[capitalizedId]?.ids || ALL
}

export const getCategoryTitle = (categoryId: string) => {
  const capitalizedId = categoryId.toUpperCase() as CategoryIds
  return CATEGORY_DATA[capitalizedId]?.title || 'All Categories'
}
