import React from 'react';

interface ProgressBarProps {
    value: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value }) => {
    const getColor = (value: number) => {
        if (value < 0.2) return 'red';
        if (value < 0.4) return '#ff8000';
        if (value < 0.6) return '#3399ff';
        if (value < 0.8) return '#03fc98';
        return '#03fc31';
    };

    const progressBarStyle = {
        width: `${value * 100}%`,
        height: '20px',
        backgroundColor: getColor(value),
        borderRadius: '10px',
        transition: 'width 0.5s ease-in-out',
    };

    return (
        <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '10px' }}>
            <div style={progressBarStyle}></div>
        </div>
    );
};

export default ProgressBar;
