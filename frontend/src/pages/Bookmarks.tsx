import { Box, Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, IconButton, InputLabel, MenuItem, Select, Skeleton, TextField, Typography, Chip, Link, Alert } from '@mui/material';
import { Bookmark as BookmarkIcon, Plus, Trash2, Edit2, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBookmarks } from '../hooks/useBookmarks.ts';
import { useCollections } from '../hooks/useCollections.ts';
import { type Bookmark } from '../api/bookmarks.ts';

export const BookmarksPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const collectionIdParam = searchParams.get('collectionId') || 'all';

  const { bookmarks, isLoading: isBookmarksLoading, error: bookmarksError, fetchBookmarks, createBookmark, updateBookmark, deleteBookmark } = useBookmarks();
  const { collections, isLoading: isCollectionsLoading, error: collectionsError, fetchCollections } = useCollections();
  
  const isLoading = isBookmarksLoading || isCollectionsLoading;
  const error = bookmarksError || collectionsError;
  
  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({ title: '', url: '', notes: '', collectionId: '' });

  useEffect(() => {
    const filterId = collectionIdParam !== 'all' ? collectionIdParam : undefined;
    fetchBookmarks(filterId);
    fetchCollections();
  }, [collectionIdParam, fetchBookmarks, fetchCollections]);

  const handleFilterChange = (value: string) => {
    if (value === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ collectionId: value });
    }
  };

  const formatUrl = (inputUrl: string) => {
    const trimmed = inputUrl.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.url.trim()) return;
    try {
      const body = {
        title: formData.title,
        url: formatUrl(formData.url),
        notes: formData.notes || undefined,
        collectionId: formData.collectionId || undefined
      };
      await createBookmark(body);
      setIsCreateOpen(false);
      setFormData({ title: '', url: '', notes: '', collectionId: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = async () => {
    if (!selectedBookmark || !formData.title.trim() || !formData.url.trim()) return;
    try {
      const body = {
        title: formData.title,
        url: formatUrl(formData.url),
        notes: formData.notes || null,
        collectionId: formData.collectionId || null
      };
      await updateBookmark(selectedBookmark.id, body);
      setIsEditOpen(false);
      setSelectedBookmark(null);
      setFormData({ title: '', url: '', notes: '', collectionId: '' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    if (!selectedBookmark) return;
    try {
      await deleteBookmark(selectedBookmark.id);
      setIsDeleteOpen(false);
      setSelectedBookmark(null);
    } catch (e) {
      console.error(e);
    }
  };

  const openEdit = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    setFormData({
      title: bookmark.title,
      url: bookmark.url,
      notes: bookmark.notes || '',
      collectionId: bookmark.collectionId || ''
    });
    setIsEditOpen(true);
  };

  const displayBookmarks = bookmarks;

  const renderFormFields = () => (
    <>
      <TextField
        fullWidth margin="normal" label="Title" required
        value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
      />
      <TextField
        fullWidth margin="normal" label="URL" type="url" required
        value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })}
      />
      <TextField
        fullWidth margin="normal" label="Notes (optional)" multiline rows={3}
        value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
      />
      <FormControl fullWidth margin="normal">
        <InputLabel>Collection (optional)</InputLabel>
        <Select
          label="Collection (optional)"
          value={formData.collectionId}
          onChange={e => setFormData({ ...formData, collectionId: e.target.value })}
        >
          <MenuItem value=""><em>None</em></MenuItem>
          {collections.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </Select>
      </FormControl>
    </>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h1" color="text.primary">Bookmarks</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Select
              value={collectionIdParam}
              onChange={(e) => handleFilterChange(e.target.value)}
              displayEmpty
            >
              <MenuItem value="all">All Collections</MenuItem>
              {collections.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            startIcon={<Plus size={18} />}
            onClick={() => { setFormData({ title: '', url: '', notes: '', collectionId: collectionIdParam !== 'all' ? collectionIdParam : '' }); setIsCreateOpen(true); }}
          >
            New Bookmark
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Grid container spacing={3}>
          {[1, 2, 3].map(i => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Skeleton variant="rounded" height={160} />
            </Grid>
          ))}
        </Grid>
      ) : displayBookmarks.length === 0 && !error ? (
        <Box sx={{ textAlign: 'center', py: 10, bgcolor: 'background.paper', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <BookmarkIcon size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
          <Typography variant="h2" color="text.secondary" gutterBottom>No bookmarks found</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Save your favorite links here.</Typography>
          <Button variant="outlined" onClick={() => setIsCreateOpen(true)}>Create Bookmark</Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {displayBookmarks.map(b => {
            const coll = collections.find(c => c.id === b.collectionId);
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={b.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Link href={b.url} target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.5, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                        {b.title} <ExternalLink size={14} />
                      </Link>
                      <Box sx={{ ml: 2, display: 'flex', flexShrink: 0 }}>
                        <IconButton size="small" onClick={() => openEdit(b)} sx={{ mr: 0.5 }}>
                          <Edit2 size={16} />
                        </IconButton>
                        <IconButton size="small" onClick={() => { setSelectedBookmark(b); setIsDeleteOpen(true); }} color="error">
                          <Trash2 size={16} />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {b.notes || <span style={{ opacity: 0.5 }}>No notes</span>}
                    </Typography>
                    {coll && (
                      <Chip label={coll.name} size="small" sx={{ bgcolor: 'background.default', color: 'text.secondary', fontWeight: 500 }} />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onClose={() => setIsCreateOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Bookmark</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>{renderFormFields()}</DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setIsCreateOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!formData.title.trim() || !formData.url.trim()}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Bookmark</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>{renderFormFields()}</DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button onClick={() => setIsEditOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleEdit} variant="contained" disabled={!formData.title.trim() || !formData.url.trim()}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Delete Bookmark?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete "{selectedBookmark?.title}"?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsDeleteOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
