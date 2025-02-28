// src/app/api/add-user/route.ts
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import crypto from 'crypto';

// Function to generate ID in the specified format
function generateCustomId() {
  // Format: abc123de-4567-89fg-hij0-klmno123456
  const uuid = crypto.randomUUID();
  
  // Convert standard UUID to custom format
  const parts = uuid.split('-');
  
  // Ensure parts[0] has 8 characters with letters and numbers
  let part0 = parts[0];
  part0 = part0.replace(/[0-9]/g, c => String.fromCharCode(97 + parseInt(c))); // Convert some numbers to letters
  part0 = part0.replace(/[a-f]/g, c => String.fromCharCode(c.charCodeAt(0) - 32)); // Make some letters uppercase
  
  // Ensure parts[2] has some letters
  let part2 = parts[2];
  part2 = part2.substring(0, 2) + 'fg' + part2.substring(4);
  
  // Ensure parts[3] has some letters
  let part3 = parts[3];
  part3 = 'hij' + part3.substring(3);
  
  // Ensure parts[4] has some letters
  let part4 = parts[4];
  part4 = 'klmno' + part4.substring(5);
  
  return `${part0}-${parts[1]}-${part2}-${part3}-${part4}`;
}

// Google Sheets setup
const setupGoogleSheets = async () => {
  try {
    // Create JWT client using service account credentials
    const client = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    await client.authorize();
    
    const sheets = google.sheets({ version: 'v4', auth: client });
    return sheets;
  } catch (error) {
    console.error('Error setting up Google Sheets:', error);
    throw error;
  }
};

export async function POST(req: Request) {
  try {
    const { email, name, companyName, password, version, assistantId } = await req.json();

    // Validate required fields
    if (!email || !name || !companyName || !password || !version || !assistantId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Get spreadsheet ID from environment variables
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Google Sheet ID not configured' },
        { status: 500 }
      );
    }

    // Initialize Google Sheets API
    const sheets = await setupGoogleSheets();

    // Generate IDs
    const companyId = generateCustomId();
    const userId = generateCustomId();
    
    // Current timestamp
    const timestamp = new Date().toISOString();

    // Debug the company data structure
    console.log('Adding company:', {
      company_id: companyId,
      name: companyName,
      assistant_id: assistantId,
      status: 'active',
      created_at: timestamp,
      updated_at: timestamp
    });

    // Prepare data for the Companies sheet
    // Format: [company_id, name, assistant_id, status, created_at, updated_at]
    const companyValues = [
      [companyId, companyName, assistantId, 'active', timestamp, timestamp]
    ];

    // Append data to the Companies sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Companies!A2:F', // Assuming headers are in row 1
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: companyValues,
      },
    });

    // Debug the user data structure
    console.log('Adding user:', {
      id: userId,
      email: email,
      name: name,
      company_id: companyId,
      system_role: 'orgadmin',
      last_access: timestamp,
      company_role: 'leader',
      department: 'Management',
      password: password
    });

    // Prepare data for the Users sheet
    // Format: [id, email, name, company_id, system_role, last_access, company_role, department, password]
    const userValues = [
      [userId, email, name, companyId, 'orgadmin', timestamp, 'leader', 'INTERNAL', password]
    ];

    // Append data to the Users sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Users!A2:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: userValues,
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Company and user added to database successfully',
      companyId,
      userId
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error adding to spreadsheet:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to add to database' },
      { status: 500 }
    );
  }
}