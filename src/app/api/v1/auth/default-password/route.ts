import { withAuth } from '@/lib/middleware/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    return withAuth(req, async (req) => {
        const defaultClientPassword = process.env.CLIENT_PASSWORD;

        if (!defaultClientPassword) {
            return NextResponse.json(
                { success: false, message: 'No setting CLIENT_PASSWORD environment var' },
                { status: 401 }
            );
        }

        const response = NextResponse.json({
            success: true,
            message: 'successful',
            defaultClientPassword
        });

        return response;
    });
}

