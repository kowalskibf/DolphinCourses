import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import "../styles/StarsInput.css";

interface StarsInputProps {
  onRatingChange: (rating: number) => void;
  initialRating?: number;
}

const StarsInput: React.FC<StarsInputProps> = ({ onRatingChange, initialRating = 0 }) => {
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [currentRating, setCurrentRating] = useState<number>(initialRating);

  const handleMouseEnter = (index: number) => {
    setHoveredRating(index + 1);
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  const handleClick = (index: number) => {
    setCurrentRating(index + 1);
    onRatingChange(index + 1);
  };

  const stars = Array.from({ length: 5 }, (_, index) => {
    const isFilled = index + 1 <= (hoveredRating || currentRating);
    const isGray = hoveredRating > 0 && index + 1 > hoveredRating;

    return (
      <div
        key={index}
        className="star-wrapper"
        onMouseEnter={() => handleMouseEnter(index)}
        onMouseLeave={handleMouseLeave}
        onClick={() => handleClick(index)}
      >
        <FontAwesomeIcon
          icon={faStar}
          className={`star ${isFilled && !isGray ? "gold" : "gray"}`}
        />
      </div>
    );
  });

  return <div className="star-rating">{stars}</div>;
};

export default StarsInput;
