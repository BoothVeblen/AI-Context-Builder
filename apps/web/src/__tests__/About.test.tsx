import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import About from '../app/about/page'

test('About', () => {
  render(<About />)
  expect(screen.getByText('About Page')).toBeDefined()
})
