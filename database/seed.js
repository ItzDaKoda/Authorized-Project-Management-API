const bcrypt = require('bcryptjs');
const { db, User, Project, Task } = require('./setup');

async function seedDatabase() {
  try {
    await db.sync({ force: true });
    console.log('Database reset');

    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = await User.bulkCreate([
      { name: 'John Employee', email: 'john@company.com', password: hashedPassword, role: 'employee' },
      { name: 'Sarah Manager', email: 'sarah@company.com', password: hashedPassword, role: 'manager' },
      { name: 'Mike Admin', email: 'mike@company.com', password: hashedPassword, role: 'admin' }
    ]);

    const projects = await Project.bulkCreate([
      { name: 'Website Redesign', description: 'Redo company site', managerId: users[1].id },
      { name: 'Mobile App', description: 'Customer app', managerId: users[1].id },
      { name: 'DB Migration', description: 'Legacy migration', managerId: users[2].id }
    ]);

    await Task.bulkCreate([
      {
        title: 'Homepage mockup',
        projectId: projects[0].id,
        assignedUserId: users[0].id,
        status: 'in-progress',
        priority: 'high'
      },
      {
        title: 'Dev environment',
        projectId: projects[1].id,
        assignedUserId: users[0].id,
        status: 'completed'
      }
    ]);

    console.log('Seed complete');
  } catch (err) {
    console.error(err);
  } finally {
    await db.close();
  }
}

seedDatabase();
