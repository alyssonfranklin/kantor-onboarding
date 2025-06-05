import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

/**
 * Dynamic Open Graph image generator
 * Allows for custom OG images based on page content
 * 
 * Parameters:
 * - title: Text to display as the main title
 * - description: Optional description text
 * - template: Template style to use (default, dark, etc.)
 * 
 * @param {NextRequest} request - The incoming request with query parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Get parameters from URL
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'Voxerion';
    const description = searchParams.get('description') || 'Business productivity platform for modern teams';
    const template = searchParams.get('template') || 'default';

    // Template colors based on our design system
    const primaryColor = '#E64A19';
    const secondaryColor = '#6B21A8';
    const isDarkTemplate = template === 'dark';
    
    const textColor = isDarkTemplate ? '#FFFFFF' : '#111827';
    const bgColor = isDarkTemplate ? '#1F2937' : '#FFFFFF';
    const accentColor = isDarkTemplate ? secondaryColor : primaryColor;

    // Generate the Open Graph image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bgColor,
            padding: '40px 60px',
            position: 'relative',
          }}
        >
          {/* Background design elements */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '8px',
              background: accentColor,
            }}
          />
          
          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxWidth: '900px',
              width: '100%',
            }}
          >
            {/* Logo */}
            <div
              style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: accentColor,
                marginBottom: 20,
              }}
            >
              VOXERION
            </div>
            
            {/* Title */}
            <div
              style={{
                fontSize: 64,
                fontWeight: 'bold',
                textAlign: 'left',
                color: textColor,
                marginBottom: 20,
                lineHeight: 1.2,
              }}
            >
              {title}
            </div>
            
            {/* Description */}
            <div
              style={{
                fontSize: 32,
                textAlign: 'left',
                color: textColor,
                opacity: 0.8,
              }}
            >
              {description}
            </div>
          </div>
          
          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: 30,
              right: 40,
              display: 'flex',
              alignItems: 'center',
              color: textColor,
              opacity: 0.7,
              fontSize: 24,
            }}
          >
            app.voxerion.com
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate OG image', { status: 500 });
  }
}