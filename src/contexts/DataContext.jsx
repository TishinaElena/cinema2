import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { cinemaAPI } from '../services/api';

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
    films: [],
    halls: [],
    seances: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await cinemaAPI.getAllData();
      setData({
        films: result.films || [],
        halls: result.halls || [],
        seances: result.seances || []
      });
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

  // Упрощенные методы для работы с данными
  const getOpenHalls = () => {
    return data.halls.filter(hall => hall.hall_open === 1);
  };

  const getFilmById = (filmId) => {
    return data.films.find(film => film.id === filmId);
  };

  const getHallById = (hallId) => {
    return data.halls.find(hall => hall.id === hallId);
  };

  const value = {
    ...data, // films, halls, seances доступны напрямую
    loading,
    error,
    selectedDate,
    setSelectedDate,
    loadData,
    getOpenHalls,
    getFilmById,
    getHallById,
    refreshData: loadData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};