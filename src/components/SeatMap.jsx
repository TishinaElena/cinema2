import React from 'react';
import './SeatMap.css';

const SeatMap = ({ 
  rows = 10, 
  cols = 15, 
  vipRows = [], 
  takenSeats = [], 
  selectedSeats = [], 
  onSeatSelect 
}) => {
  
  const handleSeatClick = (seatId) => {
    if (onSeatSelect) {
      onSeatSelect(seatId);
    }
  };

  // Определяем тип места
  const getSeatType = (seatId) => {
    const row = Math.floor((seatId - 1) / cols) + 1;
    const col = ((seatId - 1) % cols) + 1;
    
    const isVip = vipRows.includes(row);
    const isTaken = takenSeats.includes(seatId);
    const isSelected = selectedSeats.includes(seatId);
    
    if (isTaken) return 'taken';
    if (isSelected) return 'selected';
    if (isVip) return 'vip';
    return 'standard';
  };

  // Создаем сетку мест
  const renderSeats = () => {
    const seats = [];
    
    for (let row = 1; row <= rows; row++) {
      const rowSeats = [];
      
      // Добавляем номер ряда слева
      rowSeats.push(
        <div key={`row-label-${row}`} className="row-label">
          {row}
        </div>
      );
      
      for (let col = 1; col <= cols; col++) {
        const seatId = (row - 1) * cols + col;
        const seatType = getSeatType(seatId);
        const isClickable = seatType !== 'taken';
        
        rowSeats.push(
          <button
            key={`seat-${row}-${col}`}
            className={`seat seat-${seatType} ${!isClickable ? 'seat-disabled' : ''}`}
            onClick={() => isClickable && handleSeatClick(seatId)}
            disabled={!isClickable}
            title={`Ряд ${row}, Место ${col}`}
          >
            {col}
          </button>
        );
      }
      
      seats.push(
        <div key={`row-${row}`} className="seat-row">
          {rowSeats}
        </div>
      );
    }
    
    return seats;
  };

  // Рендерим номера мест (шапка)
  const renderSeatNumbers = () => {
    const numbers = [<div key="row-label-empty" className="row-label"></div>];
    
    for (let col = 1; col <= cols; col++) {
      numbers.push(
        <div key={`col-label-${col}`} className="col-label">
          {col}
        </div>
      );
    }
    
    return <div className="seat-row seat-numbers">{numbers}</div>;
  };

  return (
    <div className="seat-map-container">
      <div className="screen-label">ЭКРАН</div>
      <div className="screen"></div>
      
      <div className="seat-map">
        {renderSeatNumbers()}
        {renderSeats()}
      </div>
      
      <div className="seat-legend">
        <div className="legend-item">
          <div className="seat-legend-icon seat-standard"></div>
          <span>Стандарт</span>
        </div>
        <div className="legend-item">
          <div className="seat-legend-icon seat-vip"></div>
          <span>VIP</span>
        </div>
        <div className="legend-item">
          <div className="seat-legend-icon seat-taken"></div>
          <span>Занято</span>
        </div>
        <div className="legend-item">
          <div className="seat-legend-icon seat-selected"></div>
          <span>Выбрано</span>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;