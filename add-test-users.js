// Script to add test users to MongoDB
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Connect to MongoDB
async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create User schema
    const UserSchema = new mongoose.Schema({
      id: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      company_id: { type: String, required: true },
      role: { type: String, required: true, enum: ['user', 'orgadmin', 'admin'] },
      created_at: { type: Date, default: Date.now },
      department: { type: String, required: true },
      company_role: { type: String, required: true },
      password: { type: String, required: true },
    }, { timestamps: true });

    // Add password comparison method
    UserSchema.methods.comparePassword = async function(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    };

    // Create or get User model
    const User = mongoose.models.User || mongoose.model('User', UserSchema);
    
    // Create or get Company model
    const CompanySchema = new mongoose.Schema({
      company_id: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      domain: { type: String, required: true, unique: true },
      assistant_id: { type: String, required: true },
      status: { type: String, default: 'active' },
      created_at: { type: Date, default: Date.now },
    });
    
    const Company = mongoose.models.Company || mongoose.model('Company', CompanySchema);

    // Check if company exists, create if not
    let company = await Company.findOne({ domain: 'voxerion.com' });
    
    if (!company) {
      console.log('Creating test company...');
      company = await Company.create({
        company_id: `COM-${uuidv4().substring(0, 8)}`,
        name: 'Voxerion',
        domain: 'voxerion.com',
        assistant_id: 'asst_123456789', // Placeholder - replace with actual OpenAI assistant ID
        status: 'active',
        created_at: new Date()
      });
      console.log('Company created:', company);
    } else {
      console.log('Company already exists:', company);
    }

    // Test users to create
    const testUsers = [
      {
        email: 'admin@voxerion.com',
        name: 'Admin User',
        role: 'admin',
        password: 'defaultpassword',
        department: 'Administration',
        company_role: 'Administrator'
      },
      {
        email: 'guest@voxerion.com',
        name: 'Guest User',
        role: 'user',
        password: 'guest123',
        department: 'Guest',
        company_role: 'Guest'
      },
      {
        email: 'alysson.franklin@voxerion.com',
        name: 'Alysson Franklin',
        role: 'admin',
        password: 'password123',
        department: 'Engineering',
        company_role: 'Developer'
      }
    ];

    // Add or update each test user
    for (const userData of testUsers) {
      // Check if user exists
      let user = await User.findOne({ email: userData.email });
      
      if (user) {
        console.log(`User ${userData.email} already exists, updating password...`);
        // Update password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        await User.updateOne(
          { email: userData.email },
          { $set: { password: hashedPassword } }
        );
        
        console.log(`Password updated for ${userData.email}`);
      } else {
        // Create new user
        console.log(`Creating user ${userData.email}...`);
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        user = await User.create({
          id: `USR-${uuidv4().substring(0, 8)}`,
          email: userData.email,
          name: userData.name,
          company_id: company.company_id,
          role: userData.role,
          created_at: new Date(),
          department: userData.department,
          company_role: userData.company_role,
          password: hashedPassword
        });
        
        console.log(`User created: ${userData.email}`);
      }
    }

    // Verify users were created
    const users = await User.find().select('email role');
    console.log('Users in database:', users);

    console.log('All done!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

run();