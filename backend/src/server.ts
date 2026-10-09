import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(cors());
app.use(express.json());

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type Role = 'user' | 'admin';

interface User {
  id: number;
  userId: string;
  password: string;
  name: string;
  email: string;
  role: Role;
}

interface RecordItem {
  id: number;
  userId: string;
  title: string;
  category: string;
  status: string;
}

interface AuthenticatedRequest extends Request {
  authenticatedUser?: User;
}

// --------------------------------------------------
// MONGODB USER MODEL
// --------------------------------------------------

const userSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true
    },
    userId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      required: true
    }
  },
  {
    timestamps: true
  }
);

const UserModel = mongoose.model('User', userSchema);

// --------------------------------------------------
// LEGACY JSON DATA MIGRATION
// Existing users.json is imported only when the
// MongoDB users collection is empty.
// --------------------------------------------------

const dataDirectory = path.join(__dirname, '..', 'data');
const usersFilePath = path.join(dataDirectory, 'users.json');

async function migrateExistingUsers(): Promise<void> {
  const existingCount = await UserModel.countDocuments();

  if (existingCount > 0) {
    console.log(
      `MongoDB already contains ${existingCount} users. Migration skipped.`
    );
    return;
  }

  if (fs.existsSync(usersFilePath)) {
    const fileContent = fs.readFileSync(usersFilePath, 'utf8');
    const savedUsers = JSON.parse(fileContent);

    if (!Array.isArray(savedUsers)) {
      throw new Error('users.json must contain a JSON array.');
    }

    if (savedUsers.length > 0) {
      await UserModel.insertMany(savedUsers);

      console.log(
        `Successfully migrated ${savedUsers.length} users from users.json.`
      );

      return;
    }
  }

  // Default demo users are created only when both
  // MongoDB and the legacy JSON file contain no users.

  const demoUsers: User[] = [
    {
      id: 1,
      userId: 'user001',
      password: 'User@123',
      name: 'Arun Kumar',
      email: 'arun@example.com',
      role: 'user'
    },
    {
      id: 2,
      userId: 'user002',
      password: 'User@123',
      name: 'Priya Sharma',
      email: 'priya@example.com',
      role: 'user'
    },
    {
      id: 3,
      userId: 'admin001',
      password: 'Admin@123',
      name: 'Manoj Admin',
      email: 'admin@example.com',
      role: 'admin'
    }
  ];

  await UserModel.insertMany(demoUsers);

  console.log('Default demo users inserted into MongoDB.');
}

// --------------------------------------------------
// HELPER: CONVERT MONGODB DOCUMENT TO USER
// --------------------------------------------------

function toUser(document: any): User {
  return {
    id: document.id,
    userId: document.userId,
    password: document.password,
    name: document.name,
    email: document.email,
    role: document.role
  };
}

function safeUser(user: User) {
  const { password: ignoredPassword, ...result } = user;
  return result;
}

// --------------------------------------------------
// DEMO RECORDS
// Records remain in memory in this assignment version.
// --------------------------------------------------

const records: RecordItem[] = [
  {
    id: 101,
    userId: 'user001',
    title: 'Identity Verification',
    category: 'Identity',
    status: 'Completed'
  },
  {
    id: 102,
    userId: 'user001',
    title: 'Address Verification',
    category: 'Address',
    status: 'In Progress'
  },
  {
    id: 103,
    userId: 'user002',
    title: 'Employment Verification',
    category: 'Employment',
    status: 'Completed'
  },
  {
    id: 104,
    userId: 'user002',
    title: 'Education Verification',
    category: 'Education',
    status: 'Pending'
  }
];

// --------------------------------------------------
// DEMO SESSIONS
// Sessions are cleared when the backend restarts.
// --------------------------------------------------

const sessions = new Map<string, number>();

// --------------------------------------------------
// API DELAY
// Example: ?delayMs=1500
// Maximum delay: 3000 ms
// --------------------------------------------------

function delayResponse(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestedDelay = Number(req.query.delayMs ?? 0);

  const delayMs = Number.isFinite(requestedDelay)
    ? Math.min(Math.max(requestedDelay, 0), 3000)
    : 0;

  setTimeout(() => next(), delayMs);
}

// --------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// --------------------------------------------------

async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    const token = authorization.substring(7);
    const userId = sessions.get(token);

    if (userId === undefined) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired session.'
      });
      return;
    }

    const document = await UserModel.findOne({ id: userId });

    if (!document) {
      sessions.delete(token);

      res.status(401).json({
        success: false,
        message: 'User account not found.'
      });
      return;
    }

    req.authenticatedUser = toUser(document);

    next();
  } catch (error) {
    next(error);
  }
}

// --------------------------------------------------
// ADMIN AUTHORIZATION
// --------------------------------------------------

function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.authenticatedUser?.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
    return;
  }

  next();
}

// --------------------------------------------------
// HEALTH CHECK
// GET /api/health
// --------------------------------------------------

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'MPloyChek backend is running!',
    database: mongoose.connection.readyState === 1
      ? 'connected'
      : 'disconnected'
  });
});

// --------------------------------------------------
// LOGIN
// POST /api/login?delayMs=1000
// --------------------------------------------------

app.post(
  '/api/login',
  delayResponse,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, password, role } = req.body;

      if (
        typeof userId !== 'string' ||
        typeof password !== 'string' ||
        !['user', 'admin'].includes(role)
      ) {
        res.status(400).json({
          success: false,
          message: 'User ID, password and valid role are required.'
        });
        return;
      }

      const document = await UserModel.findOne({
        userId: userId.trim(),
        password,
        role
      });

      if (!document) {
        res.status(401).json({
          success: false,
          message: 'Invalid credentials or selected role.'
        });
        return;
      }

      const user = toUser(document);
      const token = randomBytes(32).toString('hex');

      sessions.set(token, user.id);

      res.json({
        success: true,
        message: 'Login successful.',
        token,
        user: safeUser(user)
      });
    } catch (error) {
      next(error);
    }
  }
);

// --------------------------------------------------
// LOGOUT
// POST /api/logout
// --------------------------------------------------

app.post(
  '/api/logout',
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {
    const authorization = req.headers.authorization!;

    const token = authorization.substring(7);

    sessions.delete(token);

    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  }
);

// --------------------------------------------------
// PROFILE
// GET /api/profile?delayMs=1000
// --------------------------------------------------

app.get(
  '/api/profile',
  authenticate,
  delayResponse,
  (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      user: safeUser(req.authenticatedUser!)
    });
  }
);

// --------------------------------------------------
// RECORDS
// GET /api/records?delayMs=1500
// Admin sees all records.
// General users see only their own records.
// --------------------------------------------------

app.get(
  '/api/records',
  authenticate,
  delayResponse,
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.authenticatedUser!;

    const accessibleRecords =
      user.role === 'admin'
        ? records
        : records.filter(
            record => record.userId === user.userId
          );

    res.json({
      success: true,
      total: accessibleRecords.length,
      records: accessibleRecords
    });
  }
);

// --------------------------------------------------
// ADMIN: LIST USERS
// GET /api/users?delayMs=1000
// --------------------------------------------------

app.get(
  '/api/users',
  authenticate,
  requireAdmin,
  delayResponse,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documents = await UserModel.find().sort({ id: 1 });

      const users = documents.map(document =>
        safeUser(toUser(document))
      );

      res.json({
        success: true,
        total: users.length,
        users
      });
    } catch (error) {
      next(error);
    }
  }
);

// --------------------------------------------------
// ADMIN: CREATE USER
// POST /api/users
// --------------------------------------------------

app.post(
  '/api/users',
  authenticate,
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, password, name, email, role } = req.body;

      if (
        typeof userId !== 'string' ||
        !userId.trim() ||
        typeof password !== 'string' ||
        password.length < 8 ||
        typeof name !== 'string' ||
        !name.trim() ||
        typeof email !== 'string' ||
        !email.trim() ||
        !['user', 'admin'].includes(role)
      ) {
        res.status(400).json({
          success: false,
          message: 'Provide valid user details. Password must have at least 8 characters.'
        });
        return;
      }

      const normalizedUserId = userId.trim();

      const existingUser = await UserModel.findOne({
        userId: normalizedUserId
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User ID already exists.'
        });
        return;
      }

      const highestUser = await UserModel.findOne()
        .sort({ id: -1 })
        .select({ id: 1 });

      const newId = highestUser ? highestUser.id + 1 : 1;

      const newUser: User = {
        id: newId,
        userId: normalizedUserId,
        password,
        name: name.trim(),
        email: email.trim(),
        role
      };

      const createdUser = await UserModel.create(newUser);

      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        user: safeUser(toUser(createdUser))
      });
    } catch (error: any) {
      if (error && error.code === 11000) {
        res.status(409).json({
          success: false,
          message: 'User ID or internal user ID already exists.'
        });
        return;
      }

      next(error);
    }
  }
);

// --------------------------------------------------
// ADMIN: UPDATE USER
// PUT /api/users/:id
// --------------------------------------------------

app.put(
  '/api/users/:id',
  authenticate,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID.'
        });
        return;
      }

      const document = await UserModel.findOne({ id });

      if (!document) {
        res.status(404).json({
          success: false,
          message: 'User not found.'
        });
        return;
      }

      const { userId, password, name, email, role } = req.body;

      if (
        (userId !== undefined &&
          (typeof userId !== 'string' || !userId.trim())) ||
        (password !== undefined &&
          (typeof password !== 'string' || password.length < 8)) ||
        (name !== undefined &&
          (typeof name !== 'string' || !name.trim())) ||
        (email !== undefined &&
          (typeof email !== 'string' || !email.trim())) ||
        (role !== undefined &&
          !['user', 'admin'].includes(role))
      ) {
        res.status(400).json({
          success: false,
          message: 'Invalid user details.'
        });
        return;
      }

      const update: any = {};

      if (userId !== undefined) {
        const normalizedUserId = userId.trim();

        const duplicate = await UserModel.findOne({
          userId: normalizedUserId,
          id: { $ne: id }
        });

        if (duplicate) {
          res.status(409).json({
            success: false,
            message: 'User ID already exists.'
          });
          return;
        }

        update.userId = normalizedUserId;
      }

      if (password !== undefined) update.password = password;
      if (name !== undefined) update.name = name.trim();
      if (email !== undefined) update.email = email.trim();
      if (role !== undefined) update.role = role;

      const updatedDocument = await UserModel.findOneAndUpdate(
        { id },
        { $set: update },
        { new: true, runValidators: true }
      );

      if (!updatedDocument) {
        res.status(404).json({
          success: false,
          message: 'User not found.'
        });
        return;
      }

      res.json({
        success: true,
        message: 'User updated successfully.',
        user: safeUser(toUser(updatedDocument))
      });
    } catch (error: any) {
      if (error && error.code === 11000) {
        res.status(409).json({
          success: false,
          message: 'User ID already exists.'
        });
        return;
      }

      next(error);
    }
  }
);

// --------------------------------------------------
// ADMIN: DELETE USER
// DELETE /api/users/:id
// --------------------------------------------------

app.delete(
  '/api/users/:id',
  authenticate,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID.'
        });
        return;
      }

      const user = await UserModel.findOne({ id });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found.'
        });
        return;
      }

      if (user.id === req.authenticatedUser!.id) {
        res.status(400).json({
          success: false,
          message: 'You cannot delete your own account.'
        });
        return;
      }

      await UserModel.deleteOne({ id });

      for (const [token, sessionUserId] of sessions.entries()) {
        if (sessionUserId === id) {
          sessions.delete(token);
        }
      }

      res.json({
        success: true,
        message: 'User deleted successfully.'
      });
    } catch (error) {
      next(error);
    }
  }
);

// --------------------------------------------------
// GLOBAL ERROR HANDLER
// --------------------------------------------------

app.use(
  (error: any, req: Request, res: Response, next: NextFunction) => {
    console.error('API error:', error.message || error);

    if (res.headersSent) {
      next(error);
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
);

// --------------------------------------------------
// START SERVER AFTER MONGODB CONNECTS
// --------------------------------------------------

async function startServer(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error(
      'MONGODB_URI is missing. Please check the backend .env file.'
    );
  }

  await mongoose.connect(mongoUri);

  console.log('MongoDB Atlas connected successfully!');

  await migrateExistingUsers();

  app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
  });
}

startServer().catch((error: any) => {
  console.error('Failed to start backend:', error.message || error);
  process.exit(1);
});