import React from 'react';
import './FacilityCard.css';

const FacilityCard = ({ name, image, selected, onClick }) => {
  return (
    <div
      className={`facility-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <img src={image} alt={name} />
      <p>{name}</p>
    </div>
  );
};

export default FacilityCard;
