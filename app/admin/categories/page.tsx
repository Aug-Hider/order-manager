'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete';

export default function CategoriesPage() {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState('');

  const isChef = session?.user?.role === 'chef';

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
    setLoading(false);
  };

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setForm(category);
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/categories', {
        method: selectedCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: selectedCategory?.id }),
      });
      setEditOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Erreur:', error);
    }
    setSaving(false);
  };

  const handleDeleteClick = (category: any) => {
    setSelectedCategory(category);
    setError('');
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/categories/${selectedCategory.id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur suppression');
        setSaving(false);
        return;
      }

      setDeleteOpen(false);
      setSelectedCategory(null);
      setError('');
      setCategories(categories.filter(c => c.id !== selectedCategory.id));
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la suppression');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🏷️ Catégories de Pizzas</h1>
        {isChef && <Button onClick={() => { setSelectedCategory(null); setForm({}); setEditOpen(true); }}>+ Ajouter une catégorie</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} className="p-4">
            <h3 className="font-bold text-lg uppercase">{cat.name}</h3>
            <p className="text-sm text-gray-600 mt-1">{cat.description}</p>
            {isChef && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(cat)}>Modifier</Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleDeleteClick(cat)}>Supprimer</Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">{selectedCategory ? 'Modifier' : 'Nouvelle'} catégorie</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Classiques" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ordre d'affichage</label>
                <Input type="number" value={form.sortOrder || 0} onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <Button onClick={() => setEditOpen(false)} variant="outline" disabled={saving}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'En cours...' : 'Enregistrer'}</Button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Supprimer cette catégorie ?</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer "{selectedCategory?.name}" ?</p>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setDeleteOpen(false)} variant="outline" disabled={saving}>Annuler</Button>
              <Button onClick={handleConfirmDelete} disabled={saving || !!error} className="bg-red-600 hover:bg-red-700">
                {saving ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}