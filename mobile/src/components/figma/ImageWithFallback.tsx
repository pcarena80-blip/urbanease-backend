import { View, Image, Text } from 'react-native';
import React, { useState } from 'react'

const ERROR_IMG_SRC = 'https://via.placeholder.com/150'; // Simplified fallback

export function ImageWithFallback({ src, alt, style, className, ...props }: any) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const source = typeof src === 'string' ? { uri: src } : src;

  return didError ? (
    <View
      className={`bg-gray-100 items-center justify-center ${className ?? ''}`}
      style={style}
    >
      <Text style={{ fontSize: 10, color: '#999' }}>Image Error</Text>
    </View>
  ) : (
    <Image
      source={source}
      className={className}
      style={style}
      {...props}
      onError={handleError}
    />
  )
}
