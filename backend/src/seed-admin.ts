import { DataSource } from 'typeorm';
import { User, UserRole } from './users/entities/user.entity';
import * as bcrypt from 'bcrypt';

export async function seedAdmin(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  
  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@example.com' },
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
    return;
  }

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = userRepository.create({
    email: 'admin@example.com',
    password: hashedPassword,
    name: 'Admin User',
    role: UserRole.ADMIN,
    isActive: true,
  });

  await userRepository.save(admin);
  console.log('Admin user created successfully!');
  console.log('Email: admin@example.com');
  console.log('Password: admin123');
}

