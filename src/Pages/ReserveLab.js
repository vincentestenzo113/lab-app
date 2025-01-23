import React, { useState } from 'react';
import { supabase } from '../Pages/supabaseClient';

const ReserveLab = () => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleReservation = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('reservations')
      .insert([{ date, start_time: startTime, end_time: endTime }]);
    if (error) console.error('Error making reservation:', error.message);
    else console.log('Reservation made:', data);
  };

  return (
    <form onSubmit={handleReservation}>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <input
        type="time"
        value={startTime}
        onChange={(e) => setStartTime(e.target.value)}
      />
      <input
        type="time"
        value={endTime}
        onChange={(e) => setEndTime(e.target.value)}
      />
      <button type="submit">Reserve</button>
    </form>
  );
};

export default ReserveLab;
