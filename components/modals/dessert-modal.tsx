'use client';
import { useState } from 'react';

interface DessertModalProps { item?: any; onSave: (item: any) => void; onClose: () => void }

export function DessertModal({ item, onSave, onClose }: DessertModalProps) {
  const [form, setForm] = useState(item || { name: '', description: '', price: '', category: 'dessert', aiKeywords: [], isAvailable: true });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-2xl font-bold mb-6">{item ? 'Modifier' : 'Nouveau'} article</h2>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Nom</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Catégorie</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border rounded-lg px-3 py-2">
              <option value="entree">Entrée</option><option value="dessert">Dessert</option><option value="drink">Boisson</option>
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full border rounded-lg px-3 py-2" rows={2} /></div>
          <div><label className="block text-sm font-medium mb-1">Prix (€)</label><input type="number" step="0.10" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="w-full border rounded-lg px-3 py-2" /></div>
          <div><label className="block text-sm font-medium mb-1">Mots-clés IA (virgules)</label><input value={form.aiKeywords.join(', ')} onChange={e => setForm({ ...form, aiKeywords: e.target.value.split(',').map((s: string) => s.trim()) })} className="w-full border rounded-lg px-3 py-2" /></div>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
          <button onClick={() => onSave(form)} className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}
