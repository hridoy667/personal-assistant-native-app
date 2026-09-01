import React from 'react';
import { Text, TextStyle } from 'react-native';

/**
 * Parses markdown bold (**word**) tags and renders proper bold Text nodes while preserving line breaks.
 */
export const renderFormattedText = (
  text: string,
  baseStyle?: TextStyle,
  boldStyle?: TextStyle
): React.ReactNode => {
  if (!text) return null;

  // Split text by ** bold tokens
  const parts = text.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const cleanText = part.slice(2, -2);
      return (
        <Text key={index} style={[baseStyle, { fontWeight: '700' }, boldStyle]}>
          {cleanText}
        </Text>
      );
    }

    return (
      <Text key={index} style={baseStyle}>
        {part}
      </Text>
    );
  });
};