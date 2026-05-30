const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
    const envConfig = require("dotenv").parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("MONGODB_URI not found");
    process.exit(1);
}

async function resetPassword() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        const email = "admin@gmail.com";
        const plainPassword = "admin123";
        const hashedPassword = await bcrypt.hash(plainPassword, 10);

        const result = await mongoose.connection.db.collection('users').updateOne(
            { email },
            { $set: { password: hashedPassword, role: 'admin' } }
        );

        if (result.matchedCount > 0) {
            console.log(`Successfully reset password for ${email} to ${plainPassword}`);
        } else {
            console.log(`User ${email} not found.`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

resetPassword();
