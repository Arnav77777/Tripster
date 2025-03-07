// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const {user, FriendRequest} = require('./database');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const jwt = require('jsonwebtoken');// Store files in memory; you might want to adjust this
const app = express();
const bodyParser = require('body-parser');
const { parseISO, isWithinInterval } = require('date-fns');
const PORT = 3000;
// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Specify the uploads directory
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Append timestamp to the filename
    }
});
const upload = multer({ storage: storage });
// const jwtSecret = '12345678910';
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors({
    origin: 'http://127.0.0.1:5500' // Adjust this to your frontend's URL
}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));
// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.get('/signup', (req, res) => {
    // Handle the signup request here
    res.send('Signup page');
});
app.get(`/loginpage`, (req, res) => {
    res.sendFile('login.html', { root: __dirname });
});



// Route for handling signup
app.post('/signup', async (req, res) => {
    const { name, email, password, confirmPassword} = req.body;
    const newUser = new user({
        name,
        email,
        password,
        confirmPassword
    });

    try {
        await newUser.save();
        return res.redirect(`http://localhost:3000/loginpage`);
        // res.status(201).send('User  created successfully!');
    } catch (error) {
        if (error.code === 11000) {
            console.error(error.stack)
            return res.status(400).send('Email already exists.');
        }
        res.status(500).send('Error creating user: ' + error.message);
    }
});



app.post('/login', async (req, res) => {
    try {
        const data = req.body;
        let User = await user.findOne({ email: data.email });

        if (User) {
            if (User.password == data.password) {
                app.get(`/dashboard/${User._id}`, (req, res) => {
                    res.sendFile('dashboard.html', { root: __dirname });
                });
                req.session.userId = User._id;
                console.log(req.session.userId)
                return res.redirect(`http://localhost:3000/dashboard/${User._id}`);
            }
            else {
                return res.json({
                    message: 'wrong credentials'
                })
            }
        }
        else {
            return res.json({
                message: 'user not found'
            })
        }
    }
    catch (err) {
        return res.json({
            message: err.message
        })

    }
})
app.post('/api/update-profile', upload.single('profilePicture'), async (req, res) => {
    const { fullName, username, location, bio, profilePicture } = req.body;
    const userId = req.session.userId;
    console.log(req.file)

    if (!userId) {
        return res.status(401).json({ message: 'User  not authenticated' });
    }

    try {
        const updatedUser = await user.findByIdAndUpdate(userId, {
            fullName,
            username,
            location,
            bio,
            profilePicture:req.file.path,
        }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: 'User  not found' });
        }


        res.status(200).json({
            message: "user updated"
        });
    } catch (error) {
        console.error('Error updating profile', error.message); // Log the error message
        console.error(error.stack); // Log the stack trace for more context
        res.status(400).json({ message: 'Error updating profile', error: error.message });
    }

});

app.get('/api/user/profile', async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ message: 'User  not authenticated' });
    }

    try {
        const userData = await user.findById(userId).select('fullName username location bio profilePicture'); // Select only the fields you need

        if (!userData) {
            return res.status(404).json({ message: 'User  not found' });
        }

        res.status(200).json(userData);
    } catch (error) {
        console.error('Error fetching user profile:', error.message);
        res.status(400).json({ message: 'Error fetching user profile', error: error.message });
    }
});

app.post('/api/user/trip', async (req, res) => {
    const userId = req.session.userId;
    const tripData = req.body;

    try {

        if (!userId) {
            return res.status(401).json({ message: 'User  not authenticated' });
        }
        console.log('Trip Data:', tripData);
        // Use findByIdAndUpdate with $push to add the tripData to the trips array
        const usertrip = await user.findByIdAndUpdate(
            userId,
            { $push: { trips: tripData } }, // Push the new trip data
            { new: true }
        );

        // Check if the user was found
        if (!usertrip) {
            return res.status(404).json({ message: 'User  not found' });
        }

        // Respond with the updated user data (optional)
        // res.status(201).json(usertrip.trips);
        res.redirect("http://localhost:3000/trips.html")
    } catch (error) {
        console.error('Error adding trip details:', error.message);
        console.error(error.stack);
        res.status(400).json({ message: 'Error adding trip details', error: error.message });
    }
});

app.get('/api/user/trip', async (req, res) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ message: 'User  not authenticated' });
    }

    try {
        const userData = await user.findById(userId);
        if (!userData || !userData.trips) {
            return res.status(404).json({ message: 'No trips found for this user' });
        }
        app.get(`/trips`, (req, res) => {
            res.sendFile('trips.html', { root: __dirname });
        });
        res.status(200).json(userData.trips);


    } catch (error) {
        console.error('Error fetching trips:', error.message);
        res.status(400).json({ message: 'Error fetching trips', error: error.message });
    }
});

app.get('/api/user/getalltrips', async (req, res) => {
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: 'User  not authenticated' });
    }
    try {
        // Find all users except the logged-in user
        const users = await user.find({ _id: { $ne: userId } }).populate('trips');

        // // Extract trips from each user
        // const trips = users.map(user => ({
        //     userId: user._id,
        //     userName: user.name, // or whichever field you want to show
        //     trips: user.trips
        // }));

        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching all trips:', error.message);
        res.status(400).json({ message: 'Error fetching all trips', error: error.message });
    }
});
app.get(`/match`, (req, res) => {
    res.sendFile('match.html', { root:path.join(__dirname) });
});
// Modified find-matches endpoint
app.post('/find-matches', async (req, res) => {
    const currentTrip = req.body;
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: 'User  not authenticated' });
    }

    if (!currentTrip) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        // Fetch all users except the logged-in user
        const targetUsers = await user.find({ _id: { $ne: userId } }).populate('trips');
        const matches = findMatches(currentTrip, targetUsers);
        return res.json({matches});
        // return res.redirect("/match")
    } catch (error) {
        console.error('Error fetching matches:', error.message);
        console.error(error.stack);
        return res.status(500).json({ error: 'Error fetching matches' });
    }
});
app.get('/find-matches', async (req, res) => {
    const currentTrip = req.body;
    const userId = req.session.userId;
    if (!userId) {
        return res.status(401).json({ message: 'User  not authenticated' });
    }

    if (!currentTrip) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    try {
        // Fetch all users except the logged-in user
        const targetUsers = await user.find({ _id: { $ne: userId } }).populate('trips');
        const matches = findMatches(currentTrip, targetUsers);
        return res.json({matches});
        
    } catch (error) {
        console.error('Error fetching matches:', error.message);
        console.error(error.stack);
        return res.status(500).json({ error: 'Error fetching matches' });
    }
});



// Matchmaking function
function findMatches(currentTrip, targetUsers, daysTolerance = 3) {
    const matches = [];

    targetUsers.forEach(targetUser => {
         // Initialize score for each user
            // Check each field and increment score based on matches
            targetUser.trips.forEach(targetTrip => {
                let score = 0;
                const targetStartDate = targetTrip.startDate instanceof Date 
                ? targetTrip.startDate.toISOString() 
                : targetTrip.startDate; 
                if (!currentTrip.currentTrip.startDate || !targetStartDate){
                    console.log('Skipping due to undefined dates:', currentTrip.startDate, targetTrip.startDate);

                    return; } // Skip if dates are undefined
                // Check each field and increment score based on matches
                
                if (isDateNearby(currentTrip.currentTrip.startDate,targetStartDate, daysTolerance)) {
                    score += 1; // Increment score for date match
                    console.log(`Date match found. Score: ${score}`);
                }
                // Add similar checks for other properties like destination and activities
           
            if (isDestinationMatch(currentTrip.currentTrip.destination, targetTrip.destination)) {
                score += 1; // Increment score for destination match
                console.log(`Destination match found. Score: ${score}`);
            }
            if (isActivityInterest(currentTrip.currentTrip.activities, targetTrip.activities)) {
                score += 1; // Increment score for activity interest
                console.log(`Activity interest match found. Score: ${score}`);
            }
            if (isBudgetCompatible(currentTrip.currentTrip.minBudget, targetTrip.minBudget)) {
                score += 1; // Increment score for budget compatibility
                console.log(`Budget compatibility match found. Score: ${score}`);
            }
            if (score > 0) {
                let userExists = false;
            
                // Check if targetUser  is already in matches
                for (let i = 0; i < matches.length; i++) {
                    if (matches[i].user === targetUser ) {
                        userExists = true;
            
                        // Update the score if the current score is higher
                        if (matches[i].score < score) {
                            matches[i].score = score; // Update the score
                            
                        }
                        break; // Exit the loop since we found the user
                    }
                }
            
                // If the user does not exist, add them to matches
                if (!userExists) {
                    matches.push({ user: targetUser , score });
                }
            }
            // if (score > 0) {
            //     if(targetUser!= matches.user)
            //     matches.push({ user: targetUser, score });
            //     console.log(`User  ${targetUser ._id} added to matches with score: ${score}`);
            // }
        });

        // Only add users with a score greater than 0
    });

    // Sort matches in descending order based on score
    matches.sort((a, b) => b.score - a.score);
    console.log(`Final matches: ${JSON.stringify(matches)}`);
    return matches;
}

function isDateNearby(date1, date2, daysTolerance) {
    console.log('Date1:', date1, 'Type:', typeof date1);
    console.log('Date2:', date2, 'Type:', typeof date2);
    if (!date1 || !date2) return false; // Ensure both dates are defined

    const date1Obj = parseISO(date1 || '1970-01-01');
    const date2Obj = parseISO(date2 || '1970-01-01');
    return isWithinInterval(date1Obj, {
        start: date2Obj - daysTolerance * 24 * 60 * 60 * 1000,
        end: date2Obj + daysTolerance * 24 * 60 * 60 * 1000
    });
}

function isDestinationMatch(dest1, dest2) {
    return dest1.toLowerCase() === dest2.toLowerCase();
}

function isActivityInterest(activities1, activities2) {
    return activities1.some(activity => activities2.includes(activity));
}

function isBudgetCompatible(budget1, budget2) {
    return Math.abs(budget1 - budget2) <= 100; // Example threshold
}

app.post('/send-request', async (req, res) => {
    const senderId = req.session.userId;
    try {
      const {recipientId,receivername} = req.body;
      const sender = await user.findById(senderId);
        if (!sender) {
            return res.status(404).json({ message: 'Sender not found' });
        }

        // Create a new friend request
        const newRequest = new FriendRequest({
            sender: senderId,
            recipient: recipientId,
            senderUsername: sender.username,
            recipientUsername: receivername // Use the sender's username
        });
      await newRequest.save();
      res.status(201).json({ message: 'Friend request sent' });
    } catch (error) {
        console.error(error.stack)
      res.status(500).json({ message: 'Error sending friend request' });
    }
  });
  // Get friend requests for a user
  app.get('/requests', async (req, res) => {
    const sendId = req.session.userId;
    console.log("userid",sendId)
    if (!mongoose.Types.ObjectId.isValid(sendId)) {
        console.log("invalid")
        return res.status(400).json({ message: 'Invalid user ID format' });
    }

    try {
      const requests = await FriendRequest.find({ recipient: sendId, status: 'pending' })
    console.log(requests)
      res.json(requests);
      
    } catch (error) {
        console.error(error.stack)
      res.status(500).json({ message: 'Error fetching friend requests' });
    }
  });
  
  // Accept a friend request
  app.post('/accept-request', async (req, res) => {
    const userid = req.session.userId;
    try {
      const { requestId} = req.body;
      const request = await FriendRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ message: 'Request not found' });
      }
      request.status = 'accepted';
      await request.save();
      // Find the sender and recipient users
    const sender = await user.findById(request.sender); // Find sender by ID
    const recipient = await user.findById(request.recipient); // Find recipient by ID
      console.log(recipient.username)
    if (!sender || !recipient) {
      return res.status(404).json({ message: 'User  not found' }); // Handle case where users are not found
    }
      await user.findByIdAndUpdate(request.sender, { $addToSet: { friends: {userId: recipient._id,name: recipient.name} } });
      await user.findByIdAndUpdate(request.recipient, { $addToSet: { friends: {userId: sender._id,name: sender.name} } });
      res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error(error.stack)
      res.status(500).json({ message: 'Error accepting friend request' });
    }
  });
  
  // Reject a friend request
  app.post('/reject-request', async (req, res) => {
    try {
      const { requestId } = req.body;
      await FriendRequest.findByIdAndUpdate(requestId, { status: 'rejected' });
      res.json({ message: 'Friend request rejected' });
    } catch (error) {
      res.status(500).json({ message: 'Error rejecting friend request' });
    }
  });

  // Route to get friends of a user
app.get('/friends', async (req, res) => {
    const userId = req.session.userId; // Get userId from request parameters

    try {
        // Find the user by ID and populate the friends field
        const userWithFriends = await user.findById(userId).populate('friends', 'username');

        if (!userWithFriends) {
            return res.status(404).json({ message: 'User  not found' });
        }

        // Send the list of friends
        res.status(200).json(userWithFriends.friends);
    } catch (error) {
        console.error('Error fetching friends:', error.message);
        res.status(500).json({ message: 'Error fetching friends', error: error.message });
    }
});
  
  // Disconnect a friend
  app.post('/disconnect', async (req, res) => {
    const userId = req.session.userId;
    try {
      const friendId= req.body;
      await user.findByIdAndUpdate(userId, { $pull: { friends: friendId } });
      await user.findByIdAndUpdate(friendId, { $pull: { friends: userId } });
      res.json({ message: 'Friend disconnected' });
    } catch (error) {
      res.status(500).json({ message: 'Error disconnecting friend' });
    }
  });
  


// Start the server
app.listen(3000, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});