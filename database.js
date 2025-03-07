const express=require("express");
const app=express();
const mongoose=require('mongoose');
const emailvalidator=require('email-validator');
const db_link='mongodb+srv://sakshimalde:7a4u5g14JdDJ3hYm@cluster0.hyyfr.mongodb.net/';
mongoose.connect(db_link)
.then(function(db){
    console.log(db);
    console.log('db connected');
   
})
.catch(function(err){
    console.log(err);
});
const tripSchema = mongoose.Schema({
    destination: { type: String, required: true },
    from: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    minBudget: { type: Number, required: true },
    maxBudget: { type: Number, required: true },
    tourists: { type: Number, required: true },
    activities: { type: [String], required: true },
    route: { type: String }
});

const userSchema=mongoose.Schema(
    {
        name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            validate:function(){
                return emailvalidator.validate(this.email);
            }
        },
        password:{
            type:String,
            required:true,
            minLength:8
        },
        confirmPassword:{
            type:String,
            required:true,
            minLength:8,
            validate:function(){
                return this.confirmPassword==this.password
            }
        },
        friends: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
            name: { type: String, required: true }
          }],
        username: { type: String},
        fullName: { type: String }, 
        location: { type: String },  
        bio: { type: String }, 
        profilePicture:{type: String},
        trips: [tripSchema] ,
    }
);

userSchema.pre('save',function(){
    this.confirmPassword=undefined;
})

const friendRequestSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    senderUsername: { type: String, required: true }, // Add sender's username
    recipientUsername: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
  }, { timestamps: true });
  
  const FriendRequest = mongoose.model('FriendRequest', friendRequestSchema);
  

const user=mongoose.model('User',userSchema)
module.exports = {user, FriendRequest};