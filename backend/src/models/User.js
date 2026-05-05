const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  balance: { type: Number, default: 100000 },
  initialBalance: { type: Number, default: 100000 },
  avatar: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  preferences: {
    theme: { type: String, default: 'dark' },
    defaultInterval: { type: String, default: '1D' },
    notifications: { type: Boolean, default: true },
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
