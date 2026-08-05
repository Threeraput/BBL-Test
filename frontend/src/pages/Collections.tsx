import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, Skeleton, TextField, Typography } from '@mui/material';
import { Folder, MoreVertical, Plus, Trash2, Edit2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';

type Collection = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  getAccessTokenSilently: () => Promise<string>;
};

export const CollectionsPage = ({ getAccessTokenSilently }: Props) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  
  // Form state
  const [nameInput, setNameInput] = useState('');

  const fetchCollections = async () => {
    try {
      setIsLoading(true);
      const token = await getAccessTokenSilently();
      const data = await apiClient<Collection[]>('/collections', { token });
      setCollections(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleCreate = async () => {
    if (!nameInput.trim()) return;
    try {
      const token = await getAccessTokenSilently();
      await apiClient('/collections', { method: 'POST', body: { name: nameInput }, token });
      setIsCreateOpen(false);
      setNameInput('');
      fetchCollections();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = async () => {
    if (!selectedCollection || !nameInput.trim()) return;
    try {
      const token = await getAccessTokenSilently();
      await apiClient(`/collections/${selectedCollection.id}`, { 
        method: 'PATCH', 
        body: { name: nameInput }, 
        token 
      });
      setIsEditOpen(false);
      setSelectedCollection(null);
      setNameInput('');
      fetchCollections();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!selectedCollection) return;
    try {
      const token = await getAccessTokenSilently();
      await apiClient(`/collections/${selectedCollection.id}`, { method: 'DELETE', token });
      setIsDeleteOpen(false);
      setSelectedCollection(null);
      fetchCollections();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h1" color="text.primary">Collections</Typography>
        <Button 
          variant="contained" 
          startIcon={<Plus size={18} />}
          onClick={() => { setNameInput(''); setIsCreateOpen(true); }}
        >
          New Collection
        </Button>
      </Box>

      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map(i => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      ) : collections.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'background.paper', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <Folder size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
          <Typography variant="h2" color="text.secondary" gutterBottom>No collections yet</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Create your first collection to start organizing bookmarks.</Typography>
          <Button variant="outlined" onClick={() => setIsCreateOpen(true)}>Create Collection</Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {collections.map(col => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={col.id}>
              <Card sx={{ height: '100%', position: 'relative' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2, color: 'primary.main' }}>
                      <Folder size={24} />
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => { setSelectedCollection(col); setNameInput(col.name); setIsEditOpen(true); }} sx={{ mr: 0.5 }}>
                        <Edit2 size={16} />
                      </IconButton>
                      <IconButton size="small" onClick={() => { setSelectedCollection(col); setIsDeleteOpen(true); }} color="error">
                        <Trash2 size={16} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="h2" sx={{ fontSize: '20px', mb: 1 }}>{col.name}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>New Collection</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            placeholder="Collection name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setIsCreateOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!nameInput.trim()}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit Collection</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            placeholder="Collection name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setIsEditOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleEdit} variant="contained" disabled={!nameInput.trim()}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Delete Collection?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete "{selectedCollection?.name}"? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsDeleteOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
