import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'

import Home from '../app/page'

test('home', () => {
  render(<Home />)
  const main = within(screen.getByRole('main'))
  expect(main.getByText('src/app/page.tsx')).toBeDefined()
})
