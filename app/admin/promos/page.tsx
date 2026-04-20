'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function PromosPage() {
  const { data: session } = useSession();
  const [promos, setPromos] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pizzas, setPizzas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({
    name: '',
    description: '',
    reductionType: 'percent',
    reductionValue: 0,
    applicationType: 'category',
    categoryId: '',
    pizzaIds: [],
    recurringDays: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
  });

  const isChef = session?.user?.role === 'chef';

  useEffect(() => {
    Promise.all([fetchPromos(), fetchCategories(), fetchPizzas()]).then(() => setLoading(false));
  }, []);

  const fetchPromos = async () => {
    try {
      const res = await fetch('/api/admin/promos');
      const data = await res.json();
      setPromos(data.promos || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchPizzas = async () => {
    try {
      const res = await fetch('/api/admin/menu');
      const data = await res.json();
      setPizzas(data.pizzas || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleEdit = (promo: any) => {
    setSelectedPromo(promo);
    setForm(promo);
    setEditOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/promos', {
        method: selectedPromo ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: selectedPromo?.id }),
      });
      setEditOpen(false);
      setSelectedPromo(null);
      setForm({
        name: '',
        description: '',
        reductionType: 'percent',
        reductionValue: 0,
        applicationType: 'category',
        categoryId: '',
        pizzaIds: [],
        recurringDays: [],
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true,
      });
      fetchPromos();
    } catch (error) {
      console.error('Erreur:', error);
    }
    setSaving(false);
  };

  const handleDeleteClick = (promo: any) => {
    setSelectedPromo(promo);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/promos/${selectedPromo.id}`, { method: 'DELETE' });
      setDeleteOpen(false);
      setSelectedPromo(null);
      setPromos(promos.filter((p) => p.id !== selectedPromo.id));
    } catch (error) {
      console.error('Erreur:', error);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🎉 Promos</h1>
        {isChef && (
          <Button
            onClick={() => {
              setSelectedPromo(null);
              setForm({
                name: '',
                description: '',
                reductionType: 'percent',
                reductionValue: 0,
                applicationType: 'category',
                categoryId: '',
                pizzaIds: [],
                recurringDays: [],
                startDate: new Date().toISOString().split('T')[0],
                endDate: '',
                isActive: true,
              });
              setEditOpen(true);
            }}
          >
            + Ajouter une promo
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.map((promo) => (
          <Card key={promo.id} className="p-4">
            <h3 className="font-bold text-lg">{promo.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{promo.description}</p>
            <div className="bg-orange-100 text-orange-700 px-3 py-2 rounded text-sm font-bold mb-2">
              {promo.reductionType === 'percent' ? `-${promo.reductionValue}%` : `-${promo.reductionValue}€`}
            </div>
            <p className="text-xs text-gray-500">
              {promo.recurringDays && promo.recurringDays.length > 0
                ? `Tous les ${promo.recurringDays.join(', ').toLowerCase()}`
                : 'Une seule fois'}
            </p>
            {isChef && (
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(promo)}>
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-600 hover:bg-red-50"
                  onClick={() => handleDeleteClick(promo)}
                >
                  Supprimer
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
            <h2 className="text-2xl font-bold mb-6">{selectedPromo ? 'Modifier' : 'Nouvelle'} promo</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type réduction</label>
                  <select value={form.reductionType} onChange={(e) => setForm({ ...form, reductionType: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option value="percent">Pourcentage %</option>
                    <option value="fixed">Montant €</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valeur</label>
                  <Input type="number" value={form.reductionValue} onChange={(e) => setForm({ ...form, reductionValue: parseFloat(e.target.value) })} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Appliquer sur</label>
                <select value={form.applicationType} onChange={(e) => setForm({ ...form, applicationType: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="category">Catégorie</option>
                  <option value="pizza">Pizza(s)</option>
                </select>
              </div>

              {form.applicationType === 'category' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Catégorie</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                    <option value="">-- Choisir --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.applicationType === 'pizza' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Pizzas</label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                    {pizzas.map((pizza) => (
                      <label key={pizza.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={form.pizzaIds.includes(pizza.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, pizzaIds: [...form.pizzaIds, pizza.id] });
                            } else {
                              setForm({ ...form, pizzaIds: form.pizzaIds.filter((id: string) => id !== pizza.id) });
                            }
                          }}
                        />
                        <span className="text-sm">{pizza.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Jours récurrents</label>
                <div className="grid grid-cols-4 gap-2">
                  {DAYS.map((day, i) => (
                    <label key={i} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={form.recurringDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({ ...form, recurringDays: [...form.recurringDays, day] });
                          } else {
                            setForm({ ...form, recurringDays: form.recurringDays.filter((d: string) => d !== day) });
                          }
                        }}
                      />
                      <span className="text-sm">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date début</label>
                  <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date fin</label>
                  <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                  <span className="text-sm font-medium">Actif</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button onClick={() => setEditOpen(false)} variant="outline" disabled={saving}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'En cours...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Supprimer cette promo ?</h2>
            <p className="text-gray-600 mb-6">Êtes-vous sûr de vouloir supprimer "{selectedPromo?.name}" ?</p>
            <div className="flex justify-end gap-3">
              <Button onClick={() => setDeleteOpen(false)} variant="outline" disabled={saving}>
                Annuler
              </Button>
              <Button onClick={handleConfirmDelete} disabled={saving} className="bg-red-600 hover:bg-red-700">
                {saving ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}