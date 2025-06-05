# SEO Image Assets

This directory contains image assets required for SEO and web app metadata:

## Required Images

- **favicon.ico**: Main favicon (already in /public)
- **favicon-16x16.png**: 16x16 favicon
- **favicon-32x32.png**: 32x32 favicon
- **apple-touch-icon.png**: 180x180 Apple touch icon
- **android-chrome-192x192.png**: 192x192 Android Chrome icon
- **android-chrome-512x512.png**: 512x512 Android Chrome icon
- **safari-pinned-tab.svg**: SVG mask icon for Safari pinned tabs
- **og-image.png**: 1200x630 Open Graph image for social sharing
- **twitter-image.png**: 1200x600 Twitter card image

## Image Specifications

### Favicon Files
- **favicon.ico**: Multi-size .ico file (16x16, 32x32, 48x48)
- **favicon-16x16.png**: 16x16 pixels, PNG format
- **favicon-32x32.png**: 32x32 pixels, PNG format
- **apple-touch-icon.png**: 180x180 pixels, PNG format
- **android-chrome-192x192.png**: 192x192 pixels, PNG format
- **android-chrome-512x512.png**: 512x512 pixels, PNG format
- **safari-pinned-tab.svg**: SVG format, monochrome with transparent background

### Social Media Images
- **og-image.png**: 1200x630 pixels, PNG format
- **twitter-image.png**: 1200x600 pixels, PNG format

## Usage

All image paths are referenced in the following files:
- `/src/app/layout.tsx` - Main metadata configuration
- `/public/site.webmanifest` - Web app manifest

## Design Guidelines

- Use the primary brand color (#E64A19) as the main color theme
- Include the Voxerion logo prominently
- Keep the design simple and recognizable at small sizes
- Ensure text is legible at all sizes
- Include appropriate padding around elements