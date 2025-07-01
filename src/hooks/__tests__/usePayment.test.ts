import { renderHook, act } from '@testing-library/react'
import { usePayment } from '../usePayment'

// Mock the API calls
global.fetch = jest.fn()

describe('usePayment Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => usePayment())

    expect(result.current.paymentState).toEqual({
      selectedPlan: null,
      billingPeriod: 'monthly',
      isProcessing: false,
      error: null,
    })
  })

  it('updates selected plan correctly', () => {
    const { result } = renderHook(() => usePayment())

    act(() => {
      result.current.selectPlan({
        planId: 'pro',
        priceId: 'price_test_pro',
        billingPeriod: 'monthly',
        amount: 4999,
      })
    })

    expect(result.current.paymentState.selectedPlan).toEqual({
      planId: 'pro',
      priceId: 'price_test_pro',
      billingPeriod: 'monthly',
      amount: 4999,
    })
  })

  it('toggles billing period correctly', () => {
    const { result } = renderHook(() => usePayment())

    act(() => {
      result.current.toggleBillingPeriod()
    })

    expect(result.current.paymentState.billingPeriod).toBe('annual')

    act(() => {
      result.current.toggleBillingPeriod()
    })

    expect(result.current.paymentState.billingPeriod).toBe('monthly')
  })

  it('creates checkout session successfully', async () => {
    const mockSessionData = {
      success: true,
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/cs_test_123',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSessionData,
    })

    const { result } = renderHook(() => usePayment())

    // First select a plan
    act(() => {
      result.current.selectPlan({
        planId: 'pro',
        priceId: 'price_test_pro',
        billingPeriod: 'monthly',
        amount: 4999,
      })
    })

    let sessionData: any
    await act(async () => {
      sessionData = await result.current.createCheckoutSession()
    })

    expect(sessionData).toEqual(mockSessionData)
    expect(global.fetch).toHaveBeenCalledWith('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: 'price_test_pro',
        planId: 'pro',
        billingPeriod: 'monthly',
      }),
    })
  })

  it('handles checkout session creation errors', async () => {
    const mockError = {
      success: false,
      message: 'Payment method required',
    }

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => mockError,
    })

    const { result } = renderHook(() => usePayment())

    // Select a plan first
    act(() => {
      result.current.selectPlan({
        planId: 'pro',
        priceId: 'price_test_pro',
        billingPeriod: 'monthly',
        amount: 4999,
      })
    })

    await act(async () => {
      try {
        await result.current.createCheckoutSession()
      } catch (error: any) {
        expect(error.message).toBe('Payment method required')
      }
    })

    expect(result.current.paymentState.error).toBe('Payment method required')
    expect(result.current.paymentState.isProcessing).toBe(false)
  })

  it('sets processing state during checkout session creation', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true }),
      }), 100))
    )

    const { result } = renderHook(() => usePayment())

    // Select a plan first
    act(() => {
      result.current.selectPlan({
        planId: 'pro',
        priceId: 'price_test_pro',
        billingPeriod: 'monthly',
        amount: 4999,
      })
    })

    act(() => {
      result.current.createCheckoutSession()
    })

    expect(result.current.paymentState.isProcessing).toBe(true)

    // Wait for completion
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    expect(result.current.paymentState.isProcessing).toBe(false)
  })

  it('clears error when setting new error', () => {
    const { result } = renderHook(() => usePayment())

    act(() => {
      result.current.setError('First error')
    })

    expect(result.current.paymentState.error).toBe('First error')

    act(() => {
      result.current.setError('Second error')
    })

    expect(result.current.paymentState.error).toBe('Second error')

    act(() => {
      result.current.setError(null)
    })

    expect(result.current.paymentState.error).toBeNull()
  })

  it('requires plan selection before checkout', async () => {
    const { result } = renderHook(() => usePayment())

    await act(async () => {
      try {
        await result.current.createCheckoutSession()
      } catch (error: any) {
        expect(error.message).toBe('Please select a plan before proceeding')
      }
    })

    expect(result.current.paymentState.error).toBe('Please select a plan before proceeding')
  })

  it('handles network errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => usePayment())

    // Select a plan first
    act(() => {
      result.current.selectPlan({
        planId: 'pro',
        priceId: 'price_test_pro',
        billingPeriod: 'monthly',
        amount: 4999,
      })
    })

    await act(async () => {
      try {
        await result.current.createCheckoutSession()
      } catch (error: any) {
        expect(error.message).toBe('Network error occurred. Please try again.')
      }
    })

    expect(result.current.paymentState.error).toBe('Network error occurred. Please try again.')
  })
})