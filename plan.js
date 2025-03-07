// JavaScript to update budget display in real-time
const minBudgetSlider = document.getElementById('min-budget');
const maxBudgetSlider = document.getElementById('max-budget');
const minValueDisplay = document.getElementById('min-value');
const maxValueDisplay = document.getElementById('max-value');

// Function to update budget display
function updateBudgetDisplay() {
    const minValue = parseInt(minBudgetSlider.value);
    const maxValue = parseInt(maxBudgetSlider.value);

    if (minValue > maxValue) {
        minBudgetSlider.value = maxValue;  // Prevent min budget from exceeding max budget
    }

    minValueDisplay.textContent = minBudgetSlider.value.toLocaleString();
    maxValueDisplay.textContent = maxBudgetSlider.value.toLocaleString();
}


minBudgetSlider.addEventListener('input', updateBudgetDisplay);
maxBudgetSlider.addEventListener('input', updateBudgetDisplay);

document.getElementById('trip-form').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const tripData = {
        destination: document.getElementById('destination').value,
        from: document.getElementById('from').value,
        startDate: new Date(document.getElementById('start-date').value),
        endDate: new Date(document.getElementById('end-date').value),
        minBudget: parseFloat(document.getElementById('min-budgett').value),
        maxBudget: parseFloat(document.getElementById('max-budget').value),
        tourists: parseInt(document.getElementById('tourists').value),
        activities: document.getElementById('activities').value.split(',') 
    };
     console.log(tripData)
 
    try {
        const response = await fetch('/api/user/trip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(tripData)
        });
       

        if (response.ok) {
            const result = await response.json();
            console.log('Trip added successfully:', result,tripData);
            
        } else {
            const error = await response.json();
            console.log(response)
            console.error('Error adding trip:', error);
            
        }
    } catch (error) {
        console.error('Network error:', error);
    }
});

