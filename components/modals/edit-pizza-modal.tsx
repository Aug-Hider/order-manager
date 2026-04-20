'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function EditPizzaModal({
  isOpen,
  pizza,
  onSave,
  onClose,
  loading,
}: {
  isOpen: boolean;
  pizza?: any;
  onSave: (data: any) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<any>({
    name: '',
    description: '',
    ingredients: '',
    basePrice: '',
    categoryId: '',
    aiKeywords: [],
  });
  const [kw, setKw] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      if (pizza) {
        setForm({
          name: pizza.name || '',
          description: pizza.description || '',
          ingredients: pizza.ingredients || '',
          basePrice: pizza.basePrice || '',
          categoryId: pizza.categoryId || '',
          aiKeywords: pizza.aiKeywords || [],
        });
      } else {
        setForm({
          name: '',
          description: '',
          ingredients: '',
          basePrice: '',
          categoryId: '',
          aiKeywords: [],
        });
      }
    }
  }, [isOpen, pizza]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
    setLoadingCategories(false);
  };

  if (!isOpen) return null;

  const addKeyword = () => {
    if (kw && !form.aiKeywords.includes(kw)) {
      setForm({ ...form, aiKeywords: [...form.aiKeywords, kw] });
      setKw('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <h2 className="text-2xl font-bold mb-6">{pizza ? 'Modifier' : 'Nouvelle'} pizza</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom</label>
            <Input 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
              placeholder="Ex: Margarita"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Catégorie</label>
            {loadingCategories ? (
              <div className="text-sm text-gray-500">Chargement des catégories...</div>
            ) : (
              <select
                value={form.categoryId || ''}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">-- Sans catégorie --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              rows={2}
              placeholder="Ex: Sauce tomate et mozzarella"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ingrédients</label>
            <Input 
              value={form.ingredients} 
              onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
              placeholder="Ex: Tomate, mozzarella, jambon"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Prix (€)</label>
            <Input
              type="number"
              step="0.01"
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
              placeholder="Ex: 10.50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Mots-clés IA</label>
            <div className="flex gap-2 mb-2">
              <Input 
                value={kw} 
                onChange={(e) => setKw(e.target.value)} 
                placeholder="Ex: 4 fromages" 
              />
              <Button onClick={addKeyword} size="sm" variant="outline">+</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.aiKeywords && form.aiKeywords.map((k: string) => (
                <span key={k} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {k}
                  <button 
                    type="button"
                    onClick={() => setForm({ ...form, aiKeywords: form.aiKeywords.filter((x: string) => x !== k) })}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <Button onClick={onClose} variant="outline" disabled={loading}>Annuler</Button>
          <Button onClick={() => onSave(form)} disabled={loading}>
            {loading ? 'En cours...' : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  );
}