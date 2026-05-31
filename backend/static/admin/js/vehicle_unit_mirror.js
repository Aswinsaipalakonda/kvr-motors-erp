document.addEventListener('DOMContentLoaded', function() {
    const vinInput = document.getElementById('id_vin_number');
    const motorInput = document.getElementById('id_motor_number');

    if (vinInput && motorInput) {
        vinInput.addEventListener('input', function() {
            if (motorInput.value !== vinInput.value) {
                motorInput.value = vinInput.value;
            }
        });

        motorInput.addEventListener('input', function() {
            if (vinInput.value !== motorInput.value) {
                vinInput.value = motorInput.value;
            }
        });
    }
});
