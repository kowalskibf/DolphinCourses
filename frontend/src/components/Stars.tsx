import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStar } from "@fortawesome/free-solid-svg-icons";
import "../styles/Stars.css";

interface StarsProps {
    value: number;
}

const Stars: React.FC<StarsProps> = ({ value }) => {
    const fullStars = Math.floor(value);
    const partialStarPercentage = (value - fullStars) * 100;
    const stars = Array.from({ length: 5 }, (_, index) => {
        if (index < fullStars) {
            return (
                <div key={index} className="star-wrapper">
                    <FontAwesomeIcon icon={faStar} className="star gold" />
                </div>
            );
        } else if (index === fullStars) {
            return (
                <div key={index} className="star-wrapper">
                    <div className="partial-star" style={{ width: `${partialStarPercentage}%` }}>
                        <FontAwesomeIcon icon={faStar} className="star gold" />
                    </div>
                    <FontAwesomeIcon icon={faStar} className="star gray" />
                </div>
            );
        } else {
            return (
                <div key={index} className="star-wrapper">
                    <FontAwesomeIcon icon={faStar} className="star gray" />
                </div>
            );
        }
    });

    return <div className="star-rating">{stars}</div>;
};

export default Stars;
