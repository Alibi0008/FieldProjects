import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

const toSafeUser = (user: any) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  gpa: user.gpa,
  skills: user.skills,
  schedule: user.schedule,
  goal: user.goal,
  karma: user.karma,
  githubCommits: user.githubCommits,
  eliteMinGpa: user.eliteMinGpa,
  completedProjects: user.completedProjects,
  reliabilityLabel: user.reliabilityLabel,
  reviewCount: user.reviewCount,
  matchingMode: user.matchingMode
});

const canAccessProject = async (userId: number, vacancyId: number) => {
  const project = await prisma.vacancy.findFirst({
    where: {
      id: vacancyId,
      OR: [
        { authorId: userId },
        { applications: { some: { candidateId: userId, status: 'Accepted' } } }
      ]
    },
    select: { id: true }
  });

  return Boolean(project);
};

// Auth Middleware
const auth = (req: any, res: any, next: any) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// Auth API
app.post('/api/register', async (req, res) => {
  const { email, password, name, role, gpa, skills } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role, gpa: parseFloat(gpa), skills }
    });
    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.json({ token, user: toSafeUser(user) });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const validPass = await bcrypt.compare(password, user.password);
  if (!validPass) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id }, JWT_SECRET);
  res.json({ token, user: toSafeUser(user) });
});

// Users/Candidates
app.get('/api/candidates', auth, async (req: any, res) => {
  const users = await prisma.user.findMany({
    where: { id: { not: req.user.id } },
    select: {
      id: true,
      name: true,
      role: true,
      gpa: true,
      skills: true,
      karma: true,
      githubCommits: true,
      schedule: true,
      reliabilityLabel: true,
      completedProjects: true,
      reviewCount: true
    }
  });
  res.json(users);
});

// Profile Update
app.put('/api/profile', auth, async (req: any, res: any) => {
  const data = {
    name: req.body.name,
    role: req.body.role,
    skills: req.body.skills,
    gpa: req.body.gpa,
    eliteMinGpa: req.body.eliteMinGpa,
    matchingMode: req.body.matchingMode
  } as Record<string, unknown>;

  if (data.gpa) data.gpa = parseFloat(String(data.gpa));
  if (data.eliteMinGpa) data.eliteMinGpa = parseFloat(String(data.eliteMinGpa));
  
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data
  });
  res.json(toSafeUser(user));
});

// Vacancies
app.get('/api/vacancies', auth, async (req: any, res: any) => {
  const vacancies = await prisma.vacancy.findMany({ include: { author: { select: { name: true } } }});
  res.json(vacancies);
});

app.post('/api/vacancies', auth, async (req: any, res) => {
  const { projectName, title, neededRole, minGpa, weeklyHours, responseHours, mode, description } = req.body;
  const vacancy = await prisma.vacancy.create({
    data: { 
      projectName, title, neededRole, 
      minGpa: parseFloat(minGpa || '3.0'), 
      weeklyHours: parseInt(weeklyHours || '4'), 
      responseHours: parseInt(responseHours || '24'), 
      mode: mode || 'Hybrid', 
      description: description || '',
      authorId: req.user.id 
    }
  });
  res.json(vacancy);
});

app.put('/api/vacancies/:id', auth, async (req: any, res) => {
  const vacancyId = parseInt(req.params.id);
  const existingVacancy = await prisma.vacancy.findUnique({ where: { id: vacancyId } });

  if (!existingVacancy || existingVacancy.authorId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to update this vacancy' });
  }

  const data = { ...req.body };
  if (data.minGpa) data.minGpa = parseFloat(data.minGpa);
  if (data.weeklyHours) data.weeklyHours = parseInt(data.weeklyHours);
  if (data.responseHours) data.responseHours = parseInt(data.responseHours);
  
  const vacancy = await prisma.vacancy.update({
    where: { id: vacancyId },
    data
  });
  res.json(vacancy);
});

app.delete('/api/vacancies/:id', auth, async (req: any, res) => {
  const { id } = req.params;
  const vacancy = await prisma.vacancy.findUnique({ where: { id: parseInt(id) } });
  
  if (!vacancy || vacancy.authorId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to delete this vacancy' });
  }

  await prisma.vacancy.delete({ where: { id: parseInt(id) } });
  res.json({ success: true });
});

// AI Assistant Integration
app.post('/api/ai/chat', auth, async (req: any, res) => {
  const { prompt } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const candidates = await prisma.user.findMany({ select: { name: true, role: true, gpa: true, skills: true, karma: true } });
  const vacancies = await prisma.vacancy.findMany({ select: { projectName: true, neededRole: true, minGpa: true } });

  const systemMessage = `
You are the AI Assistant for the Intelligent Team Formation platform.
Current User: ${user?.name} (${user?.role}, GPA: ${user?.gpa})
Available Candidates in DB:
${candidates.map(c => `- ${c.name} (${c.role}): GPA ${c.gpa}, Skills: ${c.skills}, Karma: ${c.karma}`).join('\n')}
Active Vacancies:
${vacancies.map(v => `- ${v.projectName} needs ${v.neededRole} (Min GPA: ${v.minGpa})`).join('\n')}

Answer the user's questions about matching, recommend candidates, and provide risk analysis.
  `;

  try {
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: `${systemMessage}\n\nUser Question: ${prompt}` }] }
      ]
    });
    
    const text = result.response.text();
    console.log('Gemini responded successfully');
    res.json({ answer: text || 'No response' });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Applications API
app.post('/api/applications', auth, async (req: any, res) => {
  const { vacancyId } = req.body;
  try {
    const normalizedVacancyId = parseInt(vacancyId);
    const existing = await prisma.application.findFirst({
      where: {
        vacancyId: normalizedVacancyId,
        candidateId: req.user.id
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already applied' });
    }

    const app = await prisma.application.create({
      data: {
        vacancyId: normalizedVacancyId,
        candidateId: req.user.id,
        status: 'Pending'
      }
    });
    res.json(app);
  } catch (err) {
    res.status(400).json({ error: 'Already applied' });
  }
});

app.get('/api/applications', auth, async (req: any, res) => {
  const incoming = await prisma.application.findMany({
    where: { vacancy: { authorId: req.user.id } },
    include: {
      candidate: { select: { name: true, role: true, gpa: true, karma: true, skills: true } },
      vacancy: { select: { projectName: true, neededRole: true } }
    }
  });

  const outgoing = await prisma.application.findMany({
    where: { candidateId: req.user.id },
    select: { vacancyId: true }
  });

  res.json({ incoming, outgoing });
});

app.put('/api/applications/:id', auth, async (req: any, res) => {
  const { status } = req.body;
  const applicationId = parseInt(req.params.id);
  const applicationRecord = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { vacancy: { select: { authorId: true } } }
  });

  if (!applicationRecord || applicationRecord.vacancy.authorId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to update this application' });
  }

  const application = await prisma.application.update({
    where: { id: applicationId },
    data: { status }
  });
  res.json(application);
});

// Projects & Members
app.get('/api/projects/my', auth, async (req: any, res: any) => {
  // Projects where I am the author OR an accepted candidate
  const projects = await prisma.vacancy.findMany({
    where: {
      OR: [
        { authorId: req.user.id },
        { applications: { some: { candidateId: req.user.id, status: 'Accepted' } } }
      ]
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
      applications: {
        where: { status: 'Accepted' },
        include: { candidate: { select: { id: true, name: true, role: true, gpa: true, skills: true } } }
      }
    }
  });
  res.json(projects);
});

app.post('/api/projects/finish', auth, async (req: any, res) => {
  const { vacancyId } = req.body;
  const vacancy = await prisma.vacancy.findUnique({
    where: { id: vacancyId },
    include: { applications: { where: { status: 'Accepted' } } }
  });

  if (!vacancy || vacancy.authorId !== req.user.id) {
    return res.status(403).json({ error: 'Only the project owner can finish it' });
  }

  // Update vacancy status
  await prisma.vacancy.update({
    where: { id: vacancyId },
    data: { status: 'Completed' }
  });

  // Increment completed projects for everyone involved
  const userIds = [vacancy.authorId, ...vacancy.applications.map(a => a.candidateId)];
  await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { completedProjects: { increment: 1 } }
  });

  res.json({ success: true });
});

app.post('/api/reviews', auth, async (req: any, res) => {
  const { candidateId, rating, teamwork, reliability, comment } = req.body;
  const sharedProject = await prisma.vacancy.findFirst({
    where: {
      status: 'Completed',
      OR: [
        {
          authorId: req.user.id,
          applications: { some: { candidateId, status: 'Accepted' } }
        },
        {
          authorId: candidateId,
          applications: { some: { candidateId: req.user.id, status: 'Accepted' } }
        },
        {
          applications: {
            some: { candidateId: req.user.id, status: 'Accepted' }
          },
          AND: {
            applications: {
              some: { candidateId, status: 'Accepted' }
            }
          }
        }
      ]
    },
    select: { id: true }
  });

  if (!sharedProject) {
    return res.status(403).json({ error: 'You can review only teammates from completed projects' });
  }
  
  const review = await prisma.peerReview.create({
    data: {
      reviewerId: req.user.id,
      candidateId,
      rating: parseInt(rating),
      teamwork: parseInt(teamwork),
      reliability: parseInt(reliability),
      comment
    }
  });

  // Update candidate karma/stats
  const reviews = await prisma.peerReview.findMany({ where: { candidateId } });
  const avgRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  const avgTeamwork = reviews.reduce((acc, r) => acc + r.teamwork, 0) / reviews.length;
  const avgReliability = reviews.reduce((acc, r) => acc + r.reliability, 0) / reviews.length;
  
  // Simple karma formula: (avgRating * 10) + bonus
  const newKarma = Math.min(100, Math.round((avgRating + avgTeamwork + avgReliability) / 3 * 20));

  await prisma.user.update({
    where: { id: candidateId },
    data: { 
      karma: newKarma,
      reviewCount: { increment: 1 }
    }
  });

  res.json(review);
});

// Group Chat API
app.get('/api/projects/:vacancyId/messages', auth, async (req: any, res) => {
  const vacancyId = parseInt(req.params.vacancyId);
  const hasAccess = await canAccessProject(req.user.id, vacancyId);

  if (!hasAccess) {
    return res.status(403).json({ error: 'Unauthorized to view this chat' });
  }

  const messages = await prisma.projectMessage.findMany({
    where: { vacancyId },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: 'asc' }
  });
  res.json(messages);
});

app.post('/api/projects/:vacancyId/messages', auth, async (req: any, res) => {
  const { text } = req.body;
  const vacancyId = parseInt(req.params.vacancyId);
  const hasAccess = await canAccessProject(req.user.id, vacancyId);

  if (!hasAccess) {
    return res.status(403).json({ error: 'Unauthorized to send messages to this chat' });
  }

  const message = await prisma.projectMessage.create({
    data: {
      text,
      vacancyId,
      senderId: req.user.id
    },
    include: { sender: { select: { id: true, name: true, role: true } } }
  });
  res.json(message);
});

async function startServer() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to the database');
    
    const PORT = 3000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
