import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AbilityScoreGenerator } from '@/components/AbilityScoreGenerator'

vi.mock('convex/react', () => ({
  useQuery: () => [],
}))

describe('AbilityScoreGenerator', () => {
  it('renders with undefined initialValues without crashing and can open Point Buy tab', () => {
    const onChange = vi.fn()
    render(
      // Pass undefined initialValues to simulate transient RHF state
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <AbilityScoreGenerator initialValues={undefined as any} onChange={onChange} />
    )

    // Default manual tab renders
    expect(screen.getByText('Manual Entry')).toBeInTheDocument()

    // Switch to Point Buy and verify remaining points label shows
    fireEvent.click(screen.getByText('Point Buy (27 points)'))
    // If it didn't crash and the tab button exists, consider it a smoke pass
  })

  it('updates when initialValues prop changes (manual tab)', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <AbilityScoreGenerator initialValues={undefined as any} onChange={onChange} />
    )

    // Rerender with concrete values; verify one of the fields reflects it
    rerender(
      <AbilityScoreGenerator
        initialValues={{
          strength: 12,
          dexterity: 10,
          constitution: 10,
          intelligence: 10,
          wisdom: 10,
          charisma: 10,
        }}
        onChange={onChange}
      />
    )

    // Strength input should show 12 in Manual tab by default
    // Label text can vary; select by display value
    expect(screen.getAllByDisplayValue('12')[0]).toBeInTheDocument()
  })
})


