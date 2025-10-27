// src/components/FeedbackList.jsx
import { useEffect, useState } from "react";

export default function FeedbackList({ token }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_FEEDBACK = "http://localhost:5001/api/feedback";

  useEffect(() => {
    fetchFeedbacks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(API_FEEDBACK, {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok) setFeedbacks(data);
      else setError(data.message || "Failed to fetch feedback");
    } catch (err) {
      console.error("Feedback fetch error:", err);
      setError("Network error while fetching feedback");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">User Feedback</h2>
        <button
          onClick={fetchFeedbacks}
          className="text-sm px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading feedback...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && feedbacks.length === 0 && (
        <p className="text-gray-500">No feedback available.</p>
      )}

      {!loading && feedbacks.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Message</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((f) => (
                <tr key={f._id} className="odd:bg-white even:bg-gray-50">
                  <td className="px-4 py-3 align-top max-w-xs break-words">{f.name}</td>
                  <td className="px-4 py-3 align-top max-w-xs break-words">{f.email}</td>
                  <td className="px-4 py-3 align-top max-w-prose break-words">{f.message}</td>
                  <td className="px-4 py-3 align-top">
                    {f.createdAt ? new Date(f.createdAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
