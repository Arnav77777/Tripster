// profile.js

// Function to handle the file input change event
document.getElementById('profile-picture').addEventListener('change', function(event) {
    const file = event.target.files[0]; // Get the selected file
    if (file) {
        const reader = new FileReader(); // Create a FileReader object
        reader.onload = function(e) {
            document.getElementById('profile-image').src = e.target.result; // Set the image source to the file's data URL
        };
        reader.readAsDataURL(file); // Read the file as a data URL
    }
});

// Function to handle form submission
document.getElementById('edit-profile-form').addEventListener('submit', async function(event) {
    event.preventDefault(); // Prevent the default form submission

    // Create a FormData object to handle form data including file uploads
    const formData = new FormData();
    formData.append('fullName', document.getElementById('full-name').value);
    formData.append('username', document.getElementById('username').value);
    formData.append('location', document.getElementById('location').value);
    formData.append('bio', document.getElementById('bio').value);
    
    // Get the file from the input and append it to the FormData
    const fileInput = document.getElementById('profile-picture');
    if (fileInput.files.length > 0) {
        formData.append('profilePicture', fileInput.files[0]);
    }

    try {
        const response = await fetch('/api/update-profile', {
            method: 'POST',
            body: formData // Send the FormData object
        });

        if (response.ok) {
            const updatedUser  = await response.json();
            alert('Profile updated successfully!');
            console.log(updatedUser );
            // Optionally, update the UI with the new data
            // e.g., update the profile display with new values
        } else {
            const errorData = await response.json();
            alert('Error updating profile: ' + errorData.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while updating the profile.');
    }
});

// Function to fetch user details and populate the form
async function fetchUserDetails() {
    try {
        const response = await fetch('http://localhost:3000/api/user/profile'); // Adjust the API endpoint as necessary
        method: 'GET'
        console.log(response)
        if (response.ok) {
            const userDetails = await response.json();
            
            // Populate the form fields with the fetched data
            document.getElementById('full-name').value = userDetails.fullName || '';
            document.getElementById('username').value = userDetails.username || '';
            document.getElementById('location').value = userDetails.location || '';
            document.getElementById('bio').value = userDetails.bio || '';
            
            // If a profile picture URL is provided, set it as the image source
            if (userDetails.profilePicture) {
                document.getElementById('profile-image').src = userDetails.profilePicture;
            }
        } else {
            console.error('Failed to fetch user details:', response.statusText);
            alert('Error fetching user details: ' + response.statusText);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while fetching user details.');
    }
}

// Call the function to fetch user details when the page loads
document.addEventListener('DOMContentLoaded', fetchUserDetails);