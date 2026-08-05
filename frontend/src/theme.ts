import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#8EC5FC',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F7FBFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E293B',
      secondary: '#64748B',
    },
    success: { main: '#67C587' },
    warning: { main: '#F6C65B' },
    error: { main: '#EF6A6A' },
    divider: '#E6EEF8',
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '32px',
      fontWeight: 700,
    },
    h2: {
      fontSize: '24px',
      fontWeight: 600,
    },
    body1: {
      fontSize: '16px',
      fontWeight: 400,
    },
    caption: {
      fontSize: '14px',
      fontWeight: 500,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 20, // Default to largest for cards
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          padding: '8px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(142, 197, 252, 0.2)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 20px rgba(142, 197, 252, 0.05)',
          border: '1px solid #E6EEF8',
          backgroundImage: 'none', // Remove dark mode overlay if any
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
        },
      },
    },
  },
});
