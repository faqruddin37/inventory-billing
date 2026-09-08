import mongoose, { Connection } from "mongoose";

interface MongooseCache {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export class DatabaseError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 503) {
    super(message);
    this.name = "DatabaseError";
    this.statusCode = statusCode;
  }
}

/**
 * Connects to MongoDB with connection caching to avoid multiple connections across Next.js API reloads.
 * Reads MONGODB_URI and DATABASE_NAME strictly from environment variables.
 */
export async function connectToDatabase(): Promise<Connection> {
  let uri = process.env.MONGODB_URI;
  const dbName = process.env.DATABASE_NAME;

  if (!uri || uri === "YOUR_MONGODB_URI" || uri.trim() === "") {
    throw new DatabaseError(
      "MONGODB_URI environment variable is not configured. Please set a valid MongoDB connection string in .env.local.",
      500
    );
  }

  // Sanitize URI if password contains unencoded '@' characters
  if (uri.startsWith("mongodb+srv://") || uri.startsWith("mongodb://")) {
    const protocol = uri.startsWith("mongodb+srv://") ? "mongodb+srv://" : "mongodb://";
    const rest = uri.slice(protocol.length);
    const lastAtIdx = rest.lastIndexOf("@");
    if (lastAtIdx !== -1) {
      const userinfo = rest.slice(0, lastAtIdx);
      const hostPart = rest.slice(lastAtIdx + 1);
      const firstColon = userinfo.indexOf(":");
      if (firstColon !== -1) {
        const username = userinfo.slice(0, firstColon);
        const rawPassword = userinfo.slice(firstColon + 1);
        if (rawPassword.includes("@") && !rawPassword.includes("%40")) {
          const encodedPassword = encodeURIComponent(decodeURIComponent(rawPassword));
          uri = `${protocol}${username}:${encodedPassword}@${hostPart}`;
        }
      }
    }
  }

  if (cached.conn) {
    // 1 = connected, 2 = connecting
    if (cached.conn.readyState === 1) {
      return cached.conn;
    }
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      ...(dbName && dbName !== "YOUR_DATABASE_NAME" ? { dbName } : {}),
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((m) => {
        return m.connection;
      })
      .catch((err: Error) => {
        cached.promise = null;
        console.error("MongoDB Connection Error:", err.message);
        throw new DatabaseError(
          `Unable to connect to MongoDB: ${err.message}. Ensure your MongoDB service is running and accessible.`,
          503
        );
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    if (e instanceof DatabaseError) {
      throw e;
    }
    throw new DatabaseError(
      `MongoDB connection failed: ${e instanceof Error ? e.message : "Unknown database error"}`,
      503
    );
  }
}

/**
 * Helper to check current MongoDB connection status
 */
export function getDbConnectionStatus(): {
  isConnected: boolean;
  statusText: string;
  readyState: number;
} {
  const state = mongoose.connection.readyState;
  const states: Record<number, string> = {
    0: "Disconnected",
    1: "Connected",
    2: "Connecting",
    3: "Disconnecting",
    99: "Uninitialized",
  };

  return {
    isConnected: state === 1,
    statusText: states[state] || "Unknown",
    readyState: state,
  };
}
