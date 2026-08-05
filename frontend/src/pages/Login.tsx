import { useAuth0 } from '@auth0/auth0-react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { LogIn } from 'lucide-react';

export const LoginPage = () => {
  const { loginWithRedirect } = useAuth0();

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
