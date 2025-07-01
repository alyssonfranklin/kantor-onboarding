'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/hooks';
import { useRouter } from 'next/navigation';
import ModalLoader from '@/components/client/ModalLoader';
import PlanSelection from '@/components/payment/PlanSelection';
import { usePayment } from '@/hooks/usePayment';
import { PricingTier } from '@/types/payment';

export default function PaymentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { 
    handlePlanSelection,
    isProcessing,
    error,
    clearError
  } = usePayment();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handlePlanSelect = async (tier: PricingTier) => {
    clearError();
    await handlePlanSelection(tier);
  };

  if (!user) {
    return <ModalLoader message="Authenticating..." />;
  }

  return (
    <>
      {isProcessing && <ModalLoader message="Processing payment..." />}
      
      <div className="min-h-screen bg-gray-50 py-12">
        <PlanSelection
          onPlanSelect={handlePlanSelect}
          isProcessing={isProcessing}
          error={error}
        />
      </div>
    </>
  );
}