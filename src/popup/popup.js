document.addEventListener('DOMContentLoaded', () => {

    const contrastSlider = document.getElementById('contrast');
    const contrastValue = document.getElementById('contrast-value');
    
    const saturationSlider = document.getElementById('saturation');
    const saturationValue = document.getElementById('saturation-value');

    function updateSliderLook(slider, valueDisplay) {
        const min = slider.min;
        const max = slider.max;
        const value = slider.value;
        
        valueDisplay.textContent = `${value}%`;
        
        const percentage = ((value - min) / (max - min)) * 100;
        
        slider.style.background = `linear-gradient(to right, #66d9ef ${percentage}%, #44475a ${percentage}%)`;
    }

    contrastSlider.addEventListener('input', () => {
        updateSliderLook(contrastSlider, contrastValue);
    });

    saturationSlider.addEventListener('input', () => {
        updateSliderLook(saturationSlider, saturationValue);
    });

    updateSliderLook(contrastSlider, contrastValue);
    updateSliderLook(saturationSlider, saturationValue);
});