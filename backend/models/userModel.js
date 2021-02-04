import mongoose from "mongoose";
import beautiflyUnique from "mongoose-beautiful-unique-validation";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: "username is already taken" },
    email: { type: String, required: true, unique: "email is already taken" },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false, required: true },
    isSeller: { type: Boolean, default: false, required: true },
    seller: {
      name: String,
      logo: String,
      description: String,
      rating: { type: Number, default: 0, required: true },
      numReviews: { type: Number, default: 0, required: true },
    },
    resetPasswordToken: String,
    resetPasswordExpires: String,
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(beautiflyUnique);

const User = mongoose.model("User", userSchema);
export default User;
