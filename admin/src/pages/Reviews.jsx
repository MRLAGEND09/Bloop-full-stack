import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { bakendUrl } from '../App';
import { toast } from 'react-toastify';

const Reviews = ({ token }) => {
  const [reviews, setReviews] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editComment, setEditComment] = useState('');
  const [editRating, setEditRating] = useState(5);

  const fetchReviews = async () => {
    try {
      const response = await axios.post(`${bakendUrl}/api/review/admin/list`, {}, { headers: { token } });
      if (response.data.success) {
        setReviews(response.data.reviews);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const startEdit = (review) => {
    setEditingId(review._id);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const saveEdit = async (reviewId) => {
    try {
      const response = await axios.post(`${bakendUrl}/api/review/admin/edit`, { reviewId, rating: editRating, comment: editComment }, { headers: { token } });
      if (response.data.success) {
        toast.success('Review updated');
        setEditingId(null);
        fetchReviews();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  const removeReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      const response = await axios.post(`${bakendUrl}/api/review/admin/delete`, { reviewId }, { headers: { token } });
      if (response.data.success) {
        toast.success('Review deleted');
        fetchReviews();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  return (
    <div>
      <h3 className='text-xl font-semibold mb-4'>Manage Reviews</h3>
      <div className='space-y-3'>
        {reviews.length === 0 ? (
          <p>No reviews found.</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className='border p-4 rounded bg-white'>
              <div className='flex justify-between gap-2 mb-2'>
                <p className='font-medium'>Product: {review.productId?.name || 'N/A'}</p>
                <p className='text-gray-500'>By: {review.userId?.name || 'Unknown'}</p>
              </div>
              <p className='text-sm text-gray-600 mb-2'>Rating: {review.rating}</p>
              {editingId === review._id ? (
                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <label className='text-sm'>Rating:</label>
                    <input type='number' min='1' max='5' value={editRating} onChange={(e) => setEditRating(Number(e.target.value))} className='border p-1 w-16' />
                  </div>
                  <textarea value={editComment} onChange={(e) => setEditComment(e.target.value)} className='w-full border p-2' rows={3} />
                  <div className='flex gap-2'>
                    <button onClick={() => saveEdit(review._id)} className='bg-green-500 text-white px-3 py-1 rounded'>Save</button>
                    <button onClick={() => setEditingId(null)} className='bg-gray-400 text-white px-3 py-1 rounded'>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className='mb-2'>{review.comment}</p>
                  <div className='flex gap-2'>
                    <button onClick={() => startEdit(review)} className='bg-blue-600 text-white px-3 py-1 rounded'>Edit</button>
                    <button onClick={() => removeReview(review._id)} className='bg-red-600 text-white px-3 py-1 rounded'>Delete</button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews;
