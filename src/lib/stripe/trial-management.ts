// Trial management system for proactive email notifications
// This system sends reminder emails at different intervals before trial expiration

import { dbConnect } from '@/lib/mongodb/connect';
import User from '@/lib/mongodb/models/user.model';
import SubscriptionHistory from '@/lib/mongodb/models/subscription-history.model';
import { sendSubscriptionEmail } from '@/lib/email/subscription-emails';
import { v4 as uuidv4 } from 'uuid';

interface TrialReminder {
  userId: string;
  companyId: string;
  trialEndDate: Date;
  daysLeft: number;
  reminderType: '7_days' | '3_days' | '1_day' | 'last_day';
}

// Function to check and send trial reminders
export async function checkAndSendTrialReminders(): Promise<void> {
  try {
    await dbConnect();

    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    const oneDayFromNow = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000));
    const endOfToday = new Date(now.getTime() + (24 * 60 * 60 * 1000));

    // Find users with active trials
    const usersInTrial = await User.find({
      subscription_status: 'trial',
      trial_end_date: { $exists: true, $gt: now },
    }).select('id company_id name email current_plan_id trial_end_date billing_period company_name');

    console.log(`Found ${usersInTrial.length} users in trial period`);

    for (const user of usersInTrial) {
      const trialEndDate = new Date(user.trial_end_date!);
      const daysLeft = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let reminderType: TrialReminder['reminderType'] | null = null;

      // Determine which reminder to send based on days left
      if (daysLeft === 7) {
        reminderType = '7_days';
      } else if (daysLeft === 3) {
        reminderType = '3_days';
      } else if (daysLeft === 1) {
        reminderType = '1_day';
      } else if (daysLeft === 0) {
        reminderType = 'last_day';
      }

      if (reminderType) {
        // Check if we already sent this reminder
        const existingReminder = await SubscriptionHistory.findOne({
          user_id: user.id,
          action: 'trial_reminder',
          'metadata.reminder_type': reminderType,
          created_at: {
            $gte: new Date(now.getTime() - (24 * 60 * 60 * 1000)), // Within last 24 hours
          },
        });

        if (!existingReminder) {
          await sendTrialReminder({
            userId: user.id,
            companyId: user.company_id,
            trialEndDate,
            daysLeft,
            reminderType,
          }, user);
        }
      }
    }

    console.log('Trial reminder check completed');

  } catch (error) {
    console.error('Error checking trial reminders:', error);
  }
}

// Send individual trial reminder
async function sendTrialReminder(reminder: TrialReminder, user: any): Promise<void> {
  try {
    console.log(`Sending ${reminder.reminderType} trial reminder to ${user.email}`);

    // Send email notification
    await sendSubscriptionEmail('trial_ending', {
      userName: user.name || 'User',
      userEmail: user.email,
      companyName: user.company_name,
      planName: user.current_plan_id || 'Your Plan',
      trialEndDate: reminder.trialEndDate,
      billingPeriod: user.billing_period,
    });

    // Log the reminder
    const historyEntry = new SubscriptionHistory({
      history_id: uuidv4(),
      user_id: reminder.userId,
      company_id: reminder.companyId,
      action: 'trial_reminder',
      new_status: 'trial',
      metadata: {
        reminder_type: reminder.reminderType,
        days_left: reminder.daysLeft,
        trial_end_date: reminder.trialEndDate,
        email_sent: true,
      },
    });

    await historyEntry.save();

    console.log(`Trial reminder sent successfully to ${user.email}`);

  } catch (error) {
    console.error(`Error sending trial reminder to ${user.email}:`, error);
  }
}

// Function to handle trial expiration (convert to paid or cancel)
export async function processTrialExpirations(): Promise<void> {
  try {
    await dbConnect();

    const now = new Date();

    // Find trials that have expired
    const expiredTrials = await User.find({
      subscription_status: 'trial',
      trial_end_date: { $exists: true, $lt: now },
    }).select('id company_id name email subscription_id current_plan_id');

    console.log(`Found ${expiredTrials.length} expired trials to process`);

    for (const user of expiredTrials) {
      try {
        // Check if the subscription converted to paid automatically
        if (user.subscription_id) {
          // Stripe should handle this automatically, but we'll verify
          console.log(`Processing trial expiration for user ${user.id}`);
          
          // Update status - this will be confirmed by webhook events
          await User.findOneAndUpdate(
            { id: user.id },
            { 
              subscription_status: 'active',
              trial_end_date: null,
            }
          );

          // Log the conversion
          const historyEntry = new SubscriptionHistory({
            history_id: uuidv4(),
            user_id: user.id,
            company_id: user.company_id,
            action: 'trial_converted',
            previous_status: 'trial',
            new_status: 'active',
            new_plan: user.current_plan_id,
            metadata: {
              converted_automatically: true,
              trial_expired: true,
            },
          });

          await historyEntry.save();
        }
      } catch (error) {
        console.error(`Error processing trial expiration for user ${user.id}:`, error);
      }
    }

    console.log('Trial expiration processing completed');

  } catch (error) {
    console.error('Error processing trial expirations:', error);
  }
}

// Enhanced trial status check with business logic
export async function getTrialStatus(userId: string): Promise<{
  isInTrial: boolean;
  daysLeft: number;
  trialEndDate: Date | null;
  needsPaymentMethod: boolean;
  canExtendTrial: boolean;
  conversionReady: boolean;
}> {
  try {
    await dbConnect();

    const user = await User.findOne({ id: userId }).select(
      'subscription_status trial_end_date stripe_customer_id subscription_id'
    );

    if (!user || !user.trial_end_date) {
      return {
        isInTrial: false,
        daysLeft: 0,
        trialEndDate: null,
        needsPaymentMethod: false,
        canExtendTrial: false,
        conversionReady: false,
      };
    }

    const now = new Date();
    const trialEndDate = new Date(user.trial_end_date);
    const daysLeft = Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const isInTrial = user.subscription_status === 'trial' && trialEndDate > now;

    return {
      isInTrial,
      daysLeft,
      trialEndDate,
      needsPaymentMethod: !user.stripe_customer_id,
      canExtendTrial: daysLeft <= 3 && isInTrial, // Allow extension in last 3 days
      conversionReady: isInTrial && daysLeft <= 1,
    };

  } catch (error) {
    console.error('Error getting trial status:', error);
    return {
      isInTrial: false,
      daysLeft: 0,
      trialEndDate: null,
      needsPaymentMethod: true,
      canExtendTrial: false,
      conversionReady: false,
    };
  }
}

// Function to extend trial (if allowed)
export async function extendTrial(userId: string, additionalDays: number = 7): Promise<boolean> {
  try {
    await dbConnect();

    const user = await User.findOne({ id: userId });
    if (!user || user.subscription_status !== 'trial') {
      return false;
    }

    const newTrialEndDate = new Date(user.trial_end_date!);
    newTrialEndDate.setDate(newTrialEndDate.getDate() + additionalDays);

    await User.findOneAndUpdate(
      { id: userId },
      { trial_end_date: newTrialEndDate }
    );

    // Log the extension
    const historyEntry = new SubscriptionHistory({
      history_id: uuidv4(),
      user_id: userId,
      company_id: user.company_id,
      action: 'trial_extended',
      new_status: 'trial',
      metadata: {
        extended_days: additionalDays,
        new_trial_end_date: newTrialEndDate,
        extended_at: new Date(),
      },
    });

    await historyEntry.save();

    console.log(`Trial extended for user ${userId} by ${additionalDays} days`);
    return true;

  } catch (error) {
    console.error('Error extending trial:', error);
    return false;
  }
}