import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, IconButton } from '@mui/material';
import { Bookmark, FolderClosed, LogOut } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const DRAWER_WIDTH = 260;

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth0();

  const menuItems = [
    { text: 'Collections', icon: <FolderClosed size={22} />, path: '/collections' },
    { text: 'Bookmarks', icon: <Bookmark size={22} />, path: '/bookmarks' },
  ];

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: DRAWER_WIDTH, 
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          p: 2,
        },
      }}
    >
      <Box sx={{ mb: 6, mt: 2, px: 2 }}>
        <Typography variant="h2" color="primary">
          Bookmarks
        </Typography>
      </Box>

      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.main',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.contrastText',
                    }
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: isActive ? 'inherit' : 'text.secondary' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  disableTypography
                  primary={
                    <Typography sx={{ fontWeight: isActive ? 600 : 500 }}>
                      {item.text}
                    </Typography>
                  } 
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ 
        mt: 'auto', 
        p: 2, 
        bgcolor: 'background.default', 
        borderRadius: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <Typography variant="caption" noWrap sx={{ display: 'block' }} color="text.secondary">
            Logged in as
          </Typography>
          <Typography variant="body2" noWrap sx={{ fontWeight: '500' }}>
            {user?.email}
          </Typography>
        </Box>
        <IconButton 
          size="small" 
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
          title="Sign out"
        >
          <LogOut size={18} />
        </IconButton>
      </Box>
    </Drawer>
  );
};
