'use client';
import { useState } from 'react';

interface PizzaModalProps { pizza?: any; categories: any[]; onSave: (pizza: any) => void; onClose: () => void }

export function PizzaModal({ pizza, categories, onSave, onClose }: PizzaModalProps) {
  const [form, setForm] = useState(pizza || { name: '', description: '', ingredients: '', basePrice: '', categoryId: categories[0]?.id, aiKeywords: [], isAvailable: true });
  const [kw, setKw] = useState('');
  const addKw = () => { if (kw && !form.aiKeywords.includes(kw)) { setForm({ ...form, aiKeywords: [...form.aiKeywords, kw] }); setKw(''); } };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6">
        <h2 className="text-2xl font-bold mb-6">{pizza ? 'Modifier' : 'Nouvelle'} pizza</h2>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Nom</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
          <div><label className="block text-sm font-medium mb-1">Ingrédients</label><input value={form.ingredients} onChange={e => setForm({ ...form, ingredients: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Prix (€)</label><input type="number" step="0.01" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Catégorie</label>
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Mots-clés IA</label>
            <div className="flex gap-2 mb-2">
              <input value={kw} onChange={e => setKw(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addKw())} className="flex-1 border rounded-lg px-3 py-2" placeholder="Ex: 4 fromages" />
              <button onClick={addKw} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300">+</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.aiKeywords.map((k: string) => (
                <span key={k} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {k}<button onClick={() => setForm({ ...form, aiKeywords: form.aiKeywords.filter((x: string) => x !== k) })}>×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button onClick={() => onSave(form)} className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
