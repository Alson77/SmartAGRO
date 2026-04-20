import React, { useState } from 'react';

const OngoingSubsidyManagement: React.FC = () => {
  const [form, setForm] = useState({
    title: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subsidies, setSubsidies] = useState<any[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/subsidy/ongoing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        setForm({ title: '', description: '' });
        fetchSubsidies();
      } else {
        alert(data.message || 'Failed to add subsidy');
      }
    } catch {
      alert('Server error');
    }
    setIsSubmitting(false);
  };

  const fetchSubsidies = async () => {
    try {
      const res = await fetch('/api/subsidy/ongoing');
      const data = await res.json();
      if (data.success) setSubsidies(data.subsidies);
    } catch {}
  };

  React.useEffect(() => {
    fetchSubsidies();
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-bold mb-4">Add Ongoing Subsidy</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded shadow">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        <button type="submit" disabled={isSubmitting} className="bg-green-600 text-white px-4 py-2 rounded">{isSubmitting ? 'Adding...' : 'Add Subsidy'}</button>
      </form>
      <h3 className="text-lg font-semibold mt-8 mb-2">Current Ongoing Subsidies</h3>
      <div className="space-y-3">
        {subsidies.length === 0 ? <p>No subsidies found.</p> : subsidies.map(sub => (
          <div key={sub._id} className="border rounded p-3 bg-gray-50">
            <div className="font-bold">{sub.title || sub.name}</div>
            <div>Description: {sub.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OngoingSubsidyManagement;