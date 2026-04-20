import React, { useState } from 'react';

interface OngoingSubsidy {
  _id: string;
  title: string;
  description: string;
}

const OngoingSubsidyList: React.FC<{ onApply: (subsidy: OngoingSubsidy) => void }> = ({ onApply }) => {
  const [subsidies, setSubsidies] = useState<OngoingSubsidy[]>([]);

  React.useEffect(() => {
    fetch('/api/subsidy/ongoing')
      .then(res => res.json())
      .then(data => {
        if (data.success) setSubsidies(data.subsidies);
      });
  }, []);

  const [showAll, setShowAll] = useState(false);
  return (
    <div className="space-y-4">
      {subsidies.length === 0 ? (
        <p>No ongoing subsidies available.</p>
      ) : (
        <>
          {/* Show only the first card unless showAll is true */}
          <div key={subsidies[0]._id} className="border rounded-xl p-4 bg-white shadow flex flex-col space-y-3 max-w-lg">
            <div className="font-bold text-lg text-gray-900 mb-1">{subsidies[0].title}</div>
            <div className="break-words whitespace-pre-line text-gray-700 p-2 rounded bg-gray-50 border border-gray-200">{subsidies[0].description}</div>
          </div>
          {subsidies.length > 1 && !showAll && (
            <button className="mt-2 px-4 py-1 bg-green-600 text-white rounded" onClick={() => setShowAll(true)}>View All</button>
          )}
          {showAll && (
            <>
              <div className="space-y-4">
                {subsidies.slice(1).map(sub => (
                  <div key={sub._id} className="border rounded-xl p-4 bg-white shadow flex flex-col space-y-3 max-w-lg">
                    <div className="font-bold text-lg text-gray-900 mb-1">{sub.title}</div>
                    <div className="break-words whitespace-pre-line text-gray-700 p-2 rounded bg-gray-50 border border-gray-200">{sub.description}</div>
                  </div>
                ))}
              </div>
              <button className="mt-2 px-4 py-1 bg-gray-300 text-gray-800 rounded" onClick={() => setShowAll(false)}>Hide</button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default OngoingSubsidyList;