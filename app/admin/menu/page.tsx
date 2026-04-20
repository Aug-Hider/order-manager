'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EditPizzaModal } from '@/components/modals/edit-pizza-modal';
import { ConfirmDeleteModal } from '@/components/modals/confirm-delete';

export default function MenuPage() {
  const { data: session } = useSession();
  const [pizzas, setPizzas] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedPizza, setSelectedPizza] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const isStaff = session?.user?.role === 'staff';

  useEffect(() => {
    Promise.all([fetchPizzas(), fetchCategories()]).then(() => setLoading(false));
  }, []);

  const fetchPizzas = async () => {
    try {
      const res = await fetch('/api/admin/menu');
      const data = await res.json();
      setPizzas(data.pizzas || []);
    } catch (error) {
      console.error('Erreur pizzas:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Erreur categories:', error);
    }
  };

  const handleEdit = (pizza: any) => {
    setSelectedPizza(pizza);
    setEditOpen(true);
  };

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/menu', {
        method: selectedPizza ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: selectedPizza?.id }),
      });
      if (res.ok) {
        setEditOpen(false);
        setSelectedPizza(null);
        await fetchPizzas();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
    setSaving(false);
  };

  const handleDeleteClick = (pizza: any) => {
    setSelectedPizza(pizza);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
      setSaving(true);
      try {
        const res = await fetch(`/api/admin/menu/${selectedPizza.id}`, { method: 'DELETE' });
        const data = await res.json();
        
        if (!res.ok) {
          console.error('Erreur API:', data);
          setSaving(false);
          return;
        }
        
        setDeleteOpen(false);
        setSelectedPizza(null);
        
        // Supprimer directement du state local
        setPizzas(pizzas.filter(p => p.id !== selectedPizza.id));
      } catch (error) {
        console.error('Erreur:', error);
      }
      setSaving(false);
    };

  const groupedPizzas = categories
    .filter((cat) => pizzas.some((p) => p.categoryId === cat.id))
    .map((cat) => ({ category: cat, pizzas: pizzas.filter((p) => p.categoryId === cat.id) }));

  const uncategorizedPizzas = pizzas.filter((p) => !p.categoryId);

  if (loading) return <div className="p-8">Chargement...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🍕 Pizzas</h1>
        {!isStaff && <Button onClick={() => { setSelectedPizza(null); setEditOpen(true); }}>+ Ajouter</Button>}
      </div>

      {groupedPizzas.map((group) => (
        <div key={group.category.id} className="mb-8">
          <h2 className="text-2xl font-bold uppercase mb-4 text-orange-600">{group.category.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {group.pizzas.map((pizza) => (
              <Card key={pizza.id} className="p-4">
                <h3 className="font-bold text-lg">{pizza.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{pizza.description}</p>
                <p className="font-semibold text-orange-600">{pizza.basePrice}€</p>
                <p className="text-xs text-gray-500 mt-2">{pizza.ingredients}</p>
                {!isStaff && (
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(pizza)}>Modifier</Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleDeleteClick(pizza)}>Supprimer</Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      ))}

      {uncategorizedPizzas.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold uppercase mb-4 text-gray-400">Sans catégorie</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uncategorizedPizzas.map((pizza) => (
              <Card key={pizza.id} className="p-4 border-dashed">
                <h3 className="font-bold text-lg">{pizza.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{pizza.description}</p>
                <p className="font-semibold text-orange-600">{pizza.basePrice}€</p>
                <p className="text-xs text-gray-500 mt-2">{pizza.ingredients}</p>
                {!isStaff && (
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(pizza)}>Modifier</Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-600 hover:bg-red-50" onClick={() => handleDeleteClick(pizza)}>Supprimer</Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      <EditPizzaModal isOpen={editOpen} pizza={selectedPizza} onSave={handleSave} onClose={() => setEditOpen(false)} loading={saving} />
      <ConfirmDeleteModal isOpen={deleteOpen} title="Supprimer cette pizza ?" message={`Êtes-vous sûr de vouloir supprimer "${selectedPizza?.name}" ?`} onConfirm={handleConfirmDelete} onCancel={() => setDeleteOpen(false)} loading={saving} />
    </div>
  );
}