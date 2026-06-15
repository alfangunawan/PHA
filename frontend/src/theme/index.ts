export const lightColors = {
  softBlue: '#A8C5DA',
  softBlueDark: '#7BAAC4',
  softBlueLight: '#D4E8F5',
  sageGreen: '#B2C9AD',
  sageGreenDark: '#8AAD83',
  sageGreenLight: '#D8EDD5',
  lavender: '#C9B8E8',
  lavenderDark: '#A994D4',
  lavenderLight: '#E8E0F5',
  peach: '#F5CBA7',
  peachDark: '#E8A87C',
  peachLight: '#FAE8D4',
  cream: '#FFF8F0',
  white: '#FFFFFF',
  offWhite: '#F7F3EE',
  lightGray: '#E8E4E0',
  mediumGray: '#B0A8A0',
  darkGray: '#6B6360',
  charcoal: '#3D3532',
  bgPrimary: '#F5F3F8',
  bgCard: '#FFFFFF',
  bgOverlay: 'rgba(61, 53, 50, 0.4)',
  success: '#A8D5A2',
  warning: '#F5D77E',
  error: '#F5A8A8',
  categories: {
    sleep: '#C9B8E8',
    focus: '#A8C5DA',
    anxiety: '#B2C9AD',
    morning: '#F5CBA7',
    general: '#A8C5DA',
    breathing: '#A8C5DA',
    meditation: '#C9B8E8',
    education: '#B2C9AD',
  },
  tabBar: '#FFFFFF',
  tabBarBorder: '#E8E4E0',
  inputBg: '#FFFFFF',
  inputBorder: '#E8E4E0',
  divider: '#E8E4E0',
};

export const darkColors = {
  softBlue: '#7DB9D6',
  softBlueDark: '#5A9BC0',
  softBlueLight: '#1A2D3A',
  sageGreen: '#8BBD86',
  sageGreenDark: '#6A9F64',
  sageGreenLight: '#182419',
  lavender: '#B09AD8',
  lavenderDark: '#8C7AC4',
  lavenderLight: '#221B36',
  peach: '#E8B88A',
  peachDark: '#CC9060',
  peachLight: '#2E1E10',
  cream: '#1A1714',
  white: '#1E1C20',
  offWhite: '#252228',
  lightGray: '#2E2B32',
  mediumGray: '#7A7280',
  darkGray: '#A89FB0',
  charcoal: '#E8E0F0',
  bgPrimary: '#13111A',
  bgCard: '#1E1C25',
  bgOverlay: 'rgba(0, 0, 0, 0.6)',
  success: '#5BAF55',
  warning: '#D4A820',
  error: '#D05050',
  categories: {
    sleep: '#B09AD8',
    focus: '#7DB9D6',
    anxiety: '#8BBD86',
    morning: '#E8B88A',
    general: '#7DB9D6',
    breathing: '#7DB9D6',
    meditation: '#B09AD8',
    education: '#8BBD86',
  },
  tabBar: '#1E1C25',
  tabBarBorder: '#2E2B32',
  inputBg: '#252228',
  inputBorder: '#3A3640',
  divider: '#2E2B32',
};

export const Colors = lightColors;

export const Typography = {
  heading: 'Poppins_600SemiBold',
  headingBold: 'Poppins_700Bold',
  headingMedium: 'Poppins_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
    '4xl': 40,
  },
  lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.8 },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  full: 9999,
};

export const lightShadows = {
  sm: { shadowColor: '#3D3532', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#3D3532', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 4 },
  lg: { shadowColor: '#3D3532', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8 },
};

export const darkShadows = {
  sm: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  md: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6 },
  lg: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
};

export const Shadows = lightShadows;

export const theme = { Colors, Typography, Spacing, BorderRadius, Shadows };
export default theme;
