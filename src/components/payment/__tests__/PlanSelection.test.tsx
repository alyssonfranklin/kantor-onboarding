import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PlanSelection } from '../PlanSelection'
import { PricingTier } from '@/types/payment'

// Mock the pricing tiers data
const mockPricingTiers: PricingTier[] = [
  {
    price_id: 'price_test_basic',
    kantor_version: 'basic',
    price_value: 2999,
    currency_id: 'usd',
    billing_period: 'monthly',
    stripe_price_id: 'price_test_basic',
    features: ['Up to 5 users', 'Basic insights', 'Email support'],
    description: 'Perfect for small teams',
    popular: false,
  },
  {
    price_id: 'price_test_pro',
    kantor_version: 'pro',
    price_value: 4999,
    currency_id: 'usd',
    billing_period: 'monthly',
    stripe_price_id: 'price_test_pro',
    features: ['Up to 25 users', 'Advanced insights', 'Priority support', 'Custom integrations'],
    description: 'Ideal for growing businesses',
    popular: true,
  },
]

// Mock fetch globally
global.fetch = jest.fn()

describe('PlanSelection Component', () => {
  const mockOnPlanSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockPricingTiers,
      }),
    })
  })

  it('renders loading state initially', () => {
    render(
      <PlanSelection 
        onPlanSelect={mockOnPlanSelect} 
        isProcessing={false} 
        error={null} 
      />
    )

    expect(screen.getByText('Loading plans...')).toBeInTheDocument()
  })

  it('renders pricing tiers after loading', async () => {
    render(
      <PlanSelection 
        onPlanSelect={mockOnPlanSelect} 
        isProcessing={false} 
        error={null} 
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Basic Plan')).toBeInTheDocument()
      expect(screen.getByText('Pro Plan')).toBeInTheDocument()
    })

    // Check pricing display
    expect(screen.getByText('$29.99')).toBeInTheDocument()
    expect(screen.getByText('$49.99')).toBeInTheDocument()
  })

  it('shows popular badge for popular plans', async () => {
    render(
      <PlanSelection 
        onPlanSelect={mockOnPlanSelect} 
        isProcessing={false} 
        error={null} 
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Most Popular')).toBeInTheDocument()
    })
  })

  it('handles billing period toggle', async () => {
    render(
      <PlanSelection 
        onPlanSelect={mockOnPlanSelect} 
        isProcessing={false} 
        error={null} 
      />
    )

    await waitFor(() => {
      const annualToggle = screen.getByRole('switch')
      fireEvent.click(annualToggle)
    })

    // Should trigger new API call for annual pricing
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('calls onPlanSelect when plan is selected', async () => {
    render(
      <PlanSelection 
        onPlanSelect={mockOnPlanSelect} 
        isProcessing={false} 
        error={null} 
      />
    )

    await waitFor(() => {
      const selectButton = screen.getAllByText('Select Plan')[0]
      fireEvent.click(selectButton)
    })

    expect(mockOnPlanSelect).toHaveBeenCalledWith({
      planId: 'basic',
      priceId: 'price_test_basic',
      billingPeriod: 'monthly',
      amount: 2999,
    })
  })

  it('disables buttons when processing', async () => {
    render(
      <PlanSelection 
        onPlanSelect={mockOnPlanSelect} 
        isProcessing={true} 
        error={null} 
      />
    )

    await waitFor(() => {
      const selectButtons = screen.getAllByText('Select Plan')
      selectButtons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })
  })

  it('displays error message when error occurs', async () => {
    render(
      <PlanSelection 
        onPlanSelect={mockOnPlanSelect} 
        isProcessing={false} 
        error="Failed to load pricing plans" 
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Failed to load pricing plans')).toBeInTheDocument()
    })
  })

  it('handles API error gracefully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    render(
      <PlanSelection 
        onPlanSelect={mockOnPlanSelect} 
        isProcessing={false} 
        error={null} 
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Failed to load pricing plans')).toBeInTheDocument()
    })
  })

  it('displays features list correctly', async () => {
    render(
      <PlanSelection 
        onPlanSelect={mockOnPlanSelect} 
        isProcessing={false} 
        error={null} 
      />
    )

    await waitFor(() => {
      // Check if features are displayed
      expect(screen.getByText('Up to 5 users')).toBeInTheDocument()
      expect(screen.getByText('Advanced insights')).toBeInTheDocument()
      expect(screen.getByText('Custom integrations')).toBeInTheDocument()
    })
  })

  it('shows trial information', async () => {
    render(
      <PlanSelection 
        onPlanSelect={mockOnPlanSelect} 
        isProcessing={false} 
        error={null} 
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/7-day free trial/)).toBeInTheDocument()
    })
  })
})