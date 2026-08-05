import { useAuth0 } from '@auth0/auth0-react';
import { Box, Button, Typography, Paper, CircularProgress } from '@mui/material';
import { LogIn } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export const LoginPage = () => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          maxWidth: 400,
          textAlign: 'center',
        }}
      >
        <Typography variant="h1" color="primary" gutterBottom>
          Bookmarks
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          A calm, trustworthy place to keep your own links. Private and secure.
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<LogIn size={20} />}
          onClick={() => loginWithRedirect()}
          sx={{ py: 1.5, px: 4 }}
        >
          Sign in
        </Button>
      </Paper>
    </Box>
  );
};
