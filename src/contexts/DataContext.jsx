import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { cinemaAPI } from '../services/api';
import { format, addDays, isPast } from 'date-fns';

const DataContext = createContext(null);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  const [data, setData] = useState({
    halls: [],
    movies: [],
    seances: [],
    schedules: {}
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await cinemaAPI.getAllData();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Получение сеансов на выбранную дату
  const getSeancesForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return data.seances.filter(seance => {
      const seanceDate = format(new Date(seance.startTime), 'yyyy-MM-dd');
      return seanceDate === dateStr;
    });
  };

  // Получение открытых залов
  const getOpenHalls = () => {
    return data.halls.filter(hall => hall.isOpen);
  };

  // Получение активных сеансов (будущие + в открытых залах)
  const getActiveSeances = (date) => {
    const seances = getSeancesForDate(date);
    const openHalls = getOpenHalls();
    const openHallIds = openHalls.map(hall => hall.id);
    
    return seances.filter(seance => {
      const isHallOpen = openHallIds.includes(seance.hallId);
      const isFuture = !isPast(new Date(seance.startTime));
      return isHallOpen && isFuture;
    });
  };

  // Получение фильма по ID
  const getMovieById = (movieId) => {
    return data.movies.find(movie => movie.id === movieId);
  };

  // Получение зала по ID
  const getHallById = (hallId) => {
    return data.halls.find(hall => hall.id === hallId);
  };

  // Дата на неделю вперед
  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(new Date(), i));
    }
    return dates;
  };

  const value = {
    data,
    loading,
    error,
    selectedDate,
    setSelectedDate,
    loadData,
    getSeancesForDate,
    getActiveSeances,
    getOpenHalls,
    getMovieById,
    getHallById,
    getWeekDates,
    refreshData: loadData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};