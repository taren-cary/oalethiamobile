import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Insert email into database
    const { data, error } = await supabase
      .from('early_access_emails')
      .insert([{ email: email.toLowerCase().trim() }])
      .select()
      .single();

    if (error) {
      // Handle duplicate email error gracefully
      if (error.code === '23505' || error.message.includes('duplicate') || error.message.includes('unique')) {
        return NextResponse.json({
          success: true,
          message: 'You\'re already on the list!'
        });
      }
      
      console.error('Error inserting email:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully signed up for early access!'
    });

  } catch (error: any) {
    console.error('Early access signup error:', error);
    Sentry.captureException(error, {
      tags: {
        error_type: 'early_access_signup',
      },
    });
    return NextResponse.json(
      { error: 'Failed to sign up for early access' },
      { status: 500 }
    );
  }
}
