import mongoose from 'mongoose';

const OrganizationSchema = new mongoose.Schema({
 name:{
     type: String,
     required: true,
     unique: true,
     minlength: 3,
     maxlength: 50
 },
 type:{
     type: String,
     enum: ['corporate', 'education'],
     required: true
 }
})
export const Organization = mongoose.model('Organization', OrganizationSchema)