const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Project, Task, db } = require('./setup');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ---------- AUTH HELPERS ----------
function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing token' });

  const token = auth.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}

// ---------- AUTH ROUTES ----------
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Missing fields' });

  const exists = await User.findOne({ where: { email } });
  if (exists) return res.status(400).json({ error: 'User exists' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed });

  res.status(201).json({
    token: signToken(user),
    user: { id: user.id, role: user.role }
  });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  res.json({
    token: signToken(user),
    user: { id: user.id, role: user.role }
  });
});

// ---------- USERS ----------
app.get('/api/users/profile', requireAuth, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'name', 'email', 'role']
  });
  res.json(user);
});

app.get('/api/users', requireAuth, requireRole('admin'), async (req, res) => {
  const users = await User.findAll({
    attributes: ['id', 'name', 'email', 'role']
  });
  res.json(users);
});

// ---------- PROJECTS ----------
app.get('/api/projects', requireAuth, async (req, res) => {
  const projects = await Project.findAll();
  res.json(projects);
});

app.post('/api/projects', requireAuth, requireRole('manager', 'admin'), async (req, res) => {
  const project = await Project.create({
    ...req.body,
    managerId: req.user.id
  });
  res.status(201).json(project);
});

// ---------- TASKS ----------
app.put('/api/tasks/:id', requireAuth, async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ error: 'Not found' });

  if (req.user.role === 'employee' && task.assignedUserId !== req.user.id) {
    return res.status(403).json({ error: 'Not your task' });
  }

  await task.update(req.body);
  res.json(task);
});

app.listen(PORT, async () => {
  await db.authenticate();
  console.log(`Server running on http://localhost:${PORT}`);
});
