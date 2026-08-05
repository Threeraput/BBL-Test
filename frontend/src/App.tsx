import { ThemeProvider } from '@mui/material/styles';
import { RouterProvider, createBrowserRouter, Outlet, Navigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { CircularProgress, Box, CssBaseline } from '@mui/material';
import { useMemo } from 'react';
import { theme } from './theme.ts';
import { AuthProvider } from './auth/AuthProvider.tsx';

import { LoginPage } from './pages/Login.tsx';
import { CollectionsPage } from './pages/Collections.tsx';
import { BookmarksPage } from './pages/Bookmarks.tsx';
import { Layout } from './layout/Layout.tsx';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

const AppRoutes = () => {
  const router = useMemo(() => createBrowserRouter([
    {
      path: '/login',
      element: <LoginPage />,
    },
    {
      path: '/callback',
      element: <LoginPage />,
    },
    {
      path: '/',
      element: <ProtectedRoute />,
      children: [
        {
          index: true,
          element: <Navigate to="/collections" replace />,
        },
        {
          path: 'collections',
          element: <CollectionsPage />,
        },
        {
          path: 'bookmarks',
          element: <BookmarksPage />,
        },
      ],
    },
  ]), []);

  return <RouterProvider router={router} />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
