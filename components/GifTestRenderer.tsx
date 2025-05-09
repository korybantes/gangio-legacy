import React, { useState } from 'react';

// Simple test component to verify GIF rendering
export const GifTestRenderer: React.FC = () => {
  const [showDebugInfo, setShowDebugInfo] = useState(true);
  
  // Sample Tenor GIF data matching the structure from your console log
  const sampleGif = {
    id: '17562197224520331210',
    type: 'gif',
    url: 'https://media.tenor.com/87l1U8Lir8oAAAAC/cookie-and-cream-aiscream-cookie-%26-cream-aiscream.gif',
    previewUrl: 'https://media.tenor.com/87l1U8Lir8oAAAAM/cookie-and-cream-aiscream-cookie-%26-cream-aiscream.gif',
    width: 359,
    height: 270,
    title: 'Cookie And Cream Aiscream Cookie & Cream Aiscream GIF'
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h2 className="text-white text-xl mb-4">GIF Renderer Test</h2>
      
      <div className="mb-4">
        <button 
          onClick={() => setShowDebugInfo(!showDebugInfo)}
          className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
        >
          {showDebugInfo ? 'Hide' : 'Show'} Debug Info
        </button>
      </div>
      
      {showDebugInfo && (
        <div className="mb-4 p-3 bg-gray-900 rounded text-xs text-gray-300 font-mono whitespace-pre-wrap overflow-auto max-h-40">
          {JSON.stringify(sampleGif, null, 2)}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-white text-lg mb-2">Direct IMG Tag Rendering:</h3>
        <div className="relative max-w-sm rounded-md overflow-hidden bg-gray-700">
          <img 
            src={sampleGif.url} 
            alt={sampleGif.title || 'GIF'}
            className="w-full h-auto rounded-md"
            style={{
              maxHeight: '300px',
              objectFit: 'contain'
            }}
            onError={(e) => {
              console.error('Error loading direct GIF:', e);
              // Try the preview URL as fallback
              if (sampleGif.previewUrl) {
                e.currentTarget.src = sampleGif.previewUrl;
              }
            }}
          />
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Direct URL
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-white text-lg mb-2">Preview URL Rendering:</h3>
        <div className="relative max-w-sm rounded-md overflow-hidden bg-gray-700">
          <img 
            src={sampleGif.previewUrl} 
            alt={sampleGif.title || 'GIF Preview'}
            className="w-full h-auto rounded-md"
            style={{
              maxHeight: '300px',
              objectFit: 'contain'
            }}
            onError={(e) => {
              console.error('Error loading preview GIF:', e);
            }}
          />
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Preview URL
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-white text-lg mb-2">Component Rendering:</h3>
        <GifRenderer attachment={sampleGif} />
      </div>
    </div>
  );
};

// Reusable GIF renderer component with enhanced error handling and debugging
export const GifRenderer: React.FC<{ attachment: any }> = ({ attachment }) => {
  // Add detailed logging for debugging
  console.log('GifRenderer received attachment:', JSON.stringify(attachment, null, 2));
  
  // Extract URLs and IDs from the attachment
  const mainUrl = attachment?.url || '';
  const fallbackUrl = attachment?.previewUrl || '';
  
  // Extract Tenor ID from URL if available
  let tenorId = attachment?.id || '';
  if (!tenorId && (mainUrl || fallbackUrl)) {
    // Try to extract Tenor ID from URL patterns
    const tenorRegex = /(?:media\.tenor\.com\/|tenor\.com\/view\/|c\.tenor\.com\/)([\w-]+)/;
    const match = (mainUrl || fallbackUrl).match(tenorRegex);
    if (match && match[1]) {
      tenorId = match[1];
      console.log('Extracted Tenor ID from URL:', tenorId);
    }
  }
  
  // Construct various fallback URLs for Tenor GIFs
  const tenorFallbackUrl = tenorId ? `https://media.tenor.com/${tenorId}/tenor.gif` : '';
  const tenorMediaUrl = tenorId ? `https://media.tenor.com/images/${tenorId}/tenor.gif` : '';
  const tenorCUrl = tenorId ? `https://c.tenor.com/${tenorId}/tenor.gif` : '';
  
  // For GIPHY URLs
  const isGiphy = (mainUrl || fallbackUrl).includes('giphy.com');
  const giphyUrls: string[] = [];
  
  if (isGiphy) {
    // Extract GIPHY ID and create alternative URLs
    const giphyRegex = /(?:giphy\.com\/gifs\/|media[\d]?\.giphy\.com\/media\/)([\w-]+)/;
    const match = (mainUrl || fallbackUrl).match(giphyRegex);
    if (match && match[1]) {
      const giphyId = match[1];
      giphyUrls.push(`https://media.giphy.com/media/${giphyId}/giphy.gif`);
      giphyUrls.push(`https://i.giphy.com/media/${giphyId}/giphy.gif`);
      giphyUrls.push(`https://media0.giphy.com/media/${giphyId}/giphy.gif`);
    }
  }
  
  // Track URL and error states
  const [currentUrl, setCurrentUrl] = useState(mainUrl || fallbackUrl);
  const [errorCount, setErrorCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const maxRetries = 6; // Increased to account for more fallback options
  
  // Force the image to reload with a new URL
  const forceReload = (url: string) => {
    // Add a cache-busting parameter
    const cacheBuster = `?t=${Date.now()}`;
    setCurrentUrl(`${url}${cacheBuster}`);
  };
  
  // Handle loading errors with multiple fallback strategies
  const handleError = () => {
    console.error(`Error loading GIF (attempt ${errorCount + 1}):`, currentUrl);
    setErrorCount(prev => prev + 1);
    
    // Try different URLs in sequence
    if (errorCount === 0 && fallbackUrl && !currentUrl.includes(fallbackUrl)) {
      console.log('Trying fallback URL:', fallbackUrl);
      setCurrentUrl(fallbackUrl);
    } else if (errorCount === 1 && tenorFallbackUrl) {
      console.log('Trying constructed Tenor URL:', tenorFallbackUrl);
      setCurrentUrl(tenorFallbackUrl);
    } else if (errorCount === 2 && tenorMediaUrl) {
      console.log('Trying Tenor media URL:', tenorMediaUrl);
      setCurrentUrl(tenorMediaUrl);
    } else if (errorCount === 3 && tenorCUrl) {
      console.log('Trying Tenor C URL:', tenorCUrl);
      setCurrentUrl(tenorCUrl);
    } else if (errorCount >= 4 && errorCount < 4 + giphyUrls.length) {
      // Try GIPHY URLs if available
      const giphyUrlIndex = errorCount - 4;
      if (giphyUrls[giphyUrlIndex]) {
        console.log('Trying GIPHY URL:', giphyUrls[giphyUrlIndex]);
        setCurrentUrl(giphyUrls[giphyUrlIndex]);
      }
    } else if (attachment?.type === 'gif' && attachment?.title) {
      // Last resort: try to search for the GIF by title
      const searchUrl = `https://tenor.com/search/${encodeURIComponent(attachment.title)}`;
      console.log('All URLs failed, linking to search:', searchUrl);
      
      // Try one last time with direct image rendering
      if (mainUrl) forceReload(mainUrl);
    }
  };
  
  // Handle successful load
  const handleLoad = () => {
    console.log('GIF loaded successfully:', currentUrl);
    setIsLoaded(true);
  };
  
  // If we've exhausted all options and still have errors
  if (errorCount >= maxRetries && !isLoaded) {
    return (
      <div className="relative max-w-sm rounded-md overflow-hidden bg-gray-700 p-4 text-center">
        <div className="text-white text-sm mb-2">Unable to load GIF</div>
        <div className="text-gray-400 text-xs">{attachment?.title || 'GIF'}</div>
        {tenorId && (
          <a 
            href={`https://tenor.com/view/${tenorId}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="mt-2 inline-block text-blue-400 text-xs hover:underline"
          >
            View on Tenor
          </a>
        )}
      </div>
    );
  }
  
  return (
    <div className="relative max-w-sm rounded-md overflow-hidden bg-gray-700">
      <a 
        href={mainUrl || fallbackUrl || (tenorId ? `https://tenor.com/view/${tenorId}` : '#')} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block"
      >
        {/* Use picture element for better browser compatibility */}
        <picture>
          <source srcSet={currentUrl} type="image/gif" />
          <img 
            src={currentUrl} 
            alt={attachment?.title || 'GIF'}
            className="w-full h-auto rounded-md hover:opacity-90 transition-opacity"
            style={{
              maxHeight: '300px',
              objectFit: 'contain',
              display: 'block' // Ensure proper rendering
            }}
            onError={handleError}
            onLoad={handleLoad}
            loading="eager" // Force eager loading
            crossOrigin="anonymous" // Try to avoid CORS issues
          />
        </picture>
        {isLoaded && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {isGiphy ? 'GIPHY' : tenorId ? 'Tenor' : 'GIF'}
          </div>
        )}
      </a>
    </div>
  );
};
