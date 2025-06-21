// Mapeamento de tipos de exercício de inglês para português
export const EXERCISE_TYPE_TRANSLATIONS: Record<string, string> = {
  'walking': 'Caminhada',
  'running': 'Corrida',
  'cycling': 'Ciclismo',
  'swimming': 'Natação',
  'gym': 'Academia',
  'yoga': 'Yoga',
  'other': 'Outro',
};

// Função para traduzir tipo de exercício
export function translateExerciseType(exerciseType: string | null | undefined): string {
  if (!exerciseType) return 'Exercício';
  
  return EXERCISE_TYPE_TRANSLATIONS[exerciseType] || exerciseType;
}

// Mapeamento de categorias de desculpa de inglês para português
export const EXCUSE_CATEGORY_TRANSLATIONS: Record<string, string> = {
  'medical': 'Atestado médico',
  'travel': 'Viagem',
  'event': 'Evento importante',
  'tired': 'Cansaço',
  'other': 'Outro',
};

// Função para traduzir categoria de desculpa
export function translateExcuseCategory(excuseCategory: string | null | undefined): string {
  if (!excuseCategory) return 'Desculpa';
  
  return EXCUSE_CATEGORY_TRANSLATIONS[excuseCategory] || excuseCategory;
} 