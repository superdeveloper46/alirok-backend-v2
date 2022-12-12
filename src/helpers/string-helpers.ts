/**
 * Convert string to title case and sanitize it
 *
 * @param  String String to sanitize, default is underscore
 * @return String
 */
const toTitleCase = (str: string, sanitizeChars = '_'): string => {
  if (typeof sanitizeChars === 'string') {
    [...sanitizeChars].forEach((char) => {
      str = str.replace(new RegExp(char, 'g'), ' ');
    });
  }

  // Convert to title case and remove any additional spaces
  return str
    .toLowerCase()
    .split(' ')
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ')
    .replace(/\s+/g, ' ');
};

const StringHelper = { toTitleCase };

export default StringHelper;
