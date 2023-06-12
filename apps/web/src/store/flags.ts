import { create } from 'zustand'

import { getFlags } from '@/lib/flags'

const defaultFlags = getFlags()

export const useFlagStore = create(() => defaultFlags)
