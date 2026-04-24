import React, { useState } from 'react'
import { BookOpenIcon } from 'lucide-react'
import { getOpenLibraryCoverUrl, resolveBookCoverUrl } from '../api/books'

const BookCoverImage = ({ title, coverColor = 'bg-teal', coverImageUrl, width = 'w-full', height = 'h-40', rounded = 'rounded-2xl', iconSize = 48, className = '' }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageFailed, setImageFailed] = useState(false)
  const [tryOpenLibrary, setTryOpenLibrary] = useState(!coverImageUrl)

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageFailed(false)
  }

  const handleImageError = () => {
    // If uploaded image failed and we haven't tried Open Library yet, try it
    if (coverImageUrl && !tryOpenLibrary) {
      setTryOpenLibrary(true)
      setImageLoaded(false)
      setImageFailed(false)
    } else {
      setImageFailed(true)
      setImageLoaded(false)
    }
  }

  // Determine which image URL to use
  const imageUrlToTry = coverImageUrl && !tryOpenLibrary 
    ? resolveBookCoverUrl(coverImageUrl)
    : getOpenLibraryCoverUrl(title)

  return (
    <div className={`${width} ${height} ${rounded} flex items-center justify-center overflow-hidden bg-gray-100 relative ${className}`}>
      {!imageFailed && (
        <img
          src={imageUrlToTry}
          alt={title}
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            transition: 'opacity 0.3s ease-in-out',
            opacity: imageLoaded ? 1 : 0,
            position: imageLoaded ? 'relative' : 'absolute'
          }}
        />
      )}
      {!imageLoaded && (
        <div className={`w-full h-full ${coverColor} flex items-center justify-center`}>
          <BookOpenIcon size={iconSize} className="text-white/50" />
        </div>
      )}
    </div>
  )
}

export default BookCoverImage
