import { NextResponse } from 'next/server';
import { seedLabels } from '../initialize-db/seedLabels';

/**
 * POST /api/admin/seed-labels
 * Seeds labels collection without reinitializing the entire database
 */
export async function POST() {
  try {
    console.log('Seeding labels collection...');
    const result = await seedLabels();
    
    console.log('Labels seeding result:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Labels seeded successfully',
      result
    });
  } catch (error) {
    console.error('Error seeding labels:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message || 'Failed to seed labels' 
      },
      { status: 500 }
    );
  }
}