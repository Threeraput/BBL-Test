import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar.tsx';

export const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 6,
          // Floating Canvas Effect: generous margins around content
          maxWidth: '1200px',
          mx: 'auto'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
