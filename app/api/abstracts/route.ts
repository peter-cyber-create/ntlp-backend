import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const status = searchParams.get('status');
    const track = searchParams.get('track');
    const search = searchParams.get('search');
    
    let queryParams = `page=${page}&limit=${limit}`;
    if (status) queryParams += `&status=${status}`;
    if (track) queryParams += `&track=${track}`;
    if (search) queryParams += `&search=${search}`;
    
    const response = await fetch(`${BACKEND_URL}/api/abstracts?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching abstracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch abstracts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward the abstract data to the backend
    const response = await fetch(`${BACKEND_URL}/api/abstracts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Backend error:', errorData);
      return NextResponse.json(
        { error: errorData.error || 'Failed to create abstract' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating abstract:', error);
    return NextResponse.json(
      { error: 'Failed to create abstract' },
      { status: 500 }
    );
  }
}
