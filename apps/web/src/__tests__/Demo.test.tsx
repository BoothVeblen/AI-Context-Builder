import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import MineList from '@/components/mine-list'

test('Demo', () => {
  render(<MineList />)
  expect(screen.getByText('Apps')).toBeDefined()
})
