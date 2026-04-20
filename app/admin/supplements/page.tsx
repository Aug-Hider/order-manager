'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete';

export default function SupplementsPage() {
  const { data: session } = useSession();
  const [supplements, setSupplements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  const isStaff = session?.user?.role === 'staff';

  useEffect(() => {
    fetchSupplements();
  }, []);

  const fetchSupplements = async () => {
    const res = await fetch('/api/admin/supplements');
    const data = await res.json();
    setSupplements(data.supplements || []);
    setLoading(false);
  };

  const handleEdit = (supplement: any) => {
    setSelectedSupplement(supplement);
    setForm(supplement);
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/supplements', {
        method: selectedSupplement ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: selectedSupplement?.id }),
      });
      setEditOpen(false);
      setSelectedSupplement(null);
      fetchSupplements();
    } catch (error) {
      console.error('Erreur:', error);
    }
    setSaving(false);
  };

  const handleDeleteClick = (supplement: any) => {
    setSelectedSupplement(supplement);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/supplements/${selectedSupplement.id}`, { method: 'DELETE' });
      setDeleteOpen(false);
      setSelectedSupplement(null);
      fetchSupplements();
    } catch (error) {
      console.error('Erreur:', error);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">➕ Suppléments</h1>
        {!isStaff && <Button onClick={() => { setSelectedSupplement(null); setForm({}); setEditOpen(true); }}>+ Ajouter un supplément</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {supplements.map((item) => (
          <Card key={item.id} className="p-4">
            <h3 className="font-bold text-lg">{item.name}</h3>
            <p className="font-semibold text-orange-600 text-xl my-2">+{item.price}€</p>
            {!isStaff && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>Modifier</Button>
                <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleDeleteClick(item)}>Supprimer</Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">{selectedSupplement ? 'Modifier' : 'Nouveau'} supplément</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Anchois" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prix (€)</label>
                <Input type="number" step="0.10" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <Button onClick={() => setEditOpen(false)} variant="outline" disabled={saving}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'En cours...' : 'Enregistrer'}</Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={deleteOpen}
        title="Supprimer ce supplément ?"
        message={`Êtes-vous sûr de vouloir supprimer "${selectedSupplement?.name}" ?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={saving}
      />
    </div>
  );
}