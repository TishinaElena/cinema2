// Моковый API для тестирования
export const cinemaAPI = {
  getAllData: async () => {
    // Имитируем задержку сети
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Возвращаем тестовые данные
    return {
      films: [
        {
          id: 1,
          title: "Аватар: Путь воды",
          description: "Джейк Салли и Нейтири создали семью, но им снова угрожает опасность.",
          duration: 192,
          genre: "Фантастика, Приключения",
          country: "США",
          ageRating: "12+",
          posterUrl: "https://via.placeholder.com/300x450?text=Аватар+2",
          film_name: "Аватар: Путь воды",
          film_description: "Джейк Салли и Нейтири создали семью, но им снова угрожает опасность.",
          film_duration: 192,
          film_origin: "США"
        },
        {
          id: 2,
          title: "Оппенгеймер",
          description: "История создания атомной бомбы глазами Роберта Оппенгеймера.",
          duration: 180,
          genre: "Биография, Драма",
          country: "США",
          ageRating: "16+",
          posterUrl: "https://via.placeholder.com/300x450?text=Оппенгеймер",
          film_name: "Оппенгеймер",
          film_description: "История создания атомной бомбы глазами Роберта Оппенгеймера.",
          film_duration: 180,
          film_origin: "США"
        },
        {
          id: 3,
          title: "Барби",
          description: "Барби и Кен отправляются в настоящее путешествие.",
          duration: 114,
          genre: "Комедия, Фэнтези",
          country: "США",
          ageRating: "12+",
          posterUrl: "https://via.placeholder.com/300x450?text=Барби",
          film_name: "Барби",
          film_description: "Барби и Кен отправляются в настоящее путешествие.",
          film_duration: 114,
          film_origin: "США"
        },
        {
          id: 4,
          title: "Джон Уик 4",
          description: "Джон Уик продолжает сражаться с Высоким столом.",
          duration: 169,
          genre: "Боевик, Триллер",
          country: "США",
          ageRating: "18+",
          posterUrl: "https://via.placeholder.com/300x450?text=Джон+Уик+4",
          film_name: "Джон Уик 4",
          film_description: "Джон Уик продолжает сражаться с Высоким столом.",
          film_duration: 169,
          film_origin: "США"
        }
      ],
      halls: [
        { 
          id: 1, 
          name: "Красный зал", 
          hall_name: "Красный зал",
          rows: 10, 
          cols: 15, 
          vipRows: [1, 2],
          hall_open: 1
        },
        { 
          id: 2, 
          name: "Синий зал", 
          hall_name: "Синий зал",
          rows: 8, 
          cols: 12, 
          vipRows: [1],
          hall_open: 1
        },
        { 
          id: 3, 
          name: "Зеленый зал", 
          hall_name: "Зеленый зал",
          rows: 12, 
          cols: 18, 
          vipRows: [1, 2, 3],
          hall_open: 0
        }
      ],
      seances: [
        { 
          id: 1, 
          movieId: 1, 
          hallId: 1, 
          startTime: '2024-01-15T12:00:00', 
          priceStandard: 400, 
          priceVip: 600,
          seance_filmid: 1,
          seance_hallid: 1,
          seance_time: '12:00'
        },
        { 
          id: 2, 
          movieId: 1, 
          hallId: 1, 
          startTime: '2024-01-15T15:30:00', 
          priceStandard: 450, 
          priceVip: 650,
          seance_filmid: 1,
          seance_hallid: 1,
          seance_time: '15:30'
        },
        { 
          id: 3, 
          movieId: 1, 
          hallId: 2, 
          startTime: '2024-01-15T14:00:00', 
          priceStandard: 350, 
          priceVip: 550,
          seance_filmid: 1,
          seance_hallid: 2,
          seance_time: '14:00'
        },
        { 
          id: 4, 
          movieId: 2, 
          hallId: 1, 
          startTime: '2024-01-15T18:00:00', 
          priceStandard: 500, 
          priceVip: 700,
          seance_filmid: 2,
          seance_hallid: 1,
          seance_time: '18:00'
        },
        { 
          id: 5, 
          movieId: 2, 
          hallId: 2, 
          startTime: '2024-01-15T20:30:00', 
          priceStandard: 400, 
          priceVip: 600,
          seance_filmid: 2,
          seance_hallid: 2,
          seance_time: '20:30'
        },
        { 
          id: 6, 
          movieId: 3, 
          hallId: 1, 
          startTime: '2024-01-15T11:00:00', 
          priceStandard: 300, 
          priceVip: 500,
          seance_filmid: 3,
          seance_hallid: 1,
          seance_time: '11:00'
        },
        { 
          id: 7, 
          movieId: 3, 
          hallId: 2, 
          startTime: '2024-01-15T16:00:00', 
          priceStandard: 350, 
          priceVip: 550,
          seance_filmid: 3,
          seance_hallid: 2,
          seance_time: '16:00'
        },
        { 
          id: 8, 
          movieId: 4, 
          hallId: 1, 
          startTime: '2024-01-15T19:00:00', 
          priceStandard: 450, 
          priceVip: 650,
          seance_filmid: 4,
          seance_hallid: 1,
          seance_time: '19:00'
        },
        { 
          id: 9, 
          movieId: 4, 
          hallId: 2, 
          startTime: '2024-01-15T22:00:00', 
          priceStandard: 500, 
          priceVip: 700,
          seance_filmid: 4,
          seance_hallid: 2,
          seance_time: '22:00'
        }
      ]
    };
  }
};