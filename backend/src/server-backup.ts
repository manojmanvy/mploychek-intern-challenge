import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { randomBytes } from 'crypto';

const app = express();
const PORT = 3000;

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

// --------------------------------------------------
// DUMMY DATABASE
// In-memory storage for assignment demonstration.
// Data resets when the server restarts.
// --------------------------------------------------

let users: User[] = [
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

// Demo sessions. Production applications should use
// a properly designed authentication/session system.
const sessions = new Map<string, number>();

// --------------------------------------------------
// HELPER: SIMULATE ASYNCHRONOUS API DELAY
// Example: ?delayMs=1500
// Maximum permitted delay: 3000 ms
// --------------------------------------------------

function delayResponse(req: Request, res: Response, next: NextFunction) {
  const requestedDelay = Number(req.query.delayMs ?? 0);

  const delayMs = Number.isFinite(requestedDelay)
    ? Math.min(Math.max(requestedDelay, 0), 3000)
    : 0;

  setTimeout(() => next(), delayMs);
}

// --------------------------------------------------
// AUTHENTICATION MIDDLEWARE
// --------------------------------------------------

interface AuthenticatedRequest extends Request {
  authenticatedUser?: User;
}

function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  const token = authorization.substring(7);
  const userId = sessions.get(token);

  if (userId === undefined) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session.'
    });
  }

  const user = users.find(item => item.id === userId);

  if (!user) {
    sessions.delete(token);

    return res.status(401).json({
      success: false,
      message: 'User account not found.'
    });
  }

  req.authenticatedUser = user;
  next();
}

function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (req.authenticatedUser?.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required.'
    });
  }

  next();
}

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'MPloyChek backend is running!'
  });
});

// --------------------------------------------------
// LOGIN API
// POST /api/login?delayMs=1000
// --------------------------------------------------

app.post('/api/login', delayResponse, (req: Request, res: Response) => {
  const { userId, password, role } = req.body;

  if (
    typeof userId !== 'string' ||
    typeof password !== 'string' ||
    !['user', 'admin'].includes(role)
  ) {
    return res.status(400).json({
      success: false,
      message: 'User ID, password and valid role are required.'
    });
  }

  const user = users.find(
    item =>
      item.userId === userId.trim() &&
      item.password === password &&
      item.role === role
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials or selected role.'
    });
  }

  const token = randomBytes(32).toString('hex');
  sessions.set(token, user.id);

  const { password: ignoredPassword, ...safeUser } = user;

  return res.json({
    success: true,
    message: 'Login successful.',
    token,
    user: safeUser
  });
});

// --------------------------------------------------
// LOGOUT API
// POST /api/logout
// --------------------------------------------------

app.post(
  '/api/logout',
  authenticate,
  (req: AuthenticatedRequest, res: Response) => {
    const authorization = req.headers.authorization!;
    const token = authorization.substring(7);

    sessions.delete(token);

    return res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  }
);

// --------------------------------------------------
// PROFILE API
// GET /api/profile?delayMs=1000
// --------------------------------------------------

app.get(
  '/api/profile',
  authenticate,
  delayResponse,
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.authenticatedUser!;
    const { password: ignoredPassword, ...safeUser } = user;

    return res.json({
      success: true,
      user: safeUser
    });
  }
);

// --------------------------------------------------
// RECORDS API
// GET /api/records?delayMs=1500
// General users receive only their own records.
// Admin users can see all records.
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
        : records.filter(record => record.userId === user.userId);

    return res.json({
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
  (req: Request, res: Response) => {
    const safeUsers = users.map(
      ({ password: ignoredPassword, ...safeUser }) => safeUser
    );

    return res.json({
      success: true,
      total: safeUsers.length,
      users: safeUsers
    });
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
  (req: Request, res: Response) => {
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
      return res.status(400).json({
        success: false,
        message: 'Provide valid user details. Password must have at least 8 characters.'
      });
    }

    const normalizedUserId = userId.trim();

    if (users.some(user => user.userId === normalizedUserId)) {
      return res.status(409).json({
        success: false,
        message: 'User ID already exists.'
      });
    }

    const newUser: User = {
      id: Math.max(0, ...users.map(user => user.id)) + 1,
      userId: normalizedUserId,
      password,
      name: name.trim(),
      email: email.trim(),
      role
    };

    users.push(newUser);

    const { password: ignoredPassword, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: safeUser
    });
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
  (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.'
      });
    }

    const user = users.find(item => item.id === id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
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
      (role !== undefined && !['user', 'admin'].includes(role))
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user details.'
      });
    }

    if (
      userId !== undefined &&
      users.some(
        item => item.userId === userId.trim() && item.id !== id
      )
    ) {
      return res.status(409).json({
        success: false,
        message: 'User ID already exists.'
      });
    }

    if (userId !== undefined) user.userId = userId.trim();
    if (password !== undefined) user.password = password;
    if (name !== undefined) user.name = name.trim();
    if (email !== undefined) user.email = email.trim();
    if (role !== undefined) user.role = role;

    const { password: ignoredPassword, ...safeUser } = user;

    return res.json({
      success: true,
      message: 'User updated successfully.',
      user: safeUser
    });
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
  (req: AuthenticatedRequest, res: Response) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.'
      });
    }

    const user = users.find(item => item.id === id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    if (user.id === req.authenticatedUser!.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.'
      });
    }

    users = users.filter(item => item.id !== id);

    for (const [token, userId] of sessions.entries()) {
      if (userId === id) {
        sessions.delete(token);
      }
    }

    return res.json({
      success: true,
      message: 'User deleted successfully.'
    });
  }
);

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});