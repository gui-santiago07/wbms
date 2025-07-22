/**
 * Função utilitária para limpar strings serializadas do PHP
 * Remove o formato serializado PHP (ex: s:15:"ABB Pederneiras") e retorna apenas o conteúdo
 * 
 * @param str - String que pode estar serializada
 * @returns String limpa ou a string original se não for serializada
 */
export const cleanPhpSerializedString = (str: string): string => {
  if (!str) return str;
  
  // Regex para detectar formato serializado PHP: s:length:"string"
  const phpSerializedRegex = /^s:\d+:"([^"]+)";?$/;
  const match = str.match(phpSerializedRegex);
  
  if (match) {
    return match[1]; // Retorna apenas o conteúdo da string
  }
  
  return str; // Retorna a string original se não for serializada
};

/**
 * Função utilitária para limpar múltiplas strings serializadas em um objeto
 * 
 * @param obj - Objeto que pode conter strings serializadas
 * @param fields - Array de campos que devem ser limpos
 * @returns Objeto com strings limpas
 */
export const cleanPhpSerializedObject = <T extends Record<string, any>>(
  obj: T, 
  fields: (keyof T)[]
): T => {
  const cleaned = { ...obj };
  
  fields.forEach(field => {
    if (cleaned[field] && typeof cleaned[field] === 'string') {
      cleaned[field] = cleanPhpSerializedString(cleaned[field]) as T[keyof T];
    }
  });
  
  return cleaned;
}; 