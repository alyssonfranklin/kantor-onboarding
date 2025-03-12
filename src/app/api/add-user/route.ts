// src/app/api/add-user/route.ts
import { NextResponse } from 'next/server';
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

    // IMPORTANT: Hardcoded spreadsheet ID - directly using the correct value
    const spreadsheetId = '1BSbZyBdsV_x4sAhkrayqxHKrZKEof7Fojm6vbi4IKc4';
    console.log('Using spreadsheet ID:', spreadsheetId); // Debug logging
    
    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'Google Sheet ID not configured' },
        { status: 500 }
      );
    }

    // Get the API key from environment variables
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google API key is not configured' },
        { status: 500 }
      );
    }

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

    // Append data to the Companies sheet using API key
    const companiesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Companies!A:F:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS&key=${apiKey}`;
    const companyResponse = await fetch(companiesUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: companyValues
      })
    });

    if (!companyResponse.ok) {
      const errorText = await companyResponse.text();
      throw new Error(`Failed to add company: ${errorText}`);
    }

    // Debug the user data structure
    console.log('Adding user:', {
      id: userId,
      email: email,
      name: name,
      company_id: companyId,
      system_role: 'orgadmin',
      last_access: timestamp,
      company_role: 'leader',
      department: 'INTERNAL',
      password: password
    });

    // Prepare data for the Users sheet
    // Format: [id, email, name, company_id, system_role, last_access, company_role, department, password]
    const userValues = [
      [userId, email, name, companyId, 'orgadmin', timestamp, 'leader', 'INTERNAL', password]
    ];

    // Append data to the Users sheet using API key
    const usersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Users!A:I:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS&key=${apiKey}`;
    const userResponse = await fetch(usersUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: userValues
      })
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      throw new Error(`Failed to add user: ${errorText}`);
    }

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