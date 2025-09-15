document.addEventListener('DOMContentLoaded', () => {

    const contrastSlider = document.getElementById('contrast');
    const contrastValue = document.getElementById('contrast-value');
    
    const saturationSlider = document.getElementById('saturation');
    const saturationValue = document.getElementById('saturation-value');

    const filterButtons = document.querySelectorAll('.filter-btn');
    const resetButton = document.querySelector('.reset-btn');
    const modeButtons = document.querySelectorAll('.mode-btn');
    console.log('Mode buttons found:', modeButtons);

    filterButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            gatherAndSendState();
        });
    });

    resetButton.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        contrastSlider.value = 50;
        saturationSlider.value = 50;
        updateSliderLook(contrastSlider, contrastValue);
        updateSliderLook(saturationSlider, saturationValue);
        gatherAndSendState();
});

    modeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            console.log('A mode button was clicked!');
            event.target.classList.toggle('active');
            gatherAndSendState();
        });
});

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
        gatherAndSendState();
    });

    saturationSlider.addEventListener('input', () => {
        updateSliderLook(saturationSlider, saturationValue);
        gatherAndSendState();
    });

    updateSliderLook(contrastSlider, contrastValue);
    updateSliderLook(saturationSlider, saturationValue);

    gatherAndSendState();

    function gatherAndSendState() {
        const activeFilter = document.querySelector('.filter-btn.active');

        const settings = {
            filter: activeFilter ? activeFilter.textContent : 'none',
            contrast: contrastSlider.value,
            saturation: saturationSlider.value,
            readingMode: document.getElementById('reading-mode').classList.contains('active'),
            nightVision: document.getElementById('night-vision').classList.contains('active')
        }
        console.log("state changed: ", settings);
    };
});