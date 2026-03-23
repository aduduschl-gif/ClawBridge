import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function POST(req: NextRequest) {
  try {
    const { databaseUrl } = await req.json();

    if (!databaseUrl) {
      return NextResponse.json({ success: false, error: 'No database URL provided' }, { status: 400 });
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 5000,
      ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
    });

    const client = await pool.connect();
    
    // Test query
    const result = await client.query('SELECT NOW()');
    client.release();
    await pool.end();

    return NextResponse.json({ 
      success: true, 
      message: 'Connection successful',
      serverTime: result.rows[0].now 
    });

  } catch (error: any) {
    console.error('Database connection test failed:', error);
    
    let errorMessage = 'Connection failed';
    if (error.code === 'ENOTFOUND') {
      errorMessage = 'Host not found';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused';
    } else if (error.code === '28P01') {
      errorMessage = 'Authentication failed (wrong password)';
    } else if (error.code === '3D000') {
      errorMessage = 'Database does not exist';
    } else if (error.message) {
      errorMessage = error.message.substring(0, 100);
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
