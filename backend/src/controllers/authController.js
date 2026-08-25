const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');
const { JWT_SECRET } = require('../middleware/auth');

const register = async (req, res) => {
  const { email, password, name, role, ngoDescription, ngoDocumentUrl } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Please provide all required fields (email, password, name, role)' });
  }

  if (!['DONOR', 'NGO', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Invalid user role specified' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and profile if NGO
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        ...(role === 'NGO' && {
          ngoProfile: {
            create: {
              description: ngoDescription || 'New NGO awaiting setup.',
              status: 'PENDING',
              documentUrl: ngoDocumentUrl || '',
            },
          },
        }),
      },
      include: {
        ngoProfile: true,
      },
    });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '24h',
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        ngoProfile: user.ngoProfile,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { ngoProfile: true },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '24h',
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        ngoProfile: user.ngoProfile,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { ngoProfile: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        ngoProfile: user.ngoProfile,
      },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  register,
  login,
  getMe,
};
