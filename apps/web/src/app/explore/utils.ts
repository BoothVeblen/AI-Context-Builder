// Q&A of your Data
const RETRIEVAL = [
  '8B9OI3ddW0YR', // A knowledge base Q&A chatbot for a certain company
  'knfBakzXl0E0', // 24-Hour After-Sales Customer Service
  'xBvYMaEhicmp', // Reading Books - The Great Gatsby
  'GwSCco2hFnZR', // Speed-reading insurance terms and conditions
  'CMTiWOdsFCbp', // AI Restaurant Assistant
]

// Mock Interview
const INTERVIEW = [
  'EtxOfgdIrTBH', // Software Engineer-Interviewer
  'g42PpZERXi0b', // Sales Manager Position-Interviewer
  'EkD1cf4RnZfB', // Administrative position - interviewer
  'Vjycf0aSuiEZ', // Registered Nurse, Internal Medicine/Surgery Unit
  'UX9h89gIoAm5', // Medical Assistant
  '1y4kuKxPrAkb', // Receptionist
  'gztL9qrgFqp5', // Financial Services Audit
  'BxIqm5FFq4Pk', // Web Developer
  'ogrtYdowhY9R', // Customized Interviews
  'WDLourw816W1', // Resume Rewrite
  'tR9bV4fiCSVB', // Writing Cover Letters
  'n1WRn2l3exDk', // Interview Question Generator
]

// Intelligent Forms
const FORM = [
  '7G74vr6Yk8j0', // New Member Registration on a Certain Platform
  'BSvmbdvE7yFo', // Survey of Customers Around a Hair Salon
  'vsChObz4sxNq', // Follow-up with Restaurant Customers
  'AeEEG3ExMDvf', // Follow-up Survey of Parents at a Dance Studio
]

// Role Play
const CHARACTER = [
  'wxIBFg1PjSMl', // Elon Musk
  'SWWCi3VYv5Qu', // Harry Potter
  'J7Mtwdm74SxL', // Spider-Man
  'ASSxL7CZv14s', // Bart Simpson
]

// Useful Assistant
const ASSISTANT = [
  '884PItmQHsl4', // Translate English text into French
  'cYnwDNpUcR2o', // Chinese Translator
  'G0kCCxQ8EoTq', // Essay Improver
  'HXo4cna4e5xj', // As an English language teacher
  'fkuqiMciaE1t', // A title generator for written pieces
  't2lOpfSmCnB0', // Youtube Title(SEO optimized)
  '2a5wLkRBF72N', // Perfect Article
  'BE5sDxITFdze', // Code Error Fixer
  'kkWDKtFqkELc', // Video Script Outline
  'cEHybwkO6lDR', // Text Similarity Comparison
  '220Pf5KV5oXx', // Prompt Improvement
  'ax4kQ4S3eblG', // Master of Color Matching
  'wr9Xf9GAhnx6', // Product Manager
  'eV7uEzpMRzw1', // Legal advisor
]

// All Categories
const ALL = [...RETRIEVAL, ...INTERVIEW, ...FORM, ...CHARACTER, ...ASSISTANT]

const CATEGORY_DATA = {
  RETRIEVAL: {
    title: 'Q&A of your Data',
    ids: RETRIEVAL,
  },
  INTERVIEW: {
    title: 'Mock Interview',
    ids: INTERVIEW,
  },
  FORM: {
    title: 'Intelligent Forms',
    ids: FORM,
  },
  CHARACTER: {
    title: 'Role Play',
    ids: CHARACTER,
  },
  ASSISTANT: {
    title: 'Useful Assistant',
    ids: ASSISTANT,
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
