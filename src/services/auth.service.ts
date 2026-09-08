import { connectToDatabase } from "@/lib/db/connection";
import { User, IUserDocument } from "@/models/User";
import { LoginCredentials, SetupOwnerInput, UserSession } from "@/types/auth.types";
import { createSessionCookie, deleteSessionCookie, getSession } from "@/lib/auth/session";

export class AuthService {
  /**
   * Checks if an owner account already exists in the system
   */
  static async isOwnerConfigured(): Promise<boolean> {
    await connectToDatabase();
    const ownerCount = await User.countDocuments({ role: "owner" });
    return ownerCount > 0;
  }

  /**
   * Sets up the initial single-owner account if none exists
   */
  static async setupInitialOwner(input: SetupOwnerInput): Promise<{ session: UserSession; token: string }> {
    await connectToDatabase();
    const existing = await User.findOne({ role: "owner" });
    if (existing) {
      throw new Error("Owner account is already configured. Please login.");
    }

    const newOwner = await User.create({
      name: input.name,
      email: input.email.toLowerCase().trim(),
      password: input.password,
      role: "owner",
      phone: input.phone,
      isActive: true,
      lastLogin: new Date(),
    });

    const session: UserSession = {
      userId: newOwner._id.toString(),
      email: newOwner.email,
      name: newOwner.name,
      role: "owner",
    };

    const token = await createSessionCookie(session);
    return { session, token };
  }

  /**
   * Authenticates the owner credentials and sets the session cookie
   */
  static async login(credentials: LoginCredentials): Promise<{ session: UserSession; token: string }> {
    await connectToDatabase();
    const user = (await User.findOne({
      email: credentials.email.toLowerCase().trim(),
      role: "owner",
    }).select("+password")) as IUserDocument | null;

    if (!user) {
      throw new Error("Invalid email or password.");
    }

    if (!user.isActive) {
      throw new Error("Owner account is deactivated.");
    }

    const isMatch = await user.comparePassword(credentials.password);
    if (!isMatch) {
      throw new Error("Invalid email or password.");
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const session: UserSession = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: "owner",
    };

    const token = await createSessionCookie(session);
    return { session, token };
  }

  /**
   * Logs out the owner by clearing the session cookie
   */
  static async logout(): Promise<void> {
    await deleteSessionCookie();
  }

  /**
   * Returns the current authenticated owner session
   */
  static async getCurrentOwner(): Promise<UserSession | null> {
    return getSession();
  }
}
